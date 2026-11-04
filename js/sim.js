// Redstone Playground — simulation engine
// Top-down, single-layer grid. One redstone tick = one step.
'use strict';

const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]]; // up, right, down, left (screen)
const DIR_NAMES = ['above', 'to the right', 'below', 'to the left'];
const opp = d => (d + 2) % 4;

const TYPES = {
  dust: { name: 'Redstone Dust', dir: false },
  block: { name: 'Solid Block', dir: false },
  rblock: { name: 'Block of Redstone', dir: false },
  lever: { name: 'Lever', dir: false },
  button: { name: 'Button', dir: false },
  torch: { name: 'Redstone Torch', dir: true },
  repeater: { name: 'Repeater', dir: true },
  comparator: { name: 'Comparator', dir: true },
  observer: { name: 'Observer', dir: true },
  lamp: { name: 'Redstone Lamp', dir: false },
  piston: { name: 'Piston', dir: true },
};

function makeCell(t, o = {}) {
  const c = { t };
  if (TYPES[t].dir) c.f = o.f ?? 1;
  if (t === 'lever') c.on = !!o.on;
  if (t === 'button') { c.on = false; c.timer = 0; }
  if (t === 'torch') c.on = !!(o.on ?? true);
  if (t === 'repeater') { c.on = !!o.on; c.delay = o.delay || 1; }
  if (t === 'comparator') { c.out = 0; c.mode = o.mode || 'cmp'; }
  if (t === 'observer') { c.pulse = false; if (o.kick) c.pend = { v: true, t: 1 }; }
  if (o.fixed) c.fixed = true;
  return c;
}

