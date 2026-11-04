# Redstone Playground

A browser-based redstone circuit sandbox. Place dust, blocks, levers, buttons, torches, repeaters, comparators, observers, lamps and pistons on a grid, and watch the signal flow tick by tick.

## Features
- **Live simulation**: signal strength 0–15, strong/weak block power, torch inversion, repeater delay/locking, comparator compare/subtract, observer pulses.
- **Route helper**: pick a source and a target, and it plans a wire that keeps a one-block gap from your other circuits, uses repeaters as one-way diodes, and adds boosters every 15 blocks. Before suggesting a route, it checks that the route doesn't change any existing circuit.
- **Mix warnings**: red outline / warning when a dust placement would join two separate wires. "Color separate circuits" shows which wires really are separate.
- **Course**: 18 lessons in 5 chapters (basics, keeping signals apart, logic gates, timing & clocks, memory), each with a loadable example. Covers strong/weak power, repeater locking, OR/AND/NAND/XOR, torch clocks & burnout, repeater loop clocks, observer clocks & edge detectors, comparators, RS latches and D latches.
- **Challenges**: 8 auto-graded puzzles (inverter → memory cell). The checker flips the inputs and watches the lamps.
- **Signal graph**: probe up to 4 parts and see their signal over time, with the measured clock period.
- Undo, shareable links, autosave in the browser.

## Deploy
Plain static files with no build step. On Vercel, import the repo with the **Other** framework preset and leave the build command empty.
