/**
 * Trigger browser download of HTML string.
 * @param {string} html
 * @param {string} filename
 */
export function downloadHtml(html, filename) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * @param {string} [dateIso] YYYY-MM-DD
 */
export function walletFilename(dateIso) {
  const d = dateIso || new Date().toISOString().slice(0, 10);
  return `carteira-${d}.html`;
}
