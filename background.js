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

// Client-side navigation: click an in-app link and wait for the SvelteKit router to
// land on the target path. Keeps the one warm device connection alive (a full reload
// would drop it and get us bounced to /dashboard/devices).
async function spaGoto(tabId, targetPath) {
  await run(tabId, (p) => window.__sunnylinkReporter.navigateInPage(p), [targetPath]);
  for (let i = 0; i < 25; i++) {
    const path = await run(tabId, () => window.__sunnylinkReporter.currentPath());
    if (path && path.split('?')[0] === targetPath.split('?')[0]) return true;
    await sleep(200);
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
      await sleep(400);
      if (await settleAndScan(tabId, 8000)) scanned++;
      progress('Scanned ' + href + ' → ' + label);
      await spaGoto(tabId, href); // back to the page's base view before the next panel
    }
  }
  // Leave the tab back on Home, and set the green OK badge LAST so nothing overwrites it.
  await spaGoto(tabId, '/dashboard');
  sendProgress('Crawl complete (' + scanned + ' pages).');
  setBadge('OK', '#16a34a');
}

let crawling = false;
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === 'START_CRAWL') {
    if (crawling) { sendResponse({ ok: false, error: 'A crawl is already running.' }); return true; }
    crawling = true;
    crawlAll(status => chrome.runtime.sendMessage({ type: 'CRAWL_PROGRESS', status }).catch(() => {}))
      .then(() => { crawling = false; sendResponse({ ok: true }); })
      .catch(e => { crawling = false; setBadge('err', '#dc2626'); sendResponse({ ok: false, error: String(e) }); });
    return true;
  }
  if (msg && msg.type === 'CLEAR_BADGE') { setBadge('', '#4f46e5'); }
});
