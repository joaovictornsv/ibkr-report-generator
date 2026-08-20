import { sessionStorage } from '../extApi.js';

const RUN_KEY = 'ibkrWalletRun';
const WAIT_MS = 15000;

/**
 * @param {Document} doc
 * @param {string} selector
 * @param {number} [timeout]
 */
export function waitFor(doc, selector, timeout = WAIT_MS) {
  return new Promise((resolve, reject) => {
    const check = () => doc.querySelector(selector);
    if (check()) {
      resolve(check());
      return;
    }

    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Timeout waiting for ${selector}`));
    }, timeout);

    const observer = new MutationObserver(() => {
      const el = check();
      if (el) {
        clearTimeout(timer);
        observer.disconnect();
        resolve(el);
      }
    });

    observer.observe(doc.documentElement, { childList: true, subtree: true });
  });
}

/**
 * @param {Document} doc
 * @param {RegExp} pattern
 * @returns {HTMLElement|null}
 */
export function findNavLink(doc, pattern) {
  const candidates = doc.querySelectorAll('a, button, [role="tab"], [role="menuitem"]');
  for (const el of candidates) {
    const text = (el.textContent || '').trim();
    const label = el.getAttribute('aria-label') || '';
    if (pattern.test(text) || pattern.test(label)) return el;
  }
  return null;
}

export function hasChart(doc) {
  const chart = doc.querySelector('.portfolio-value-chart__chart');
  return !!(chart && chart.querySelector('path.highcharts-point[aria-label]'));
}

export function hasPositionsTable(doc) {
  const table = doc.querySelector('#cp-ptf-positions-table0');
  return !!(table && table.querySelector('tr._tbgr[aria-label], tr[data-id][aria-label]'));
}

export async function clickNav(doc, pattern) {
  const link = findNavLink(doc, pattern);
  if (!link) return false;
  link.click();
  return true;
}

export async function ensureChart1Y(doc) {
  const pressed = doc.querySelector('button[aria-pressed="true"][aria-label*="12M"], button[aria-pressed="true"]');
  if (pressed && /1Y|12M/i.test(pressed.textContent + pressed.getAttribute('aria-label'))) {
    return;
  }
  const btn = doc.querySelector('button[aria-label*="12M"], button[aria-label*="period_aria_12M"]')
    || [...doc.querySelectorAll('button')].find((b) => b.textContent.trim() === '1Y');
  btn?.click();
}

export async function getRunState() {
  const result = await sessionStorage().get(RUN_KEY);
  return result[RUN_KEY] || null;
}

export async function setRunState(state) {
  if (state) {
    await sessionStorage().set({ [RUN_KEY]: state });
  } else {
    await sessionStorage().remove(RUN_KEY);
  }
}

export { RUN_KEY, WAIT_MS };
