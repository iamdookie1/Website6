// Redstone Playground — UI, rendering and input
'use strict';
(function () {
  const { Sim, makeCell, findRoute, TYPES, DIRS, DIR_NAMES, opp } = window.Redstone;
  const { EXAMPLES, CHAPTERS, LESSONS, CHALLENGES, runChallenge, W, H } = window.RedstoneExamples;

  // ------------------------------------------------------------------ state
  const st = {
    sim: null, tool: 'dust', rot: 1, running: true, tps: 10,
    showLevels: false, showCircuits: false,
    hover: null, inspect: null, painting: null, lastPaint: null,
    undo: [], redo: [], zoom: 1, cs: 24,
    route: { phase: 'src', src: null, tgt: null, result: null },
    comps: null,
    probes: [], challenge: null, challengeResult: null,
  };
  const PROBE_COLORS = ['#ff5a4f', '#5ac8ff', '#ffcf4a', '#7ee081'];

  const TOOLS = [
    { id: 'hand', label: 'Use', key: 'Q', tip: 'Tap levers, buttons, repeaters and comparators. Tap anything to inspect it.' },
    { id: 'dust', label: 'Dust', key: '1' },
    { id: 'block', label: 'Block', key: '2' },
    { id: 'lever', label: 'Lever', key: '3' },
    { id: 'button', label: 'Button', key: '4' },
    { id: 'rblock', label: 'Redstone Block', key: '5' },
    { id: 'torch', label: 'Torch', key: '6' },
    { id: 'repeater', label: 'Repeater', key: '7' },
    { id: 'comparator', label: 'Comparator', key: '8' },
    { id: 'observer', label: 'Observer', key: '9' },
    { id: 'lamp', label: 'Lamp', key: '0' },
    { id: 'piston', label: 'Piston', key: 'P' },
    { id: 'probe', label: 'Probe', key: 'T', tip: 'Tap up to 4 parts to graph their signal over time.' },
    { id: 'rotate', label: 'Rotate', key: 'R', tip: 'Tap a torch, repeater, comparator, observer or piston to turn it.' },
    { id: 'erase', label: 'Erase', key: 'E', tip: 'Tap or drag to remove. Right-click also erases with any tool.' },
    { id: 'route', label: 'Route helper', key: 'G', tip: 'Tap a signal source, then the thing to power.' },
  ];

  const $ = s => document.querySelector(s);
  const canvas = $('#board'), ctx = canvas.getContext('2d');
  const scrollBox = $('#boardScroll');

  // ------------------------------------------------------------------ colors
  const COL = {
    bg: '#191b20', grid: '#23262d', gridMajor: '#2b2f37',
    stone: '#8b8f96', stoneDark: '#62666d', stoneLight: '#a9adb3',
    slab: '#b9bcc0', slabEdge: '#7d8187',
    wood: '#9a7448', woodDark: '#6e5232',
    red: '#ff3b2f', redOff: '#5a1a17',
    lampOff: '#5b4632', lampOn: '#ffd56b',
  };
  const dustColor = lv => {
    const t = lv / 15;
    const r = Math.round(90 + 165 * t), g = Math.round(12 + 40 * t * t), b = Math.round(10 + 20 * t * t);
    return `rgb(${r},${g},${b})`;
  };

  // ------------------------------------------------------------------ drawing
  function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); }

  function torchHead(c, x, y, r, on) {
    if (on) {
      const g = c.createRadialGradient(x, y, 0, x, y, r * 3);
      g.addColorStop(0, 'rgba(255,70,50,.55)'); g.addColorStop(1, 'rgba(255,70,50,0)');
      c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 3, 0, 7); c.fill();
    }
    c.fillStyle = on ? COL.red : COL.redOff;
    c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = Math.max(1, r * 0.25); c.stroke();
  }

  // rotate drawing so that "facing" points right (dir 1)
  function withRot(c, cx, cy, f, fn) {
    c.save(); c.translate(cx, cy); c.rotate((f - 1) * Math.PI / 2); fn(); c.restore();
  }

  // info: {level, conn, point, bpow, lit, want, attached}
  function drawCell(c, cell, px, py, s, info) {
    const cx = px + s / 2, cy = py + s / 2, m = s * 0.08;
    switch (cell.t) {
      case 'dust': {
        const col = dustColor(info.level);
        const w = Math.max(2, s * 0.2);
        c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round';
        c.lineWidth = w;
        for (let d = 0; d < 4; d++) {
          if (!(info.point >> d & 1)) continue;
          const len = info.conn ? s / 2 : s * 0.36;
          c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + DIRS[d][0] * len, cy + DIRS[d][1] * len); c.stroke();
        }
        c.beginPath(); c.arc(cx, cy, s * 0.17, 0, 7); c.fill();
        if (info.level > 0) {
          c.fillStyle = `rgba(255,120,90,${0.12 + info.level / 60})`;
          c.beginPath(); c.arc(cx, cy, s * 0.08, 0, 7); c.fill();
        }
        break;
      }
      case 'block': {
        c.fillStyle = COL.stone; c.fillRect(px + 1, py + 1, s - 2, s - 2);
        c.fillStyle = COL.stoneLight; c.fillRect(px + 1, py + 1, s - 2, s * 0.12);
        c.fillStyle = COL.stoneDark; c.fillRect(px + 1, py + s - 1 - s * 0.12, s - 2, s * 0.12);
        c.fillStyle = 'rgba(0,0,0,.12)';
        c.fillRect(px + s * 0.25, py + s * 0.35, s * 0.18, s * 0.1);
        c.fillRect(px + s * 0.55, py + s * 0.6, s * 0.2, s * 0.1);
        if (info.bpow) {
          c.strokeStyle = info.bpow === 2 ? 'rgba(255,59,47,.95)' : 'rgba(255,59,47,.5)';
          c.lineWidth = Math.max(2, s * (info.bpow === 2 ? 0.12 : 0.07));
          c.strokeRect(px + c.lineWidth / 2 + 1, py + c.lineWidth / 2 + 1, s - c.lineWidth - 2, s - c.lineWidth - 2);
        }
        break;
      }
      case 'rblock': {
        c.fillStyle = '#b3140d'; c.fillRect(px + 1, py + 1, s - 2, s - 2);
        c.strokeStyle = '#ff5246'; c.lineWidth = Math.max(1, s * 0.06);
        c.beginPath();
        for (let k = 1; k < 3; k++) {
          c.moveTo(px + s * k / 3, py + 2); c.lineTo(px + s * k / 3, py + s - 2);
          c.moveTo(px + 2, py + s * k / 3); c.lineTo(px + s - 2, py + s * k / 3);
        }
        c.stroke();
        c.strokeStyle = '#6d0905'; c.strokeRect(px + 1.5, py + 1.5, s - 3, s - 3);
        break;
      }
      case 'lever': {
        rr(c, px + s * 0.25, py + s * 0.3, s * 0.5, s * 0.4, s * 0.06); c.fillStyle = COL.stoneDark; c.fill();
        const ang = cell.on ? 0.6 : -0.6;
        c.save(); c.translate(cx, cy + s * 0.05); c.rotate(ang);
        c.strokeStyle = COL.wood; c.lineWidth = Math.max(2, s * 0.12); c.lineCap = 'round';
        c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -s * 0.36); c.stroke();
        c.restore();
        torchHead(c, cx + Math.sin(ang) * s * 0.36, cy + s * 0.05 - Math.cos(ang) * s * 0.36, s * 0.08, cell.on);
        break;
      }
      case 'button': {
        const inset = cell.on ? s * 0.05 : 0;
        rr(c, px + s * 0.3 + inset, py + s * 0.35 + inset, s * 0.4 - inset * 2, s * 0.3 - inset * 2, s * 0.05);
        c.fillStyle = cell.on ? '#7c7f85' : COL.slab; c.fill();
        c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1; c.stroke();
        if (cell.on) torchHead(c, cx, cy, s * 0.06, true);
        break;
      }
      case 'torch': {
        const on = cell.on;
        if (cell.burnt) {
          c.fillStyle = 'rgba(160,160,160,.35)';
          c.beginPath(); c.arc(cx - s * 0.1, cy - s * 0.25, s * 0.1, 0, 7); c.arc(cx + s * 0.08, cy - s * 0.35, s * 0.08, 0, 7); c.fill();
        }
        if (info.attached) {
          withRot(c, cx, cy, cell.f, () => {
            c.strokeStyle = COL.wood; c.lineWidth = Math.max(2, s * 0.13); c.lineCap = 'round';
            c.beginPath(); c.moveTo(-s / 2 + 1, 0); c.lineTo(s * 0.1, 0); c.stroke();
          });
          torchHead(c, cx + DIRS[cell.f][0] * s * 0.12, cy + DIRS[cell.f][1] * s * 0.12, s * 0.14, on);
        } else {
          c.fillStyle = COL.woodDark; c.beginPath(); c.arc(cx, cy, s * 0.2, 0, 7); c.fill();
          torchHead(c, cx, cy, s * 0.14, on);
        }
        break;
      }
      case 'repeater': case 'comparator': {
        rr(c, px + m, py + m, s - 2 * m, s - 2 * m, s * 0.08);
        c.fillStyle = COL.slab; c.fill(); c.strokeStyle = COL.slabEdge; c.lineWidth = 1; c.stroke();
        withRot(c, cx, cy, cell.f, () => {
          // arrow
          c.fillStyle = 'rgba(0,0,0,.18)';
          c.beginPath(); c.moveTo(s * 0.36, 0); c.lineTo(s * 0.12, -s * 0.18); c.lineTo(s * 0.12, s * 0.18); c.closePath(); c.fill();
        });
        const pos = (along, side) => {
          const f = cell.f, a = DIRS[f], b = DIRS[(f + 1) % 4];
          return [cx + a[0] * along * s + b[0] * side * s, cy + a[1] * along * s + b[1] * side * s];
        };
        if (cell.t === 'repeater') {
          const on = cell.on, locked = info.want & 2;
          const [fx, fy] = pos(0.2, 0); torchHead(c, fx, fy, s * 0.09, on);
          const back = 0.05 - (cell.delay - 1) * 0.1;
          if (locked) {
            const [lx, ly] = pos(back, 0);
            c.save(); c.translate(lx, ly); c.rotate(cell.f % 2 ? Math.PI / 2 : 0);
            c.fillStyle = '#3a3d42'; c.fillRect(-s * 0.3, -s * 0.05, s * 0.6, s * 0.1); c.restore();
          } else {
            const [bx, by] = pos(back, 0); torchHead(c, bx, by, s * 0.09, on);
          }
          c.fillStyle = 'rgba(0,0,0,.35)';
          for (let k = 0; k < cell.delay; k++) {
            const [dx, dy] = pos(0.05 - k * 0.1, 0.32); c.beginPath(); c.arc(dx, dy, s * 0.035, 0, 7); c.fill();
          }
        } else {
          const [fx, fy] = pos(0.25, 0); torchHead(c, fx, fy, s * 0.08, cell.mode === 'sub');
          const outOn = cell.out > 0;
          const [ax, ay] = pos(-0.22, 0.2); torchHead(c, ax, ay, s * 0.08, outOn);
          const [bx, by] = pos(-0.22, -0.2); torchHead(c, bx, by, s * 0.08, outOn);
        }
        break;
      }
      case 'observer': {
        c.fillStyle = '#5d6168'; c.fillRect(px + 1, py + 1, s - 2, s - 2);
        withRot(c, cx, cy, cell.f, () => {
          c.fillStyle = '#3b3e44'; c.fillRect(s * 0.28, -s / 2 + 1, s * 0.22 - 1, s - 2);
          c.fillStyle = '#c9ccd1';
          c.fillRect(s * 0.33, -s * 0.28, s * 0.1, s * 0.16);
          c.fillRect(s * 0.33, s * 0.12, s * 0.1, s * 0.16);
        });
        const bx = cx - DIRS[cell.f][0] * s * 0.3, by = cy - DIRS[cell.f][1] * s * 0.3;
        torchHead(c, bx, by, s * 0.08, cell.pulse);
        break;
      }
      case 'lamp': {
        const on = info.lit;
        if (on) {
          const g = c.createRadialGradient(cx, cy, s * 0.2, cx, cy, s * 1.1);
          g.addColorStop(0, 'rgba(255,214,107,.35)'); g.addColorStop(1, 'rgba(255,214,107,0)');
          c.fillStyle = g; c.fillRect(px - s * 0.6, py - s * 0.6, s * 2.2, s * 2.2);
        }
        c.fillStyle = on ? COL.lampOn : COL.lampOff; c.fillRect(px + 1, py + 1, s - 2, s - 2);
        c.strokeStyle = on ? '#b88a2c' : '#3a2c1f'; c.lineWidth = Math.max(1, s * 0.07);
        c.strokeRect(px + s * 0.2, py + s * 0.2, s * 0.6, s * 0.6);
        c.beginPath(); c.moveTo(cx, py + s * 0.2); c.lineTo(cx, py + s * 0.8); c.moveTo(px + s * 0.2, cy); c.lineTo(px + s * 0.8, cy); c.stroke();
        break;
      }
      case 'piston': {
        const ext = info.lit;
        c.fillStyle = COL.stone; c.fillRect(px + 1, py + 1, s - 2, s - 2);
        withRot(c, cx, cy, cell.f, () => {
          c.fillStyle = COL.wood; c.fillRect(s * 0.28, -s / 2 + 1, s * 0.22 - 1, s - 2);
          c.fillStyle = COL.woodDark; c.fillRect(s * 0.28, -s * 0.08, s * 0.22 - 1, s * 0.16);
          if (ext) {
            c.fillStyle = '#b08b5a'; c.fillRect(s * 0.5, -s * 0.08, s * 0.8, s * 0.16);
            c.fillStyle = COL.wood; c.fillRect(s * 1.3, -s / 2 + 1, s * 0.2 - 1, s - 2);
          }
        });
        break;
      }
    }
  }

  function cellInfo(sim, x, y) {
    const i = sim.idx(x, y), net = sim.net, cell = sim.cells[i];
    const info = { level: net.level[i], conn: net.conn[i], point: net.point[i], bpow: net.bpow[i], lit: net.lit[i], want: net.want[i] };
    if (cell && cell.t === 'torch') { const A = sim.nb(x, y, opp(cell.f)); info.attached = !!(A && A.t === 'block'); }
    return info;
  }

  // dust networks (for coloring & mix warnings)
  function dustComponents(sim) {
    const comp = new Int32Array(sim.cells.length).fill(-1);
    let id = 0;
    sim.cells.forEach((c, i) => {
      if (!c || c.t !== 'dust' || comp[i] >= 0) return;
      const stack = [i]; comp[i] = id;
      while (stack.length) {
        const j = stack.pop(), x = j % sim.w, y = (j / sim.w) | 0;
        for (let d = 0; d < 4; d++) {
          const N = sim.nb(x, y, d);
          if (N && N.t === 'dust') { const k = sim.nbi(x, y, d); if (comp[k] < 0) { comp[k] = id; stack.push(k); } }
        }
      }
      id++;
    });
    return { comp, count: id };
  }
  const compHue = id => (id * 137.508 + 200) % 360;

  function placementCell(tool, x, y) {
    const o = { f: st.rot };
    if (tool === 'torch') {
      const sim = st.sim;
      const isBlock = d => { const n = sim.nb(x, y, d); return n && n.t === 'block'; };
      if (!isBlock(opp(st.rot))) {
        for (let d = 0; d < 4; d++) if (isBlock(opp(d))) { o.f = d; break; }
      }
    }
    if (tool === 'repeater' || tool === 'comparator') {
      // like in the game, face away from where the power comes from
      const sim = st.sim;
      if (!Sim.feeds(sim.nb(x, y, opp(st.rot)), opp(st.rot))) {
        for (let d = 0; d < 4; d++) {
          if (Sim.feeds(sim.nb(x, y, d), d)) { o.f = opp(d); break; }
        }
      }
    }
    return makeCell(tool, o);
  }

  function wouldMerge(x, y) {
    if (!st.comps) st.comps = dustComponents(st.sim);
    const ids = new Set();
    for (let d = 0; d < 4; d++) {
      const N = st.sim.nb(x, y, d);
      if (N && N.t === 'dust') ids.add(st.comps.comp[st.sim.nbi(x, y, d)]);
    }
    return ids.size >= 2;
  }

  // ------------------------------------------------------------------ render
  function resize() {
    const box = scrollBox.getBoundingClientRect();
    const fit = Math.floor(Math.min((box.width - 2) / W, (box.height - 2) / H));
    const base = Math.max(18, Math.min(44, fit || 24));
    st.cs = Math.round(base * st.zoom);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * st.cs * dpr; canvas.height = H * st.cs * dpr;
    canvas.style.width = W * st.cs + 'px'; canvas.style.height = H * st.cs + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  }

  function render() {
    const sim = st.sim, s = st.cs;
    ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W * s, H * s);
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x++) {
      ctx.strokeStyle = x % 5 ? COL.grid : COL.gridMajor;
      ctx.beginPath(); ctx.moveTo(x * s + 0.5, 0); ctx.lineTo(x * s + 0.5, H * s); ctx.stroke();
    }
    for (let y = 0; y <= H; y++) {
      ctx.strokeStyle = y % 5 ? COL.grid : COL.gridMajor;
      ctx.beginPath(); ctx.moveTo(0, y * s + 0.5); ctx.lineTo(W * s, y * s + 0.5); ctx.stroke();
    }

    let comps = null;
    if (st.showCircuits) comps = st.comps || (st.comps = dustComponents(sim));

    // circuit tint underlay
    if (comps) {
      for (let i = 0; i < sim.cells.length; i++) {
        if (comps.comp[i] < 0) continue;
        ctx.fillStyle = `hsla(${compHue(comps.comp[i])},80%,55%,.28)`;
        ctx.fillRect((i % W) * s + 1, ((i / W) | 0) * s + 1, s - 1, s - 1);
      }
    }

    // pass 1: everything except lamps glow ordering - draw lamps first so glow sits under others
    const order = [];
    sim.cells.forEach((c, i) => { if (c) order.push(i); });
    order.sort((a, b) => (sim.cells[b].t === 'lamp') - (sim.cells[a].t === 'lamp'));
    for (const i of order) {
      const x = i % W, y = (i / W) | 0;
      drawCell(ctx, sim.cells[i], x * s, y * s, s, cellInfo(sim, x, y));
    }

    // fixed (challenge) parts
    sim.cells.forEach((c, i) => {
      if (!c || !c.fixed) return;
      const x = (i % W) * s, y = ((i / W) | 0) * s;
      ctx.fillStyle = 'rgba(255,207,74,.9)';
      ctx.beginPath(); ctx.moveTo(x + 1, y + 1); ctx.lineTo(x + s * 0.3, y + 1); ctx.lineTo(x + 1, y + s * 0.3); ctx.closePath(); ctx.fill();
    });
    // probes
    st.probes.forEach((p, k) => {
      ctx.strokeStyle = PROBE_COLORS[k]; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(p.x * s + s / 2, p.y * s + s / 2, s * 0.46, 0, 7); ctx.stroke();
      ctx.fillStyle = PROBE_COLORS[k];
      ctx.font = `700 ${Math.max(9, s * 0.34)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(k + 1), p.x * s + s * 0.15, p.y * s + s * 0.82);
    });

    // power numbers
    if (st.showLevels) {
      ctx.font = `600 ${Math.max(9, s * 0.38)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      sim.cells.forEach((c, i) => {
        if (!c) return;
        const x = i % W, y = (i / W) | 0, net = sim.net;
        let txt = null;
        if (c.t === 'dust') txt = String(net.level[i]);
        else if (c.t === 'comparator') txt = String(c.out);
        else if (c.t === 'block' && net.bpow[i]) txt = net.bpow[i] === 2 ? 'S' : 'W';
        if (txt === null) return;
        const tx = x * s + s * 0.78, ty = y * s + s * 0.24;
        ctx.fillStyle = 'rgba(0,0,0,.7)';
        rr(ctx, tx - s * 0.2, ty - s * 0.17, s * 0.4, s * 0.34, 3); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillText(txt, tx, ty + 0.5);
      });
    }

    // route overlay
    const R = st.route;
    if (st.tool === 'route') {
      const mark = (p, col, label) => {
        if (!p) return;
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([5, 3]);
        ctx.strokeRect(p.x * s + 2, p.y * s + 2, s - 4, s - 4); ctx.setLineDash([]);
        ctx.fillStyle = col; ctx.font = `700 ${Math.max(10, s * 0.4)}px system-ui, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText(label, p.x * s + s / 2, p.y * s - 2);
      };
      if (R.result && R.result.cells) {
        const ghost = st.sim.clone();
        R.result.cells.forEach(c => ghost.set(c.x, c.y, makeCell(c.t, { f: c.f })));
        ghost.compute();
        ctx.save();
        for (const c of R.result.cells) {
          ctx.fillStyle = 'rgba(90,200,255,.18)'; ctx.fillRect(c.x * s + 1, c.y * s + 1, s - 1, s - 1);
          ctx.globalAlpha = 0.85;
          const gc = ghost.get(c.x, c.y);
          const info = cellInfo(ghost, c.x, c.y);
          if (gc.t === 'dust') info.level = 15;
          drawCell(ctx, gc, c.x * s, c.y * s, s, info);
          ctx.globalAlpha = 1;
        }
        ctx.restore();
      }
      mark(R.src, '#5ce08a', 'START');
      mark(R.tgt, '#ffcf4a', 'TARGET');
    }

    // hover ghost
    const hv = st.hover;
    if (hv) {
      const occupied = sim.get(hv.x, hv.y);
      let col = 'rgba(255,255,255,.55)';
      if (!occupied && TYPES[st.tool]) {
        ctx.globalAlpha = 0.5;
        const g = placementCell(st.tool, hv.x, hv.y);
        const info = { level: 0, conn: 0, point: 15, bpow: 0, lit: 0, want: 0 };
        if (g.t === 'torch') { const A = sim.nb(hv.x, hv.y, opp(g.f)); info.attached = !!(A && A.t === 'block'); }
        drawCell(ctx, g, hv.x * s, hv.y * s, s, info);
        ctx.globalAlpha = 1;
        if (st.tool === 'dust' && wouldMerge(hv.x, hv.y)) col = '#ff5a4f';
      }
      if (st.tool === 'erase' && occupied) col = '#ff5a4f';
      ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.strokeRect(hv.x * s + 1, hv.y * s + 1, s - 2, s - 2);
    }
  }

  // ------------------------------------------------------------------ editing
  function snapshot() { return JSON.stringify(st.sim.cells); }
  function pushUndo() {
    st.undo.push(snapshot()); if (st.undo.length > 80) st.undo.shift();
    st.redo = [];
  }
  function restore(json) {
    st.sim.cells = JSON.parse(json);
    changed();
  }
  function undo() { if (!st.undo.length) return toast('Nothing to undo'); st.redo.push(snapshot()); restore(st.undo.pop()); }
  function redo() { if (!st.redo.length) return; st.undo.push(snapshot()); restore(st.redo.pop()); }

  let saveTimer = 0;
  function changed() {
    st.comps = null;
    st.sim.compute();
    if (st.route.result) { st.route.result = null; if (st.route.phase === 'result') st.route.phase = 'src'; renderRoutePanel(); }
    render(); renderInspector();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { localStorage.setItem('redstone-playground', JSON.stringify(st.sim.serialize())); } catch (e) { /* ignore */ } }, 400);
  }

  function place(x, y, tool, warn) {
    const sim = st.sim;
    if (!sim.inb(x, y) || sim.get(x, y)) return false;
    const merge = tool === 'dust' && warn && wouldMerge(x, y);
    sim.set(x, y, placementCell(tool, x, y));
    st.comps = null;
    if (merge) toast('⚠️ That dust just joined two separate wires, so they now share one signal. Undo (Ctrl+Z) and leave a one-block gap, or use a repeater.', 'warn', 6000);
    return true;
  }

  function erase(x, y) {
    const c = st.sim.get(x, y);
    if (!c) return false;
    if (c.fixed) { toast('That part belongs to the challenge and can\'t be removed.'); return false; }
    st.sim.set(x, y, null); st.comps = null; return true;
  }

  function interact(x, y) {
    const c = st.sim.get(x, y);
    if (!c) return false;
    switch (c.t) {
      case 'lever': c.on = !c.on; break;
      case 'button': c.on = true; c.timer = 10; break;
      case 'repeater': c.delay = c.delay % 4 + 1; break;
      case 'comparator': c.mode = c.mode === 'sub' ? 'cmp' : 'sub'; break;
      case 'torch': case 'observer': case 'piston': rotateCell(x, y, false); break;
      default: st.inspect = { x, y }; renderInspector(); setTab('inspect'); return false;
    }
    st.inspect = { x, y };
    st.sim.compute(); render(); renderInspector();
    return true;
  }

  function rotateCell(x, y, undoable = true) {
    const c = st.sim.get(x, y);
    if (!c || c.f === undefined) return false;
    if (c.fixed) { toast('That part belongs to the challenge.'); return true; }
    if (undoable) pushUndo();
    c.f = (c.f + 1) % 4;
    if (c.t === 'observer') c.sig = undefined;
    changed();
    return true;
  }

  // ------------------------------------------------------------------ input
  function cellAt(e) {
    const r = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) / st.cs), y = Math.floor((e.clientY - r.top) / st.cs);
    return st.sim.inb(x, y) ? { x, y } : null;
  }

  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('pointerdown', e => {
    const p = cellAt(e);
    if (!p) return;
    const { x, y } = p;
    const occupied = st.sim.get(x, y);
    st.lastPaint = p;
    if (e.button === 2 || st.tool === 'erase') {
      if (occupied && !occupied.fixed) { pushUndo(); erase(x, y); changed(); } else if (occupied) erase(x, y);
      st.painting = 'erase';
      canvas.setPointerCapture(e.pointerId);
      return;
    }
    if (st.tool === 'route') return routeClick(x, y);
    if (st.tool === 'probe') return toggleProbe(x, y);
    if (st.tool === 'hand') { if (occupied) interact(x, y); else { st.inspect = { x, y }; renderInspector(); } return; }
    if (st.tool === 'rotate') { if (!rotateCell(x, y)) toast('Only torches, repeaters, comparators, observers and pistons can be rotated.'); return; }
    if (occupied) { interact(x, y); return; }
    pushUndo();
    place(x, y, st.tool, true);
    st.inspect = { x, y };
    changed();
    if (st.tool === 'dust' || st.tool === 'block') { st.painting = st.tool; canvas.setPointerCapture(e.pointerId); }
  });

  canvas.addEventListener('pointermove', e => {
    const p = cellAt(e);
    const prev = st.hover;
    st.hover = p;
    if (p && e.pointerType === 'mouse' && !st.painting && (!prev || prev.x !== p.x || prev.y !== p.y)) {
      if (st.sim.get(p.x, p.y) || (st.inspect && !st.sim.get(st.inspect.x, st.inspect.y))) { st.inspect = p; renderInspector(); }
    }
    if (st.painting && p && st.lastPaint) {
      // walk along the line from the last cell so fast drags don't leave gaps
      let { x, y } = st.lastPaint; let any = false;
      while (x !== p.x || y !== p.y) {
        if (x !== p.x) x += Math.sign(p.x - x); else y += Math.sign(p.y - y);
        any = (st.painting === 'erase' ? erase(x, y) : place(x, y, st.painting, true)) || any;
      }
      st.lastPaint = p;
      if (any) changed();
    }
    if (!prev || !p || prev.x !== p.x || prev.y !== p.y) render();
  });
  const endPaint = () => { st.painting = null; st.lastPaint = null; };
  canvas.addEventListener('pointerup', endPaint);
  canvas.addEventListener('pointercancel', endPaint);
  canvas.addEventListener('pointerleave', () => { st.hover = null; render(); });

  window.addEventListener('keydown', e => {
    if (e.target.matches('input, select, textarea')) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redo(); return; }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (k === ' ') { e.preventDefault(); toggleRun(); return; }
    if (k === 'escape') { resetRoute(); return; }
    if (k === 'r' && st.hover && st.sim.get(st.hover.x, st.hover.y)?.f !== undefined) { rotateCell(st.hover.x, st.hover.y); return; }
    if (k === 'r') { setRot((st.rot + 1) % 4); return; }
    const t = TOOLS.find(t => t.key.toLowerCase() === k);
    if (t && t.id !== 'rotate') setTool(t.id);
  });

  // ------------------------------------------------------------------ palette
  const ICONS = {
    hand: '<svg viewBox="0 0 24 24"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-5.5a1.5 1.5 0 0 1 3 0V12m0-4.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.6-2.2L4.3 15.4a1.6 1.6 0 0 1 2.4-2.1L8 14.6"/></svg>',
    rotate: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/></svg>',
    erase: '<svg viewBox="0 0 24 24"><path d="m7 21-4-4a2 2 0 0 1 0-2.8L13.2 4a2 2 0 0 1 2.8 0l4 4a2 2 0 0 1 0 2.8L10 21z"/><path d="M22 21H7M5 11l9 9"/></svg>',
    probe: '<svg viewBox="0 0 24 24"><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>',
    route: '<svg viewBox="0 0 24 24"><circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path d="M8.5 19H16a3.5 3.5 0 0 0 0-7H8a3.5 3.5 0 0 1 0-7h7.5"/></svg>',
  };

  function iconCanvas(t) {
    const s = 34, cv = document.createElement('canvas'), dpr = window.devicePixelRatio || 1;
    cv.width = s * dpr; cv.height = s * dpr; cv.style.width = s + 'px'; cv.style.height = s + 'px';
    const c = cv.getContext('2d'); c.scale(dpr, dpr);
    const cell = makeCell(t, { f: 1, on: true });
    if (t === 'torch') cell.on = true;
    if (t === 'repeater') cell.on = true;
    if (t === 'comparator') cell.out = 15;
    if (t === 'observer') cell.pulse = true;
    const info = { level: 15, conn: 10, point: 10, bpow: 0, lit: t === 'lamp' ? 1 : 0, want: 0, attached: false };
    drawCell(c, cell, 0, 0, s, info);
    return cv;
  }

  function buildPalette() {
    const pal = $('#palette');
    pal.innerHTML = '';
    TOOLS.forEach(t => {
      const b = document.createElement('button');
      b.className = 'tool'; b.dataset.tool = t.id;
      b.title = `${t.label} (${t.key})${t.tip ? ' — ' + t.tip : ''}`;
      const ic = document.createElement('span'); ic.className = 'tool-icon';
      if (ICONS[t.id]) ic.innerHTML = ICONS[t.id]; else ic.appendChild(iconCanvas(t.id));
      const lb = document.createElement('span'); lb.className = 'tool-label'; lb.textContent = t.label;
      const kb = document.createElement('kbd'); kb.textContent = t.key;
      b.append(ic, lb, kb);
      b.addEventListener('click', () => setTool(t.id));
      if (['rotate', 'route', 'hand', 'probe', 'erase'].includes(t.id)) b.classList.add('tool-util');
      pal.appendChild(b);
    });
  }

  const HINTS = {
    hand: 'Tap levers, buttons, repeaters (delay) and comparators (mode). Tap anything to inspect it.',
    dust: 'Click or drag to lay dust. A red outline means you would join two separate wires.',
    block: 'Click or drag to place solid blocks. Dust pointing into a block powers it, and torches stuck to it then turn off.',
    torch: 'Torches stick to a block behind them automatically. Use R to change direction.',
    repeater: 'Takes power from the back and sends it out the arrow. Placed next to a wire, it turns to take power from it. Tap a placed one to change its delay; use Rotate to turn it.',
    comparator: 'Back = main input, sides = compared. Tap a placed one to switch compare/subtract.',
    observer: 'The face looks at the block in front. A pulse comes out the back (red dot) when that block changes.',
    piston: 'Pushes out when powered from any side except its face.',
    rotate: 'Tap a directional part to turn it 90°.',
    probe: 'Tap up to 4 parts to graph their signal in the Signal graph below the board. Tap again to remove.',
    erase: 'Tap or drag to remove. Right-click erases with any tool.',
    route: 'Route helper: tap the START (what has the signal), then the TARGET.',
  };

  function setTool(id) {
    st.tool = id;
    document.querySelectorAll('.tool').forEach(b => b.classList.toggle('active', b.dataset.tool === id));
    $('#hint').textContent = HINTS[id] || `Click to place a ${TYPES[id]?.name.toLowerCase() || id}. Click a placed one to use it. Right-click erases.`;
    if (id === 'route') { setTab('route'); renderRoutePanel(); }
    render();
  }

  const ARROWS = ['↑', '→', '↓', '←'];
  function setRot(r) { st.rot = r; $('#rotBtn .rot-arrow').textContent = ARROWS[r]; render(); }

  // ------------------------------------------------------------------ side panel
  function setTab(id) {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
    document.querySelectorAll('.tab-panel').forEach(p => p.hidden = p.id !== 'panel-' + id);
  }
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
    setTab(t.dataset.tab);
    if (t.dataset.tab === 'route') setTool('route');
  }));

  const DESC = {
    dust: 'Carries a signal. Strength drops by 1 every block (max 15). It joins up with any dust or redstone part right next to it.',
    block: 'Conducts power. <b>Strongly</b> powered (by a repeater, comparator, lever, button or observer), it also powers dust next to it. <b>Weakly</b> powered (by dust pointing in), it only powers lamps, pistons, repeaters and torches stuck to it.',
    rblock: 'Always-on power source (strength 15). Powers dust and parts next to it, but not other blocks.',
    lever: 'On/off switch. Tap it to flip. It strongly powers blocks next to it.',
    button: 'Tap it for a 1 second pulse (10 ticks).',
    torch: 'Always on, <b>unless the block it\'s stuck to is powered</b>, so it flips the signal. It powers everything around it except its own block.',
    repeater: 'Takes power from the back and sends full strength 15 out the front after its delay. One-way only, and it ignores wires at its sides. A powered repeater or comparator pointing into its side <b>locks</b> it.',
    comparator: 'Back = main input, sides = compared. <b>Compare</b>: outputs the back signal unless a side is stronger. <b>Subtract</b>: outputs back − side.',
    observer: 'Watches the block in front of its face. When that block changes, it sends a short pulse out of its back.',
    lamp: 'Lights up when powered from any side.',
    piston: 'Pushes out when powered from any side except its face. (Here it just extends; it doesn\'t move blocks.)',
  };

  function renderInspector() {
    const box = $('#panel-inspect');
    const p = st.inspect;
    const c = p && st.sim.get(p.x, p.y);
    if (!c) {
      box.innerHTML = `<div class="empty-state"><p><b>Hover or tap</b> anything on the board to see how it's powered.</p>
        <p class="muted">New to redstone? Open the <b>Learn</b> tab. Want to send a signal somewhere without messing up your other circuits? Use the <b>Route helper</b>.</p></div>`;
      return;
    }
    const sim = st.sim, i = sim.idx(p.x, p.y), net = sim.net;
    const lines = [];
    const dirsOf = m => [0, 1, 2, 3].filter(d => m >> d & 1).map(d => DIR_NAMES[d]);
    switch (c.t) {
      case 'dust':
        lines.push(`Strength: <b class="lv">${net.level[i]}</b> / 15`);
        lines.push(net.conn[i] ? `Connected ${dirsOf(net.conn[i]).join(', ')}` : 'Not connected to anything (cross shape)');
        lines.push(`Powers blocks/lamps ${dirsOf(net.point[i]).join(', ')}`);
        if (!st.comps) st.comps = dustComponents(sim);
        { let n = 0; st.comps.comp.forEach(v => { if (v === st.comps.comp[i]) n++; }); lines.push(`Part of a wire ${n} dust long`); }
        break;
      case 'block': lines.push(['Unpowered', 'Weakly powered', 'Strongly powered'][net.bpow[i]]); break;
      case 'lever': case 'button': lines.push(c.on ? 'ON, sending 15' : 'OFF'); break;
      case 'torch': {
        const A = sim.nb(p.x, p.y, opp(c.f));
        lines.push(c.on ? 'ON, sending 15' : 'OFF');
        if (c.burnt) lines.push('<span class="warn">BURNT OUT: it flipped too often (8 times in 3 s). It recovers after a few seconds.</span>');
        lines.push(A && A.t === 'block' ? `Stuck to the block ${DIR_NAMES[opp(c.f)]}` : '<span class="warn">Not stuck to a block, so nothing can turn it off. Rotate it so its back touches a block.</span>');
        break;
      }
      case 'repeater':
        lines.push(`Delay: ${c.delay} tick${c.delay > 1 ? 's' : ''} (tap to change)`);
        lines.push(c.on ? 'Output ON (15)' : 'Output OFF');
        if (net.want[i] & 2) lines.push('<span class="warn">LOCKED by a side input</span>');
        break;
      case 'comparator':
        lines.push(`Mode: ${c.mode === 'sub' ? 'Subtract' : 'Compare'} (tap to switch)`);
        lines.push(`Back: ${c._rear ?? 0}, side: ${c._side ?? 0}, output: <b class="lv">${c.out}</b>`);
        break;
      case 'observer': lines.push(`Watching the space ${DIR_NAMES[c.f]}`); lines.push(c.pulse ? 'PULSING' : 'Idle'); break;
      case 'lamp': lines.push(net.lit[i] ? 'Lit' : 'Off'); break;
      case 'piston': lines.push(net.lit[i] ? 'Extended' : 'Retracted'); break;
    }
    // power sources feeding this cell
    const feeds = [];
    if (!['lever', 'button', 'rblock'].includes(c.t)) {
      const kind = c.t === 'dust' ? 'dust' : c.t === 'block' ? 'block' : 'comp';
      for (let d = 0; d < 4; d++) {
        const N = sim.nb(p.x, p.y, d);
        if (!N) continue;
        let v;
        if (c.t === 'block') {
          v = Sim.strongInto(N, opp(d)) ? 15 : 0;
          if (!v && N.t === 'dust') { const j = sim.nbi(p.x, p.y, d); v = (net.point[j] >> opp(d) & 1) ? net.level[j] : 0; }
        } else if (c.t === 'dust' && N.t === 'dust') {
          v = net.level[sim.nbi(p.x, p.y, d)];
        } else v = sim.inputFrom(p.x, p.y, d, kind);
        if (v > 0) feeds.push(`<li><b class="lv">${v}</b> from the ${TYPES[N.t].name.toLowerCase()} ${DIR_NAMES[d]}</li>`);
      }
    }
    box.innerHTML = `<h3>${TYPES[c.t].name}</h3><p class="desc">${DESC[c.t]}</p>
      <ul class="state">${lines.map(l => `<li>${l}</li>`).join('')}</ul>
      ${feeds.length ? `<h4>Getting power from</h4><ul class="feeds">${feeds.join('')}</ul>` : ''}`;
  }

  function renderLessons() {
    const box = $('#panel-learn');
    box.innerHTML = `<p class="muted">Each lesson loads an example onto the board, replacing your build (Ctrl+Z brings it back). Use the <b>Probe</b> tool and the <b>Signal graph</b> to see timing.</p>`;
    CHAPTERS.forEach((ch, ci) => {
      const h = document.createElement('h4'); h.className = 'chapter'; h.textContent = `${ci + 1}. ${ch.title}`;
      box.appendChild(h);
      ch.lessons.forEach(l => {
        const d = document.createElement('details');
        d.className = 'lesson';
        d.innerHTML = `<summary>${l.title}</summary><div class="lesson-body">${l.body}</div>`;
        const b = document.createElement('button');
        b.className = 'btn primary'; b.textContent = 'Load this example';
        b.addEventListener('click', () => loadExample(l.id, l.probes));
        d.querySelector('.lesson-body').appendChild(b);
        box.appendChild(d);
      });
    });
    const h = document.createElement('h4'); h.className = 'chapter'; h.textContent = `${CHAPTERS.length + 1}. Challenges`;
    box.appendChild(h);
    const intro = document.createElement('p'); intro.className = 'muted small';
    intro.innerHTML = 'The fixed parts (yellow corner) can\'t be removed. Build the rest, then press <b>Check my circuit</b>. The checker flips the inputs for you and watches the lamps.';
    box.appendChild(intro);
    const done = loadDone();
    CHALLENGES.forEach(c => {
      const b = document.createElement('button');
      b.className = 'challenge-btn' + (st.challenge === c.id ? ' active' : '');
      b.innerHTML = `<span>${done[c.id] ? '✅' : '⬜'} ${c.title}</span><span class="stars">${'★'.repeat(c.level)}${'☆'.repeat(4 - c.level)}</span>`;
      b.addEventListener('click', () => loadChallenge(c.id));
      box.appendChild(b);
      if (st.challenge === c.id) box.appendChild(challengeCard(c));
    });
  }

  function loadDone() { try { return JSON.parse(localStorage.getItem('redstone-done') || '{}'); } catch (e) { return {}; } }

  function challengeCard(c) {
    const d = document.createElement('div'); d.className = 'challenge-card';
    const r = st.challengeResult;
    d.innerHTML = `<p>${c.brief}</p>
      <div class="row"><button class="btn primary" data-act="check">Check my circuit</button><button class="btn" data-act="reset">Restart</button></div>
      ${r ? (r.error ? `<div class="callout bad">${r.error}</div>` : `<div class="callout ${r.pass ? 'good' : 'bad'}"><b>${r.pass ? 'Solved! 🎉' : 'Not yet'}</b>
        <ul class="checks">${r.rows.map(x => `<li class="${x.ok ? 'ok' : 'no'}">${x.ok ? '✓' : '✗'} ${x.label}</li>`).join('')}</ul></div>`) : ''}`;
    d.querySelector('[data-act=check]').addEventListener('click', () => {
      st.challengeResult = runChallenge(st.sim, c);
      if (st.challengeResult.pass) {
        const done = loadDone(); done[c.id] = 1;
        try { localStorage.setItem('redstone-done', JSON.stringify(done)); } catch (e) { /* ignore */ }
        toast('Challenge solved!', 'good');
      }
      renderLessons();
    });
    d.querySelector('[data-act=reset]').addEventListener('click', () => loadChallenge(c.id));
    return d;
  }

  function loadBoard(data, probes) {
    pushUndo();
    const s = Sim.deserialize(data, W, H);
    s.settle(30);
    st.sim.cells = s.cells;
    st.probes = (probes || []).map(([x, y]) => ({ x, y, hist: [] }));
    resetRoute(true);
    changed();
    renderScope();
  }

  function loadExample(id, probes) {
    st.challenge = null; st.challengeResult = null;
    loadBoard(EXAMPLES[id](), probes);
    renderLessons();
    toast('Example loaded. Ctrl+Z brings your build back.');
  }

  function loadChallenge(id) {
    const c = CHALLENGES.find(c => c.id === id);
    st.challenge = id; st.challengeResult = null;
    loadBoard(c.setup(), []);
    renderLessons();
    setTool('dust');
  }

  // ------------------------------------------------------------------ probes & signal graph
  function probeVal(x, y) {
    const sim = st.sim, c = sim.get(x, y);
    if (!c) return 0;
    const i = sim.idx(x, y), net = sim.net;
    switch (c.t) {
      case 'dust': return net.level[i];
      case 'lamp': case 'piston': return net.lit[i] ? 15 : 0;
      case 'comparator': return c.out;
      case 'observer': return c.pulse ? 15 : 0;
      case 'block': return net.bpow[i] ? 15 : 0;
      case 'rblock': return 15;
      default: return c.on ? 15 : 0;
    }
  }
  function recordProbes() {
    for (const p of st.probes) { p.hist.push(probeVal(p.x, p.y)); if (p.hist.length > 400) p.hist.shift(); }
  }
  function toggleProbe(x, y) {
    const k = st.probes.findIndex(p => p.x === x && p.y === y);
    if (k >= 0) st.probes.splice(k, 1);
    else {
      if (!st.sim.get(x, y)) { toast('Tap a part (dust, lamp, torch, repeater…) to probe it.'); return; }
      if (st.probes.length >= 4) st.probes.shift();
      st.probes.push({ x, y, hist: [] });
    }
    render(); renderScope();
  }
  function measure(hist) {
    const rises = [];
    for (let i = 1; i < hist.length; i++) if (hist[i] > 0 && !(hist[i - 1] > 0)) rises.push(i);
    if (rises.length < 3) return null;
    const last = rises.slice(-5), d = last.slice(1).map((r, i) => r - last[i]);
    if (Math.max(...d) - Math.min(...d) > 1) return null;
    const period = Math.round(d.reduce((a, b) => a + b, 0) / d.length);
    let on = 0; for (let i = last[last.length - 2]; i < last[last.length - 1]; i++) if (hist[i] > 0) on++;
    return { period, on };
  }

  const scope = $('#scope'), sctx = scope.getContext('2d');
  function renderScope() {
    const legend = $('#scopeLegend');
    const wrap = scope.parentElement;
    const w = wrap.clientWidth, h = 120, dpr = window.devicePixelRatio || 1;
    if (scope.width !== w * dpr) { scope.width = w * dpr; scope.height = h * dpr; scope.style.height = h + 'px'; }
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sctx.fillStyle = '#16181c'; sctx.fillRect(0, 0, w, h);
    const N = 100, step = w / N;
    sctx.strokeStyle = '#262a31'; sctx.lineWidth = 1;
    for (let i = 0; i <= N; i += 10) { const x = Math.round(w - i * step) + 0.5; sctx.beginPath(); sctx.moveTo(x, 0); sctx.lineTo(x, h); sctx.stroke(); }
    if (!st.probes.length) {
      sctx.fillStyle = '#9aa1aa'; sctx.font = '13px system-ui, sans-serif'; sctx.textAlign = 'center'; sctx.textBaseline = 'middle';
      sctx.fillText('Pick the Probe tool (T) and tap parts to graph their signal over time', w / 2, h / 2);
      legend.innerHTML = '';
      return;
    }
    const lane = (h - 8) / st.probes.length;
    st.probes.forEach((p, k) => {
      const top = 4 + k * lane, hh = lane - 6;
      sctx.strokeStyle = PROBE_COLORS[k]; sctx.lineWidth = 2; sctx.beginPath();
      const hist = p.hist.slice(-N);
      hist.forEach((v, i) => {
        const x = w - (hist.length - i) * step, y = top + hh - (v / 15) * hh;
        if (i === 0) sctx.moveTo(x, y); else { sctx.lineTo(x, sctx._lastY ?? y); sctx.lineTo(x, y); }
        sctx._lastY = y;
      });
      if (hist.length) sctx.lineTo(w, sctx._lastY);
      sctx.stroke(); sctx._lastY = undefined;
    });
    legend.innerHTML = st.probes.map((p, k) => {
      const c = st.sim.get(p.x, p.y), m = measure(p.hist);
      const name = c ? TYPES[c.t].name : '(empty)';
      const info = m ? `period <b>${m.period}</b> ticks (${(m.period / 10).toFixed(1)} s) · on ${m.on} / off ${m.period - m.on}` : `now ${probeVal(p.x, p.y)}`;
      return `<span class="probe-item"><i style="background:${PROBE_COLORS[k]}"></i>${k + 1}. ${name}: ${info}</span>`;
    }).join('') + `<button class="btn tiny" id="clearProbes">Clear</button>`;
    $('#clearProbes').onclick = () => { st.probes = []; render(); renderScope(); };
  }

  // ------------------------------------------------------------------ route helper
  function resetRoute(silent) {
    st.route = { phase: 'src', src: null, tgt: null, result: null };
    if (!silent) { renderRoutePanel(); render(); }
  }

  function routeClick(x, y) {
    let R = st.route;
    const c = st.sim.get(x, y);
    if (R.phase === 'result') { st.route = R = { phase: 'src', src: null, tgt: null, result: null }; }
    if (!c) { toast(R.phase === 'src' ? 'Tap something that has a signal (lever, torch, wire…).' : 'Tap the thing you want to power (lamp, piston, block, wire…).'); return; }
    if (R.phase === 'src') { R.src = { x, y }; R.phase = 'tgt'; }
    else if (R.phase === 'tgt') {
      R.tgt = { x, y };
      R.result = findRoute(st.sim, R.src.x, R.src.y, x, y);
      R.phase = 'result';
    }
    st.route = R;
    renderRoutePanel(); render();
  }

  function renderRoutePanel() {
    const R = st.route, box = $('#panel-route');
    const nm = p => p ? TYPES[st.sim.get(p.x, p.y)?.t]?.name || '?' : '';
    let html = `<h3>Route helper</h3>
      <p class="desc">Get a signal from one thing to another <b>without touching or changing any of your other circuits</b>.</p>
      <ol class="steps">
        <li class="${R.phase === 'src' ? 'now' : 'done'}">Tap the <b>start</b>: something with a signal${R.src ? `: <span class="pill start">${nm(R.src)}</span>` : ''}</li>
        <li class="${R.phase === 'tgt' ? 'now' : R.phase === 'result' ? 'done' : ''}">Tap the <b>target</b> you want to power${R.tgt ? `: <span class="pill target">${nm(R.tgt)}</span>` : ''}</li>
      </ol>`;
    if (st.tool !== 'route') html += `<button class="btn primary" id="routeStart">Start picking</button>`;
    if (R.phase === 'result' && R.result) {
      if (R.result.error) {
        html += `<div class="callout bad"><b>No route.</b> ${R.result.error}</div><button class="btn" id="routeReset">Try again</button>`;
      } else {
        const r = R.result, reps = r.cells.filter(c => c.t === 'repeater').length;
        html += `<div class="callout good"><b>Found a safe route:</b> ${r.dust} dust + ${reps} repeater${reps === 1 ? '' : 's'}. It's shown in blue on the board.</div>
        <h4>Why it's built this way</h4>
        <ol class="why">
          <li><b>Starts with a repeater facing away</b> from the start. Repeaters are one-way, so nothing on the new wire can flow back into your existing circuit.</li>
          ${r.dust ? '<li><b>Keeps a one-block gap</b> from everything else. Dust joins up with anything right next to it, and that\'s how signals get mixed or stolen.</li>' : ''}
          ${r.boosters ? `<li><b>${r.boosters} booster repeater${r.boosters > 1 ? 's' : ''}</b> in the middle, because dust fades out after 15 blocks.</li>` : ''}
          <li><b>Ends with a repeater pointing into</b> the target, so the target gets full strength and nothing beside it gets powered.</li>
          <li>✅ <b>Checked:</b> building this doesn't change the power of any existing part.</li>
        </ol>
        <div class="row"><button class="btn primary" id="routeBuild">Build it</button><button class="btn" id="routeReset">Cancel</button></div>
        <p class="muted small">In the real game you can also go over or under another wire, since a one-block height difference keeps wires apart too.</p>`;
      }
    }
    box.innerHTML = html;
    box.querySelector('#routeStart')?.addEventListener('click', () => setTool('route'));
    box.querySelector('#routeReset')?.addEventListener('click', () => resetRoute());
    box.querySelector('#routeBuild')?.addEventListener('click', buildRoute);
  }

  function buildRoute() {
    const r = st.route.result;
    if (!r || !r.cells) return;
    pushUndo();
    r.cells.forEach(c => st.sim.set(c.x, c.y, makeCell(c.t, { f: c.f })));
    resetRoute(true);
    changed();
    renderRoutePanel();
    toast('Built! Flip your source to test it. Ctrl+Z removes it.', 'good');
  }

  // ------------------------------------------------------------------ toolbar
  let timer = 0;
  function startLoop() {
    clearInterval(timer);
    if (st.running) timer = setInterval(tick, 1000 / st.tps);
  }
  let lastInsp = 0;
  function renderInspectorThrottled() { const t = performance.now(); if (t - lastInsp > 120) { lastInsp = t; renderInspector(); } }

  function toggleRun() {
    st.running = !st.running;
    $('#playBtn').textContent = st.running ? '⏸ Pause' : '▶ Play';
    $('#stepBtn').disabled = st.running;
    startLoop();
  }
  $('#playBtn').addEventListener('click', toggleRun);
  $('#stepBtn').addEventListener('click', () => { tick(); renderInspector(); });
  function tick() {
    st.sim.step();
    recordProbes();
    render(); renderScope();
    $('#tickCount').textContent = st.sim.ticks;
    if (st.inspect) renderInspectorThrottled();
  }
  $('#speed').addEventListener('change', e => { st.tps = +e.target.value; startLoop(); });
  $('#undoBtn').addEventListener('click', undo);
  $('#rotBtn').addEventListener('click', () => setRot((st.rot + 1) % 4));
  $('#clearBtn').addEventListener('click', () => {
    if (!st.sim.cells.some(Boolean)) return;
    pushUndo(); st.sim.cells.fill(null); resetRoute(true); changed(); toast('Board cleared. Ctrl+Z brings it back.');
  });
  $('#levelsChk').addEventListener('change', e => { st.showLevels = e.target.checked; render(); });
  $('#circuitsChk').addEventListener('change', e => {
    st.showCircuits = e.target.checked; render();
    if (st.showCircuits) { const n = (st.comps || (st.comps = dustComponents(st.sim))).count; toast(`${n} separate wire${n === 1 ? '' : 's'} on the board. Each color is its own signal.`); }
  });
  $('#zoomIn').addEventListener('click', () => { st.zoom = Math.min(2.5, st.zoom * 1.2); resize(); });
  $('#zoomOut').addEventListener('click', () => { st.zoom = Math.max(0.5, st.zoom / 1.2); resize(); });
  $('#shareBtn').addEventListener('click', async () => {
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(st.sim.serialize()))));
    const url = location.origin + location.pathname + '#b=' + code;
    history.replaceState(null, '', '#b=' + code);
    try { await navigator.clipboard.writeText(url); toast('Link copied. Anyone who opens it sees your build.', 'good'); }
    catch (e) { toast('Link is in the address bar. Copy it from there.'); }
  });

  let toastTimer = 0;
  function toast(msg, kind = '', ms = 3500) {
    const t = $('#toast');
    t.textContent = msg; t.className = 'show ' + kind;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.className = '', ms);
  }

  // ------------------------------------------------------------------ boot
  function boot() {
    let data = null;
    const m = location.hash.match(/#b=([^&]+)/);
    if (m) { try { data = JSON.parse(decodeURIComponent(escape(atob(m[1])))); } catch (e) { data = null; } }
    if (!data) { try { const s = localStorage.getItem('redstone-playground'); if (s) data = JSON.parse(s); } catch (e) { /* ignore */ } }
    if (!data || !data.c || !data.c.length) data = EXAMPLES.basics();
    st.sim = Sim.deserialize(data, W, H);
    st.sim.settle(30);
    buildPalette(); renderLessons(); renderInspector(); renderRoutePanel(); renderScope();
    setTool('dust'); setRot(1); setTab('learn');
    resize();
    window.addEventListener('resize', () => { resize(); renderScope(); });
    startLoop();
  }
  boot();
})();