class Sim {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.cells = new Array(w * h).fill(null);
    this.ticks = 0;
    this.compute();
  }

  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  idx(x, y) { return y * this.w + x; }
  get(x, y) { return this.inb(x, y) ? this.cells[y * this.w + x] : null; }
  set(x, y, c) { if (this.inb(x, y)) this.cells[y * this.w + x] = c; }
  nb(x, y, d) { return this.get(x + DIRS[d][0], y + DIRS[d][1]); }
  nbi(x, y, d) { return this.idx(x + DIRS[d][0], y + DIRS[d][1]); }

  // Does dust at (x,y) visually/logically connect to neighbour n in direction d?
  static connects(n, d) {
    if (!n) return false;
    switch (n.t) {
      case 'dust': case 'lever': case 'button': case 'rblock': case 'torch': case 'comparator':
        return true;
      case 'repeater': return n.f % 2 === d % 2;
      case 'observer': return n.f === d; // its back (output) faces the dust
      default: return false;
    }
  }

  // Power that neighbour N (index ni) sends in direction `dir` into something of `kind`
  // kind: 'dust' | 'block' | 'comp'
  emit(N, ni, dir, kind) {
    const net = this.net;
    switch (N.t) {
      case 'lever': case 'button': return N.on ? 15 : 0;
      case 'rblock': return kind === 'block' ? 0 : 15;
      case 'torch': return (N.on && kind !== 'block') ? 15 : 0;
      case 'repeater': return (N.on && N.f === dir) ? 15 : 0;
      case 'comparator': return N.f === dir ? N.out : 0;
      case 'observer': return (N.pulse && opp(N.f) === dir) ? 15 : 0;
      case 'block': {
        if (kind === 'block') return 0;
        const b = net.bpow[ni];
        if (kind === 'dust') return b === 2 ? 15 : 0;
        return b ? 15 : 0;
      }
      default: return 0;
    }
  }

  // Power entering (x,y) from its neighbour in direction d
  inputFrom(x, y, d, kind) {
    const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
    const N = this.get(nx, ny);
    if (!N) return 0;
    const ni = this.idx(nx, ny), into = opp(d);
    if (N.t === 'dust') return (this.net.point[ni] >> into & 1) ? this.net.level[ni] : 0;
    return this.emit(N, ni, into, kind);
  }

  // Can neighbour N (in direction d from a cell) send power into that cell?
  static feeds(N, d) {
    if (!N) return false;
    switch (N.t) {
      case 'dust': case 'lever': case 'button': case 'rblock': case 'torch': return true;
      case 'repeater': case 'comparator': return N.f === opp(d);
      case 'observer': return N.f === d;
      default: return false;
    }
  }

  static strongInto(N, dir) {
    if (!N) return false;
    switch (N.t) {
      case 'lever': case 'button': return N.on;
      case 'repeater': return N.on && N.f === dir;
      case 'comparator': return N.out > 0 && N.f === dir;
      case 'observer': return N.pulse && opp(N.f) === dir;
      default: return false;
    }
  }

  compute() {
    const { w, h, cells } = this, n = w * h;
    const net = this.net = {
      level: new Int8Array(n), conn: new Uint8Array(n), point: new Uint8Array(n),
      bpow: new Uint8Array(n), lit: new Uint8Array(n), want: new Int8Array(n),
    };
    const dusts = [];
    // 1. dust shape
    for (let i = 0; i < n; i++) {
      const c = cells[i];
      if (!c) continue;
      const x = i % w, y = (i / w) | 0;
      if (c.t === 'dust') {
        dusts.push(i);
        let m = 0;
        for (let d = 0; d < 4; d++) if (Sim.connects(this.nb(x, y, d), d)) m |= 1 << d;
        net.conn[i] = m;
        let p;
        if (m === 0) p = 15;
        else if (!(m & 10)) p = 5;      // only vertical connections → straight up/down line
        else if (!(m & 5)) p = 10;      // only horizontal
        else p = m;
        net.point[i] = p;
      } else if (c.t === 'block') {
        // 2. strong power from stateful neighbours
        for (let d = 0; d < 4; d++) if (Sim.strongInto(this.nb(x, y, d), opp(d))) net.bpow[i] = 2;
      }
    }
    // 3. dust levels
    for (const i of dusts) {
      const x = i % w, y = (i / w) | 0;
      let base = 0;
      for (let d = 0; d < 4; d++) {
        const N = this.nb(x, y, d);
        if (N && N.t !== 'dust') base = Math.max(base, this.emit(N, this.nbi(x, y, d), opp(d), 'dust'));
      }
      net.level[i] = base;
    }
    let changed = true;
    while (changed) {
      changed = false;
      for (const i of dusts) {
        const x = i % w, y = (i / w) | 0;
        const v = net.level[i] - 1;
        if (v <= 0) continue;
        for (let d = 0; d < 4; d++) {
          const N = this.nb(x, y, d);
          if (N && N.t === 'dust') {
            const j = this.nbi(x, y, d);
            if (net.level[j] < v) { net.level[j] = v; changed = true; }
          }
        }
      }
    }
    // 4. weak power: dust pointing into a block
    for (let i = 0; i < n; i++) {
      const c = cells[i];
      if (!c || c.t !== 'block' || net.bpow[i]) continue;
      const x = i % w, y = (i / w) | 0;
      for (let d = 0; d < 4; d++) {
        const N = this.nb(x, y, d);
        if (N && N.t === 'dust') {
          const j = this.nbi(x, y, d);
          if (net.level[j] > 0 && (net.point[j] >> opp(d) & 1)) { net.bpow[i] = 1; break; }
        }
      }
    }
    // 5. consumers + what stateful parts want to become
    for (let i = 0; i < n; i++) {
      const c = cells[i];
      if (!c) continue;
      const x = i % w, y = (i / w) | 0;
      switch (c.t) {
        case 'lamp': {
          for (let d = 0; d < 4; d++) if (this.inputFrom(x, y, d, 'comp') > 0) { net.lit[i] = 1; break; }
          break;
        }
        case 'piston': {
          for (let d = 0; d < 4; d++) if (d !== c.f && this.inputFrom(x, y, d, 'comp') > 0) { net.lit[i] = 1; break; }
          break;
        }
        case 'torch': {
          const a = opp(c.f);
          const A = this.nb(x, y, a);
          const powered = A && A.t === 'block' && net.bpow[this.nbi(x, y, a)] > 0;
          net.want[i] = powered ? 0 : 1;
          break;
        }
        case 'repeater': {
          let v = this.inputFrom(x, y, opp(c.f), 'comp') > 0 ? 1 : 0;
          for (const sd of [(c.f + 1) % 4, (c.f + 3) % 4]) {
            const N = this.nb(x, y, sd);
            if (N && ((N.t === 'repeater' && N.on) || (N.t === 'comparator' && N.out > 0)) && N.f === opp(sd)) v |= 2;
          }
          net.want[i] = v;
          break;
        }
        case 'comparator': {
          const rear = this.inputFrom(x, y, opp(c.f), 'comp');
          let side = 0;
          for (const sd of [(c.f + 1) % 4, (c.f + 3) % 4]) {
            const N = this.nb(x, y, sd);
            if (N && ['dust', 'repeater', 'comparator', 'rblock', 'observer'].includes(N.t)) side = Math.max(side, this.inputFrom(x, y, sd, 'comp'));
          }
          c._rear = rear; c._side = side;
          net.want[i] = c.mode === 'sub' ? Math.max(rear - side, 0) : (rear >= side ? rear : 0);
          break;
        }
      }
    }
    return net;
  }

  sigAt(x, y) {
    const c = this.get(x, y);
    if (!c) return 'air';
    const i = this.idx(x, y), net = this.net;
    return [c.t, c.f, c.on ? 1 : 0, c.out || 0, c.delay || 0, c.mode || '', c.pulse ? 1 : 0,
      net.level[i], net.bpow[i], net.lit[i], net.conn[i]].join(',');
  }

  step() {
    const { w, cells } = this;
    // a. timers
    for (const c of cells) {
      if (!c) continue;
      if (c.t === 'button' && c.on && --c.timer <= 0) c.on = false;
      if (c.t === 'observer' && c.pulse && --c.offIn <= 0) c.pulse = false;
    }
    // b. apply scheduled changes
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      if (!c || !c.pend) continue;
      if (--c.pend.t > 0) continue;
      const v = c.pend.v; c.pend = null;
      if (c.t === 'repeater' && this.net && (this.net.want[i] & 2)) continue; // locked repeaters ignore their scheduled tick
      if (c.t === 'comparator') c.out = v;
      else if (c.t === 'observer') { c.pulse = true; c.offIn = 1; }
      else c.on = v;
      if (c.t === 'torch' && !v) {
        // burnout: 8 turn-offs within 30 redstone ticks (60 game ticks)
        c.offs = (c.offs || []).filter(t => this.ticks - t < 30);
        c.offs.push(this.ticks);
        if (c.offs.length >= 8) { c.burnt = this.ticks + 50; c.offs = []; }
      }
    }
    // c. evaluate wiring
    this.compute();
    const net = this.net;
    // d. schedule
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      if (!c) continue;
      switch (c.t) {
        case 'torch': {
          let want = !!net.want[i];
          if (c.burnt) { if (this.ticks < c.burnt) want = false; else c.burnt = 0; }
          if (want !== c.on) { if (!c.pend) c.pend = { v: want, t: 1 }; } else c.pend = null;
          break;
        }
        case 'repeater': {
          if (net.want[i] & 2) break; // locked
          const want = !!(net.want[i] & 1);
          if (want !== c.on && !c.pend) c.pend = { v: want, t: c.delay };
          break;
        }
        case 'comparator': {
          const want = net.want[i];
          if (want !== c.out) { if (!c.pend || c.pend.v !== want) c.pend = { v: want, t: 1 }; } else c.pend = null;
          break;
        }
        case 'observer': {
          const x = i % w, y = (i / w) | 0;
          const s = this.sigAt(x + DIRS[c.f][0], y + DIRS[c.f][1]);
          if (c.sig !== undefined && s !== c.sig && !c.pend && !c.pulse) c.pend = { v: true, t: 1 };
          c.sig = s;
          break;
        }
      }
    }
    this.ticks++;
  }

  serialize() {
    const out = [];
    this.cells.forEach((c, i) => {
      if (!c) return;
      const e = [i % this.w, (i / this.w) | 0, c.t];
      const o = {};
      if (c.f !== undefined) o.f = c.f;
      if (c.t === 'lever' && c.on) o.on = 1;
      if (c.t === 'torch' && !c.on) o.on = 0;
      if (c.t === 'observer' && (c.pend || c.pulse)) o.kick = 1;
      if (c.fixed) o.fixed = 1;
      if (c.t === 'repeater' && c.delay > 1) o.delay = c.delay;
      if (c.t === 'comparator' && c.mode === 'sub') o.mode = 'sub';
      if (Object.keys(o).length) e.push(o);
      out.push(e);
    });
    return { w: this.w, h: this.h, c: out };
  }

  static deserialize(data, w, h) {
    const s = new Sim(w || data.w, h || data.h);
    for (const [x, y, t, o] of data.c || []) if (TYPES[t]) s.set(x, y, makeCell(t, o || {}));
    s.compute();
    return s;
  }

  clone() {
    const s = new Sim(this.w, this.h);
    s.cells = this.cells.map(c => c ? JSON.parse(JSON.stringify(c)) : null);
    s.compute();
    return s;
  }

  // Let freshly loaded circuits settle (torches etc.)
  settle(n = 30) { for (let i = 0; i < n; i++) this.step(); }
}

