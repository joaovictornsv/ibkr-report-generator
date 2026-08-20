# IBKR Wallet HTML Browser Extension

New standalone repo (do not change `/media/joaovictornsv/B137-2092/vault/projects/ibkr-analysis`). Reuse extraction rules proven on the Aug 19 dumps (`raw-stocks.html`, `total.html`) and the report look from `wallet.html`, minus personal sections.

**Overview:** A Chrome Manifest V3 extension that injects one button on IBKR Client Portal, briefly navigates Dashboard then Positions to scrape both views, and downloads a self-contained HTML report — without the personal disclaimer, 70/30 strategy, or country-diversification sections.

## Todos

- [x] Create Chrome MV3 manifest, content script, button CSS, README for unpacked install
- [x] Implement positions + Highcharts extractors; unit-test against copied `raw-stocks.html` and `total.html` fixtures
- [x] Port `wallet.html` generator: header, monthly chart, sorted holdings; omit disclaimer, strategy, countries, hold tags
- [x] Orchestrator that auto-clicks portal nav (Dashboard then Positions), waits for known selectors, stores partial extract in session, then downloads

## Product

Anyone logged into **IBKR Client Portal** sees a floating **Download wallet report** button. One click runs a **short two-page scrape** (Dashboard NAV chart and Portfolio positions live on different views), then downloads `carteira-YYYY-MM-DD.html`.

No IBKR login, API keys, or data leaves the browser. The extension only has DOM access on IBKR hosts.

```mermaid
flowchart TD
  click[UserClicksButton]
  dash[OpenDashboard]
  waitChart[WaitForHighcharts]
  pos[OpenPositions]
  waitTable[WaitForPositionsTable]
  html[BuildAndDownloadHTML]
  click --> dash --> waitChart --> pos --> waitTable --> html
```

## Two-page extraction (required)

Dashboard chart and the positions grid are **not** on the same view. v1 does not treat the chart as optional and does not ask the user to click twice. After one button press, a small orchestrator:

1. **Dashboard** — click the portal’s own Dashboard / home nav item (same tab, SPA). Wait until `.portfolio-value-chart__chart` has Highcharts points (`path.highcharts-point[aria-label]`). Prefer the **1Y** range already selected in the dumps; if another period is active, click the `1Y` control (`aria-label` containing `12M` / `1Y`) then re-wait. Snapshot the series into `chrome.storage.session`.
2. **Positions** — click Portfolio / Positions. Wait until `#cp-ptf-positions-table0` has `tr._tbgr[aria-label]` rows. Snapshot holdings.
3. **Download** — merge both snapshots, generate HTML, trigger download. Disable the button and show status on it (`Collecting chart…` / `Collecting positions…` / `Done`) so the hop is obvious.

**Nav discovery:** do not hardcode full URLs if the SPA uses hashes; prefer clicking visible nav links whose text or `aria-label` matches `/dashboard/i`, `/portfolio/i`, `/positions/i`. Record the selectors used against a live session when implementing; keep a fallback list.

**Waits:** `MutationObserver` + timeout (~15s per view). If the auto-click misses IBKR’s nav markup, stop and toast the missing step (`Open Dashboard, then click the button again` or Positions). A second click resumes from whatever is still missing in session storage (so a failed hop is recoverable without restarting).

**Same-tab only.** No extra windows. Content script stays on the portal origin across SPA route changes; if IBKR does a full reload, the orchestrator state in `chrome.storage.session` continues the run.

**After download:** leave the user on **Positions** (the last hop). Do not bounce them back to Dashboard unless restoring the start URL is cheap — extra navigation is noise.

**Concurrency:** ignore further clicks while a run is in progress. Clear the session run flag when finished or timed out.

## Target site (from dumps)

The saved table id `cp-ptf-positions-table0` is **Client Portal**, not TWS. Match these hosts in the manifest (SPA uses several):

- `https://*.interactivebrokers.com/*`
- `https://*.interactivebrokers.co.uk/*` (and other regional portals if needed)

The portal is an SPA: **Dashboard** (NAV Highcharts) and **Portfolio / Positions** (grid) are different routes. The button is always visible once the shell loads; a click **drives those two routes in order**, then downloads. If the user is already on one of the two views when they click, skip that hop and only navigate to the missing one.

## What the HTML report includes vs omits

**Keep** (generic, from page + light derivation):

