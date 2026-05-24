# JSD-AI

JSD-AI is a lightweight browser start-page / speed-dial app.

It stores tabs and dials in `localStorage`, renders everything from stored data, and avoids framework baggage. No jQuery, no React, no Vue, no Angular, no `data-*` attributes. Just plain HTML, CSS, and JavaScript.

## See it LIVE

https://jaydevdo.github.io/JSD-AI/

## Current status

Development snapshot.

Current baseline:

```text
version: 1.0.3
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

## Views

The app supports two layouts.

### Vertical view

```text
tabs left
dial grid right
```

In vertical view, inactive tabs are visually shortened so only the active tab connects to the grid.

### Horizontal view

```text
tabs top
dial grid below
```

In horizontal view, inactive tabs have a bottom gap so only the active tab connects to the grid.

## Home / repo button

The `navHome` item opens the GitHub repository for this project:

```text
https://github.com/JayDevDo/JSD-AI
```

## Dialogs

Dialogs are created by JavaScript when needed.

The app does not use native `<dialog>` or `<form>` for the custom dialogs. This avoids browser/user-agent styling interference, especially in older or unusual browsers.

Current dialogs:

```text
dlg_Tab.js
dlg_Dial.js
dlg_Json.js
```

### Tab dialog

The tab dialog handles:

```text
tab name
rows
columns
order
background color
text color
delete checkbox
```

Tab name validation is handled in `dlg_Tab.js`.

### Dial dialog

The dial dialog handles:

```text
label
URL/path text
background color
text color
tab
row
column
pinned
delete checkbox
```

The URL/path field is a wrapping textarea. It is treated as plain text and is not browser-validated as a URL.

When adding a dial, the dialog defaults to:

```text
clicked tab
clicked row
clicked column
dial background = tab text color
dial text = tab background color
```

Row and column selectors display human-friendly numbers, while stored data remains zero-based.

```text
displayed row 1 = stored row 0
displayed column 1 = stored col 0
```

## Pinning behavior

Pinned dials are stored once in `allDials`.

A pinned dial projects onto every non-archive tab at the same row/column.

When pinning a dial:

```text
- The selected position must fit within the shared grid of all normal tabs
- A row/column already used by another pinned dial is blocked
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

Pinned dials lose their pinned state when archived.

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

JSON parsing and import analysis live in:

```text
fctr_Json.js
```

The dialog UI lives in:

```text
dlg_Json.js
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
fctr_Json.js
dlg_Tab.js
dlg_Dial.js
dlg_Json.js
default-JSD.json
LICENSE
README.md
```

## File responsibilities

### `index.html`

Contains the app scaffold and script loading order.

### `JSD.css`

Contains layout, tab styling, dial styling, dialog styling, textarea styling, and the pinned dial icon.

### `JSD.js`

Main UI builder.

Handles app init, view toggle, tab rendering, dial grid rendering, active tab rebuilds, button wiring, and small DOM helpers.

### `fctr_LclStrg.js`

Storage and data mutation layer.

Handles:

```text
localStorage load/save
default data loading
ARCHIVE tab repair
tab lookup
dial lookup
tab ordering
tab save
dial save
tab delete
last-click timestamp
JSON export
JSON replacement entry points
```

### `fctr_Positioning.js`

Positioning and pinning logic layer.

Handles:

```text
position comparisons
cell comparisons
occupied-position checks
free slot lookup
closest free slot lookup
shared pin grid calculation
pin target validation
pin move planning
pin collision checks
in-memory move operations
resize move-out logic
```

This file does not write to `localStorage`.

### `fctr_Archive.js`

Archive FIFO logic.

Handles:

```text
archive list
archive dial
delete-to-archive
```

### `fctr_Json.js`

JSON parse/import analysis layer.

Handles:

```text
JSON part detection
settings detection
tabs/dials detection
tabs+dials validation
JSON summary generation
import mode routing
```

### `dlg_Tab.js`

Tab add/edit dialog.

Includes tab name, rows, columns, order, colors, validation, and delete checkbox row.

### `dlg_Dial.js`

Dial add/edit dialog.

Includes label, URL/path textarea, colors, tab, row, column, pinned option, delete checkbox row, and pin confirmation messages.

### `dlg_Json.js`

JSON import/export dialog UI.

Includes textarea, file loading, parse messages, import buttons, export button, and cancel button.

### `default-JSD.json`

Default app data used when `localStorage` is empty.

### `LICENSE`

MIT license.

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

Position checks consider:

```text
exact stored dial at position
pinned dial projection at row/col
temporary pin planning projection
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
Keep one-line if statements on one line when practical
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
