// Example circuits and lessons
'use strict';
(function () {
  const { Sim, makeCell } = window.Redstone;
  const W = 40, H = 24;
  const R = 1, D = 2, L = 3, U = 0; // facing: Right, Down, Left, Up

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

  const EXAMPLES = {
    empty: () => build(() => {}),

    basics: () => build((P, wire) => {
      P(3, 4, 'lever'); wire(4, 4, 12, 4); P(13, 4, 'lamp');
      P(3, 9, 'button'); wire(4, 9, 12, 9); P(13, 9, 'lamp');
      P(3, 14, 'rblock'); wire(4, 14, 12, 14); P(13, 14, 'lamp');
      P(20, 4, 'lever'); wire(21, 4, 24, 4); P(25, 4, 'piston', { f: R });
    }),

    strength: () => build((P, wire) => {
      P(2, 5, 'lever'); wire(3, 5, 20, 5); P(21, 5, 'lamp');
      P(2, 11, 'lever'); wire(3, 11, 11, 11); P(12, 11, 'repeater', { f: R }); wire(13, 11, 20, 11); P(21, 11, 'lamp');
    }),

    mixing: () => build((P, wire) => {
      // Broken: one stray dust joins two wires
      P(3, 3, 'lever'); wire(4, 3, 16, 3); P(17, 3, 'lamp');
      P(3, 5, 'lever'); wire(4, 5, 16, 5); P(17, 5, 'lamp');
      P(10, 4, 'dust');
      // Fixed: same wires, gap kept
      P(3, 12, 'lever'); wire(4, 12, 16, 12); P(17, 12, 'lamp');
      P(3, 14, 'lever'); wire(4, 14, 16, 14); P(17, 14, 'lamp');
    }),

    diode: () => build((P, wire) => {
      P(3, 6, 'lamp'); wire(4, 6, 9, 6); P(10, 6, 'repeater', { f: R }); wire(11, 6, 16, 6); P(17, 6, 'lamp');
      P(6, 5, 'lever'); P(14, 5, 'lever');
      // repeater squeezing past another wire
      P(3, 12, 'lever'); wire(4, 12, 7, 12); P(8, 12, 'repeater', { f: R }); P(9, 12, 'repeater', { f: R }); wire(10, 12, 14, 12); P(15, 12, 'lamp');
      P(8, 16, 'lever'); wire(8, 15, 8, 13); wire(9, 13, 9, 17); P(9, 18, 'lamp');
    }),

    not: () => build((P, wire) => {
      P(3, 6, 'lever'); wire(4, 6, 7, 6); P(8, 6, 'block'); P(9, 6, 'torch', { f: R }); wire(10, 6, 14, 6); P(15, 6, 'lamp');
    }),

    and: () => build((P, wire) => {
      P(3, 4, 'lever'); wire(4, 4, 5, 4); P(6, 4, 'block'); P(7, 4, 'torch', { f: R });
      P(3, 8, 'lever'); wire(4, 8, 5, 8); P(6, 8, 'block'); P(7, 8, 'torch', { f: R });
      wire(8, 4, 8, 8); P(9, 6, 'dust'); P(10, 6, 'block'); P(11, 6, 'torch', { f: R }); wire(12, 6, 13, 6); P(14, 6, 'lamp');
    }),

    clock: () => build((P, wire) => {
      P(6, 6, 'block'); P(7, 6, 'torch', { f: R });
      wire(8, 6, 8, 8); wire(7, 8, 6, 8); P(6, 7, 'repeater', { f: U, delay: 4 });
      wire(8, 5, 8, 4); P(8, 3, 'lamp');
      // observer pulse detector
      P(14, 6, 'lever'); P(15, 6, 'observer', { f: L }); P(16, 6, 'repeater', { f: R, delay: 4 }); wire(17, 6, 19, 6); P(20, 6, 'lamp');
    }),

    comparator: () => build((P, wire) => {
      P(5, 6, 'lever', { on: true }); wire(6, 6, 8, 6); P(9, 6, 'comparator', { f: R }); wire(10, 6, 14, 6); P(15, 6, 'lamp');
      P(9, 8, 'lever'); P(9, 7, 'dust');
      P(5, 15, 'lever', { on: true }); wire(6, 15, 8, 15); P(9, 15, 'comparator', { f: R, mode: 'sub' }); wire(10, 15, 11, 15); P(12, 15, 'lamp');
      P(9, 21, 'lever'); wire(9, 20, 9, 16);
    }),

    route: () => build((P, wire) => {
      P(3, 4, 'lever'); wire(4, 4, 12, 4); P(13, 4, 'lamp');
      P(3, 12, 'lever'); wire(4, 12, 15, 12); P(16, 12, 'lamp');
      P(24, 2, 'lever'); wire(24, 3, 24, 16); P(24, 17, 'lamp');
      P(32, 8, 'lamp');
      P(8, 18, 'button'); wire(9, 18, 14, 18); P(15, 18, 'piston', { f: R });
    }),
  };

  const LESSONS = [
    {
      id: 'basics', title: '1. Power sources & things to power',
      body: `<p><b>Sources</b> make a signal: levers (stay on), buttons (pulse for 1 second) and blocks of redstone (always on).</p>
      <p><b>Dust</b> carries the signal. <b>Lamps</b> and <b>pistons</b> react to it.</p>
      <p>Try it: tap the levers and the button.</p>`,
    },
    {
      id: 'strength', title: '2. Signals fade after 15 blocks',
      body: `<p>Dust starts at strength <b>15</b> and loses 1 for every block. After 15 blocks it's gone, so the top lamp stays dark.</p>
      <p>A <b>repeater</b> resets the signal to full strength 15. Turn on <i>Show power levels</i> to see the numbers.</p>`,
    },
    {
      id: 'mixing', title: '3. Why signals get mixed up',
      body: `<p><b>This is the big one.</b> Dust connects to <i>any</i> dust, lever, torch, repeater or comparator right next to it, including ones from a different circuit.</p>
      <p>In the top pair, one stray dust touches both wires. Now <b>either</b> lever lights <b>both</b> lamps. The bottom pair keeps a <b>one-block gap</b> and works properly.</p>
      <p>Turn on <i>Color separate circuits</i>: each wire that's really separate gets its own color.</p>`,
    },
    {
      id: 'diode', title: '4. Repeaters: one-way doors',
      body: `<p>A repeater only passes power <b>forward</b>. The right-hand lever can't send power back through it to the left lamp.</p>
      <p>Repeaters also <b>ignore wires at their sides</b>. The bottom example squeezes a signal right past another wire without mixing. This is the trick for tight spaces.</p>
      <p>Tap a repeater to change its delay (1 to 4 ticks).</p>`,
    },
    {
      id: 'not', title: '5. Torches flip signals (NOT gate)',
      body: `<p>A torch stuck to a block turns <b>off</b> when that block gets powered. Dust pointing into a block powers it.</p>
      <p>The lamp is on until you flip the lever, so the torch acts as an inverter.</p>`,
    },
    {
      id: 'and', title: '6. AND gate',
      body: `<p>Two inverted inputs are joined, then inverted again. The lamp only lights when <b>both</b> levers are on.</p>`,
    },
    {
      id: 'clock', title: '7. Clocks & observers',
      body: `<p><b>Left:</b> a torch powers a loop that feeds back into its own block through a repeater, so it keeps blinking.</p>
      <p><b>Right:</b> an <b>observer</b> watches the lever. When something changes in front of its face, it sends a short pulse out of its back.</p>`,
    },
    {
      id: 'comparator', title: '8. Comparators',
      body: `<p>A comparator reads the signal coming in from its back and compares it with the strongest signal coming in from its sides.</p>
      <p><b>Compare mode</b> (top): passes the back signal (13) through, unless a side is stronger. Flip the side lever (15) and the output drops to 0.</p>
      <p><b>Subtract mode</b> (bottom, lit front torch): outputs back − side. Flip the side lever and you get 13 − 11 = 2, which is just enough to reach the lamp.</p>
      <p>Tap a comparator to switch modes. Turn on <i>Show power levels</i> to see the numbers.</p>`,
    },
    {
      id: 'route', title: '9. Get a signal somewhere without breaking things',
      body: `<p>Open the <b>Route helper</b> tab, tap the <b>lever at the top left</b>, then tap the <b>lone lamp on the right</b>. The helper plans a wire around the other circuits and checks it doesn't change any of them.</p>
      <p>It follows these rules, which you can use in the game too:</p>
      <ol>
        <li>Start with a <b>repeater facing away</b> from the source, so nothing can flow back.</li>
        <li>Keep <b>one empty block</b> between your wire and everything else.</li>
        <li>Add a repeater <b>every 15 blocks</b>.</li>
        <li>End with a <b>repeater pointing into</b> the target, so only the target is powered.</li>
      </ol>
      <p>In the real game you can also pass <b>over</b> or <b>under</b> another wire, since a one-block height difference also keeps them apart.</p>`,
    },
  ];

  window.RedstoneExamples = { EXAMPLES, LESSONS, W, H };
})();
