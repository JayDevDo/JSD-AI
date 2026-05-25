# JSD-AI

JSD-AI is a lightweight browser start-page / speed-dial app.

It stores tabs and dials in `localStorage`, renders everything from stored data, and avoids framework baggage. No jQuery, no React, no Vue, no Angular, no `data-*` attributes. Just plain HTML, CSS, and JavaScript.

## See it LIVE

https://jaydevdo.github.io/JSD-AI/

## Current status

Development snapshot.

Current baseline:

```text
version: 1.0.4
storage: localStorage
layout: vertical / horizontal toggle
dialogs: JS-built, no native dialog/form dependency
positioning: position-based dial identity
pinning: shared row/column projection
archive: FIFO archive tab
json: import / export dialog
license: MIT
```

## What it does

JSD-AI lets the user maintain a browser-local dashboard of tabs and URL/path dials.

Each tab has:

```text
tabId
rows
cols
bgColor
txtColor
order
```

Each dial has:

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

## Main features

```text
- Loads from localStorage if data exists
- Falls back to default-JSD.json when localStorage is empty
- Repairs missing ARCHIVE tab during init
- Supports vertical and horizontal tab views
- Builds tab grid from row/column settings
- Builds dial grid from active tab rows/cols
- Empty cells show Add Dial
- Existing dials can be opened or edited
- Tabs can be added, edited, deleted, and reordered
- Dials can be added, edited, pinned, moved, archived, and deleted
- Pinned dials appear on every normal tab at the same row/col
- Occupied cells are blocked in dial position selectors
- Pinning can move conflicting dials when free space exists
- Archive tab is hidden from normal navigation
- Removed dials are archived
- JSON import/export supports settings, dials, and tabs+dials
```

## Home / repo button

The `navHome` item opens the GitHub repository for this project:

## Dialogs

Dialogs are created by JavaScript when needed.

The app does not use native `<dialog>` or `<form>` for the custom dialogs. This avoids browser/user-agent styling interference, especially in older or unusual browsers.

Row and column selectors display human-friendly numbers, while stored data remains zero-based.

## Pinning behavior

Pinned dials are stored once in `allDials`.

A pinned dial projects onto every non-archive tab at the same row/column.

When pinning a dial:

```text
- The selected position must fit within the shared grid of all normal tabs
- If a normal dial occupies the projected position on another tab, the app tries to move it
- If no free fallback slot exists, pinning is blocked
```

Pinned dials show a CSS-drawn padlock icon.

## Archive behavior

The archive tab is a system tab.

```text
ARCHIVE r0 c0 = reserved explanation/placeholder
ARCHIVE r0 c1 = newest archived dial
ARCHIVE r0 c2 = previous archived dial
...
```

Archive is FIFO. When full, the oldest archived dial is dropped.

## JSON import / export

The JSON dialog can:

```text
- Export the current app data
- Load JSON from a file
- Paste JSON text
- Import settings
- Import dials
- Import tabs+dials
- Import both settings and tabs+dials
```

## Browser notes

The app is intentionally plain JavaScript and should work broadly.

Known browser behavior:

```text
input type=color may not show a native picker in Pale Moon
Basilisk and LibreWolf handle it correctly in testing
```

If a browser does not support native color inputs, it may show a plain text field instead.

## File layout

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
