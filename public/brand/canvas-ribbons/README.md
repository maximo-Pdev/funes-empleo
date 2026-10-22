# Canvas Ribbons attribution and adaptation

- Original: [Canvas Ribbons by Boris Šehovac](https://codepen.io/bsehovac/pen/LQVzxJ).
- Source: the user's `canvas-ribbons.zip` CodePen export (`src/script.js`).
- Original JavaScript SHA-256: `40da134343349789017573941541a3b4d8866c77a6ff5b9c1e83215bf2b95252`.
- License: MIT, copyright (c) 2026 Boris Šehovac, copied unchanged into `LICENSE.txt`.
- Adaptation: `src/app/(public)/home-ribbons.tsx`.

The adaptation retains the original sine-driven control points, 45-degree
rotation, amplitude, three waves and Bézier line-history rendering. It uses
municipal green/neutral tokens over a dark neutral CSS field, 120 trail segments,
a 30 FPS limit and a device-pixel-ratio cap of 2. The demo's global constructor,
FPS counter, unused utilities and document-wide styles are not imported.

The React lifecycle resizes the canvas, pauses off-screen or when the document
is hidden, draws a preloaded static frame for reduced motion, and releases its
animation frame, observers and event listeners on unmount. No runtime CodePen
request, iframe, script CDN, library or new package is required.
