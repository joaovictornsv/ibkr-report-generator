# IBKR Wallet Report — Technical documentation

Developer-facing notes. End users should read **[README.md](README.md)** (Portuguese, simplified).

---

## Overview

Chrome Manifest V3 browser extension that injects a button on IBKR Client Portal, scrapes Dashboard (NAV chart) and Portfolio positions in one tab, and downloads a self-contained HTML report.

- **Source:** `src/`
- **Browser bundle:** `dist/content.js` (esbuild IIFE — required for Firefox/LibreWolf)
- **Detailed install (English):** [INSTALL.md](INSTALL.md) (included in release zip)

---

## Setup

```bash
npm install
npm run build   # writes dist/content.js
npm test
```

Always run `npm run build` after changing extension source before loading in a browser.

---

## Project layout

```
manifest.json
src/content/index.js      # UI + orchestrator
src/content/button.css
src/extract/chart.js        # Highcharts NAV extract
src/extract/positions.js    # Positions table extract
src/extract/navigate.js     # SPA nav, waits, session state
src/report/buildHtml.js     # HTML report generator
src/data/ticker-sectors.json # Offline ticker → sector lookup
src/data/sectors.js          # Sector labels + lookup helper
src/download.js
src/extApi.js               # browser/chrome storage shim
test/fixtures/              # IBKR HTML dumps for regression tests
scripts/package-release.mjs
```

---

## Tests

```bash
npm test
```

Fixtures: `test/fixtures/raw-stocks.html`, `test/fixtures/total.html` (from ibkr-analysis dumps).

---

## Release packaging

```bash
npm run release
```

Outputs:

| Path | Purpose |
|------|---------|
| `release/ibkr-wallet-report-<version>/` | Staged folder for sanity check |
| `release/ibkr-wallet-report-<version>.zip` | **Upload to GitHub Releases** |

The zip contains only runtime files: `manifest.json`, `dist/content.js`, CSS, `INSTALL.md`, `LEIA-ME.txt`. No source or `node_modules`.

Bump `version` in `package.json` before each release (script syncs into packaged `manifest.json`).

### Publish a GitHub Release

1. `npm run release`
2. Commit and push if needed
3. `gh release create vX.Y.Z release/ibkr-wallet-report-X.Y.Z.zip --title "vX.Y.Z" --notes "..."`

---

## Browser compatibility

| Browser | Load method | Persistence |
|---------|-------------|-------------|
| Chrome, Edge, Brave | Load unpacked → folder | Until removed or folder deleted |
| Firefox, LibreWolf 115+ | Temporary add-on → `manifest.json` | Lost on browser quit |

Uses `storage.session` (fallback: `storage.local`) for multi-page scrape state across SPA navigation.

Content script is bundled — do not load `src/content/index.js` directly in manifest (ES `import` breaks on Firefox).

---

## Privacy / security (technical)

- Content scripts match `https://*.interactivebrokers.com/*` and `https://*.interactivebrokers.co.uk/*`
- Permission: `storage` only
- No background service worker in v1
- Report HTML loads stock logos from `financialmodelingprep.com` when the **downloaded file** is opened (not at scrape time)
- Sectors come from bundled `src/data/ticker-sectors.json`; unknown tickers fall back to **Outros**

---

## Limitations

- Unofficial; IBKR DOM changes can break selectors
- Not on Chrome Web Store or Firefox Add-ons (manual zip install)
- Sector map is static (add tickers to `src/data/ticker-sectors.json` as needed)
- Firefox/LibreWolf: reload temporary add-on after restart

---

## Screenshots for README

User-facing screenshots in `docs/images/`:

| File | Content |
|------|---------|
| `01-botao-portal.png` | Portal with floating button |
| `02-download-release.png` | GitHub Releases — download `ibkr-wallet-report-*.zip` |
| `03-carteira-relatorio.png` | Generated HTML wallet report preview |

Referenced from [README.md](README.md).
