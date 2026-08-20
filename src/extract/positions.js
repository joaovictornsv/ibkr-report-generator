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

    const mvCell = marketValueCol >= 0 ? cells[marketValueCol] : cells[5];
    const value = parseNumber(mvCell?.textContent || '0');
    if (!value) continue;

    holdings.push({ ticker: ticker.toUpperCase(), name, qty, value });
  }

  const total = round2(holdings.reduce((sum, h) => sum + h.value, 0));
  const asOf = new Date().toISOString().slice(0, 10);

  return { currency: 'USD', asOf, holdings, total };
}

function findColumnIndex(table, labelPattern) {
  for (const th of table.querySelectorAll('th')) {
    const button = th.querySelector('[aria-label]');
    const label = button?.getAttribute('aria-label')
      || th.getAttribute('aria-label')
      || th.textContent
      || '';
    if (labelPattern.test(label)) {
      const idx = Number(th.getAttribute('aria-colindex'));
      if (idx > 0) return idx - 1;
    }
  }
  return -1;
}

function parseNumber(text) {
  const cleaned = String(text).replace(/[^\d.,-]/g, '').replace(/,/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
