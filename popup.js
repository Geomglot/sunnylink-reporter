function refreshList() {
  chrome.storage.local.get('sunnylinkReport', data => {
    const report = data.sunnylinkReport || {};
    const keys = Object.keys(report);
    const list = document.getElementById('list');
    if (!keys.length) {
      list.className = 'empty';
      list.textContent = 'No pages scanned yet. Browse the dashboard, or click "Crawl All Pages".';
      return;
    }
    list.className = '';
    list.innerHTML = '<ul>' + keys.map(k =>
      `<li><span>${k}</span><span>${report[k].rows.length} settings</span></li>`).join('') + '</ul>';
  });
}

document.getElementById('crawl').addEventListener('click', () => {
  const btn = document.getElementById('crawl');
  const status = document.getElementById('status');
  btn.disabled = true;
  status.textContent = 'Starting crawl \u2014 a new tab will open and browse automatically...';
  // Remember the tab the crawl was launched from, so report links can reuse it.
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const originTabId = tabs && tabs[0] ? tabs[0].id : null;
    chrome.runtime.sendMessage({ type: 'START_CRAWL', originTabId }, res => {
      btn.disabled = false;
      status.textContent = res && res.ok ? 'Crawl complete.' : 'Crawl stopped early \u2014 check the report for what was captured.';
      refreshList();
    });
  });
});

chrome.runtime.onMessage.addListener(msg => {
  if (msg && msg.type === 'CRAWL_PROGRESS') {
    const status = document.getElementById('status');
    if (status) status.textContent = msg.status;
  }
});

document.getElementById('rescan').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs[0];
    if (!tab || !tab.url || !tab.url.startsWith('https://www.sunnylink.ai/')) {
      alert('Open a sunnylink.ai dashboard page first.');
      return;
    }
    chrome.tabs.sendMessage(tab.id, { type: 'RESCAN' }, () => setTimeout(refreshList, 1200));
  });
});

document.getElementById('report').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('report.html') });
});

document.getElementById('instructions').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('instructions.html') });
});

document.getElementById('clear').addEventListener('click', () => {
  chrome.storage.local.remove('sunnylinkReport', refreshList);
});

document.getElementById('ver').textContent = 'v' + chrome.runtime.getManifest().version;

chrome.runtime.sendMessage({ type: 'CLEAR_BADGE' }).catch(() => {});
refreshList();