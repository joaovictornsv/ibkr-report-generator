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
const DEFAULT_BTN_LABEL = 'Download wallet report';

let running = false;
let buttonResetTimer = null;

function ensureUi() {
  if (!document.getElementById(BTN_ID)) {
    const btn = document.createElement('button');
    btn.id = BTN_ID;
    btn.type = 'button';
    btn.textContent = running ? 'Working…' : DEFAULT_BTN_LABEL;
    btn.disabled = running;
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

function watchUi() {
  const observer = new MutationObserver(() => {
    if (!document.getElementById(BTN_ID) || !document.getElementById(TOAST_ID)) {
      ensureUi();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

function setButtonLabel(text, disabled = false) {
  ensureUi();
  const btn = document.getElementById(BTN_ID);
  if (!btn) return;
  btn.textContent = text;
  btn.disabled = disabled;
}

function scheduleButtonReset(label, delayMs = 2500) {
  clearTimeout(buttonResetTimer);
  setButtonLabel(label, false);
  if (delayMs > 0) {
    buttonResetTimer = setTimeout(() => {
      buttonResetTimer = null;
      setButtonLabel(DEFAULT_BTN_LABEL, false);
    }, delayMs);
  }
}

function showToast(message, ms = 6000) {
  ensureUi();
  const toast = document.getElementById(TOAST_ID);
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('visible'), ms);
}

async function onButtonClick() {
  if (running) {
    showToast('Report already in progress…', 2500);
    return;
  }

  clearTimeout(buttonResetTimer);
  buttonResetTimer = null;
  running = true;
  setButtonLabel('Starting…', true);

  try {
    await runOrchestrator();
  } catch (err) {
    console.error('[IBKR Wallet]', err);
    showToast(err.message || 'Report failed');
    setButtonLabel(DEFAULT_BTN_LABEL, false);
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
  scheduleButtonReset('Done');
}

async function resumeIfNeeded() {
  const state = await getRunState();
  if (!state || (!state.chart && !state.step)) return;

  running = true;
  setButtonLabel(
    state.positions ? 'Finishing…' : state.chart ? 'Collecting positions…' : 'Collecting chart…',
    true,
  );
  try {
    await runOrchestrator();
  } catch (err) {
    console.error('[IBKR Wallet resume]', err);
    showToast(err.message || 'Report failed');
    setButtonLabel(DEFAULT_BTN_LABEL, false);
  } finally {
    running = false;
  }
}

ensureUi();
watchUi();
resumeIfNeeded();
