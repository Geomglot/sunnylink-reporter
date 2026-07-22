(function () {
  function esc(s) { return (s || '').replace(/\s+/g, ' ').trim(); }

  function contentScope() { return document.querySelector('main') || document.body; }

  function sectionName() {
    const path = location.pathname;
    const panel = new URLSearchParams(location.search).get('panel');
    const base = (document.title || path).replace(/^sunnylink\s*-\s*/i, '');
    if (!panel) return base;
    const panelLabel = panel.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return `${base} → ${panelLabel}`;
  }

  // Given a control element, climb to its settings-row container and read the
  // row's label. The redesigned dashboard lays each row out as a
  // `justify-between` flex box: label text on the left, control on the right.
  function labelForControl(ctrl) {
    let row = ctrl;
    for (let i = 0; i < 7 && row; i++) {
      row = row.parentElement;
      if (!row) break;
      if (/justify-between/.test(row.className || '') &&
          row.querySelectorAll('[role="switch"],[role="combobox"],[role="radio"]').length <= 1) break;
    }
    if (!row) return '';
    // The label is the first font-medium text element (a <button> or <span>) or a heading.
    const labelEl = row.querySelector('button[class*="font-medium"],[class*="font-medium"],h1,h2,h3,h4');
    return esc(labelEl ? labelEl.textContent : '');
  }

  // A value that is empty or still a live-link placeholder ("Connecting...") is not
  // a real setting value and must never be recorded.
  function isPlaceholder(value) {
    return !value || /^connecting|^loading|^—$|^-$/i.test(value);
  }

  function extractRows() {
    const rows = [];
    const used = new Set();
    const scope = contentScope();

    // Switches, dropdowns (combobox) and radios all report their value directly.
    scope.querySelectorAll('[role="switch"],[role="combobox"],[role="radio"]').forEach(ctrl => {
      if (used.has(ctrl)) return;
      used.add(ctrl);
      const label = labelForControl(ctrl);
      const role = ctrl.getAttribute('role');
      let value;
      if (role === 'switch') value = ctrl.getAttribute('aria-checked') === 'true' ? 'On' : 'Off';
      else value = esc(ctrl.textContent);
      if (label && !isPlaceholder(value)) rows.push({ label, value });
    });

    // Sliders / numeric steppers render their current value in a tabular-nums span.
    scope.querySelectorAll('[class*="tabular-nums"]').forEach(sl => {
      const label = labelForControl(sl);
      const value = esc(sl.textContent);
      if (label && !isPlaceholder(value) && !rows.some(r => r.label === label)) rows.push({ label, value });
    });

    // Legacy device pages used a <dl>/<dt> description list. Keep support in case
    // any page still ships one; harmless when there are none.
    const dts = scope.querySelectorAll('dt');
    if (dts.length) {
      const h1 = scope.querySelector('h1');
      if (h1) rows.unshift({ label: 'Device Model', value: esc(h1.textContent) });
      dts.forEach(dt => {
        const v = dt.nextElementSibling ? esc(dt.nextElementSibling.textContent) : '';
        if (!isPlaceholder(v)) rows.push({ label: esc(dt.textContent), value: v });
      });
    }

    const seen = new Set();
    return rows.filter(r => {
      const key = r.label + '|' + r.value;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // The dashboard shows "Connecting..." placeholders (and skeleton loaders) until it
  // finishes pulling live values from the device. Wait until the control count is
  // stable AND those placeholders are gone, so a scan captures real values -- but
  // never wait past maxMs, so an offline device can't hang the crawl forever.
  function isLoading() {
    const scope = contentScope();
    if (scope.querySelector('[aria-busy="true"],[class*="animate-pulse"],[class*="skeleton"]')) return true;
    return /connecting\.?\.?\.?/i.test(scope.innerText || '');
  }

  function waitForSettle(maxMs = 12000) {
    return new Promise(resolve => {
      let lastCount = -1, stableTicks = 0;
      const start = Date.now();
      const timer = setInterval(() => {
        const count = document.querySelectorAll('[role="switch"],[role="combobox"],[role="radio"],[class*="tabular-nums"],dt').length;
        stableTicks = count === lastCount ? stableTicks + 1 : 0;
        lastCount = count;
        const settled = stableTicks >= 2 && !isLoading();
        if (settled || Date.now() - start > maxMs) { clearInterval(timer); resolve(); }
      }, 400);
    });
  }

  // Sub-panel rows in the redesign are full-width buttons carrying a chevron icon
  // (e.g. "MADS Settings", "Torque Settings") that push a `?panel=...` URL.
  // Scope to the main content area so sidebar/header rows (Search, Pair Device,
  // the account menu) are excluded, and keep a denylist as a second safety net.
  const DENY = /disable|delete|remove|reset|clear|exit|download|update|logout|sign.?out|pair|migrat|search settings|select\b/i;

  function subPanelButtons() {
    return Array.from(contentScope().querySelectorAll('button'))
      .filter(b => /w-full/.test(b.className || '') &&
                   b.getAttribute('role') !== 'switch' &&
                   !/tabular-nums/.test(b.className || '') &&
                   b.querySelector('svg'));
  }

  function findSubPanels() {
    return subPanelButtons()
      .map(b => esc(b.textContent))
      .filter(t => t && t.length < 40 && !DENY.test(t));
  }

  function clickSubPanel(label) {
    const btn = subPanelButtons().find(b => esc(b.textContent) === label);
    if (btn) { btn.click(); return true; }
    return false;
  }

  // Navigate WITHOUT a full page reload, so the app keeps its one warm live link to
  // the device. A full reload (chrome.tabs.update) drops that link, and SvelteKit's
  // route guard then bounces us to /dashboard/devices and shows "Connecting..."
  // placeholders. Clicking an in-app <a> lets SvelteKit's client router handle it.
  function navigateInPage(href) {
    let a = document.querySelector('a[href="' + href + '"]');
    if (!a) {
      // Synthesize an anchor so the SvelteKit client router still intercepts it.
      a = document.createElement('a');
      a.href = href;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();
      return true;
    }
    a.click();
    return true;
  }

  // Adaptive discovery of top-level settings pages straight from the sidebar links.
  function discoverTopLevelLinks() {
    const EXCLUDE = new Set(['/dashboard', '/dashboard/devices']);
    const set = new Set();
    document.querySelectorAll('a[href^="/dashboard"]').forEach(a => {
      const href = a.getAttribute('href');
      // Skip device-detail deep links (per-device UUID paths), keep settings pages.
      if (href && !EXCLUDE.has(href) && !/\/dashboard\/devices\//.test(href)) set.add(href);
    });
    return Array.from(set);
  }

  // A cold page load has no active device, so the app bounces to the device picker
  // (/dashboard/devices) and the settings sidebar is empty. Detect that state...
  function needsDeviceSelection() {
    return /\/dashboard\/devices\/?$/.test(location.pathname) || discoverTopLevelLinks().length === 0;
  }

  // ...and recover by clicking the first device card, which selects it and reveals
  // the settings pages. Device cards are role="button" rows carrying the dongle id.
  function selectFirstDevice() {
    const cards = Array.from(contentScope().querySelectorAll('[role="button"]'))
      .filter(e => /cursor-pointer/.test(e.className || ''));
    const card = cards.find(e => /[0-9a-f]{12,}/i.test(e.textContent)) || cards[0];
    if (card) { card.click(); return true; }
    return false;
  }

  function scanAndSave() {
    const rows = extractRows();
    if (!rows.length) return Promise.resolve(false);
    const key = sectionName();
    return new Promise(resolve => {
      chrome.storage.local.get('sunnylinkReport', data => {
        const report = data.sunnylinkReport || {};
        report[key] = { rows, updatedAt: new Date().toISOString(), url: location.href };
        chrome.storage.local.set({ sunnylinkReport: report }, () => resolve(true));
      });
    });
  }

  function currentPath() { return location.pathname + location.search; }

  window.__sunnylinkReporter = { extractRows, waitForSettle, findSubPanels, clickSubPanel, discoverTopLevelLinks, needsDeviceSelection, selectFirstDevice, navigateInPage, currentPath, scanAndSave, sectionName };

  // Still auto-scans when you just browse normally.
  waitForSettle(8000).then(scanAndSave);

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'RESCAN') {
      waitForSettle(4000).then(scanAndSave).then(() => sendResponse({ ok: true }));
      return true;
    }
  });
})();
