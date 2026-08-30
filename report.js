function esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// ISO 8601 local date-time (YYYY-MM-DD HH:MM:SS) so the month and day are unambiguous.
function isoLocal(d){
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
         ' ' + p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
}

// Open a card's source page. Prefer the tab the crawl was launched from; fall back to
// any open sunnylink tab, then a new tab. This leaves the report itself untouched.
function focusTab(tabId, windowId, url) {
  chrome.tabs.update(tabId, { url, active: true });
  if (windowId != null) chrome.windows.update(windowId, { focused: true });
}
function reuseOrCreate(url) {
  chrome.tabs.query({ url: 'https://www.sunnylink.ai/*' }, tabs => {
    const t = (tabs || [])[0];
    if (t) focusTab(t.id, t.windowId, url); else chrome.tabs.create({ url });
  });
}
function openSource(url) {
  chrome.storage.local.get('sunnylinkOriginTab', d => {
    const origin = d.sunnylinkOriginTab;
    if (origin == null) { reuseOrCreate(url); return; }
    chrome.tabs.get(origin, tab => {
      if (chrome.runtime.lastError || !tab) { reuseOrCreate(url); return; }
      focusTab(tab.id, tab.windowId, url);
    });
  });
}

chrome.storage.local.get('sunnylinkReport', data => {
  const report = data.sunnylinkReport || {};
  const keys = Object.keys(report);
  const grid = document.getElementById('grid');
  const meta = document.getElementById('meta');
  if (!keys.length) {
    grid.innerHTML = '<div class="empty">No data yet. Visit the sunnylink dashboard settings pages first, then reopen this report.</div>';
    return;
  }
  // Cards can predate the running version, and an older one may simply be missing
  // settings this version knows how to reach, so say which version captured the data
  // rather than which one is displaying it.
  const running = chrome.runtime.getManifest().version;
  const stamps = Array.from(new Set(keys.map(k => report[k].version || 'older')));
  const current = stamps.length === 1 && stamps[0] === running;
  const stampText = stamps.map(v => v === 'older' ? 'an older version' : 'v' + v).join(', ');
  meta.textContent = 'Generated ' + isoLocal(new Date()) + ' \u2014 ' + keys.length +
                     ' page(s) scanned \u2014 captured by ' + (current ? 'v' + running : stampText);
  if (!current) {
    const stale = document.getElementById('stale');
    stale.textContent = stamps.length > 1
      ? 'This report mixes scans from different versions of the extension. Clear the saved data and ' +
        'crawl again so every page comes from v' + running + '.'
      : 'This report was captured by ' + stampText + '. You are now running v' + running +
        ', which may reach settings the older version could not. Crawl again for a complete report.';
    stale.hidden = false;
  }
  // Order cards to match the sunnylink left-hand menu (top-to-bottom); the grid then
  // fills left-to-right, top-to-bottom. Fall back to scan order for older reports
  // saved before the menu index existed.
  const ordered = keys.sort((a, b) => {
    const oa = report[a].order ?? 999, ob = report[b].order ?? 999;
    if (oa !== ob) return oa - ob;
    return String(report[a].updatedAt || '').localeCompare(String(report[b].updatedAt || ''));
  });
  grid.innerHTML = ordered.map(k => {
    const rowsHtml = report[k].rows.map(r => {
      const v = String(r.value).trim().toLowerCase();
      const cls = v === 'on' ? ' on' : v === 'off' ? ' off' : '';
      const trCls = r.disabled ? ' class="disabled"' : '';
      return `<tr${trCls}><td class="label">${esc(r.label)}</td><td class="value${cls}">${esc(r.value)}</td></tr>`;
    }).join('');
    const url = report[k].url;
    const title = url ? `<a href="${esc(url)}" class="src" data-url="${esc(url)}">${esc(k)}</a>` : esc(k);
    return `<div class="card"><h2>${title}</h2><table>${rowsHtml}</table></div>`;
  }).join('');

  grid.addEventListener('click', e => {
    const a = e.target.closest('a.src');
    if (!a) return;
    e.preventDefault();
    openSource(a.dataset.url);
  });
});