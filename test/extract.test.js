import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { extractPositions, resolveMarketValue } from '../src/extract/positions.js';
import { extractChart, parseAriaLabel, collapseToMonthly } from '../src/extract/chart.js';
import { mergeReportData, buildHtml } from '../src/report/buildHtml.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtures = join(__dirname, 'fixtures');

function loadFixture(name) {
  const html = readFileSync(join(fixtures, name), 'utf8');
  return new JSDOM(html).window.document;
}

test('resolveMarketValue multiplies qty when raw value is unit price', () => {
  assert.equal(resolveMarketValue(6, 598.5, 598.5), 3591);
  assert.equal(resolveMarketValue(101, 32.67, 32.67), 3299.67);
  assert.equal(resolveMarketValue(6, 573.7, 3442.14), 3442.14);
  assert.equal(resolveMarketValue(1, 3616, 3616), 3616);
});

test('extractPositions parses raw-stocks fixture', () => {
  const doc = loadFixture('raw-stocks.html');
  const result = extractPositions(doc);

  assert.equal(result.currency, 'USD');
  assert.equal(result.holdings.length, 19);
  assert.equal(result.total, 28008.77);

  const ma = result.holdings.find((h) => h.ticker === 'MA');
  assert.ok(ma);
  assert.equal(ma.qty, 6);
  assert.equal(ma.value, 3442.14);

  const cprt = result.holdings.find((h) => h.ticker === 'CPRT');
  assert.ok(cprt);
  assert.equal(cprt.qty, 101);
  assert.equal(cprt.value, 3418.85);
});

test('extractChart parses total.html fixture', () => {
  const doc = loadFixture('total.html');
  const result = extractChart(doc);

  assert.equal(result.currency, 'USD');
  assert.equal(result.asOf, '2026-08-19');
  assert.ok(result.series.length >= 140);
  assert.equal(result.months.length, 8);

  const expected = [
    ['Jan', 186.97],
    ['Fev', 7142.33],
    ['Mar', 8395.09],
    ['Abr', 15060.63],
    ['Mai', 14989.49],
    ['Jun', 15607.2],
    ['Jul', 19604.45],
    ['Ago', 28234.75],
  ];

  for (let i = 0; i < expected.length; i++) {
    assert.equal(result.months[i].label, expected[i][0]);
    assert.equal(result.months[i].value, expected[i][1]);
  }
});

test('parseAriaLabel handles IBKR Highcharts labels', () => {
  const parsed = parseAriaLabel('147. Wednesday, Aug 19, 00:00, 28,234.75.');
  assert.ok(parsed);
  assert.equal(parsed.date, '2026-08-19');
  assert.equal(parsed.value, 28234.75);
});

test('collapseToMonthly keeps last observation per month', () => {
  const months = collapseToMonthly([
    { date: '2026-01-28', value: 187.55 },
    { date: '2026-01-30', value: 186.97 },
    { date: '2026-02-27', value: 7142.33 },
  ]);
  assert.equal(months.length, 2);
  assert.equal(months[0].label, 'Jan');
  assert.equal(months[0].value, 186.97);
  assert.equal(months[1].label, 'Fev');
  assert.equal(months[1].value, 7142.33);
});

test('mergeReportData and buildHtml produce valid report', () => {
  const positionsDoc = loadFixture('raw-stocks.html');
  const chartDoc = loadFixture('total.html');
  const positions = extractPositions(positionsDoc);
  const chart = extractChart(chartDoc);
  const data = mergeReportData(chart, positions);

  assert.equal(data.total, 28008.77);
  assert.equal(data.stocks.length, 19);
  assert.equal(data.stocks[0].ticker, 'MA');
  assert.equal(data.stocks[0].sector, 'Financial Services');
  assert.ok(data.stocks[0].pct > 0);

  const html = buildHtml(data);
  assert.match(html, /Carteira de investimentos/);
  assert.match(html, /Evolução mensal/);
  assert.match(html, /"ticker":"MA"/);
  assert.match(html, /"sector":"Financial Services"/);
  assert.match(html, /sector-card/);
  assert.match(html, /Serviços financeiros/);
  assert.doesNotMatch(html, /Estratégia atual/);
  assert.doesNotMatch(html, /Países/);
  assert.doesNotMatch(html, /Apenas manter/);
});
