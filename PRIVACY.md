# Privacy Policy - Sunnylink Settings Reporter

_Last updated: 2026-07-22_

Sunnylink Settings Reporter ("the extension") is a personal, read-only tool that
compiles a report of your own device settings shown on the sunnylink.ai dashboard.

## What the extension accesses

- **Settings values displayed on `https://www.sunnylink.ai/dashboard` pages** that you
  are already logged into - the labels and current values of switches, dropdowns and
  sliders (for example "Enable sunnypilot: On"). It reads what is already visible on the
  page in your own authenticated session.

The extension does **not** read your login credentials, authentication tokens, cookies,
browsing history, or any page outside `https://www.sunnylink.ai/`.

## How the data is used and stored

- The compiled report is saved **locally on your device** using the browser's
  `chrome.storage.local` storage.
- It is used only to display the report back to you inside the extension.
- The data **never leaves your browser**. The extension does not send, upload, sync,
  share, or sell any data to the developer or to any third party. There are no analytics,
  no tracking, and no remote servers.

## Removing your data

- Click **Clear Saved Data** in the extension popup to delete the stored report at any
  time. Removing (uninstalling) the extension also deletes its stored data.

## Permissions

- `storage` - to save the compiled report locally on your device.
- `scripting` and `tabs` - to read the settings values from the sunnylink.ai dashboard
  tabs while a scan or crawl is running.
- Host access to `https://www.sunnylink.ai/*` - the only website the extension reads.

## Contact

Questions about this policy can be directed to the developer via the contact email
listed on the extension's Chrome Web Store page.
