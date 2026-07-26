# Sunnylink Settings Reporter

A private Chrome extension (Manifest V3) that compiles a read-only report of your
own device settings from the [sunnylink.ai](https://www.sunnylink.ai) dashboard.

It scans each settings page - either as you browse, or via a one-click auto-crawl -
and builds a single compiled report of every switch, dropdown and slider value. All
data stays on your machine in `chrome.storage.local`; nothing is transmitted anywhere.
See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

---

## Install from the Chrome Web Store (recommended)

**[Add to Chrome](https://chromewebstore.google.com/detail/bbjdimjmoeppaeaakjlbglibidijoiho)**

Open that link in desktop Chrome (or another Chromium browser such as Brave, Vivaldi
or Opera) and click **Add to Chrome**. The extension is unlisted - it will not appear
in store search, but anyone with this link can install it, and updates arrive
automatically. Then pin the toolbar icon (see below) and open the **Instructions**
button in the popup.

---

## Install (unpacked, for development)

1. Keep all files together in one folder (this repo).
2. Open Chrome and go to `chrome://extensions`.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select this folder.
   - If it is already loaded, click the **reload icon** on the extension's card to
     pick up any changes.

### Making the toolbar icon appear

Chrome does **not** automatically pin newly loaded extensions to the toolbar - they
stay inside the puzzle-piece (Extensions) menu until you pin them:

1. Click the **puzzle-piece icon** near the top-right of Chrome.
2. Find **Sunnylink Settings Reporter** in the list.
3. Click the **pin** icon next to it.

You can always open the popup from the puzzle-piece menu even without pinning.

---

## Usage

Log into sunnylink.ai as normal, then either:

- **Browse manually** - visit each settings page (Device, Toggles, Models, Steering,
  Cruise, Visuals, Display, Vehicle, Software, Developer, plus sub-panels such as MADS
  Settings). The extension quietly scans each page a couple of seconds after it loads.

- **Auto-crawl** - click the toolbar icon and press **Crawl All Pages**. A new tab
  opens on the dashboard (selecting your device automatically if the app asks), then
  steps through Home and every settings page found in the sidebar, drilling into any
  sub-panel rows (the full-width rows with a chevron, e.g. MADS / Torque Settings). It
  navigates **inside the app** (client-side) rather than reloading each page, so the
  live link to your device stays connected throughout. The crawl takes roughly
  30-60 seconds and uses one visible tab - Manifest V3 extensions cannot browse fully
  in the background. When finished it loads the compiled report in that same tab.

  Watch the **toolbar badge** for progress: `...` while starting, a rising count as
  pages are captured, a green **OK** when done (red **err** if it could not start).

When it finishes, click **Open Full Report** to see everything compiled. In the report,
values of **On** are shown in green and **Off** in red for quick scanning. Use
**Clear Saved Data** to start over.

---

## Popup actions

| Button | What it does |
|--------|--------------|
| **Crawl All Pages** | Auto-visits and scans every settings page (see above). |
| **Rescan Current Page** | Re-scans the sunnylink tab you are currently on. |
| **Open Full Report** | Opens the compiled report in a new tab. |
| **Clear Saved Data** | Deletes the stored report. |

---

## How it works

- `content.js` - runs on `sunnylink.ai/dashboard*`. Finds settings rows by their
  control (`role="switch"` / `role="combobox"` / sliders) inside the page's `<main>`
  area and reads the row's `font-medium` label. Exposes helpers on
  `window.__sunnylinkReporter` for the crawler.
- `background.js` - the service worker that drives **Crawl All Pages**: one cold load
  to establish the device connection, then client-side (SPA) navigation between pages
  to keep that connection warm, with device auto-selection recovery and toolbar-badge
  progress.
- `popup.html` / `popup.js` - the toolbar popup.
- `report.html` / `report.js` - the compiled report view.

---

## Limitations

- The extractor keys off the dashboard's current markup. A large future visual redesign
  of sunnylink could require updating the selectors in `content.js`.
- The crawl needs one visible tab for its duration; do not close that tab while it runs.
- If a page's live values have not arrived yet (device briefly offline / connecting),
  that page is skipped rather than recorded as "Connecting..." - just re-crawl, or
  browse that page manually, once the device is online.
