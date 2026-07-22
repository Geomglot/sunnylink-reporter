function esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
chrome.storage.local.get('sunnylinkReport', data => {
  const report = data.sunnylinkReport || {};
  const keys = Object.keys(report);
  const grid = document.getElementById('grid');
  const meta = document.getElementById('meta');
  if (!keys.length) {
    grid.innerHTML = '<div class="empty">No data yet. Visit the sunnylink dashboard settings pages first, then reopen this report.</div>';
    return;
  }
  meta.textContent = 'Generated ' + new Date().toLocaleString() + ' \u2014 ' + keys.length + ' page(s) scanned';
  grid.innerHTML = keys.sort().map(k => {
    const rowsHtml = report[k].rows.map(r => {
      const v = String(r.value).trim().toLowerCase();
      const cls = v === 'on' ? ' on' : v === 'off' ? ' off' : '';
      return `<tr><td class="label">${esc(r.label)}</td><td class="value${cls}">${esc(r.value)}</td></tr>`;
    }).join('');
    return `<div class="card"><h2>${esc(k)}</h2><table>${rowsHtml}</table></div>`;
  }).join('');
});