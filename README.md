# JSD-AI

JSD-AI is a lightweight browser start-page / speed-dial app.

The app scaffold is served from the project host: HTML, CSS, JavaScript, and the default JSON scaffold.

Your personal tabs, dials, settings, archive contents, and imported data live in your browser `localStorage`.

There is no account, no backend database, no sync service, and no monitoring of your personal speed-dial data.

The server provides the app shell; your dashboard stays local unless you export it or manually share it.

## Live app

https://jaydevdo.github.io/JSD-AI/

## Current status

Development snapshot.

```text
version: 1.0.8
storage: localStorage
layout: vertical / horizontal
dialogs: JavaScript-built, grouped in dialogs.js
styling: app CSS and dialog CSS split
positioning: position-based dial identity
pinning: shared row/column projection
archive: FIFO archive tab with restore / permanent delete
json: import / export, including old-format conversion
license: MIT
```

## What it does

JSD-AI lets you maintain a browser-local dashboard of tabs and URL/path dials.

Core behavior:

```text
- Loads saved localStorage data when present
- Falls back to default-JSD.json when localStorage is empty
- Stores user tabs, dials, settings, and archive locally
- Supports tabs on the left or tabs on top
- Supports configurable tab grid sizes
- Supports pinned dials across normal tabs
- Archives deleted dials instead of immediately destroying them
- Allows archived dials to be restored or deleted forever
- Supports JSON import/export
- Supports hiding add-dial buttons while keeping empty slots clickable
- Search for dials.
```

## Data model

Tabs use:

```text
tabId
rows
cols
bgColor
txtColor
order
```

Dials use:

```text
label
url
bgColor
txtColor
position
pinned
lastClicked
```

Dial position is the dial identity:

```js
{
	tabId: "WORK",
	row: 0,
	col: 1
}
```

There are no generated dial IDs. Position is the unique location key.

## Local data and privacy

The hosted files provide the scaffold. Your edited dashboard data is stored in your browser.

```text
Server provides:
- index.html
- CSS
- JavaScript
- default-JSD.json

Browser stores locally:
- user tabs
- user dials
- settings
- archive contents
- imported JSON data
```

The app does not upload your tabs or dials.

Clearing browser site data or localStorage can remove your dashboard unless you exported a backup first.

Opening a dial naturally visits that dial’s target site, so that target site receives a normal browser visit.

JSD-AI does not add referrals, track click actions, or share dial-click activity with the project host.

## Layout

The app supports two main layouts:

```text
vView: tabs on the left
hView: tabs on top
```

The active layout is stored in user settings.

## Add-dial visibility

Empty dial slots can show visible `Add Dial` buttons, or the buttons can be hidden while leaving the empty slot clickable.

```text
showAddDials: true
	empty slots show Add Dial buttons

showAddDials: false
	empty slots remain clickable but visually hidden
```

This keeps the grid cleaner without removing the ability to add new dials.

## Validation

Tab and dial dialogs validate input before saving.

Tab names:

```text
- are forced to uppercase
- cannot be pasted or dropped
- reject blocked characters
- reject duplicate names
- reject reserved names
- must fit configured length limits
```

Dial labels:

```text
- cannot be pasted or dropped
- reject blocked characters
- must fit configured length limits
```

Dial URLs:

```text
- must not be empty
- must not contain whitespace
- must use a supported URL protocol
- must include a host
```

Supported dial URL protocols:

```text
http://
https://
ftp://
```

A bad target URL is still ultimately the user’s responsibility. The validation is there to prevent obvious broken entries and accidental placeholder saves.

## Pinning

Pinned dials are stored once and projected onto every normal tab at the same row/column.

When pinning would collide with an existing dial, the app tries to move the conflicting dial to a free slot.

If no free slot exists, pinning is blocked.

Pinned dials cannot be moved from their projected position through the normal edit dialog.

## Archive

The archive is a hidden system tab.

Deleted dials are moved into the archive. The archive keeps a fixed number of dials using FIFO behavior.

When full, the oldest archived dial is dropped.

Archived dials can be restored to the active tab when a free slot exists, or deleted forever.

Permanent delete in the archive is immediate. The first-stage delete is already the move to archive.

## JSON import / export

The JSON dialog supports:

```text
- Export current app data
- Load JSON from a file
- Paste JSON text
- Import settings
- Import tabs and dials
- Import dials
- Import both settings and tabs/dials
```

Imported tab IDs are normalized to uppercase so older or manually edited JSON can still match the current tab-name policy.

The JSON importer is primarily intended for JSON generated by this app.

## Dialogs

Dialogs are generated in JavaScript and styled through `dialogs.css`.

Current dialogs:

```text
- tab dialog
- dial dialog
- JSON import/export dialog
- settings dialog
```

Escape closes the tab, dial, JSON, and settings dialogs.

## Browser notes

The app intentionally uses plain JavaScript, plain CSS, and plain HTML.

Known browser behavior:

```text
input type=color may not show a native picker in Pale Moon
However Basilisk and LibreWolf handle it correctly in testing
```

## Files

```text
index.html
JSD.css
dialogs.css
JSD.js
dialogs.js
fctr_LclStrg.js
fctr_Positioning.js
fctr_Archive.js
fctr_jsonConvert.js
fctr_Json.js
default-JSD.json
LICENSE
README.md
```

## License

MIT License.