- Title, total market value (sum of position market values), position count, as-of date, currency (from chart `currency="USD"` or default USD).
- Monthly NAV sparkline from the Dashboard 1Y series (last observation per calendar month, same rule as the existing report). Chart is a first-class extract step, not an optional extra.
- Holdings list: ticker, company name if present in the row, quantity (`span._npos` in the Position column), market value, % of total.
- Logos via the existing public URL pattern `https://financialmodelingprep.com/image-stock/{TICKER}.png` with ticker-initials fallback (loaded when the downloaded file is opened, not by the extension).
- Optional Investidor10 name links (same heuristic: tickers ending in a digit → `/acoes/`, else `/stocks/`). Easy to drop later if you want a fully locale-neutral report.

**Omit** (personal / not on the page):

- Qty-1 disclaimer
- Current strategy / 30–70 Brazil–international
- Country flags, country lookup maps, country summary card
- `HOLD_ONLY` / “Apenas manter” tags
- Hardcoded ticker → name/sector/country maps from the Python one-off

**Sectors:** the live positions table does **not** contain GICS sector. Do **not** ship the personal sector map. First version: **flat list sorted by market value**. Optional later: best-effort sector from a small bundled public mapping, or skip grouping forever.

**Language:** generate the report in **Portuguese** to match the current `wallet.html` copy (`Carteira de investimentos`, `Posições`, `Dados em …`), since that is the artifact you already share. Internals (code, README) in English.

## Extraction (DOM, not regex on full HTML)

Port the logic that already worked on the dumps, using `querySelector` so it survives minor markup noise:

**Positions** — for each `tr[data-id][aria-label]`:

- Ticker: `aria-label` or `span.text-semibold`
- Qty: first `td` with `span._npos` after the instrument cell (column “Position”)
- Market value: parse the Market Value cell (`td` under “Sort by Market Value”); strip commas
- Name: `div.fs8.fg70` if IBKR renders it; else ticker

Ignore cash rows if they appear without a real ticker. Sum `value` for the header total (in the current report this is **stock MV**, not full NAV — keep that distinction; NAV belongs on the chart).

**Chart** — `path.highcharts-point[aria-label]`: parse date + number from the aria-label; collapse to last value per month; Portuguese month labels (`Jan`…`Dez` / `Fev` as today).

Copy `raw-stocks.html` and `total.html` from ibkr-analysis into this repo as **fixtures** for unit tests (jsdom). That is the regression suite when IBKR tweaks classes.

## Extension architecture (Chrome MV3)

Suggested project layout:

- `manifest.json` — MV3, `content_scripts` on IBKR URLs, `storage` permission, no host_permissions beyond those matches (no `<all_urls>`).
- `src/content/index.js` — inject button, click starts orchestrator, status text, toasts.
- `src/extract/navigate.js` — find-and-click portal nav; waitFor(selector, timeout); skip hop if target already in DOM.
- `src/content/button.css` — fixed-position control, high z-index, does not fight IBKR layout.
- `src/extract/positions.js` / `src/extract/chart.js` — pure functions `(document) => data`.
- `src/report/buildHtml.js` — CSS + body + inline `DATA` JSON + the chart/list JS from current wallet, stripped of country/strategy/disclaimer/HOLD_ONLY.
- `src/download.js` — `Blob` + `<a download>` (enough; `downloads` API optional).

`storage` is required for the in-progress run across SPA reloads. No background worker required for v1 unless navigation proves flaky. Vanilla JS; no React.

**SPA robustness:** wait for `#cp-ptf-positions-table0` and `.portfolio-value-chart__chart` after each hop; re-query the live document, never cache NodeLists across routes.

## Install path

v1: **unpacked load** (`chrome://extensions` → Load unpacked). README with 5 steps. Chrome Web Store only if you later want public listing (privacy policy, screenshots, review). Firefox can share most of the same code later; do not block v1 on it.

## Privacy / ToS notes (README)

- Processes portfolio data **only in the tab**.
- Does not transmit holdings to a server.
- Unofficial; IBKR DOM can change — fixtures + a clear “table not found” message.

## Out of scope for v1

- Updating ibkr-analysis
- Writing `holdings.json` / git commits
- Firefox/Safari stores, IBKR Mobile, TWS
- Sector/country/strategy personalization
- Calling IBKR Web API
