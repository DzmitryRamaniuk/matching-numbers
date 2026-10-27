# Matching Numbers

A personal clone of the Matching Numbers puzzle. It is a plain web app that you
install on an Android phone as a home-screen app. The service worker caches the app files, so it works offline after the first visit.

## Rules

- The board is a grid 9 cells wide. Its numbers come in pairs that add up to 10 (for example 1 and 9, 3 and 7, 5 and 5), shuffled into random places.
- Tap a number, then tap another number. They are removed if:
  - they are equal or add up to 10, and
  - they touch in a row, column or diagonal, or every cell between them is already removed.
- Removed numbers stay on the board, greyed out and not tappable. A row whose numbers are all removed disappears, and the rows below move up.
- **Hint** highlights a pair you can remove. Tap anywhere other than the highlighted numbers to clear it.
- When no pairs are left, use **Add more** to copy every number still on the board after the last number. The copies fill any empty cells at the end of the last row first, then continue on new rows (5 uses per game). Empty cells in the middle stay empty.
- When the board is cleared, the next board starts right away with the same settings. The score carries over, and Add more uses reset to 5.
- The game ends when no pairs are left and no rows remain. A dialog then shows the final score and a **New game** button.

## Run locally

```sh
npm start          # serves the folder on http://localhost:3000
npm test           # runs the rule tests
```

## Install on an Android phone

Chrome only offers "Install app" on HTTPS (or localhost), so host the
folder somewhere with HTTPS, for example GitHub Pages or Vercel. Then:

1. Open the URL in Chrome on the phone.
2. Menu (⋮) → **Add to Home screen** (or **Install app**).

## Files

| File | Purpose |
| --- | --- |
| `logic.js` | Pure game rules (matching, connectivity, board updates) |
| `app.js` | Screen rendering and tap handling |
| `index.html`, `styles.css` | Layout and theme (follows system dark mode) |
| `manifest.webmanifest`, `icon.svg`, `icon-192.png`, `icon-512.png` | Home-screen install metadata and icons (Chrome needs the PNGs to offer install) |
| `sw.js` | Service worker that caches the app files (network first, cache when offline); bump `CACHE` when files change |
| `tests/logic.test.js` | Tests for the rules |