// ---------------------------------------------------------------------------
// Route helper: plan a wire from a source to a target that never touches
// (or changes) any existing circuit.
// ---------------------------------------------------------------------------
function inputsSnapshot(sim) {
  const net = sim.net, out = new Array(sim.cells.length);
  sim.cells.forEach((c, i) => { if (c) out[i] = `${net.level[i]}|${net.bpow[i]}|${net.lit[i]}|${net.want[i]}`; });
  return out;
}

function findRoute(sim, sx, sy, tx, ty) {
  const S = sim.get(sx, sy), T = sim.get(tx, ty);
  if (!S) return { error: 'Pick something that sends a signal as the start.' };
  if (!T) return { error: 'Pick the thing you want to power as the target.' };
  if (sx === tx && sy === ty) return { error: 'The start and the target are the same thing.' };

  let startDirs = [0, 1, 2, 3];
  switch (S.t) {
    case 'repeater': case 'comparator': startDirs = [S.f]; break;
    case 'observer': startDirs = [opp(S.f)]; break;
    case 'lamp': case 'piston':
      return { error: `A ${TYPES[S.t].name.toLowerCase()} doesn't send out a signal. Start from a lever, button, torch, wire, repeater, block of redstone or a powered block.` };
  }
  let endDirs = [0, 1, 2, 3]; // e = direction the final repeater faces
  switch (T.t) {
    case 'repeater': case 'comparator': endDirs = [T.f]; break;
    case 'piston': endDirs = [0, 1, 2, 3].filter(e => e !== opp(T.f)); break;
    case 'torch':
      return { error: "Torches can't take power directly. Power the block the torch is stuck to instead (tap that block as the target)." };
    case 'lever': case 'button': case 'rblock':
      return { error: `A ${TYPES[T.t].name.toLowerCase()} is a power source; it can't be switched by redstone. Pick a lamp, piston, block, wire or repeater.` };
    case 'observer':
      return { error: "Observers don't react to redstone power, only to changes in the block they're looking at." };
  }

  const empty = (x, y) => sim.inb(x, y) && !sim.get(x, y);
  const dustOK = (x, y) => empty(x, y) && [0, 1, 2, 3].every(d => !sim.nb(x, y, d));
  const repOK = (x, y, f) => {
    if (!empty(x, y)) return false;
    for (let d = 0; d < 4; d++) {
      const N = sim.nb(x, y, d);
      if (!N) continue;
      if (N.t === 'observer' && N.f === opp(d)) return false; // someone is watching this spot
      if ((d === (f + 1) % 4 || d === (f + 3) % 4) && (N.t === 'repeater' || N.t === 'comparator') && N.f === opp(d)) return false; // would lock it
    }
    return true;
  };
  const key = (x, y) => y * sim.w + x;
  const ends = new Map(); // key of last-dust cell -> e
  const P = (x, y, d, k = 1) => [x + DIRS[d][0] * k, y + DIRS[d][1] * k];

  const candidates = [];
  for (const d of startDirs) {
    const [c0x, c0y] = P(sx, sy, d);
    if (!repOK(c0x, c0y, d)) continue;
    // direct: source, repeater, target in a line
    const [ax, ay] = P(sx, sy, d, 2);
    if (ax === tx && ay === ty && endDirs.includes(d)) { candidates.push([{ x: c0x, y: c0y, t: 'repeater', f: d }]); continue; }
    const [bx, by] = P(sx, sy, d, 3);
    if (bx === tx && by === ty && endDirs.includes(d) && repOK(ax, ay, d)) {
      candidates.push([{ x: c0x, y: c0y, t: 'repeater', f: d }, { x: ax, y: ay, t: 'repeater', f: d }]);
      continue;
    }
    if (!dustOK(ax, ay)) continue;
    // BFS from first dust cell to any valid last-dust cell
    ends.clear();
    for (const e of endDirs) {
      const [cnx, cny] = P(tx, ty, opp(e));
      const [lx, ly] = P(tx, ty, opp(e), 2);
      if (cnx === c0x && cny === c0y) continue;
      if (repOK(cnx, cny, e) && dustOK(lx, ly)) ends.set(key(lx, ly), e);
    }
    if (!ends.size) continue;
    const prev = new Map([[key(ax, ay), -1]]);
    const q = [[ax, ay]];
    let found = null;
    const blocked = new Set([key(c0x, c0y)]);
    for (const e of ends.values()) { const [cx, cy] = P(tx, ty, opp(e)); blocked.add(key(cx, cy)); }
    while (q.length) {
      const [x, y] = q.shift();
      const k = key(x, y);
      if (ends.has(k)) { found = [x, y]; break; }
      for (let dd = 0; dd < 4; dd++) {
        const [nx, ny] = P(x, y, dd);
        const nk = key(nx, ny);
        if (!sim.inb(nx, ny) || prev.has(nk) || blocked.has(nk) || !dustOK(nx, ny)) continue;
        prev.set(nk, k); q.push([nx, ny]);
      }
    }
    if (!found) continue;
    const pathKeys = [];
    for (let k = key(found[0], found[1]); k !== -1; k = prev.get(k)) pathKeys.unshift(k);
    const e = ends.get(key(found[0], found[1]));
    const [cnx, cny] = P(tx, ty, opp(e));
    const cells = [{ x: c0x, y: c0y, t: 'repeater', f: d }];
    for (const k of pathKeys) cells.push({ x: k % sim.w, y: (k / sim.w) | 0, t: 'dust' });
    cells.push({ x: cnx, y: cny, t: 'repeater', f: e });
    // boosters: no more than 15 dust between repeaters
    let lastRep = 0, ok = true;
    for (let i = 1; i < cells.length - 1; i++) {
      if (i - lastRep <= 15) continue;
      let j = i;
      for (; j > lastRep; j--) {
        const a = cells[j - 1], b = cells[j + 1];
        if (cells[j].t === 'dust' && (a.x === b.x || a.y === b.y)) break;
      }
      if (j <= lastRep) { ok = false; break; }
      const nxt = cells[j + 1];
      const f = DIRS.findIndex(([dx, dy]) => cells[j].x + dx === nxt.x && cells[j].y + dy === nxt.y);
      cells[j] = { x: cells[j].x, y: cells[j].y, t: 'repeater', f, booster: true };
      lastRep = j; i = j;
    }
    if (ok) candidates.push(cells);
  }

  // Safety check: with the wire built but not yet connected to the target,
  // nothing that already exists may change.
  const before = inputsSnapshot(sim);
  const valid = candidates.filter(cells => {
    const test = sim.clone();
    cells.slice(0, -1).forEach(c => test.set(c.x, c.y, makeCell(c.t, { f: c.f })));
    if (cells.length === 1) return true;
    test.compute();
    const after = inputsSnapshot(test);
    return before.every((v, i) => v === undefined || v === after[i]);
  }).sort((a, b) => a.length - b.length);

  if (!valid.length) {
    return { error: "I couldn't find a safe route. A safe wire needs a one-block gap from everything else, and there isn't enough room. Try moving things apart, or clear a lane between the start and the target." };
  }
  const cells = valid[0];
  return {
    cells,
    dust: cells.filter(c => c.t === 'dust').length,
    boosters: cells.filter(c => c.booster).length,
  };
}

window.Redstone = { Sim, makeCell, findRoute, TYPES, DIRS, DIR_NAMES, opp };
