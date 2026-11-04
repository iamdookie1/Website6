// Example circuits, lessons and challenges
'use strict';
(function () {
  const { Sim, makeCell } = window.Redstone;
  const W = 40, H = 24;
  const U = 0, R = 1, D = 2, L = 3; // facing

  function build(fn) {
    const s = new Sim(W, H);
    const P = (x, y, t, o) => s.set(x, y, makeCell(t, o));
    const wire = (x1, y1, x2, y2) => {
      const dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1);
      let x = x1, y = y1;
      for (;;) { P(x, y, 'dust'); if (x === x2 && y === y2) break; x += dx; y += dy; }
    };
    fn(P, wire);
    return s.serialize();
  }

  // ---------------------------------------------------------------- circuits
  const C = {
    basics(P, wire) {
      P(3, 4, 'lever'); wire(4, 4, 12, 4); P(13, 4, 'lamp');
      P(3, 9, 'button'); wire(4, 9, 12, 9); P(13, 9, 'lamp');
      P(3, 14, 'rblock'); wire(4, 14, 12, 14); P(13, 14, 'lamp');
      P(20, 4, 'lever'); wire(21, 4, 24, 4); P(25, 4, 'piston', { f: R });
      P(20, 9, 'lever'); P(21, 9, 'lamp');
    },
    strength(P, wire) {
      P(2, 5, 'lever'); wire(3, 5, 20, 5); P(21, 5, 'lamp');
      P(2, 11, 'lever'); wire(3, 11, 11, 11); P(12, 11, 'repeater', { f: R }); wire(13, 11, 20, 11); P(21, 11, 'lamp');
    },
    power(P, wire) {
      // weak vs strong power
      P(3, 4, 'lever'); wire(4, 4, 6, 4); P(7, 4, 'block'); wire(8, 4, 10, 4); P(11, 4, 'lamp');
      P(7, 5, 'lamp');
      P(3, 10, 'lever'); wire(4, 10, 5, 10); P(6, 10, 'repeater', { f: R }); P(7, 10, 'block'); wire(8, 10, 10, 10); P(11, 10, 'lamp');
      P(7, 11, 'lamp');
    },
    mixing(P, wire) {
      P(3, 3, 'lever'); wire(4, 3, 16, 3); P(17, 3, 'lamp');
      P(3, 5, 'lever'); wire(4, 5, 16, 5); P(17, 5, 'lamp');
      P(10, 4, 'dust');
      P(3, 12, 'lever'); wire(4, 12, 16, 12); P(17, 12, 'lamp');
      P(3, 14, 'lever'); wire(4, 14, 16, 14); P(17, 14, 'lamp');
    },
    diode(P, wire) {
      P(3, 6, 'lamp'); wire(4, 6, 9, 6); P(10, 6, 'repeater', { f: R }); wire(11, 6, 16, 6); P(17, 6, 'lamp');
      P(6, 5, 'lever'); P(14, 5, 'lever');
      P(3, 12, 'lever'); wire(4, 12, 7, 12); P(8, 12, 'repeater', { f: R }); P(9, 12, 'repeater', { f: R }); wire(10, 12, 14, 12); P(15, 12, 'lamp');
      P(8, 16, 'lever'); wire(8, 15, 8, 13); wire(9, 13, 9, 17); P(9, 18, 'lamp');
    },
    sidebyside(P, wire) {
      // two repeaters side by side sharing one input wire
      P(3, 4, 'lever'); P(4, 4, 'dust'); P(4, 5, 'dust'); P(5, 4, 'repeater', { f: R }); P(5, 5, 'repeater', { f: R, delay: 3 }); P(6, 4, 'lamp'); P(6, 5, 'lamp');
      // locking: one repeater pointing into the side of another
      P(3, 11, 'lever'); P(4, 11, 'dust'); P(5, 11, 'repeater', { f: R }); wire(6, 11, 7, 11); P(8, 11, 'lamp');
      P(5, 14, 'lever'); P(5, 13, 'dust'); P(5, 12, 'repeater', { f: U });
      // repeater placed sideways: wire hits its side, nothing happens
      P(12, 4, 'lever'); wire(13, 4, 14, 4); P(15, 4, 'repeater', { f: D }); P(16, 4, 'lamp');
    },
    not(P, wire) {
      P(3, 6, 'lever'); wire(4, 6, 7, 6); P(8, 6, 'block'); P(9, 6, 'torch', { f: R }); wire(10, 6, 14, 6); P(15, 6, 'lamp');
    },
    or(P, wire) {
      P(3, 4, 'lever'); P(4, 4, 'dust'); P(5, 4, 'repeater', { f: R }); wire(6, 4, 7, 4);
      P(3, 8, 'lever'); P(4, 8, 'dust'); P(5, 8, 'repeater', { f: R }); wire(6, 8, 7, 8);
      wire(7, 5, 7, 7); P(8, 6, 'dust'); P(9, 6, 'lamp');
    },
    and(P, wire) {
      P(3, 4, 'lever'); wire(4, 4, 5, 4); P(6, 4, 'block'); P(7, 4, 'torch', { f: R });
      P(3, 8, 'lever'); wire(4, 8, 5, 8); P(6, 8, 'block'); P(7, 8, 'torch', { f: R });
      wire(8, 4, 8, 8); P(9, 6, 'dust'); P(10, 6, 'block'); P(11, 6, 'torch', { f: R }); wire(12, 6, 13, 6); P(14, 6, 'lamp');
    },
    xor(P, wire) {
      P(3, 4, 'lever'); wire(4, 4, 9, 4); wire(4, 5, 4, 12); wire(5, 12, 10, 12);
      P(10, 11, 'repeater', { f: U }); P(10, 10, 'comparator', { f: R, mode: 'sub' });
      P(6, 7, 'lever'); wire(6, 8, 6, 10); wire(7, 10, 9, 10);
      wire(7, 7, 10, 7); P(10, 6, 'dust'); P(10, 5, 'repeater', { f: U }); P(10, 4, 'comparator', { f: R, mode: 'sub' });
      P(11, 4, 'dust'); wire(12, 4, 12, 10); P(11, 10, 'dust'); P(13, 7, 'dust'); P(14, 7, 'lamp');
    },
    ticks(P, wire) {
      P(2, 6, 'lever');
      P(3, 6, 'repeater', { f: R, delay: 2 }); P(4, 6, 'dust');
      P(5, 6, 'repeater', { f: R, delay: 2 }); P(6, 6, 'dust');
      P(7, 6, 'repeater', { f: R, delay: 2 }); P(8, 6, 'dust');
      P(9, 6, 'repeater', { f: R, delay: 2 }); P(10, 6, 'dust'); P(11, 6, 'lamp');
    },
    torchclock(P, wire) {
      P(6, 6, 'block'); P(7, 6, 'torch', { f: R });
      wire(8, 6, 8, 8); wire(7, 8, 6, 8); P(6, 7, 'repeater', { f: U, delay: 4 });
      wire(8, 5, 8, 4); P(8, 3, 'lamp');
      // burnout demo: a torch that switches itself off every tick
      P(6, 15, 'block'); P(7, 15, 'torch', { f: R });
      wire(8, 15, 8, 17); wire(7, 17, 4, 17); wire(4, 16, 4, 15); P(5, 15, 'dust');
      P(1, 15, 'lever'); P(2, 15, 'dust'); P(3, 15, 'dust');
    },
    ringclock(P, wire) {
      P(6, 4, 'dust'); P(7, 4, 'repeater', { f: R, delay: 2 }); P(8, 4, 'dust');
      P(8, 5, 'repeater', { f: D, delay: 2 }); P(8, 6, 'dust');
      P(7, 6, 'repeater', { f: L, delay: 2 }); P(6, 6, 'dust');
      P(6, 5, 'repeater', { f: U, delay: 2 });
      P(4, 4, 'lever'); P(5, 4, 'observer', { f: L });
      P(9, 4, 'repeater', { f: R }); P(10, 4, 'dust'); P(11, 4, 'lamp');
      P(7, 2, 'lever'); P(7, 3, 'repeater', { f: D });
    },
    observer(P, wire) {
      // edge detector
      P(14, 6, 'lever'); P(15, 6, 'observer', { f: L }); P(16, 6, 'repeater', { f: R, delay: 4 }); wire(17, 6, 19, 6); P(20, 6, 'lamp');
      // observer clock
      P(4, 12, 'observer', { f: R, kick: true }); P(5, 12, 'observer', { f: L });
      wire(6, 12, 9, 12); P(10, 12, 'lamp');
      wire(3, 12, 3, 14); P(3, 15, 'lamp');
    },
    comparator(P, wire) {
      P(5, 6, 'lever', { on: true }); wire(6, 6, 8, 6); P(9, 6, 'comparator', { f: R }); wire(10, 6, 14, 6); P(15, 6, 'lamp');
      P(9, 8, 'lever'); P(9, 7, 'dust');
      P(5, 15, 'lever', { on: true }); wire(6, 15, 8, 15); P(9, 15, 'comparator', { f: R, mode: 'sub' }); wire(10, 15, 11, 15); P(12, 15, 'lamp');
      P(9, 21, 'lever'); wire(9, 20, 9, 16);
    },
    rslatch(P, wire) {
      P(4, 6, 'block'); P(5, 6, 'torch', { f: R, on: true });
      wire(6, 6, 7, 6); P(8, 6, 'block'); P(8, 7, 'torch', { f: D, on: false });
      wire(8, 8, 4, 8); P(4, 7, 'dust');
      P(5, 5, 'lamp'); P(9, 7, 'lamp');
      P(8, 5, 'button'); P(3, 6, 'button');
    },
    dlatch(P, wire) {
      P(3, 6, 'lever'); P(4, 6, 'dust'); P(5, 6, 'repeater', { f: R }); wire(6, 6, 7, 6); P(8, 6, 'lamp');
      P(5, 9, 'lever'); P(5, 8, 'dust'); P(5, 7, 'repeater', { f: U });
    },
    route(P, wire) {
      P(3, 4, 'lever'); wire(4, 4, 12, 4); P(13, 4, 'lamp');
      P(3, 12, 'lever'); wire(4, 12, 15, 12); P(16, 12, 'lamp');
      P(24, 2, 'lever'); wire(24, 3, 24, 16); P(24, 17, 'lamp');
      P(32, 8, 'lamp');
      P(8, 18, 'button'); wire(9, 18, 14, 18); P(15, 18, 'piston', { f: R });
    },
  };
  const EXAMPLES = { empty: () => build(() => {}) };
  for (const k in C) EXAMPLES[k] = () => build(C[k]);

  // ---------------------------------------------------------------- lessons
  const CHAPTERS = [
    {
      title: 'Basics', lessons: [
        {
          id: 'basics', title: 'Power sources & outputs',
          body: `<p><b>Sources</b> make a signal: levers stay on, buttons pulse for 1 second (10 ticks), and blocks of redstone are always on.</p>
          <p><b>Dust</b> carries the signal. <b>Lamps</b> light up and <b>pistons</b> push out when powered. A lever right next to a lamp powers it directly, without any dust.</p>`,
        },
        {
          id: 'strength', title: 'Signal strength (0–15)',
          body: `<p>Dust starts at strength <b>15</b> and drops 1 per block. After 15 blocks it reaches 0, so the top lamp stays dark.</p>
          <p>A <b>repeater</b> boosts the signal back to 15. Turn on <i>Show power levels</i> to see each number.</p>`,
        },
        {
          id: 'power', title: 'Strong vs weak power',
          body: `<p>Blocks can carry power, in two ways:</p>
          <ul><li><b>Weakly powered</b>: dust points into the block. It powers lamps, pistons, repeaters and torches next to it, but <b>not other dust</b>. In the top row the lamp below the block lights up, but the wire past the block stays dead.</li>
          <li><b>Strongly powered</b>: a repeater, comparator, lever or button powers the block. That also powers dust next to it, so in the bottom row the signal carries on through the block.</li></ul>
          <p>Use the <b>Inspect</b> tab: blocks with a red outline are powered, and the outline is thicker for strong power.</p>`,
        },
      ],
    },
    {
      title: 'Keeping signals apart', lessons: [
        {
          id: 'mixing', title: 'Why signals get mixed up',
          body: `<p>Dust connects to <i>any</i> dust, lever, torch, repeater or comparator right next to it, including ones that belong to another circuit.</p>
          <p>In the top pair, one stray dust touches both wires, so <b>either</b> lever lights <b>both</b> lamps. The bottom pair keeps a <b>one-block gap</b> and works properly.</p>
          <p>Turn on <i>Color separate circuits</i>: every truly separate wire gets its own color.</p>`,
        },
        {
          id: 'diode', title: 'Repeaters: one-way doors',
          body: `<p>A repeater only passes power <b>forward</b>. The right-hand lever can't send power back to the left lamp.</p>
          <p>Repeaters also <b>ignore wires at their sides</b>. In the bottom example a signal squeezes right past another wire without mixing.</p>`,
        },
        {
          id: 'sidebyside', title: 'Repeaters side by side & locking',
          body: `<p>Repeaters work exactly like in the game:</p>
          <ul><li>They take power <b>only from the back</b> (the end without the arrow) and send it out the front. Top left: two repeaters side by side share one input wire. The lower one has delay 3, so its lamp lights a little later.</li>
          <li>A powered repeater (or comparator) pointing into the <b>side</b> of another repeater <b>locks</b> it, freezing its output. Bottom left: turn the top lever on, then the bottom lever, then turn the top lever off. The lamp stays on until you unlock it.</li>
          <li>Top right: the wire runs into the repeater's <b>side</b>, so nothing happens. Use the <b>Rotate</b> tool on it until the arrow points at the lamp.</li></ul>
          <p>Tip: when you place a repeater next to a wire, it automatically turns to take power from that wire.</p>`,
        },
        {
          id: 'route', title: 'Send a signal anywhere (Route helper)',
          body: `<p>Open the <b>Route helper</b> tab, tap the <b>lever at the top left</b>, then tap the <b>lone lamp on the right</b>. The helper plans a wire around everything else and checks that it doesn't change any existing circuit.</p>
          <ol><li>Start with a <b>repeater facing away</b> from the source, so nothing can flow back.</li>
          <li>Keep <b>one empty block</b> between your wire and everything else.</li>
          <li>Add a repeater <b>every 15 blocks</b>.</li>
          <li>End with a <b>repeater pointing into</b> the target.</li></ol>
          <p>In the real game, you can also run a wire one block higher or lower to get over or under another one.</p>`,
        },
      ],
    },
    {
      title: 'Logic gates', lessons: [
        {
          id: 'not', title: 'NOT: torches flip signals',
          body: `<p>A torch stuck to a block turns <b>off</b> when that block is powered. The lamp is on until you flip the lever, so the torch acts as an <b>inverter</b>.</p>
          <p>Torches can't be powered directly. You always power the block they're stuck to.</p>`,
        },
        {
          id: 'or', title: 'OR: join wires safely',
          body: `<p>OR is just joining two wires. Each input goes through a repeater first, so input A's power can't flow backwards into B's wire and switch on anything else connected there.</p>`,
        },
        {
          id: 'and', title: 'AND (and NAND)',
          body: `<p>Invert both inputs, join them, then invert again. The lamp is only on when <b>both</b> levers are on.</p>
          <p>Take away the last torch and you get <b>NAND</b>: on unless both inputs are on. The joined middle wire on its own is <b>NOR</b>.</p>`,
        },
        {
          id: 'xor', title: 'XOR with comparators',
          body: `<p>XOR is on when <b>exactly one</b> input is on. This build uses two comparators in <b>subtract mode</b>: each one computes "A − B" or "B − A". A repeater feeds each side input at full strength 15, so when both inputs are on, both subtractions give 0.</p>
          <p>Notice the B lever is placed <i>inside</i> the loop of A's wire. On a flat board this is the only way to avoid crossing wires.</p>`,
        },
      ],
    },
    {
      title: 'Timing & clocks', lessons: [
        {
          id: 'ticks', title: 'Ticks and delay',
          probes: [[4, 6], [6, 6], [8, 6], [10, 6]],
          body: `<p>Redstone runs in <b>ticks</b>: 1 tick = 0.1 seconds. Parts take time to react:</p>
          <ul><li>Dust: instant (0)</li><li>Torch: 1 tick</li><li>Repeater: 1–4 ticks (tap it to change)</li><li>Comparator: 1 tick</li><li>Observer: 1 tick, pulse lasts 1 tick</li></ul>
          <p>This delay line has 4 repeaters with delay 2. The <b>Signal graph</b> below the board is probing each stage. Flip the lever and watch the signal step forward 2 ticks at a time.</p>`,
        },
        {
          id: 'torchclock', title: 'Torch clock & burnout',
          probes: [[7, 6], [8, 3]],
          body: `<p>A <b>clock</b> is a circuit that turns itself on and off forever. Here a torch powers a loop that comes back into its own block through a repeater:</p>
          <p>torch on → repeater (4 ticks) → block powered → torch off (1 tick) → … So each half lasts 1 + 4 = 5 ticks, and the full <b>period = 10 ticks (1 s)</b>. Check the graph.</p>
          <p><b>Burnout:</b> in the bottom circuit the torch feeds itself with no repeater, so it tries to flip every tick. A torch that turns off <b>8 times in 3 seconds</b> burns out (it goes grey) and stays off for a while, just like in the game. The lever lets you force it off.</p>`,
        },
        {
          id: 'ringclock', title: 'Repeater loop clock (adjustable)',
          probes: [[8, 4], [11, 4]],
          body: `<p>Flip the <b>left lever once</b>. The observer sends a 1-tick pulse into a ring of 4 repeaters, and the pulse keeps going round.</p>
          <p><b>Period = sum of all repeater delays</b> in the ring: 4 × 2 = 8 ticks. Tap the ring repeaters to change their delays and watch the graph change.</p>
          <p><b>Stop switch:</b> the top lever powers a repeater that points into the side of a ring repeater and <b>locks</b> it. When the pulse reaches the locked repeater it can't get through and is lost, just like in the game. Unlock it, then flip the start lever again to restart.</p>
          <p>Each flip of the start lever adds another pulse, so the ring can carry several at once (try 2 pulses for double speed).</p>`,
        },
        {
          id: 'observer', title: 'Observers: edge detector & fastest clock',
          probes: [[20, 6], [10, 12]],
          body: `<p>An observer watches the block in front of its face. Whenever that block <b>changes</b>, it sends a 1-tick pulse out of its back (the red dot).</p>
          <p><b>Top:</b> an observer watching a lever turns each flip into a short pulse. A delay-4 repeater stretches that pulse to 4 ticks so you can see it. This is called an <b>edge detector</b>.</p>
          <p><b>Bottom:</b> two observers facing each other keep setting each other off. This is the fastest possible clock: on for 1 tick, off for 1 tick.</p>`,
        },
        {
          id: 'comparator', title: 'Comparators: analog signals',
          body: `<p>A comparator reads its back input and compares it with the strongest signal coming in from the sides.</p>
          <p><b>Compare mode</b> (top): passes the back signal (13) through, unless a side is stronger. Flip the side lever (15) and the output drops to 0.</p>
          <p><b>Subtract mode</b> (bottom, lit front torch): outputs back − side. Flip the side lever: 13 − 11 = 2, just enough to reach the lamp.</p>`,
        },
      ],
    },
    {
      title: 'Memory', lessons: [
        {
          id: 'rslatch', title: 'RS latch (two-torch memory)',
          body: `<p>Two torches each switch the other one off, so the circuit stays in whichever state it was last pushed into. It <b>remembers</b>.</p>
          <p>Press the <b>right button</b> (SET) and the left lamp turns on and <i>stays</i> on after the button pops out. Press the <b>left button</b> (RESET) to turn it off. The right lamp always shows the opposite.</p>`,
        },
        {
          id: 'dlatch', title: 'Repeater-lock memory (D latch)',
          body: `<p>The bottom lever locks the top repeater. While it's locked, the repeater <b>remembers</b> its output, whatever the data lever does.</p>
          <p>Try it: data lever on → lamp on. Turn on the lock lever. Now data off → the lamp <b>stays on</b>. Unlock it and the lamp follows the data lever again.</p>`,
        },
      ],
    },
  ];
  const LESSONS = CHAPTERS.flatMap(c => c.lessons);

  // ---------------------------------------------------------------- challenges
  const fixedBuild = parts => () => build(P => parts.forEach(([x, y, t, o]) => P(x, y, t, Object.assign({ fixed: true }, o))));

  const CHALLENGES = [
    {
      id: 'c-not', title: 'Inverter', level: 1,
      brief: 'Make the lamp turn <b>on when the lever is off</b>, and off when it\'s on.',
      setup: fixedBuild([[3, 6, 'lever'], [15, 6, 'lamp']]),
      io: { A: [3, 6], OUT: [15, 6] },
      test: h => [0, 1].map(a => { h.set('A', a); h.run(30); return h.row(`A=${a} → lamp ${a ? 'off' : 'on'}`, h.lit('OUT') === !a); }),
    },
    {
      id: 'c-or', title: 'OR without mixing', level: 2,
      brief: 'The big lamp must light if <b>either</b> lever is on. The small lamp at the end of each lever\'s wire must <b>only</b> react to its own lever.',
      setup: fixedBuild([
        [3, 4, 'lever'], ...[4, 5, 6, 7, 8].map(x => [x, 4, 'dust']), [9, 4, 'lamp'],
        [3, 12, 'lever'], ...[4, 5, 6, 7, 8].map(x => [x, 12, 'dust']), [9, 12, 'lamp'],
        [20, 8, 'lamp']]),
      io: { A: [3, 4], B: [3, 12], LA: [9, 4], LB: [9, 12], OUT: [20, 8] },
      test: h => [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => {
        h.set('A', a); h.set('B', b); h.run(40);
        return h.row(`A=${a} B=${b}`, h.lit('OUT') === !!(a || b) && h.lit('LA') === !!a && h.lit('LB') === !!b);
      }),
    },
    {
      id: 'c-and', title: 'AND gate', level: 2,
      brief: 'Light the lamp only when <b>both</b> levers are on.',
      setup: fixedBuild([[3, 4, 'lever'], [3, 8, 'lever'], [14, 6, 'lamp']]),
      io: { A: [3, 4], B: [3, 8], OUT: [14, 6] },
      test: h => [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => {
        h.set('A', a); h.set('B', b); h.run(40); return h.row(`A=${a} B=${b} → ${a && b ? 'on' : 'off'}`, h.lit('OUT') === !!(a && b));
      }),
    },
    {
      id: 'c-xor', title: 'XOR gate', level: 3,
      brief: 'Light the lamp when <b>exactly one</b> lever is on. (Hint: comparators in subtract mode.)',
      setup: fixedBuild([[3, 4, 'lever'], [6, 7, 'lever'], [14, 7, 'lamp']]),
      io: { A: [3, 4], B: [6, 7], OUT: [14, 7] },
      test: h => [[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => {
        h.set('A', a); h.set('B', b); h.run(40); return h.row(`A=${a} B=${b} → ${a !== b ? 'on' : 'off'}`, h.lit('OUT') === (a !== b));
      }),
    },
    {
      id: 'c-blink', title: 'Blinker', level: 2,
      brief: 'Make the lamp <b>blink by itself</b>, with a full on+off cycle of between 4 and 40 ticks.',
      setup: fixedBuild([[8, 3, 'lamp']]),
      io: { OUT: [8, 3] },
      test: h => {
        h.run(20); const p = h.period('OUT', 160);
        return [h.row(p ? `Blinking, period ${p} ticks` : 'Lamp is not blinking', !!p && p >= 4 && p <= 40)];
      },
    },
    {
      id: 'c-stop', title: 'Clock with an off switch', level: 3,
      brief: 'Make the lamp blink while the lever is <b>off</b>, and stay completely dark while the lever is <b>on</b>.',
      setup: fixedBuild([[5, 6, 'lever'], [8, 3, 'lamp']]),
      io: { S: [5, 6], OUT: [8, 3] },
      test: h => {
        h.set('S', 0); h.run(20); const p = h.period('OUT', 160);
        const r1 = h.row(p ? `Lever off: blinking (period ${p})` : 'Lever off: not blinking', !!p);
        h.set('S', 1); h.run(30); const on = h.watch('OUT', 60).some(Boolean);
        return [r1, h.row('Lever on: lamp stays dark', !on)];
      },
    },
    {
      id: 'c-edge', title: 'Flash on flip', level: 3,
      brief: 'When the lever is switched on, the lamp should <b>flash briefly</b> and then go dark again, even though the lever stays on.',
      setup: fixedBuild([[14, 6, 'lever'], [20, 6, 'lamp']]),
      io: { A: [14, 6], OUT: [20, 6] },
      test: h => {
        h.set('A', 0); h.run(40); const r0 = h.row('Dark while the lever is off', !h.watch('OUT', 20).some(Boolean));
        h.set('A', 1); const flash = h.watch('OUT', 15).some(Boolean); const after = h.watch('OUT', 30).some(Boolean);
        return [r0, h.row('Flashes when switched on', flash), h.row('Goes dark again afterwards', !after)];
      },
    },
    {
      id: 'c-mem', title: 'Memory cell', level: 4,
      brief: 'Pressing <b>SET</b> (right button) turns the lamp on and it <b>stays on</b>. Pressing <b>RESET</b> (left button) turns it off and it stays off.',
      setup: fixedBuild([[3, 6, 'button'], [8, 5, 'button'], [5, 5, 'lamp']]),
      io: { RESET: [3, 6], SET: [8, 5], OUT: [5, 5] },
      test: h => {
        const rows = [];
        h.press('RESET'); h.run(40); rows.push(h.row('RESET → off', !h.lit('OUT')));
        h.press('SET'); h.run(40); rows.push(h.row('SET → on (and stays on after the button pops out)', h.lit('OUT')));
        h.run(40); rows.push(h.row('Still on later', h.lit('OUT')));
        h.press('RESET'); h.run(40); rows.push(h.row('RESET → off again', !h.lit('OUT')));
        return rows;
      },
    },
  ];

  // Run a challenge's checks on a copy of the board
  function runChallenge(sim, ch) {
    const s = sim.clone();
    const get = n => { const [x, y] = ch.io[n]; return s.get(x, y); };
    for (const n in ch.io) if (!get(n)) return { error: `The ${n} part was removed. Reload the challenge.` };
    const h = {
      set(n, v) { get(n).on = !!v; },
      press(n) { const c = get(n); c.on = true; c.timer = 10; },
      run(k) { for (let i = 0; i < k; i++) s.step(); },
      lit(n) { const [x, y] = ch.io[n]; return !!s.net.lit[s.idx(x, y)]; },
      watch(n, k) { const out = []; for (let i = 0; i < k; i++) { s.step(); out.push(h.lit(n)); } return out; },
      period(n, k) {
        const w = h.watch(n, k), rises = [];
        for (let i = 1; i < w.length; i++) if (w[i] && !w[i - 1]) rises.push(i);
        if (rises.length < 3) return 0;
        const d = rises.slice(1).map((r, i) => r - rises[i]);
        return Math.round(d.reduce((a, b) => a + b, 0) / d.length);
      },
      row(label, ok) { return { label, ok: !!ok }; },
    };
    const rows = ch.test(h);
    return { rows, pass: rows.every(r => r.ok) };
  }

  window.RedstoneExamples = { EXAMPLES, CHAPTERS, LESSONS, CHALLENGES, runChallenge, W, H };
})();
