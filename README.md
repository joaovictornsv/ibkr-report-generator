# IBKR Wallet Report

Unofficial browser extension for **IBKR Client Portal**. One click collects your Dashboard NAV chart and Portfolio positions, then downloads a self-contained HTML report (`carteira-YYYY-MM-DD.html`).

All processing happens in your browser. Nothing is sent to a server.

---

## For most users (install from zip)

You do **not** need Node.js or the command line.

1. Go to **[Releases](../../releases)** and download the latest **`ibkr-wallet-report-X.Y.Z.zip`**.
2. **Extract** the zip to a folder you will keep (e.g. `Documents/ibkr-wallet-report`).
3. Open **`INSTALL.md`** inside that folder and follow the steps for **Chrome**, **Edge**, **Brave**, **Firefox**, or **LibreWolf**.

That’s it.

---

## Usage

1. Log into [IBKR Client Portal](https://www.interactivebrokers.com/portal).
2. Click **Download wallet report** (bottom-right).
3. Wait for **Collecting chart…** → **Collecting positions…** → **Done**.
4. Open the downloaded `carteira-YYYY-MM-DD.html` file in any browser.

If a step fails, read the message near the button and click again.

---

## What’s in the report

- Total market value (sum of stock positions), position count, date, currency
- Monthly NAV chart (last 1Y value per month)
- Holdings sorted by value: ticker, name, quantity, % of total
- Stock logos when you open the HTML file

Omitted on purpose: personal disclaimer, strategy split, country breakdown.

---

## Privacy

- Reads the Client Portal page only on `*.interactivebrokers.com` (and `.co.uk`).
- Uses browser session storage to resume if the scrape spans two portal pages.
- No IBKR API keys; no data sent to third-party servers.

---

## For developers

### Setup

```bash
npm install
npm run build   # writes dist/content.js
npm test
```

Source lives in `src/`; browsers load the bundled `dist/content.js` (required for Firefox / LibreWolf).

### Create a release zip

```bash
npm run release
```

Outputs:

- `release/ibkr-wallet-report-<version>/` — folder to sanity-check
- `release/ibkr-wallet-report-<version>.zip` — **upload this to GitHub Releases**

The zip contains only what end users need (`manifest.json`, `dist/`, CSS, `INSTALL.md`). No source code or `node_modules`.

### Publishing a GitHub Release

1. Run `npm run release`.
2. Create a new release on GitHub, tag e.g. `v1.0.0`.
3. Attach `release/ibkr-wallet-report-1.0.0.zip`.
4. Paste a short note pointing users to extract the zip and open `INSTALL.md`.

Bump `version` in `package.json` before each release (the script syncs it into the packaged `manifest.json`).

---

## Limitations

- Unofficial; IBKR can change their website layout at any time.
- Not published on Chrome Web Store or Firefox Add-ons (manual zip install).
- Firefox / LibreWolf: temporary add-on — reload after browser restart.
- No sector grouping (positions table has no sector column).

See [PLAN.md](PLAN.md) for product scope and architecture.
