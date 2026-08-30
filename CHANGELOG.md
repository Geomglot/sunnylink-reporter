# Changelog

## 1.6.0

- **The report now says which version of the extension captured it.** The version is
  recorded against each page as it is scanned, not read when the report is opened, so
  a report always names the version that actually gathered the values.
- **A report built from more than one version says so.** Because a newer version can
  reach settings an older one could not, a mixed report warns you and suggests
  clearing the saved data and crawling again.
- **The toolbar popup shows the installed version** beside its title.

## 1.5.0

**Sub-panel settings are captured properly. If you have used an earlier version,
your saved report is almost certainly missing settings - clear it and crawl again.**

- **Every sub-panel is now captured, not just the first one on each page.** Pages
  like Steering hold several sub-panels (MADS Settings, Lane Centering Settings,
  Torque Settings). Only the first one was ever recorded: the crawl moved on to the
  next one before the previous panel had closed, so the click landed on nothing and
  the parent page was quietly scanned a second time instead. Lane Centering settings,
  for example, never appeared in a report at all.
- **Each sub-panel card now shows only its own settings.** Previously a sub-panel was
  scanned through to the page behind it, so its card repeated every setting from its
  parent page.
- **Rows that cannot open a panel are no longer clicked at all.** The Models page
  lists eight model groups that expand in place rather than opening a panel, and
  Maps and Vehicle have one each. The crawl used to click every one of them and wait.
  It now tells the two kinds of row apart from the markup - a row that expands has a
  chevron that rotates, a row that opens a panel does not - so those pages no longer
  slow the crawl down or clutter the report.
- **Sub-panels locked by a switched-off parent setting are skipped cleanly.** Torque
  Settings while Enforce Torque Lateral Control is off, for example. These rows are
  marked disabled in the page itself, so they are recognised without being clicked.
- **Sub-panel rows are recognised more reliably.** Rows are identified by their own
  label rather than by every word inside the row, so a panel will not disappear from
  the crawl if the dashboard later adds a description or a badge to its row.

## 1.4.0

- Dropped the `tabs` permission, which caused Chrome to show a "Read your browsing
  history" warning at install. It was never needed. No change to what the extension
  does.

## 1.3.0

- Report cards are ordered to match the sunnylink left-hand menu.
- Locked (greyed-out) settings are shown in a paler colour.
- Slider values and the detected vehicle model are captured.
- The finished report opens in the crawl's own tab when the crawl ends.
- Added an Instructions button and help page to the popup.
- Each report card title links back to the page it came from.
- The Generated timestamp uses ISO 8601 (YYYY-MM-DD HH:MM:SS).

## 1.2.0

- Added the privacy policy.

## 1.1.0 and earlier

- Initial release: scan sunnylink.ai settings pages as you browse, or crawl them all
  in one click, and compile the values into a single local report.
