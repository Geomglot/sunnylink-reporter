function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Toolbar-badge progress. The popup closes the instant the crawl opens its active
// tab, so the badge is the only always-visible sign that the crawl is working.
function setBadge(text, color) {
  try {
    chrome.action.setBadgeText({ text: String(text).slice(0, 4) });
    if (color) chrome.action.setBadgeBackgroundColor({ color });
  } catch (e) {}
}

function waitForTabComplete(tabId) {
  return new Promise(resolve => {
    function check() {
      chrome.tabs.get(tabId, tab => {
        if (chrome.runtime.lastError) { resolve(); return; }
        if (tab.status === 'complete') resolve(); else setTimeout(check, 200);
      });
    }
    check();
  });
}

async function run(tabId, func, args = []) {
  try {
    const res = await chrome.scripting.executeScript({ target: { tabId }, func, args });
    return res && res[0] ? res[0].result : undefined;
  } catch (e) { return undefined; }
}

async function waitForReporter(tabId) {
  for (let i = 0; i < 20; i++) {
    if (await run(tabId, () => typeof window.__sunnylinkReporter !== 'undefined')) return true;
    // Halfway through, force-inject the content script in case the declarative
    // injection lost the race with the initial page load.
    if (i === 10) {
      try { await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] }); } catch (e) {}
    }
    await sleep(300);
  }
  return false;
}

// Settle, then scan. If nothing was captured (device still connecting), wait a bit
// and try once more before giving up on the page.
async function settleAndScan(tabId, settleMs = 12000) {
  await run(tabId, (ms) => window.__sunnylinkReporter.waitForSettle(ms), [settleMs]);
  let ok = await run(tabId, () => window.__sunnylinkReporter.scanAndSave());
  if (!ok) {
    await sleep(2500);
    await run(tabId, (ms) => window.__sunnylinkReporter.waitForSettle(ms), [6000]);
    ok = await run(tabId, () => window.__sunnylinkReporter.scanAndSave());
  }
  return ok;
}

// Which sub-panel overlay a path is showing, if any. Two paths that differ only by
// `?panel=` are the same page but a different view, so the pathname on its own can
// never tell us whether a hop has finished.
function panelOf(pathAndSearch) {
  const query = String(pathAndSearch || '').split('?')[1] || '';
  return new URLSearchParams(query).get('panel') || '';
}

// Client-side navigation: click an in-app link and wait for the SvelteKit router to
// land on the target path AND the target overlay state. Keeps the one warm device
// connection alive (a full reload would drop it and bounce us to /dashboard/devices).
async function spaGoto(tabId, targetPath) {
  await run(tabId, (p) => window.__sunnylinkReporter.navigateInPage(p), [targetPath]);
  const wantPath = targetPath.split('?')[0];
  const wantPanel = panelOf(targetPath);
  for (let i = 0; i < 25; i++) {
    // Always let the router have a tick first. Reading the location straight after
    // the click sees the state we are trying to leave, and the pathname still
    // matches while a sub-panel is open, so an immediate check reports "arrived"
    // before the overlay has closed -- and the next click then lands on nothing.
    await sleep(200);
    const path = await run(tabId, () => window.__sunnylinkReporter.currentPath());
    if (path && path.split('?')[0] === wantPath && panelOf(path) === wantPanel) return true;
  }
  return false;
}

async function crawlAll(sendProgress) {
  let scanned = 0;
  const progress = (msg) => { setBadge(String(scanned), '#4f46e5'); sendProgress(msg); };

  setBadge('...', '#4f46e5');
  // One cold load to establish the connection; every hop after this is client-side.
  const tab = await chrome.tabs.create({ url: 'https://www.sunnylink.ai/dashboard', active: true });
  const tabId = tab.id;

  await waitForTabComplete(tabId);
  let haveReporter = await waitForReporter(tabId);
  if (!haveReporter) { setBadge('err', '#dc2626'); progress('Could not load the scanner on the dashboard.'); return; }

  // A cold load has no active device and the app shows the device picker. Select the
  // first device so the settings pages become reachable.
  await run(tabId, () => window.__sunnylinkReporter.waitForSettle(6000));
  if (await run(tabId, () => window.__sunnylinkReporter.needsDeviceSelection())) {
    progress('Selecting device...');
    await run(tabId, () => window.__sunnylinkReporter.selectFirstDevice());
    await sleep(1500);
    await waitForReporter(tabId);
    await run(tabId, () => window.__sunnylinkReporter.waitForSettle(8000));
  }

  if (await settleAndScan(tabId)) scanned++;
  progress('Scanned Home');

  const topLinks = (await run(tabId, () => window.__sunnylinkReporter.discoverTopLevelLinks())) || [];

  for (const href of topLinks) {
    await spaGoto(tabId, href);
    if (await settleAndScan(tabId)) scanned++;
    progress('Scanned ' + href);

    const panels = (await run(tabId, () => window.__sunnylinkReporter.findSubPanels())) || [];
    for (const label of panels) {
      const clicked = await run(tabId, (l) => window.__sunnylinkReporter.clickSubPanel(l), [label]);
      if (!clicked) continue;
      // Wait for the overlay to actually come up before scanning; otherwise the scan
      // just re-records the page underneath and the sub-panel's settings are lost.
      const opened = await run(tabId, () => window.__sunnylinkReporter.waitForPanel(true));
      // Rows that cannot open a panel are filtered out before they are clicked, so
      // this is an anomaly rather than the normal locked/expandable case: note it
      // and move on rather than recording the page underneath a second time.
      if (!opened) { progress('No panel opened for ' + label); await spaGoto(tabId, href); continue; }
      if (await settleAndScan(tabId, 8000)) scanned++;
      progress('Scanned ' + href + ' → ' + label);
      await spaGoto(tabId, href); // close this overlay before opening the next one
    }
  }
  // Show the finished report in the crawl's own tab, then set the green OK badge LAST
  // so nothing overwrites it.
  try { await chrome.tabs.update(tabId, { url: chrome.runtime.getURL('report.html') }); } catch (e) {}
  sendProgress('Crawl complete (' + scanned + ' pages).');
  setBadge('OK', '#16a34a');
}

let crawling = false;
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'START_CRAWL') {
    if (crawling) { sendResponse({ ok: false, error: 'A crawl is already running.' }); return true; }
    crawling = true;
    if (msg.originTabId != null) chrome.storage.local.set({ sunnylinkOriginTab: msg.originTabId });
    crawlAll(status => chrome.runtime.sendMessage({ type: 'CRAWL_PROGRESS', status }).catch(() => {}))
      .then(() => { crawling = false; sendResponse({ ok: true }); })
      .catch(e => { crawling = false; setBadge('err', '#dc2626'); sendResponse({ ok: false, error: String(e) }); });
    return true;
  }
  if (msg && msg.type === 'CLEAR_BADGE') { setBadge('', '#4f46e5'); }
});
