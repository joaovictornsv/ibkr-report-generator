# How to install IBKR Wallet Report

This extension adds a **Download wallet report** button on the IBKR Client Portal website. You do **not** need to install Node.js or run any commands — only follow the steps for your browser below.

---

## Before you start

1. **Download the release zip** from the project’s GitHub **Releases** page (file name like `ibkr-wallet-report-1.0.0.zip`).
2. **Extract the zip** to a permanent folder, for example:
   - Windows: `Documents\ibkr-wallet-report`
   - Mac: `Documents/ibkr-wallet-report`
   - Linux: `~/ibkr-wallet-report`
3. **Keep that folder.** Do not delete it after installing — the browser keeps reading the extension from there.
4. **Do not** try to install from inside the zip file without extracting first.

You should see these files inside the extracted folder:

- `manifest.json`
- `INSTALL.md` (this file)
- `dist/content.js`
- `src/content/button.css`

---

## Google Chrome

Works the same on **Microsoft Edge** and **Brave** (see notes below).

1. Open Chrome.
2. In the address bar, type **`chrome://extensions`** and press Enter.
3. Turn on **Developer mode** (switch in the top-right corner).
4. Click **Load unpacked**.
5. Select the **extracted folder** (the one that contains `manifest.json`).
6. You should see **IBKR Wallet Report** in the list with no errors.
7. Open [IBKR Client Portal](https://www.interactivebrokers.com/portal), log in, and look for the blue **Download wallet report** button at the bottom-right.

**After an update:** download the new zip, extract it (you can overwrite the old folder), then go to `chrome://extensions` and click the **reload** icon on the extension card.

---

## Microsoft Edge

1. Open Edge.
2. Go to **`edge://extensions`**.
3. Turn on **Developer mode** (bottom-left or top-left, depending on version).
4. Click **Load unpacked**.
5. Select the extracted folder.
6. Open Client Portal and use the button as above.

---

## Brave

1. Open Brave.
2. Go to **`brave://extensions`**.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the extracted folder.

---

## Mozilla Firefox

Firefox installs this as a **temporary** add-on. You will need to **repeat these steps after closing Firefox**.

1. Open Firefox.
2. In the address bar, type **`about:debugging#/runtime/this-firefox`** and press Enter.
3. Click **Load Temporary Add-on…**.
4. Open the extracted folder and select **`manifest.json`**.
5. Confirm **IBKR Wallet Report** appears without errors.
6. Open Client Portal and use the button.

Requires Firefox **115 or newer**.

---

## LibreWolf

Same steps as Firefox (LibreWolf is Firefox-based). The add-on is **temporary** — reload it after each browser restart.

1. Open LibreWolf.
2. Go to **`about:debugging#/runtime/this-firefox`**.
3. Click **Load Temporary Add-on…**.
4. Select **`manifest.json`** inside the extracted folder.
5. Open Client Portal and use the button.

If the download does not start, check LibreWolf’s download permissions for `interactivebrokers.com`.

---

## How to use

1. Log into **IBKR Client Portal** (not TWS desktop).
2. Click **Download wallet report** (bottom-right).
3. Wait while the button shows **Collecting chart…** then **Collecting positions…**.
4. Your browser saves **`carteira-YYYY-MM-DD.html`**. Open that file in any browser to view your report.

If something fails, a dark message appears near the button. Fix what it says (e.g. open Dashboard), then click the button again.

---

## Troubleshooting

| Problem | What to try |
|--------|-------------|
| No button on the portal | Refresh the page. On Firefox/LibreWolf, reload the add-on via `about:debugging`. |
| “Load unpacked” is greyed out | Enable **Developer mode** first. |
| Extension error right after install | Make sure you extracted the zip and selected the folder that **contains** `manifest.json`. |
| Button works but no download | Allow downloads for Interactive Brokers in browser settings. |
| Stopped working after browser update | Reload the extension (Chrome: reload on extensions page; Firefox: load temporary add-on again). |

---

## Privacy (short version)

- Works only while you are on IBKR’s website in your browser.
- Does **not** send your portfolio to any server.
- Unofficial tool — not affiliated with Interactive Brokers.

---

## Not in the Chrome Web Store / Firefox Add-ons

This version is meant for **manual install** from the release zip. That is normal for personal / small tools. Store listing would require extra review and a privacy policy page; it may come later.

For developers building from source, see [README.md](README.md).
