import { extractChart } from '../extract/chart.js';
import { extractPositions } from '../extract/positions.js';
import {
  waitFor,
  clickNav,
  hasChart,
  hasPositionsTable,
  ensureChart1Y,
  getRunState,
  setRunState,
} from '../extract/navigate.js';
import { buildHtml, mergeReportData } from '../report/buildHtml.js';
import { downloadHtml, walletFilename } from '../download.js';

const BTN_ID = 'ibkr-wallet-btn';
const TOAST_ID = 'ibkr-wallet-toast';

let running = false;

function ensureUi() {
  if (!document.getElementById(BTN_ID)) {
    const btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.textContent = 'Download wallet report';
    btn.addEventListener('click', onButtonClick);
    document.body.appendChild(btn);
  }
  if (!document.getElementById(TOAST_ID)) {
    const toast = document.createElement('div');
    toast.id = TOAST_ID;
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
}

function setButtonLabel(text, disabled = false) {
  const btn = document.getElementById(BTN_ID);
  if (!btn) return;
  btn.textContent = text;
  btn.disabled = disabled;
}

function showToast(message, ms = 6000) {
  const toast = document.getElementById(TOAST_ID);
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('visible'), ms);
}

async function onButtonClick() {
  if (running) return;
  running = true;
  setButtonLabel('Starting…', true);

  try {
    await runOrchestrator();
  } catch (err) {
    console.error('[IBKR Wallet]', err);
    showToast(err.message || 'Report failed');
    setButtonLabel('Download wallet report', false);
  } finally {
    running = false;
  }
}

async function runOrchestrator() {
  let state = (await getRunState()) || { chart: null, positions: null, step: 'chart' };

  if (!state.chart) {
    if (!hasChart(document)) {
      setButtonLabel('Collecting chart…', true);
      const clicked = await clickNav(document, /dashboard|home|início/i)
        || await clickNav(document, /portfolio/i);
      if (!clicked && !hasChart(document)) {
        throw new Error('Open Dashboard, then click the button again.');
      }
      if (!hasChart(document)) {
        await waitFor(document, '.portfolio-value-chart__chart path.highcharts-point[aria-label]');
      }
    }
    await ensureChart1Y(document);
    await waitFor(document, '.portfolio-value-chart__chart path.highcharts-point[aria-label]');
    state.chart = extractChart(document);
    state.step = 'positions';
    await setRunState(state);
  }

  if (!state.positions) {
    if (!hasPositionsTable(document)) {
      setButtonLabel('Collecting positions…', true);
      const clicked = await clickNav(document, /positions|posições/i)
        || await clickNav(document, /portfolio/i);
      if (!clicked && !hasPositionsTable(document)) {
        throw new Error('Open Portfolio → Positions, then click the button again.');
      }
      if (!hasPositionsTable(document)) {
        await waitFor(document, '#cp-ptf-positions-table0 tr._tbgr[aria-label], #cp-ptf-positions-table0 tr[data-id][aria-label]');
      }
    }
    state.positions = extractPositions(document);
    await setRunState(state);
  }

  const data = mergeReportData(state.chart, state.positions);
  const html = buildHtml(data);
  downloadHtml(html, walletFilename(data.asOf));

  await setRunState(null);
  setButtonLabel('Done', true);
  setTimeout(() => setButtonLabel('Download wallet report', false), 2500);
}

async function resumeIfNeeded() {
  const state = await getRunState();
  if (state && (state.chart || state.step)) {
    running = true;
    setButtonLabel(state.positions ? 'Finishing…' : state.chart ? 'Collecting positions…' : 'Collecting chart…', true);
    try {
      await runOrchestrator();
    } catch (err) {
      console.error('[IBKR Wallet resume]', err);
      setButtonLabel('Download wallet report', false);
    } finally {
      running = false;
    }
  }
}

ensureUi();
resumeIfNeeded();
