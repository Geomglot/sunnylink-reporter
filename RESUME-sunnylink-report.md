# RESUME: sunnylink-reporter (session: sunnylink-report)

Project home: /Users/hugh/Library/Mobile Documents/com~apple~CloudDocs/OpenpilotTools/sunnylink-reporter. If that is not your working directory, STOP and say so before doing anything.

## What this is

A Chrome MV3 extension that compiles a read-only report of your own sunnylink.ai
device settings, either as you browse or via a one-click auto-crawl. All data stays
in `chrome.storage.local`. Repo and Chrome Web Store listing are both public.

## CURRENT STATE (2026-08-27)

v1.5.0 is committed, tagged and pushed to `main` (`11661db`, tag `v1.5.0`). Working
tree clean, nothing unpushed. Geomglot tested the build and confirmed it good.

**Not yet submitted to the Chrome Web Store.** `sunnylink-reporter-1.5.0.zip` is
built from the pushed tree and sits in the project root (gitignored, local only).
That upload is the one outstanding piece of the release.

v1.5.0 fixes sub-panel capture. The bug: `spaGoto` compared only the pathname, but a
sub-panel shares its parent's pathname and differs only by `?panel=`, so "go back to
base" returned instantly with the panel still open and the next panel click was
swallowed by the pending navigation. Only the first sub-panel on any page was ever
captured; Lane Centering settings never appeared at all. Diagnosed and verified
against the live dashboard via Chrome automation, not by reasoning alone.

Four DOM facts about the dashboard were established by inspection and now drive the
crawl (all documented in code comments in `content.js`):

- An open sub-panel marks the page beneath it `inert`. That is the exact boundary
  for scoping a scan to just the panel.
- A row that opens a sub-panel carries `row-press` and a static chevron.
- A row that expands in place (Models x8, Maps "Canada", Vehicle "View details") has
  a chevron carrying `transition-transform`. Zero overlap with the above across all
  11 settings pages.
- A sub-panel locked by a switched-off parent setting is a real `disabled` button,
  not just a dimmed one.

Because locked and expanding rows are filtered before any click, every row the crawl
now clicks opens on the first 100ms poll. The 5s `waitForPanel` timeout is a
stuck-page safety net with ~50x headroom, not a tuned value.

## Session log

**Session 1 (2026-08-25 to 08-27).** Reported symptom: Lane Centering settings in the
Steering sub-menu were never captured. Root-caused the `spaGoto` pathname-comparison
race on the live site; fixed it plus panel-scan scoping via `[inert]`; hardened
sub-panel row detection to read the row's own label rather than every word in the
button. Built and then removed an "unavailable card" feature for locked panels at
Geomglot's request (it produced 8 empty cards on Models); investigating that revealed
the Models rows were never locked panels at all but accordions, leading to the
attribute-based filtering above. Added `CHANGELOG.md`, updated `README.md` for the
now-public repo and store listing, bumped to 1.5.0, restored version tagging (it had
lapsed after v1.2.0; v1.3.0/v1.4.0 already existed on the remote). Rebased onto a
remote commit where Geomglot had made the same README edit independently.

## OPEN LOOPS

- **Chrome Web Store submission for 1.5.0 is not done.** Zip is built and current.
  Upload at the developer dashboard, item `bbjdimjmoeppaeaakjlbglibidijoiho`.
  Listing is now **Public**, not Unlisted, so leave visibility alone and expect a
  slower review than previous unlisted submissions.
- **Store "What's new" text is drafted but saved nowhere but here.** Chrome Web Store
  has no release-notes field, so it goes at the top of the Description, and the
  description edit must go in the *same* submission as the zip or it queues a second
  review. Draft:

  > What's new in 1.5.0
  > Settings inside sub-panels were going missing from reports. Pages such as
  > Steering hold several sub-panels and only the first was ever captured, so
  > Lane Centering settings never appeared at all. All sub-panels are now
  > captured, each showing only its own settings, and the crawl is faster.
  >
  > If you used an earlier version, clear your saved report and crawl again.
  > Full changelog: https://github.com/Geomglot/sunnylink-reporter/blob/main/CHANGELOG.md

- **`PRIVACY.md` has not been reviewed since the listing went public.** Flagged but
  never actually read this session. Reviewers do read it. Worth a pass before
  submitting.
- **Two copies of the extension may be installed** (unpacked local + Web Store). They
  produce two toolbar icons and it is easy to crawl with the stale one. Once the
  store update lands, unload one.
- **Not verified:** whether the Web Store dashboard has gained a release-notes field
  since. Assumed absent based on knowledge to May 2026. Cheap to check while there.

## NEXT UP (proposed agenda for session 2 - a default to present, not authorization)

1. Submit 1.5.0 to the Chrome Web Store: read `PRIVACY.md` first, then upload the zip
   and update the description in one submission.
2. If Geomglot would rather not do the store step yet, the standing code item is the
   `sectionName()` casing mismatch noted below.

Waiting on Geomglot's word before any of this.

Known-but-unfixed, no agreement to act: `sectionName()` derives a sub-panel's card
title from the URL panel id, so `mads_settings` titlecases to "Mads Settings" while
the row itself reads "MADS Settings". Harmless today. It only bites if a card key is
ever generated from the row label instead of the panel id.

## TO RESUME

Use the opener in the section below of the session that produced this file, or:

```
Working directory must be /Users/hugh/Library/Mobile Documents/com~apple~CloudDocs/OpenpilotTools/sunnylink-reporter (verify with pwd before anything else; if it differs, STOP and tell me). Read RESUME-sunnylink-report.md and CLAUDE.md, run `for f in *.js; do node --check "$f" || echo "FAILED: $f"; done` to confirm green, then STOP: brief me on state, present next-step options with RESUME's NEXT UP as the marked default, and wait for my word. Build nothing until I answer; anything I wrote below this opener counts as that answer.
```
