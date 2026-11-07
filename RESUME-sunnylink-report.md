# RESUME: sunnylink-reporter (session: sunnylink-report)

Project home: /Users/hugh/sunnylink-reporter. If that is not your working directory, STOP and say so before doing anything.

## What this is

A Chrome MV3 extension that compiles a read-only report of your own sunnylink.ai
device settings, either as you browse or via a one-click auto-crawl. All data stays
in `chrome.storage.local`. Repo and Chrome Web Store listing are both public.

## CURRENT STATE (2026-11-07)

v1.6.1 is committed, tagged and pushed to `main` (`2cc44f6`, tag `v1.6.1`). Working
tree clean apart from this handoff, nothing unpushed. Geomglot tested the unpacked
build and confirmed the Maps card appears. `sunnylink-reporter-1.6.1.zip` is built
from the pushed tree and sits in the project root (gitignored, local only); the 1.6.0
zip was deleted so the wrong package cannot be uploaded by mistake.

**v1.6.1 was uploaded to the Chrome Web Store by Geomglot (confirmed 2026-11-07).**
Recorded here as submitted; whether review has passed and it is live was not stated.

v1.6.1 adds the Maps page (`/dashboard/osm`) to the report. That page has no
switches, dropdowns or sliders, so the control-based scanner found zero rows and
`scanAndSave` silently dropped it. `extractCurrentMap()` in `content.js` now reads the
"Current Map" heading's following card: first line -> "Current Map" (e.g.
"Canada - All"), second line -> "Map Status" (e.g. "Downloading 738/765"). The
Country picker is a download form, deliberately ignored. Same pattern as
`extractVehicleModel()`.

Caveat: only the "downloading" layout of that card was seen live. The finished and
no-map-installed layouts were not observed.

Earlier releases, for context: v1.6.0 stamps the capturing extension version on each
page and warns on mixed-version reports. v1.5.0 fixed sub-panel capture (`spaGoto`
compared pathname only, but sub-panels differ only by `?panel=`).

DOM facts about the dashboard that drive the crawl (documented in `content.js`):

- An open sub-panel marks the page beneath it `inert`; scans skip inert content.
- A row that opens a sub-panel carries `row-press` and a static chevron.
- A row that expands in place (Models x8, Vehicle "View details") has a chevron
  carrying `transition-transform`. The 2026-08 notes also listed Maps "Canada" here;
  on 2026-11-07 the Maps page showed "Canada - All" as a static info card instead, so
  the Maps page has likely been redesigned since.
- A sub-panel locked by a switched-off parent setting is a real `disabled` button.
- Pages with no recognised controls produce no card at all. Any other page that
  shows only information boxes would be silently missing in the same way Maps was.

## Session log

**Session 1 (2026-08-25 to 08-27).** Fixed sub-panel capture (spaGoto race, `[inert]`
scoping, attribute-based row filtering); added CHANGELOG, restored tagging; released
v1.5.0 (published) and v1.6.0 (version stamping, submitted for review).

**Session 2 (2026-11-07).** Reported: Maps screen not reported. Inspected the live
page via Chrome automation, found it has no controls, added `extractCurrentMap()`,
tested the logic live, Geomglot verified the unpacked build. Released v1.6.1 (commit,
tag, push, zip). Geomglot then uploaded 1.6.1 to the Chrome Web Store.

## OPEN LOOPS

- **Maps card in other states is unverified.** Once the device's Canada download
  finishes, rescan Maps and confirm both rows still read sensibly. Also untested: no
  map installed.
- **"Map Status" is a snapshot** (a mid-download count goes stale). Kept deliberately
  so the report shows whether maps are fully installed; Geomglot was offered dropping
  it and did not ask to.
- **`PRIVACY.md` was never reviewed** against the public listing. Start there if store
  review queries privacy disclosures.
- **Two copies of the extension may be installed** (unpacked + store). Once the store
  update publishes, unload the unpacked copy.

## NEXT UP (proposed agenda for session 3 - a default to present, not authorization)

1. Once v1.6.1 is live on the store, unload the unpacked copy.
2. Rescan Maps after the download completes; adjust `extractCurrentMap()` if the
   finished layout differs.
3. Optional idea, needs Geomglot's agreement: sweep all settings pages for others that
   render zero rows (same failure shape as Maps) so none are silently missing.
4. Standing small item: `sectionName()` titlecases panel ids, so `mads_settings` shows
   "Mads Settings" while the row reads "MADS Settings". Harmless today.

Waiting on Geomglot's word before any of this.

## TO RESUME

Paste this into a fresh session:

```
Working directory must be /Users/hugh/sunnylink-reporter (verify with pwd before anything else; if it differs, STOP and tell me). Read RESUME-sunnylink-report.md and CLAUDE.md, run `for f in *.js; do node --check "$f" || echo "FAILED: $f"; done` to confirm green, then STOP: brief me on state, present next-step options with RESUME's NEXT UP as the marked default, and wait for my word. Build nothing until I answer; anything I wrote below this opener counts as that answer.
```
