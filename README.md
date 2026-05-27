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
version: 1.0.6
storage: localStorage
layout: vertical / horizontal
dialogs: JavaScript-built
positioning: position-based dial identity
pinning: shared row/column projection
archive: FIFO archive tab
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
- Supports pinned dials across normal tabs
- Archives deleted dials instead of immediately destroying them
- Allows archived dials to be restored or deleted forever
- Supports JSON import/export
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

## Pinning

Pinned dials are stored once and projected onto every normal tab at the same row/column.

When pinning would collide with an existing dial, the app tries to move the conflicting dial to a free slot. 
If no free slot exists, pinning is blocked.

## Archive

The archive is a hidden system tab.

Deleted dials are moved into the archive. The archive keeps a fixed number of dials using FIFO behavior. 
When full, the oldest archived dial is dropped.

Archived dials can be restored to the active tab when a free slot exists, or deleted forever.

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

## Browser notes

The app intentionally uses plain JavaScript, plain CSS, and plain HTML.

Known browser behavior:
If a browser does not support native color inputs, it may show a plain text field instead.

```text
input type=color may not show a native picker in Pale Moon
However Basilisk and LibreWolf handle it correctly in testing
```

## Files

```text
index.html
JSD.css
JSD.js
fctr_LclStrg.js
fctr_Positioning.js
fctr_Archive.js
fctr_jsonConvert.js
fctr_Json.js
dlg_Tab.js
dlg_Dial.js
dlg_Json.js
dlg_Settings.js
default-JSD.json
LICENSE
README.md
```

## License

MIT License.