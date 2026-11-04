# Redstone Playground

A browser-based redstone circuit sandbox. Place dust, blocks, levers, buttons, torches, repeaters, comparators, observers, lamps and pistons on a grid, and watch the signal flow tick by tick.

## Features
- **Live simulation**: signal strength 0–15, strong/weak block power, torch inversion, repeater delay/locking, comparator compare/subtract, observer pulses.
- **Route helper**: pick a source and a target, and it plans a wire that keeps a one-block gap from your other circuits, uses repeaters as one-way diodes, and adds boosters every 15 blocks. Before suggesting a route, it checks that the route doesn't change any existing circuit.
- **Mix warnings**: red outline / warning when a dust placement would join two separate wires. "Color separate circuits" shows which wires really are separate.
- **Lessons** with loadable examples (signal strength, mixing, diodes, NOT/AND gates, clocks, comparators).
- Undo, shareable links, autosave in the browser.

## Deploy
Plain static files with no build step. On Vercel, import the repo with the **Other** framework preset and leave the build command empty.
