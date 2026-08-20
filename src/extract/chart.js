const PT_MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const EN_TO_PT = {
  Jan: 'Jan', Feb: 'Fev', Mar: 'Mar', Apr: 'Abr', May: 'Mai', Jun: 'Jun',
  Jul: 'Jul', Aug: 'Ago', Sep: 'Set', Oct: 'Out', Nov: 'Nov', Dec: 'Dez',
};

/**
 * Extract NAV chart series from IBKR Dashboard Highcharts markup.
 * @param {Document} doc
 * @returns {{ currency: string, asOf: string, series: Array<{date:string,value:number}>, months: Array<{label:string,value:number}> }}
 */
export function extractChart(doc) {
  const chartRoot = doc.querySelector('.portfolio-value-chart__chart');
  if (!chartRoot) {
    throw new Error('Portfolio chart not found (.portfolio-value-chart__chart)');
  }

  const currency = chartRoot.getAttribute('currency') || 'USD';
  const points = chartRoot.querySelectorAll('path.highcharts-point[aria-label]');
  if (!points.length) {
    throw new Error('No Highcharts data points found');
  }

  const series = [];
  for (const point of points) {
    const parsed = parseAriaLabel(point.getAttribute('aria-label'));
    if (parsed) series.push(parsed);
  }

  if (!series.length) {
    throw new Error('Could not parse chart data points');
  }

  const months = collapseToMonthly(series);
  const asOf = series[series.length - 1].date;

  return { currency, asOf, series, months };
}

/**
 * Parse Highcharts aria-label, e.g. "147. Wednesday, Aug 19, 00:00, 28,234.75."
 * @param {string|null} label
 * @returns {{ date: string, value: number }|null}
 */
export function parseAriaLabel(label) {
  if (!label) return null;

  const match = label.match(/,\s*([A-Za-z]+)\s+(\d{1,2}),\s*[^,]+,\s*([\d,]+(?:\.\d+)?)/);
  if (!match) return null;

  const [, monthStr, dayStr, valueStr] = match;
  const monthIdx = monthIndex(monthStr);
  if (monthIdx < 0) return null;

  const day = Number(dayStr);
  const value = parseFloat(valueStr.replace(/,/g, ''));
  if (!Number.isFinite(value)) return null;

  const year = inferYear(monthIdx, day);
  const date = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return { date, value };
}

function monthIndex(abbr) {
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  return months.indexOf(abbr.slice(0, 3).toLowerCase());
}

function inferYear(monthIdx, day) {
  const now = new Date();
  let year = now.getFullYear();
  const candidate = new Date(year, monthIdx, day);
  if (candidate > now) year -= 1;
  return year;
}

/**
 * Keep the last observation per calendar month (1Y series → monthly sparkline).
 * @param {Array<{date:string,value:number}>} series
 * @returns {Array<{label:string,value:number}>}
 */
export function collapseToMonthly(series) {
  const byMonth = new Map();

  for (const { date, value } of series) {
    const d = new Date(date + 'T12:00:00');
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const existing = byMonth.get(key);
    if (!existing || date >= existing.date) {
      byMonth.set(key, { date, value, month: d.getMonth() });
    }
  }

  return [...byMonth.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(({ value, month }) => ({
      label: PT_MONTHS[month] || EN_TO_PT[Object.keys(EN_TO_PT)[month]] || PT_MONTHS[0],
      value: Math.round(value * 100) / 100,
    }));
}

export { PT_MONTHS };
