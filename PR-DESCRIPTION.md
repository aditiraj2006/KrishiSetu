## What
Adds a branded favicon and related icon assets to improve brand identity in browser tabs, bookmarks and mobile home-screen shortcuts.

- New assets in `client/public/`:
  - `favicon.ico`
  - `favicon.svg`
  - `icon.png` (32×32)
  - `apple-touch-icon.png` (180×180)
- Updated `client/index.html` `<head>` with:
  - `<title>` for the app
  - `<meta name="theme-color" content="#248f3e">`
  - `<link rel="icon">` entries (`.ico`, SVG, 32×32 PNG)
  - `<link rel="apple-touch-icon">`

## Why
The application previously did not ship a custom favicon, so browsers showed a generic icon. A branded favicon strengthens brand recognition, makes the tab easier to identify, and aligns with modern web best practices (see issue #341).

## How tested
- Verified that the `href` paths in `index.html` (`/favicon.ico`, `/favicon.svg`, `/icon.png`, `/apple-touch-icon.png`) match the asset filenames placed in `client/public/`, which Vite serves from the site root.
- Loaded the app locally and confirmed the favicon renders in the browser tab with no console errors related to favicon loading.
- Checked the SVG markup renders the green lettermark/leaf design at the declared 32×32 viewBox.

## Notes
Please drop `SOLVE_BRIEF.md` from the final commit if it was accidentally included; it is not part of the fix.

Fixes #341
