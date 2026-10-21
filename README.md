# Matching Numbers

A personal clone of the Matching Numbers puzzle. It is a plain web app that you
install on an Android phone as a home-screen app. It works offline after the first load.

## Rules

- The board is a grid 9 cells wide.
- Tap a number, then tap another number. They are removed if:
  - they are equal or add up to 10, and
  - they touch in a row, column or diagonal, or every cell between them is already removed.
- **Hint** highlights a pair you can remove. Tap anywhere other than the highlighted numbers to clear it.
- When no pairs are left, use **Add row** to append 9 more numbers (5 uses per game).
- The game ends when the board is cleared (win) or no pairs are left and no rows remain (loss).

## Run locally

```sh
npm start          # serves the folder on http://localhost:3000
npm test           # runs the rule tests
```

## Install on an Android phone

Chrome only offers "Install app" and offline mode on HTTPS (or localhost), so host the
folder somewhere with HTTPS, for example GitHub Pages or Vercel. Then:

1. Open the URL in Chrome on the phone.
2. Menu (⋮) → **Add to Home screen** (or **Install app**).

## Files

| File | Purpose |
| --- | --- |
| `logic.js` | Pure game rules (matching, connectivity, board updates) |
| `app.js` | Screen rendering and tap handling |
| `index.html`, `styles.css` | Layout and theme (follows system dark mode) |
| `manifest.webmanifest`, `icon.svg` | Home-screen install metadata and icon |
| `sw.js` | Service worker that caches the app for offline use |
| `tests/logic.test.js` | Tests for the rules |
