# JSD-AI

JSD-AI is a lightweight browser start-page / speed-dial app.

It stores tabs and dials in `localStorage`, renders everything from that stored data, and avoids framework baggage. No jQuery, no React, no Vue, no Angular, no `data-*` attributes. Just plain HTML, CSS, and JavaScript.

## See it LIVE
https://jaydevdo.github.io/JSD-AI/

## Current status

Development snapshot.

Current baseline:

```text
version: 1.0.1
storage: localStorage
layout: vertical / horizontal toggle
dialogs: JS-built, no native dialog/form dependency
license: MIT
```

## What it does

JSD-AI lets the user maintain a browser-local dashboard of tabs and URL dials.

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
- Archive tab is hidden from normal navigation
- Removed dials are archived
```

## Archive behavior

The archive tab is a system tab.

```text
ARCHIVE r0 c0 = reserved explanation/placeholder
ARCHIVE r0 c1 = newest archived dial
ARCHIVE r0 c2 = previous archived dial
...
```

Archive is FIFO. When full, the oldest archived dial is dropped.

Pinned dials lose their pinned state when archived.

## Views

The app supports two layouts.

### Vertical view

```text
tabs left
dial grid right
```

### Horizontal view

```text
tabs top
dial grid below
```

The `navHome` item opens the GitHub Pages site for this repository.

## Dialogs

Dialogs are created by JavaScript when needed.

The app does not use native `<dialog>` or `<form>` for the custom dialogs. This avoids browser/user-agent styling interference, especially in older or unusual browsers.

Current dialogs:

```text
dlg_Tab.js
dlg_Dial.js
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
JSD.js
fctr_LclStrg.js
fctr_Archive.js
dlg_Tab.js
dlg_Dial.js
default-JSD.json
LICENSE
README.md
```

## File responsibilities

### `index.html`

Contains the app scaffold and CSS.

### `JSD.js`

Main UI builder. Handles app init, view toggle, tab rendering, dial grid rendering, active tab rebuilds, button wiring, and small DOM helpers.

### `fctr_LclStrg.js`

Storage/data layer. Handles localStorage load/save, default data loading, archive tab repair, tab lookup, dial lookup, position checks, tab saving, dial saving, pin/unpin logic, move/delete helpers, and resize consequences.

### `fctr_Archive.js`

Archive FIFO logic. Handles archive list, archive dial, and delete-to-archive.

### `dlg_Tab.js`

Tab add/edit dialog. Includes tab name, rows, columns, order, colors, and delete checkbox row.

### `dlg_Dial.js`

Dial add/edit dialog. Includes label, URL, tab, row, column, colors, pinned option, and delete checkbox row.

## Data rules

### Tab identity

```text
tabId is the tab name
tabId must be unique
tabId length is limited by systemSettings
```

### Dial identity

```text
position is the identity
dial.position.tabId
dial.position.row
dial.position.col
```

### Pinning

Pinned dials are still stored once in `allDials`.

A pinned dial projects onto every non-archive tab at the same row/col.

### Position checks

`posTaken(pos)` checks both:

```text
exact stored dial at pos
pinned dial projection at row/col
```

Archive ignores pinned projection.

## Development rules

```text
No jQuery
No data-* attributes
No framework dependency
No constructors for data objects
No prototype machinery
No hidden generated IDs for dials
No native dialog/form dependency for custom dialogs
Keep function and variable names concise
Prefer direct readable code over over-abstracted helpers
```

## Running locally

Because the app fetches `default-JSD.json`, serve the folder through a local web server instead of opening `index.html` directly.

Example:

```bash
python3 -m http.server
```

Then open the local server page in a browser.

## Storage reset during testing

The app stores data in browser `localStorage`.

To reset the app state during development, clear the site storage for the local test URL, or run in the browser console:

```js
localStorage.removeItem("JSD.appData");
location.reload();
```

## License

MIT License.
