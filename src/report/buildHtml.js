/**
 * Build self-contained wallet HTML report.
 * @param {{ asOf: string, currency: string, total: number, stocks: Array, months: Array }} data
 * @returns {string}
 */
export function buildHtml(data) {
  const footerDate = formatFooterDate(data.asOf);
  const dataJson = JSON.stringify(data).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Carteira</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #f8f9fb; --card: #ffffff; --text: #111827; --muted: #6b7280;
      --border: #e5e7eb; --accent: #2563eb; --accent-soft: #eff6ff; --radius: 16px;
    }
    body {
      font-family: 'Inter', system-ui, sans-serif; background: var(--bg); color: var(--text);
      line-height: 1.5; min-height: 100vh; -webkit-font-smoothing: antialiased;
    }
    .wrap { max-width: 720px; margin: 0 auto; padding: 32px 20px 48px; }
    header { margin-bottom: 28px; }
    header h1 { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); }
    .total { font-size: 2.5rem; font-weight: 700; letter-spacing: -0.03em; margin-top: 4px; font-variant-numeric: tabular-nums; }
    .money-cents { font-size: 0.62em; font-weight: 600; opacity: 0.72; }
    .meta { font-size: 0.8125rem; color: var(--muted); margin-top: 4px; }
    .card {
      background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);
      padding: 24px; margin-bottom: 20px;
    }
    .card h2 { font-size: 0.8125rem; font-weight: 600; color: var(--muted); margin-bottom: 16px; }
    .chart-wrap { position: relative; height: 200px; cursor: crosshair; }
    .chart-wrap svg { width: 100%; height: 100%; overflow: visible; display: block; }
    .chart-tooltip {
      position: absolute; pointer-events: none; z-index: 2; background: var(--text); color: #fff;
      font-size: 0.75rem; font-weight: 500; padding: 6px 10px; border-radius: 8px; white-space: nowrap;
      transform: translate(-50%, -100%); opacity: 0; transition: opacity 0.12s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .chart-tooltip.visible { opacity: 1; }
    .chart-tooltip .tt-month { font-size: 0.625rem; opacity: 0.7; font-weight: 400; }
    .chart-tooltip .tt-value { font-weight: 600; font-variant-numeric: tabular-nums; }
    .chart-labels { display: flex; justify-content: space-between; margin-top: 8px; padding: 0 2px; }
    .chart-labels span {
      font-size: 0.6875rem; color: var(--muted); text-align: center; flex: 1;
      transition: color 0.12s, font-weight 0.12s;
    }
    .chart-labels span.active { color: var(--accent); font-weight: 600; }
    .chart-dot { transition: r 0.12s; cursor: pointer; }
    .chart-dot.active { r: 6; }
    .chart-hit { fill: transparent; cursor: pointer; }
    .section-title { font-size: 0.8125rem; font-weight: 600; color: var(--muted); margin-bottom: 12px; }
    .holdings-card {
      background: var(--card); border: 1px solid var(--border); border-radius: var(--radius);
      padding: 16px 20px 12px;
    }
    .stock {
      display: grid; grid-template-columns: 40px 1fr auto; gap: 12px; align-items: center;
      padding: 10px 4px; border-radius: 10px; transition: background 0.15s;
    }
    .stock:hover { background: var(--bg); }
    .logo {
      width: 40px; height: 40px; border-radius: 10px; background: var(--bg);
      border: 1px solid var(--border); display: flex; align-items: center; justify-content: center;
      overflow: hidden; font-size: 0.6875rem; font-weight: 700; color: var(--muted);
    }
    .logo img { width: 100%; height: 100%; object-fit: contain; padding: 6px; }
    .stock-info { min-width: 0; }
    .stock-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .stock-name {
      font-weight: 600; font-size: 0.9375rem; white-space: nowrap; overflow: hidden;
      text-overflow: ellipsis; color: inherit; text-decoration: none;
    }
    a.stock-name:hover { color: var(--accent); text-decoration: underline; text-underline-offset: 2px; }
    .stock-ticker { font-size: 0.75rem; color: var(--muted); font-weight: 500; }
    .stock-qty {
      font-size: 0.6875rem; font-weight: 600; color: var(--muted); background: var(--bg);
      border: 1px solid var(--border); padding: 1px 7px; border-radius: 99px;
      line-height: 1.5; font-variant-numeric: tabular-nums; flex-shrink: 0;
    }
    .stock-right { text-align: right; }
    .stock-value { font-weight: 600; font-size: 0.9375rem; font-variant-numeric: tabular-nums; }
    .stock-pct { font-size: 0.75rem; color: var(--muted); margin-top: 2px; font-variant-numeric: tabular-nums; }
    footer { text-align: center; font-size: 0.6875rem; color: var(--muted); margin-top: 20px; }
    @media (max-width: 480px) {
      .total { font-size: 2rem; }
      .stock { grid-template-columns: 36px 1fr auto; gap: 10px; }
      .logo { width: 36px; height: 36px; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>Carteira de investimentos</h1>
      <div class="total" id="total"></div>
      <div class="meta" id="meta"></div>
    </header>
    <div class="card">
      <h2>Evolução mensal</h2>
      <div class="chart-wrap" id="chart-wrap">
        <div class="chart-tooltip" id="chart-tooltip"></div>
        <div id="chart"></div>
      </div>
      <div class="chart-labels" id="chart-labels"></div>
    </div>
    <h2 class="section-title">Posições · <span id="count"></span></h2>
    <div class="holdings-card" id="stocks"></div>
    <footer>Dados em ${footerDate} · ${data.currency}</footer>
  </div>
  <script>
    const DATA = ${dataJson};
    ${REPORT_SCRIPT}
  </script>
</body>
</html>`;
}

/**
 * Merge chart + positions extracts into report DATA shape.
 */
export function mergeReportData(chartData, positionsData) {
  const total = positionsData.total;
  const stocks = positionsData.holdings
    .map((h) => ({
      ticker: h.ticker,
      name: h.name,
      qty: h.qty,
      value: Math.round(h.value * 100) / 100,
      pct: total > 0 ? Math.round((h.value / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    asOf: positionsData.asOf || chartData.asOf,
    currency: positionsData.currency || chartData.currency || 'USD',
    total,
    stocks,
    months: chartData.months,
  };
}

function formatFooterDate(isoDate) {
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const REPORT_SCRIPT = `
    function investidor10Url(ticker) {
      const t = ticker.toLowerCase();
      if (/\\d$/.test(ticker)) return 'https://investidor10.com.br/acoes/' + t + '/';
      return 'https://investidor10.com.br/stocks/' + t + '/';
    }
    const fmt = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: DATA.currency || 'USD', maximumFractionDigits: 0 }).format(n);
    const fmtFull = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: DATA.currency || 'USD', minimumFractionDigits: 2 }).format(n);
    const fmtCents = n => {
      const str = fmtFull(n);
      const dot = str.lastIndexOf('.');
      if (dot === -1) return str;
      return str.slice(0, dot) + '<small class="money-cents">' + str.slice(dot) + '</small>';
    };
    document.getElementById('total').innerHTML = fmtCents(DATA.total);
    document.getElementById('meta').textContent = DATA.stocks.length + ' posições';
    document.getElementById('count').textContent = DATA.stocks.length;

    const months = DATA.months;
    const W = 640, H = 180, pad = { t: 28, r: 12, b: 8, l: 12 };
    const vals = months.map(m => m.value);
    const minV = Math.min(...vals) * 0.9;
    const maxV = Math.max(...vals) * 1.02;
    const x = i => pad.l + (i / (months.length - 1)) * (W - pad.l - pad.r);
    const y = v => pad.t + (1 - (v - minV) / (maxV - minV)) * (H - pad.t - pad.b);
    const points = months.map((m, i) => x(i) + ',' + y(m.value)).join(' ');
    const area = 'M ' + x(0) + ',' + H + ' L ' + points.split(' ').join(' L ') + ' L ' + x(months.length - 1) + ',' + H + ' Z';
    const tooltip = document.getElementById('chart-tooltip');
    const labelEls = [];
    let activeIdx = -1;

    function showMonth(i) {
      if (i === activeIdx) return;
      activeIdx = i;
      const m = months[i];
      const cx = x(i), cy = y(m.value);
      const svgEl = document.getElementById('chart-svg');
      const svgRect = svgEl.getBoundingClientRect();
      const scaleX = svgRect.width / W;
      const scaleY = svgRect.height / H;
      tooltip.innerHTML = '<div class="tt-month">' + m.label + '</div><div class="tt-value">' + fmtCents(m.value) + '</div>';
      tooltip.style.left = (cx * scaleX) + 'px';
      tooltip.style.top = (cy * scaleY - 10) + 'px';
      tooltip.classList.add('visible');
      document.getElementById('chart-line').setAttribute('x1', cx);
      document.getElementById('chart-line').setAttribute('x2', cx);
      document.querySelectorAll('.chart-dot').forEach((d, j) => d.classList.toggle('active', j === i));
      labelEls.forEach((el, j) => el.classList.toggle('active', j === i));
    }

    document.getElementById('chart').innerHTML =
      '<svg id="chart-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none">' +
      '<defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#2563eb" stop-opacity="0.15"/>' +
      '<stop offset="100%" stop-color="#2563eb" stop-opacity="0"/></linearGradient></defs>' +
      '<line id="chart-line" x1="0" y1="' + pad.t + '" x2="0" y2="' + (H - pad.b) + '" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="4 3" opacity="0"/>' +
      '<path d="' + area + '" fill="url(#grad)"/>' +
      '<polyline points="' + points + '" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      months.map((m, i) =>
        '<circle class="chart-hit" cx="' + x(i) + '" cy="' + y(m.value) + '" r="20" data-idx="' + i + '"/>' +
        '<circle class="chart-dot" cx="' + x(i) + '" cy="' + y(m.value) + '" r="4" fill="#fff" stroke="#2563eb" stroke-width="2" data-idx="' + i + '"/>'
      ).join('') + '</svg>';

    document.getElementById('chart-svg').querySelectorAll('.chart-hit, .chart-dot').forEach(el => {
      el.addEventListener('mouseenter', () => showMonth(+el.dataset.idx));
    });
    document.getElementById('chart-wrap').addEventListener('mouseleave', () => {
      activeIdx = -1;
      tooltip.classList.remove('visible');
      document.getElementById('chart-line').setAttribute('opacity', '0');
      document.querySelectorAll('.chart-dot').forEach(d => d.classList.remove('active'));
      labelEls.forEach(el => el.classList.remove('active'));
    });
    document.getElementById('chart-wrap').addEventListener('mouseenter', () => {
      document.getElementById('chart-line').setAttribute('opacity', '1');
    });
    const labelsContainer = document.getElementById('chart-labels');
    months.forEach((m, i) => {
      const span = document.createElement('span');
      span.textContent = m.label;
      span.addEventListener('mouseenter', () => showMonth(i));
      labelsContainer.appendChild(span);
      labelEls.push(span);
    });

    document.getElementById('stocks').innerHTML = DATA.stocks.map(s =>
      '<div class="stock">' +
        '<div class="logo"><img src="https://financialmodelingprep.com/image-stock/' + s.ticker + '.png" alt="' + s.ticker + '" onerror="this.style.display=\\'none\\';this.parentElement.textContent=\\'' + s.ticker.slice(0,2) + '\\'"></div>' +
        '<div class="stock-info"><div class="stock-top">' +
          '<a class="stock-name" href="' + investidor10Url(s.ticker) + '" target="_blank" rel="noopener noreferrer">' + s.name + '</a>' +
          '<span class="stock-ticker">' + s.ticker + '</span>' +
          '<span class="stock-qty">×' + s.qty + '</span>' +
        '</div></div>' +
        '<div class="stock-right"><div class="stock-value">' + fmtCents(s.value) + '</div>' +
        '<div class="stock-pct">' + s.pct + '%</div></div>' +
      '</div>'
    ).join('');
`.trim();
