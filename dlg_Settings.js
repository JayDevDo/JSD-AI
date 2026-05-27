/*
	dlg_Settings.js
	Version = 20260526
*/
"use strict";

//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const buildSysSttsBlock = () => {
	const sys = JSDStore.getSys();
	const block = Object.assign(document.createElement("div"), { className: "settingsBlock sysSettingsBlock" });
	const title = Object.assign(document.createElement("h3"), { textContent: "System settings" });

	const hdrRow = Object.assign(document.createElement("div"), { className: "settingsRow sysHdrRow" });
	const hdrSetting = Object.assign(document.createElement("span"), { className: "settingsLabel", textContent: "Setting" });
	const hdrMin = Object.assign(document.createElement("span"), { className: "settingsValue", textContent: "Min" });
	const hdrMax = Object.assign(document.createElement("span"), { className: "settingsValue", textContent: "Max" });
	hdrRow.append(hdrSetting, hdrMin, hdrMax);

	const gridSizeSlct = Object.assign(document.createElement("select"), { className: "settingsValue" });
	for (const value of [3, 4, 5, 6]) {
		gridSizeSlct.appendChild(Object.assign(document.createElement("option"), {
			value: value.toString(),
			textContent: value.toString()
		}));
	}

	const minRows = Object.assign(gridSizeSlct.cloneNode(true), { id: "setMinRows", value: sys.minRows.toString() });
	const maxRows = Object.assign(gridSizeSlct.cloneNode(true), { id: "setMaxRows", value: sys.maxRows.toString() });
	const minCols = Object.assign(gridSizeSlct.cloneNode(true), { id: "setMinCols", value: sys.minCols.toString() });
	const maxCols = Object.assign(gridSizeSlct.cloneNode(true), { id: "setMaxCols", value: sys.maxCols.toString() });
	const minLblLenVal = Object.assign(document.createElement("span"),{className:"settingsValue",textContent:sys.minLabelLen.toString()});
	const blankMax = Object.assign(document.createElement("span"), { className: "settingsValue" });

	const minLabelSlct = Object.assign(gridSizeSlct.cloneNode(true), { id: "setMinLabelLen" });
	for (const value of [7, 8]) {
		minLabelSlct.appendChild(Object.assign(document.createElement("option"), {
			value: value.toString(),
			textContent: value.toString()
		}));
	}
	minLabelSlct.value = sys.minLabelLen.toString();

	const maxTabLabelSlct = Object.assign(gridSizeSlct.cloneNode(true), { id: "setMaxTabLabelLen" });
	maxTabLabelSlct.replaceChildren();
	for (const value of [8, 9, 10, 11, 12]) {
		maxTabLabelSlct.appendChild(Object.assign(document.createElement("option"), {
			value: value.toString(),
			textContent: value.toString()
		}));
	}
	maxTabLabelSlct.value = sys.maxTabLabelLen.toString();

	const maxDialLabelSlct = Object.assign(gridSizeSlct.cloneNode(true), { id: "setMaxDialLabelLen" });
	maxDialLabelSlct.replaceChildren();
	for (const value of [8, 9, 10, 11, 12, 13, 14, 15, 16]) {
		maxDialLabelSlct.appendChild(Object.assign(document.createElement("option"), {
			value: value.toString(),
			textContent: value.toString()
		}));
	}
	maxDialLabelSlct.value = sys.maxDialLabelLen.toString();

	block.append(title, hdrRow);

	for (const rowData of  [
		["Rows", minRows, maxRows],
		["Columns", minCols, maxCols],
		["Label length", minLabelSlct, blankMax],
		["Tab label", minLblLenVal, maxTabLabelSlct],
		["Dial label", minLblLenVal.cloneNode(true), maxDialLabelSlct]
	]) {
		const row = Object.assign(document.createElement("div"), { className: "settingsRow sysSettingsRow" });
		const label = Object.assign(document.createElement("span"), {className: "settingsLabel",textContent: rowData[0]	});
		row.append(label, rowData[1], rowData[2]);
		block.appendChild(row);
	}

	return block;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const buildArchiveBlock = () => {
	const archiveDials = JSDStore.tabDials(archTabId);
	const archiveCount = archiveDials.length.toString();
	const block = Object.assign( document.createElement("div"), { className: "settingsBlock archiveBlock" });
	const title = Object.assign( document.createElement("h3"), { textContent: "Archive" });
	const countRow = Object.assign( document.createElement("div"), { className: "settingsRow" });
	const lblCount = Object.assign( document.createElement("span"), { className: "settingsLabel", textContent: "Items:" });
	const valCount = Object.assign( document.createElement("span"), { className: "settingsValue", textContent:  archiveCount });
	countRow.append( lblCount, valCount );
	const list = Object.assign( document.createElement("div"), { className: "archiveList" });

	if (!archiveDials.length) {
		const emptyRow = Object.assign(document.createElement("div"),{className: "archiveRow",textContent: "Archive empty"});
		list.appendChild(emptyRow);
	}

	for ( const [ idx, dial ] of archiveDials.entries() ) {
		const row = Object.assign(document.createElement("div"), { className: "archiveRow" });
		const order = Object.assign(document.createElement("span"), { className: "archiveOrder", textContent: (idx + 1).toString() });
		const label = Object.assign(document.createElement("span"), { className: "archiveLabel", textContent: dial.label || "" });
		const restoreBtn = Object.assign(document.createElement("button"), { type: "button", textContent: "restore" });
		const deleteBtn = Object.assign(document.createElement("button"), { type: "button", textContent: "really delete" });
		row.append(order, label, restoreBtn, deleteBtn);
		list.appendChild(row);
	}	

	block.append( title, countRow, list );
	return block;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const buildRdOnlyBlock = () => {
	const sys = JSDStore.getSys();
	const usr = JSDStore.getUsr();
	const pinGrid = JSDStore.getPinGridSize();
	const block = Object.assign(document.createElement("div"), { className: "settingsBlock rdOnlyBlock" });
	const title = Object.assign(document.createElement("h3"), { textContent: "Read-only settings" });
	const maxTabsRow = Object.assign(document.createElement("div"), { className: "settingsRow" });
	const lblMaxTabs = Object.assign(document.createElement("span"), { className: "settingsLabel", textContent: "Max user tabs:" });
	const valMaxTabs = Object.assign(document.createElement("span"), { className: "settingsValue", textContent: (sys.maxTabs - 1).toString() });

	const maxPinsRow = Object.assign(document.createElement("div"), { className: "settingsRow rdMaxPinsRow" });
	const lblMaxPins = Object.assign(document.createElement("span"), { className: "settingsLabel", textContent: "Max pins:" });
	const valMaxPins = Object.assign(document.createElement("span"), { className: "settingsValue", textContent: sys.maxPins.toString() });

	const pinGridBox = Object.assign(document.createElement("div"), { className: "pinGridRow" });
	const lblPinGrid = Object.assign(document.createElement("span"), { className: "settingsLabel", textContent: "Pin grid:" });
	const valPinGrid = Object.assign(document.createElement("span"), {
		className: "settingsValue",
		textContent: (pinGrid.bottom + 1) + " X " + (pinGrid.right + 1)
	});
	pinGridBox.append( lblPinGrid, valPinGrid);
	maxPinsRow.append( lblMaxPins, valMaxPins, pinGridBox);

	const activeTabRow = Object.assign(document.createElement("div"), { className: "settingsRow" });
	const lblActiveTab = Object.assign(document.createElement("span"), { className: "settingsLabel", textContent: "Active tab:" });
	const valActiveTab = Object.assign(document.createElement("span"), { className: "settingsValue", textContent: usr.activeTabId });
	maxTabsRow.append( lblMaxTabs, valMaxTabs);
	activeTabRow.append( lblActiveTab, valActiveTab);
	block.append( title, maxTabsRow, maxPinsRow, activeTabRow);
	return block;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const buildUserSttsBlock = () => {
	const sys = JSDStore.getSys();
	const usr = JSDStore.getUsr();
	const viewLabels = { vView: "tabs left", hView: "tabs on top"};
	const nextView = usr.view === "vView" ? "hView" : "vView";

	const block = Object.assign(document.createElement("div"), { className: "settingsBlock usrSettingsBlock" });
	const title = Object.assign(document.createElement("h3"), { textContent: "User settings" });

	const viewRow = Object.assign( document.createElement("div"), { className: "settingsRow" });
	const lblView = Object.assign( document.createElement("span"), { className: "settingsLabel", textContent: "View:" });
	const bttnView = Object.assign(	document.createElement("button"),{	
		type: "button",	className: "bttnViewToggle", textContent: viewLabels[nextView],
		onclick: () => { setView(nextView);renderApp();document.getElementById("settingsDlg").remove();}
	} );
	viewRow.append(lblView, bttnView);

	const themeRow = Object.assign(document.createElement("div"), { className: "settingsRow" });
	const lblTheme = Object.assign(document.createElement("span"), { className: "settingsLabel", textContent: "Theme:" });
	const valTheme = Object.assign(document.createElement("select"), { id: "setTheme", className: "settingsValue" });
	for (const theme of sys.themeOptions) {
		const option = Object.assign(document.createElement("option"),{value:theme,textContent:theme,selected:theme===usr.theme});
		valTheme.appendChild(option);
	}
	themeRow.append( lblTheme, valTheme );

	const contrastRow = Object.assign(document.createElement("div"), { className: "settingsRow contrastRow" });
	const lblContrast = Object.assign(document.createElement("span"), { className: "settingsLabel", textContent: "Contrast:" });
	const minContrast = Object.assign(document.createElement("input"), {id:"setUserContrastMin", className:"settingsValue",type:"number",step:"0.1",value:usr.contrastLevel[0]});
	const sysMinCntrast = Object.assign(document.createElement("span"), { className: "settingsLabel", textContent: sys.contrastLimits[0].toString() });
	const maxContrast = Object.assign(document.createElement("input"), {id:"setUserContrastMax",className:"settingsValue",type:"number",step:"0.1",value: usr.contrastLevel[1]});
	const sysMaxCntrast = Object.assign(document.createElement("span"), { className: "settingsLabel", textContent: sys.contrastLimits[1].toString() });
	contrastRow.append( lblContrast, minContrast, sysMinCntrast, maxContrast, sysMaxCntrast );

	const jsonRow = Object.assign(document.createElement("div"), { className: "settingsRow" });
	const lblJson = Object.assign(document.createElement("span"), { className: "settingsLabel", textContent: "JSON:" });
	const jsonBtn = Object.assign(document.createElement("button"), {
		id: "jsonImportExportBtn",type:"button",textContent:"import-export",
		onclick:()=>{ document.getElementById("settingsDlg").remove();openJsonDialog();}});
	jsonRow.append( lblJson, jsonBtn );

	block.append(title, viewRow, themeRow, contrastRow, jsonRow);
	return block;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const openSettingsDialog = () => {
	const dialog = document.createElement("div");
	dialog.id = "settingsDlg";

	const panel = document.createElement("div");
	panel.id = "settingsDlgPanel";

	// - - - - - -  - Table - - - - - -  -
	const dlgTbl = document.createElement("table");
	
	// - - - - - -  - header/Caption - - - - - -  -
	const dlgHdr = dlgTbl.appendChild(document.createElement("caption"));
	dlgHdr.textContent = "Settings";

	// - - - - - -  - Body - - - - - -  -
	const dlgBody = dlgTbl.appendChild(document.createElement("tbody"));
	const frstRow = dlgBody.appendChild(document.createElement("tr")); 

	const r1c1 = frstRow.appendChild(document.createElement("td")); 
	r1c1.appendChild( buildUserSttsBlock() );	
	
	const r1c2 = frstRow.appendChild(document.createElement("td")); 
	r1c2.appendChild( buildRdOnlyBlock() );

	const scndRow = dlgBody.appendChild(document.createElement("tr")); 
	const r2c1 = scndRow.appendChild(document.createElement("td")); 
	r2c1.appendChild( buildArchiveBlock() );

	const r2c2 = scndRow.appendChild(document.createElement("td")); 
	r2c2.appendChild( buildSysSttsBlock() );

	// - - - - - -  - footer - - - - - -  -
	const dlgFtr = dlgTbl.appendChild(document.createElement("tfoot")); 
	const ftrRow = dlgFtr.appendChild(document.createElement("tr")); 
	const ftrCell = ftrRow.appendChild(document.createElement("td"));
	ftrCell.colSpan = 2;

	const actions = document.createElement("div");
	actions.className = "dialogActions";

	const applyBtn = document.createElement("button");
	applyBtn.type = "button";
	applyBtn.textContent = "Apply";
	applyBtn.onclick = () => {
		const minRowsInput = document.getElementById("setMinRows");
		const maxRowsInput = document.getElementById("setMaxRows");
		const minColsInput = document.getElementById("setMinCols");
		const maxColsInput = document.getElementById("setMaxCols");
		const minLabelInput = document.getElementById("setMinLabelLen");
		const maxTabLabelInput = document.getElementById("setMaxTabLabelLen");
		const maxDialLabelInput = document.getElementById("setMaxDialLabelLen");
		const userContrastMinInput = document.getElementById("setUserContrastMin");
		const userContrastMaxInput = document.getElementById("setUserContrastMax");
		const themeInput = document.getElementById("setTheme");
		const msgs = [];

		if (Number(minRowsInput.value) > Number(maxRowsInput.value)) {msgs.push("minRows cannot be greater than maxRows");}
		if (Number(minColsInput.value) > Number(maxColsInput.value)) {msgs.push("minCols cannot be greater than maxCols");}
		if (Number(userContrastMinInput.value) > Number(userContrastMaxInput.value)) {msgs.push("user contrast min cannot be greater than max");}
		if (msgs.length) {if (typeof showMssgs === "function") {showMssgs(msgs);}return;}

		const newSys = {
			minRows: Number(minRowsInput.value),
			maxRows: Number(maxRowsInput.value),
			minCols: Number(minColsInput.value),
			maxCols: Number(maxColsInput.value),
			minLabelLen: Number(minLabelInput.value),
			maxTabLabelLen: Number(maxTabLabelInput.value),
			maxDialLabelLen: Number(maxDialLabelInput.value)
		};

		const newUsr = {
			contrastLevel: [Number(userContrastMinInput.value), Number(userContrastMaxInput.value) ],
			theme: themeInput.value
		};

		JSDStore.saveSettings(newSys, newUsr);
		renderApp();
		dialog.remove();

		if (typeof showMssgs === "function") {showMssgs(["settings saved"]);}
	};

	const closeBtn = document.createElement("button");
	closeBtn.type = "button";
	closeBtn.textContent = "Close";
	closeBtn.onclick = () => { document.getElementById("settingsDlg").remove(); };

	actions.appendChild(applyBtn);
	actions.appendChild(closeBtn);

	ftrCell.appendChild(actions);

	dialog.appendChild(dlgTbl);
	document.body.appendChild(dialog);
};
