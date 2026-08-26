/**
 * Extract stock positions from IBKR Client Portal positions table.
 * @param {Document} doc
 * @returns {{ currency: string, asOf: string, holdings: Array<{ticker:string,name:string,qty:number,value:number}>, total: number }}
 */
export function extractPositions(doc) {
  const table = doc.querySelector('#cp-ptf-positions-table0');
  if (!table) {
    throw new Error('Positions table not found (#cp-ptf-positions-table0)');
  }

  const marketValueCol = findColumnIndex(table, /sort by market value/i);
  const positionCol = findColumnIndex(table, /sort by position/i);
  const lastPriceCol = findColumnIndex(table, /sort by last price/i);

  const holdings = [];
  for (const row of table.querySelectorAll('tr[data-id][aria-label], tr._tbgr[aria-label]')) {
    const ticker = (row.getAttribute('aria-label') || '').trim()
      || row.querySelector('span.text-semibold')?.textContent?.trim();
    if (!ticker || !/^[A-Z0-9.]+$/i.test(ticker)) continue;

    const cells = [...row.querySelectorAll('td')];
    const nameEl = row.querySelector('div.fs8.fg70');
    const name = nameEl?.textContent?.trim() || ticker;

    const qtyCell = positionCol >= 0 ? cells[positionCol] : cells[1];
    const qtyText = qtyCell?.querySelector('span._npos')?.textContent?.trim()
      || qtyCell?.textContent?.trim()
      || '0';
    const qty = parseNumber(qtyText);

    const lastPriceCell = lastPriceCol >= 0 ? cells[lastPriceCol] : cells[3];
    const lastPrice = parseNumber(lastPriceCell?.textContent || '0');

    const mvCell = marketValueCol >= 0 ? cells[marketValueCol] : cells[5];
    const rawValue = parseNumber(mvCell?.textContent || '0');
    const value = resolveMarketValue(qty, lastPrice, rawValue);
    if (!value) continue;

    holdings.push({ ticker: ticker.toUpperCase(), name, qty, value });
  }

  const total = round2(holdings.reduce((sum, h) => sum + h.value, 0));
  const asOf = new Date().toISOString().slice(0, 10);

  return { currency: 'USD', asOf, holdings, total };
}

function findColumnIndex(table, labelPattern) {
  const headers = [...table.querySelectorAll('thead tr th')];
  for (let i = 0; i < headers.length; i++) {
    const th = headers[i];
    const button = th.querySelector('[aria-label]');
    const label = button?.getAttribute('aria-label')
      || th.getAttribute('aria-label')
      || th.textContent
      || '';
    if (labelPattern.test(label)) return i;
  }
  return -1;
}

/** When IBKR column mapping is off, market value may contain the unit last price. */
export function resolveMarketValue(qty, lastPrice, rawValue) {
  if (!rawValue) {
    return qty > 0 && lastPrice > 0 ? round2(qty * lastPrice) : 0;
  }
  if (qty > 1 && lastPrice > 0 && Math.abs(rawValue - lastPrice) / lastPrice < 0.01) {
    return round2(qty * lastPrice);
  }
  return round2(rawValue);
}

function parseNumber(text) {
  const cleaned = String(text).replace(/[^\d.,-]/g, '').replace(/,/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
