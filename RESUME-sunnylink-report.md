# RESUME: sunnylink-reporter (session: sunnylink-report)

Project home: /Users/hugh/Library/Mobile Documents/com~apple~CloudDocs/OpenpilotTools/sunnylink-reporter. If that is not your working directory, STOP and say so before doing anything.

## What this is

A Chrome MV3 extension that compiles a read-only report of your own sunnylink.ai
device settings, either as you browse or via a one-click auto-crawl. All data stays
in `chrome.storage.local`. Repo and Chrome Web Store listing are both public.

## CURRENT STATE (2026-08-27, updated)

v1.6.0 is committed, tagged and pushed to `main` (`74e2f6b`, tag `v1.6.0`). Working
tree clean, nothing unpushed. Geomglot tested it and confirmed it ships as is.
`sunnylink-reporter-1.6.0.zip` is built from the pushed tree and sits in the project
root (gitignored, local only). The earlier 1.5.0 zip was deleted so the wrong package
cannot be uploaded by mistake.

**v1.5.0 published on the Chrome Web Store on 2026-08-27. v1.6.0 was uploaded and
submitted for review the same day,** with its "What's new" description block in the
same submission. Repo and store are now in step apart from that pending review;
nothing further is needed unless review comes back with questions.

v1.6.0 records the extension version against each page as it is scanned and shows it
on the report, with a notice when a report's pages did not all come from the running
version. The stamp is taken at capture time rather than read at display time, because
saved data outlives an update and a pre-1.5.0 report is missing settings later
versions can reach.

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
remote commit where Geomglot had made the same README edit independently. Closed by
submitting 1.5.0 to the Chrome Web Store on 2026-08-27; review outcome not yet known
at the time of writing. Then added version stamping: the report names the version
that captured it and the popup shows the installed version, released as v1.6.0. Both releases went to the Chrome Web Store on 2026-08-27:
v1.5.0 published, v1.6.0 submitted and awaiting review.

## OPEN LOOPS

- **v1.6.0 review outcome not yet known.** Submitted 2026-08-27, item
  `bbjdimjmoeppaeaakjlbglibidijoiho`. Check whether it published or came back with
  questions; once it publishes, confirm the popup shows v1.6.0. The description text
  that went up with it, kept as the template for the next release:

  > What's new in 1.6.0
  > Reports now say which version of the extension captured them, and the toolbar
  > popup shows the version you have installed. If a report was gathered by an older
  > version, or mixes scans from several, it now tells you and suggests crawling
  > again. This matters because a saved report outlives an update: one gathered
  > before 1.5.0 is missing settings that later versions can reach.
  >
  > Full changelog: https://github.com/Geomglot/sunnylink-reporter/blob/main/CHANGELOG.md

- **`PRIVACY.md` was never reviewed** against the now-public listing. It was flagged
  before submission but not read. If review comes back querying privacy disclosures,
  start there.
- **Two copies of the extension may be installed** (unpacked local + Web Store). They
  produce two toolbar icons and it is easy to crawl with the stale one. Once the store
  update publishes, unload the unpacked copy.

## NEXT UP (proposed agenda for session 2 - a default to present, not authorization)

1. Confirm v1.6.0 published, then unload the unpacked copy so crawls cannot run
   against a stale build.
2. Standing code item, whenever the store side is settled: the `sectionName()` casing
   mismatch noted below. Small, and nothing depends on it.

Nothing is in flight beyond the review itself. If it published cleanly, this project
is at a natural resting point.

Waiting on Geomglot's word before any of this.

Known-but-unfixed, no agreement to act: `sectionName()` derives a sub-panel's card
title from the URL panel id, so `mads_settings` titlecases to "Mads Settings" while
the row itself reads "MADS Settings". Harmless today. It only bites if a card key is
ever generated from the row label instead of the panel id.

## TO RESUME

Paste this into a fresh session:

```
Working directory must be /Users/hugh/Library/Mobile Documents/com~apple~CloudDocs/OpenpilotTools/sunnylink-reporter (verify with pwd before anything else; if it differs, STOP and tell me). Read RESUME-sunnylink-report.md and CLAUDE.md, run `for f in *.js; do node --check "$f" || echo "FAILED: $f"; done` to confirm green, then STOP: brief me on state, present next-step options with RESUME's NEXT UP as the marked default, and wait for my word. Build nothing until I answer; anything I wrote below this opener counts as that answer.
```
