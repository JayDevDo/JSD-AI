/*
	dialogs.js
	Version = 20260527
*/
"use strict";
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Dialog builders
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const makeDialogFrame = (dlgId, captionText) => {
	const dialog = makeElement("div", { id: dlgId });
	const table = document.createElement("table");
	const caption = table.appendChild(document.createElement("caption"));
	const body = table.appendChild(document.createElement("tbody"));
	const foot = table.appendChild(document.createElement("tfoot"));
	caption.textContent = captionText;
	dialog.appendChild(table);
	return { dialog: dialog, table: table, body: body, foot: foot };
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const makeDialogRow = (...cells) => {
	const row = document.createElement("tr");
	for (const cell of cells) {
		const td = document.createElement("td");
		if (cell instanceof Node) {td.appendChild(cell);}
		else {td.textContent = cell.toString();}
		row.appendChild(td);
	}
	return row;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const makeDialogActions = (...bttns) => {
	const actions = makeElement("div", { className: "dialogActions" });
	for (const bttn of bttns) {actions.appendChild(bttn);}
	return actions;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const setDialogMssg = (elm, mssgs, fallback = "Ready.") => {
	elm.textContent = mssgs.length ? mssgs.join("\n") : fallback;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const setInputInvalid = (input, invalid) => {
	if (invalid) {input.classList.add("invalidInput");}
	else {input.classList.remove("invalidInput");}
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Text validation helpers
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const dialogTextCharsOK = (text) => {
	for (const char of text.normalize("NFC")) {
		if (/[\p{C}\p{Extended_Pictographic}\p{Emoji_Presentation}]/u.test(char)) {return false;}
	}
	return true;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const dialogTextLen = (text) => Array.from(text.normalize("NFC")).length;
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const dialogLabelMssgs = (name, value, minLen, maxLen) => {
	const normValue = value.normalize("NFC");
	const valueLen = dialogTextLen(normValue);
	const mssgs = [];
	if (valueLen < minLen) {mssgs.push(name + " too short: " + valueLen + " / " + minLen);}
	if (valueLen > maxLen) {mssgs.push(name + " too long: " + valueLen + " / " + maxLen);}
	if (!dialogTextCharsOK(normValue)) {mssgs.push(name + " contains blocked characters");}
	return mssgs;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const blockTextBeforeInput = (evt, input, maxLen, blockedCb, fieldName) => {
	if (evt.inputType && evt.inputType.startsWith("delete")) {return;}
	if (evt.inputType === "historyUndo" || evt.inputType === "historyRedo") {return;}
	if (evt.inputType !== "insertText" && evt.inputType !== "insertCompositionText") {
		evt.preventDefault();
		blockedCb(fieldName + " accepts typing only");
		return;
	}
	if (evt.data === null) {return;}

	const newText = evt.data.normalize("NFC");
	const oldLen = dialogTextLen(input.value);
	const selText = input.value.slice(input.selectionStart, input.selectionEnd);
	const selLen = dialogTextLen(selText);
	const newLen = oldLen - selLen + dialogTextLen(newText);

	if (!dialogTextCharsOK(newText)) {
		evt.preventDefault();
		blockedCb(fieldName + " contains blocked characters");
		return;
	}
	if (newLen > maxLen) {
		evt.preventDefault();
		blockedCb(fieldName + " too long: " + newLen + " / " + maxLen);
		return;
	}
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const forceInputCaps = (input) => {
	const selStart = input.selectionStart;
	const selEnd = input.selectionEnd;
	const capsValue = input.value.normalize("NFC").toUpperCase();
	if (input.value !== capsValue) {
		input.value = capsValue;
		input.setSelectionRange(selStart, selEnd);
	}
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Dial validation helpers
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const dialLabelMssgs = (label, sys) => dialogLabelMssgs("Dial label", label, sys.minLabelLen, sys.maxDialLabelLen);
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const dialUrlMssgs = (url) => {
	const normUrl = url.normalize("NFC");
	const mssgs = [];
	const allowedProtocols = ["http:", "https:", "ftp:"];
	if (!normUrl.length || /^\s+$/.test(normUrl)) {mssgs.push("URL is empty");}
	if (/\s/.test(normUrl)) {mssgs.push("URL contains whitespace");}
	if (!dialogTextCharsOK(normUrl)) {mssgs.push("URL contains blocked characters");}
	try {
		const urlObj = new URL(normUrl);
		if (!allowedProtocols.includes(urlObj.protocol)) {mssgs.push("URL must start with http://, https://, or ftp://");}
		if (!urlObj.hostname.length) {mssgs.push("URL is missing a host");}
	} catch {
		if (normUrl.length) {mssgs.push("URL is not valid");}
	}
	return mssgs;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Tab validation helpers
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const tabNameMssgs = (tabId, sys, oldId = null) => {
	const normTabId = tabId.normalize("NFC").toUpperCase();
	const mssgs = dialogLabelMssgs("Tab name", normTabId, sys.minLabelLen, sys.maxTabLabelLen);
	if (normTabId === archTabId.toUpperCase()) {mssgs.push("Tab name is reserved: " + archTabId);}
	for (const oldTab of JSDStore.getTabs()) {
		if (oldId !== null && oldTab.tabId === oldId) {continue;}
		if (oldTab.tabId.toUpperCase() === normTabId) {mssgs.push("Tab name already exists: " + normTabId);break;}
	}
	return mssgs;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Tab dialog
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const openTabDialog = (tab = null) => {
	const appData = JSDStore.getData();
	const sys = JSDStore.getSys();
	const editMode = Boolean(tab);
	const oldId = editMode ? tab.tabId : null;
	const workTab = tab ? cloneData(tab) : JSDStore.newTab();
	const frm = makeDialogFrame("tabDlg", editMode ? "Edit tab" : "Add tab");

	const tabInput = makeTextInput("tabIdInput", workTab.tabId.toUpperCase(), sys.minLabelLen, sys.maxTabLabelLen);
	const rowsSelect = makeNumberSelect("tabRowsSelect", sys.minRows, sys.maxRows, workTab.rows);
	const colsSelect = makeNumberSelect("tabColsSelect", sys.minCols, sys.maxCols, workTab.cols);
	const ordSelect = makeNumberSelect("tabOrderSelect", 1, JSDStore.usrTabs().length + (editMode ? 0 : 1), workTab.order);
	const bgInput = makeColorInput("tabBgInput", workTab.bgColor);
	const txtInput = makeColorInput("tabTxtInput", workTab.txtColor);
	const delCheck = makeElement("input", { id: "tabDelCheck" });
	const tabMssg = makeElement("div", { id: "tabMssg" });

	const tabFormMssgs = () => tabNameMssgs(tabInput.value, sys, oldId);
	const canSaveTab = () => tabFormMssgs().length === 0;

	const syncTabForm = () => {
		const mssgs = tabFormMssgs();
		applyBtn.hidden = !canSaveTab();
		setInputInvalid(tabInput, Boolean(mssgs.length));
		setDialogMssg(tabMssg, mssgs);
	};

	const blockedTabInput = (mssg) => {
		const mssgs = tabFormMssgs();
		applyBtn.hidden = !canSaveTab();
		setInputInvalid(tabInput, Boolean(mssgs.length));
		setDialogMssg(tabMssg, [mssg].concat(mssgs));
	};

	const handleSave = () => {
		if (!canSaveTab()) {syncTabForm();return;}
		workTab.tabId = tabInput.value.normalize("NFC").toUpperCase();
		workTab.rows = Number(rowsSelect.value);
		workTab.cols = Number(colsSelect.value);
		workTab.order = Number(ordSelect.value);
		workTab.bgColor = bgInput.value;
		workTab.txtColor = txtInput.value;
		const res = JSDStore.saveTab(workTab, oldId);
		if (res.ok) {renderApp(appData);frm.dialog.remove();}
		showMssgs(res.mssgs);
	};

	const handleDelete = () => {
		const res = JSDStore.delTab(oldId);
		if (res.ok) {renderApp(appData);frm.dialog.remove();}
		showMssgs(res.mssgs);
	};

	const delBtn = makeButton("Delete", handleDelete, "tabDelBtn");
	const applyBtn = makeButton(editMode ? "Apply" : "Add", handleSave);
	const cancelBtn = makeButton("Cancel", () => frm.dialog.remove());
	const delRow = makeDialogRow("Delete tab", delCheck);
	const actions = makeDialogActions(delBtn, applyBtn, cancelBtn);

	delCheck.type = "checkbox";
	delBtn.hidden = true;
	delRow.className = "delRow";

	tabInput.addEventListener("paste", (evt) => {evt.preventDefault();blockedTabInput("Tab name does not accept pasting text");});
	tabInput.addEventListener("drop", (evt) => {evt.preventDefault();blockedTabInput("Tab name does not accept dropping text");});
	tabInput.addEventListener("beforeinput", (evt) => blockTextBeforeInput(evt, tabInput, sys.maxTabLabelLen, blockedTabInput, "Tab name"));
	tabInput.addEventListener("input", () => {forceInputCaps(tabInput);syncTabForm();});
	delCheck.addEventListener("change", () => {delBtn.hidden = !delCheck.checked;});
	frm.dialog.addEventListener("keydown", (evt) => {if (evt.key === "Escape") {frm.dialog.remove();}});

	frm.body.appendChild(makeDialogRow("Tab", tabInput));
	frm.body.appendChild(makeDialogRow("Rows", rowsSelect));
	frm.body.appendChild(makeDialogRow("Columns", colsSelect));
	frm.body.appendChild(makeDialogRow("Order", ordSelect));
	frm.body.appendChild(makeDialogRow("Background", bgInput));
	frm.body.appendChild(makeDialogRow("Text", txtInput));
	if (editMode) {frm.body.appendChild(delRow);}

	const mssgRow = makeDialogRow(tabMssg);
	mssgRow.firstChild.colSpan = 2;
	frm.body.appendChild(mssgRow);

	const ftrRow = makeDialogRow(actions);
	ftrRow.firstChild.colSpan = 2;
	frm.foot.appendChild(ftrRow);

	syncTabForm();
	document.body.appendChild(frm.dialog);
	tabInput.focus();
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Dial dialog
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const openDialDialog = (pos, dial = null) => {
	const appData = JSDStore.getData();
	const sys = JSDStore.getSys();
	const editMode = Boolean(dial);
	const oldPos = editMode ? cloneData(dial.position) : null;
	const workDial = dial ? cloneData(dial) : JSDStore.newDial(pos);
	if (!editMode) {const tab = JSDStore.tabById(pos.tabId);workDial.bgColor = tab.txtColor;workDial.txtColor = tab.bgColor;}
	const lockPos = editMode && workDial.pinned;
	let pinPlanConfirmed = false;

	const frm = makeDialogFrame("dialDlg", editMode ? "Edit dial" : "Add dial");
	const tabSelect = makeElement("select", { id: "dialTabSelect" });
	const rowSelect = makeElement("select", { id: "dialRowSelect" });
	const colSelect = makeElement("select", { id: "dialColSelect" });
	const labelInput = makeTextInput("dialLabelInput", workDial.label, sys.minLabelLen, sys.maxDialLabelLen);
	const urlInput = makeElement("textarea", { id: "dialUrlInput" });
	const bgInput = makeColorInput("dialBgInput", workDial.bgColor);
	const txtInput = makeColorInput("dialTxtInput", workDial.txtColor);
	const pinInput = makeElement("input", { id: "dialPinInput" });
	const delCheck = makeElement("input", { id: "dialDelCheck" });
	const dialMssg = makeElement("div", { id: "dialPlanMssg" });

	urlInput.value = workDial.url || "";
	urlInput.rows = 3;
	urlInput.wrap = "soft";
	urlInput.spellcheck = false;
	labelInput.spellcheck = false;
	labelInput.autocomplete = "off";
	pinInput.type = "checkbox";
	pinInput.checked = workDial.pinned;
	delCheck.type = "checkbox";

	const dialTargetMssgs = () => {
		const mssgs = [];
		if (!tabSelect.value) {mssgs.push("No tab selected");}
		if (tabSelect.value !== archTabId && (rowSelect.disabled || colSelect.disabled)) {mssgs.push("No free dial position selected");}
		return mssgs;
	};

	const dialFormMssgs = () => {
		if (tabSelect.value === archTabId) {return [];}
		return dialLabelMssgs(labelInput.value, sys).concat(dialUrlMssgs(urlInput.value), dialTargetMssgs());
	};

	const canSaveDial = () => dialFormMssgs().length === 0;
	const setDialMssg = (mssgs) => setDialogMssg(dialMssg, mssgs);

	const syncDialForm = () => {
		const mssgs = dialFormMssgs();
		applyBtn.hidden = !canSaveDial();
		setInputInvalid(labelInput, Boolean(dialLabelMssgs(labelInput.value, sys).length));
		setInputInvalid(urlInput, Boolean(dialUrlMssgs(urlInput.value).length));
		if (mssgs.length) {setDialMssg(mssgs);}
		else if (!pinPlanConfirmed) {setDialMssg([]);}
	};

	const blockedLabelInput = (mssg) => {
		const mssgs = dialFormMssgs();
		applyBtn.hidden = !canSaveDial();
		setInputInvalid(labelInput, Boolean(dialLabelMssgs(labelInput.value, sys).length));
		setInputInvalid(urlInput, Boolean(dialUrlMssgs(urlInput.value).length));
		setDialMssg([mssg].concat(mssgs));
	};

	const resetPinPlan = () => {
		pinPlanConfirmed = false;
		applyBtn.textContent = editMode ? "Apply" : "Add";
		syncDialForm();
	};

	const addOpt = (select, value, label, selected = false) => {
		const opt = makeElement("option", { textContent: label });
		opt.value = value;
		opt.selected = selected;
		select.appendChild(opt);
	};

	const slotFree = (tabId, row, col) => !JSDPos.posTaken(JSDStore.makePos(tabId, row, col), oldPos);

	const rowFree = (tabId, row) => {
		const tab = JSDStore.tabById(tabId);
		for (let col = 0; col < tab.cols; col++) {if (slotFree(tabId, row, col)) {return true;}}
		return false;
	};

	const pinPlanForSelection = () => {
		if (tabSelect.value === archTabId || rowSelect.disabled || colSelect.disabled) {
			return { ok: false, mssgs: ["No pin target"], moves: [] };
		}
		const testDial = cloneData(workDial);
		testDial.position = JSDStore.makePos(tabSelect.value, Number(rowSelect.value), Number(colSelect.value));
		testDial.pinned = true;
		return JSDPos.pinMovePlan(testDial, oldPos);
	};

	const updPinRow = () => {
		const maxPins = JSDPos.getPins().length >= sys.maxPins;
		const hidePin = !workDial.pinned && (maxPins || !pinPlanForSelection().ok);
		pinRow.hidden = hidePin;
		pinRow.style.display = hidePin ? "none" : "";
		if (hidePin) {pinInput.checked = false;}
		syncDialForm();
	};

	const fillCols = (wantCol = null) => {
		const tab = JSDStore.tabById(tabSelect.value);
		clearElm(colSelect);
		if (!tab || tab.tabId === archTabId) {
			addOpt(colSelect, "0", "-");
			colSelect.disabled = true;
			updPinRow();
			return;
		}
		colSelect.disabled = false;
		for (let col = 0; col < tab.cols; col++) {
			if (slotFree(tab.tabId, Number(rowSelect.value), col)) {
				addOpt(colSelect, col.toString(), (col + 1).toString(), col === wantCol);
			}
		}
		if (wantCol !== null) {colSelect.value = wantCol.toString();}
		if (colSelect.options.length && colSelect.selectedIndex === -1) {colSelect.selectedIndex = 0;}
		updPinRow();
	};

	const fillRows = (wantRow = null, wantCol = null) => {
		const tab = JSDStore.tabById(tabSelect.value);
		clearElm(rowSelect);
		if (!tab || tab.tabId === archTabId) {
			addOpt(rowSelect, "0", "-");
			rowSelect.disabled = true;
			colSelect.disabled = true;
			updPinRow();
			return;
		}
		rowSelect.disabled = false;
		for (let row = 0; row < tab.rows; row++) {
			if (rowFree(tab.tabId, row)) {addOpt(rowSelect, row.toString(), (row + 1).toString(), row === wantRow);}
		}
		if (wantRow !== null) {rowSelect.value = wantRow.toString();}
		if (rowSelect.options.length && rowSelect.selectedIndex === -1) {rowSelect.selectedIndex = 0;}
		fillCols(wantCol);
	};

	const fillTabs = () => {
		clearElm(tabSelect);
		if (lockPos) {addOpt(tabSelect, workDial.position.tabId, workDial.position.tabId, true);return;}
		for (const tab of JSDStore.tabsByOrd()) {
			if (JSDPos.tabHasFree(tab.tabId, oldPos)) {
				addOpt(tabSelect, tab.tabId, tab.tabId, tab.tabId === workDial.position.tabId);
			}
		}
		if (editMode) {addOpt(tabSelect, archTabId, archTabId, false);}
		tabSelect.value = workDial.position.tabId;
		if (tabSelect.options.length && tabSelect.selectedIndex === -1) {tabSelect.selectedIndex = 0;}
	};

	const handleArchiveSelected = () => {
		const res = editMode ? JSDArch.delToArch(oldPos) : { ok: false, mssgs: ["Cannot archive new dial"] };
		if (res.ok) {JSDStore.commit();buildTabGrid();frm.dialog.remove();}
		showMssgs(res.mssgs);
	};

	const handlePinPlan = () => {
		if (!workDial.pinned || (editMode && dial.pinned)) {return true;}
		const plan = JSDPos.pinMovePlan(workDial, oldPos);
		if (!plan.ok) {setDialMssg(plan.mssgs);return false;}
		if (plan.moves.length && !pinPlanConfirmed) {
			pinPlanConfirmed = true;
			setDialMssg(["Pinning will move:"].concat(plan.mssgs));
			applyBtn.textContent = "Confirm pin";
			return false;
		}
		return true;
	};

	const handleSave = () => {
		if (tabSelect.value === archTabId) {handleArchiveSelected();return;}
		if (!canSaveDial()) {syncDialForm();return;}

		workDial.label = labelInput.value.normalize("NFC");
		workDial.url = urlInput.value.normalize("NFC");
		workDial.bgColor = bgInput.value;
		workDial.txtColor = txtInput.value;
		workDial.position = JSDStore.makePos(tabSelect.value, Number(rowSelect.value), Number(colSelect.value));
		workDial.pinned = !pinRow.hidden && pinInput.checked;

		if (!handlePinPlan()) {return;}

		const res = JSDStore.saveDial(workDial, oldPos);
		if (res.ok) {renderApp(appData);frm.dialog.remove();}
		showMssgs(res.mssgs);
	};

	const handleDelete = () => {
		const res = JSDArch.delToArch(oldPos);
		if (res.ok) {
			JSDStore.commit();
			buildTabGrid();
			frm.dialog.remove();
		}
		showMssgs(res.mssgs);
	};

	const delBtn = makeButton("Delete", handleDelete, "dialDelBtn");
	const applyBtn = makeButton(editMode ? "Apply" : "Add", handleSave);
	const cancelBtn = makeButton("Cancel", () => frm.dialog.remove());
	const pinRow = makeDialogRow("Pinned", pinInput);
	const delRow = makeDialogRow("Delete dial", delCheck);
	const actions = makeDialogActions(delBtn, applyBtn, cancelBtn);

	delBtn.hidden = true;
	pinRow.hidden = true;
	delRow.className = "delRow";

	labelInput.addEventListener("paste", (evt) => {evt.preventDefault();blockedLabelInput("Dial label does not accept pasting text");});
	labelInput.addEventListener("drop", (evt) => {evt.preventDefault();blockedLabelInput("Dial label does not accept dropping text");});
	labelInput.addEventListener("beforeinput", (evt) => blockTextBeforeInput(evt, labelInput, sys.maxDialLabelLen, blockedLabelInput, "Dial label"));
	labelInput.addEventListener("input", syncDialForm);
	urlInput.addEventListener("input", syncDialForm);
	bgInput.addEventListener("input", syncDialForm);
	txtInput.addEventListener("input", syncDialForm);
	delCheck.addEventListener("change", () => {delBtn.hidden = !delCheck.checked;});
	tabSelect.addEventListener("change", () => {resetPinPlan();fillRows(0, 0);});
	rowSelect.addEventListener("change", () => {resetPinPlan();fillCols(Number(colSelect.value));});
	colSelect.addEventListener("change", () => {resetPinPlan();fillRows(Number(rowSelect.value), Number(colSelect.value));});
	pinInput.addEventListener("change", resetPinPlan);
	frm.dialog.addEventListener("keydown", (evt) => {if (evt.key === "Escape") {frm.dialog.remove();}});

	frm.body.appendChild(makeDialogRow("Label", labelInput));
	frm.body.appendChild(makeDialogRow("URL", urlInput));
	frm.body.appendChild(makeDialogRow("Background", bgInput));
	frm.body.appendChild(makeDialogRow("Text", txtInput));
	frm.body.appendChild(makeDialogRow("Tab", tabSelect));
	frm.body.appendChild(makeDialogRow("Row", rowSelect));
	frm.body.appendChild(makeDialogRow("Column", colSelect));
	frm.body.appendChild(pinRow);
	if (editMode) {frm.body.appendChild(delRow);}

	const mssgRow = makeDialogRow(dialMssg);
	mssgRow.firstChild.colSpan = 2;
	frm.body.appendChild(mssgRow);

	const ftrRow = makeDialogRow(actions);
	ftrRow.firstChild.colSpan = 2;
	frm.foot.appendChild(ftrRow);

	fillTabs();
	fillRows(workDial.position.row, workDial.position.col);
	if (lockPos) {tabSelect.disabled = true;rowSelect.disabled = true;colSelect.disabled = true;}
	updPinRow();
	syncDialForm();

	document.body.appendChild(frm.dialog);
	labelInput.focus();
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// JSON dialog
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const jsonMsg = (elm, text) => {elm.textContent = text;console.info(text);};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const openJsonDialog = () => {
	let importParts = null;
	let tdChk = null;
	const frm = makeDialogFrame("jsonDlg", "JSON import / export");
	const jsonText = makeElement("textarea", { id: "jsonText" });
	const mssg = makeElement("div", { id: "jsonMssg", textContent: "Paste JSON, or click Export." });
	const fileInput = makeElement("input", { id: "jsonFileInput" });
	fileInput.type = "file";
	fileInput.accept = ".json,application/json";
	fileInput.hidden = true;

	const showBtns = () => {
		const setOK = Boolean(importParts && importParts.settings);
		const tdOK = Boolean(importParts && importParts.dials && tdChk && tdChk.ok);
		exportBtn.hidden = jsonText.value.length > 0;
		setBtn.hidden = !setOK;
		tdBtn.hidden = !tdOK;
		tdBtn.textContent = importParts && importParts.tabs ? "Import tabs+dials" : "Import dials";
		bothBtn.hidden = !(setOK && tdOK);
	};

	const analyseText = () => {
		try {
			const res = JSDJson.analyseJson(jsonText.value);
			importParts = res.parts;
			tdChk = res.tdChk;
			jsonMsg(mssg, res.mssg);
		} catch (err) {
			importParts = null;
			tdChk = null;
			jsonMsg(mssg, "JSON parse failed: " + err.message);
		}
		showBtns();
	};

	const closeDialog = () => {renderApp();frm.dialog.remove();};

	const doImport = (mode) => {
		if (jsonText.value.length === 0) {jsonText.focus();jsonMsg(mssg, "Paste JSON first.");return;}
		analyseText();
		const msgs = JSDJson.importMode(mode, importParts, tdChk);
		if (!msgs.length) {jsonMsg(mssg, "Selected import is not valid.");return;}
		showMssgs(msgs);
		closeDialog();
	};

	const handleExport = () => {
		jsonText.value = JSDStore.exportJson(true);
		importParts = null;
		tdChk = null;
		jsonText.focus();
		jsonText.select();
		jsonMsg(mssg, "Export JSON ready to copy.");
		showBtns();
	};

	const handleLoadFile = () => {
		fileInput.value = "";
		fileInput.click();
	};

	const handleFileChange = () => {
		if (!fileInput.files.length) {return;}
		const reader = new FileReader();
		reader.addEventListener("load", () => {
			jsonText.value = reader.result;
			analyseText();
		});
		reader.addEventListener("error", () => {
			jsonMsg(mssg, "Could not read selected file.");
			showBtns();
		});
		reader.readAsText(fileInput.files[0]);
	};

	const exportBtn = makeButton("Export", handleExport);
	const loadBtn = makeButton("Load JSON file", handleLoadFile);
	const setBtn = makeButton("Import settings", () => doImport("settings"));
	const tdBtn = makeButton("Import tabs+dials", () => doImport("tabsDials"));
	const bothBtn = makeButton("Import both", () => doImport("both"));
	const cancelBtn = makeButton("Cancel", closeDialog);
	const actions = makeDialogActions(exportBtn, loadBtn, setBtn, tdBtn, bothBtn, cancelBtn);

	showBtns();

	jsonText.addEventListener("input", () => {
		if (jsonText.value.length === 0) {
			importParts = null;
			tdChk = null;
			jsonMsg(mssg, "Paste JSON, or click Export.");
			showBtns();
			return;
		}
		analyseText();
	});
	fileInput.addEventListener("change", handleFileChange);
	frm.dialog.addEventListener("keydown", (event) => {if (event.key === "Escape") {closeDialog();}});

	frm.body.appendChild(makeDialogRow("JSON text", jsonText));

	const fileRow = makeDialogRow(fileInput);
	fileRow.firstChild.colSpan = 2;
	frm.body.appendChild(fileRow);

	const mssgRow = makeDialogRow(mssg);
	mssgRow.firstChild.colSpan = 2;
	frm.body.appendChild(mssgRow);

	const ftrRow = makeDialogRow(actions);
	ftrRow.firstChild.colSpan = 2;
	frm.foot.appendChild(ftrRow);

	document.body.appendChild(frm.dialog);
	jsonText.focus();
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
// Settings dialog
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const openSettingsDialog = () => {
	const frm = makeDialogFrame("settingsDlg", "Settings");
	const settingsMssg = makeElement("div", { id: "settingsMssg" });

	const runArchiveAction = (action) => {
		const res = action();
		showMssgs(res.mssgs);
		if (!res.ok) {setDialogMssg(settingsMssg, res.mssgs);return;}
		renderApp();
		frm.dialog.remove();
		openSettingsDialog();
	};

	const buildSysSttsBlock = () => {
		const sys = JSDStore.getSys();
		const block = Object.assign(document.createElement("div"), { className: "settingsBlock sysSettingsBlock" });
		const title = Object.assign(document.createElement("h3"), { textContent: "System settings" });
		const hdrRow = Object.assign(document.createElement("div"), { className: "settingsRow sysHdrRow" });
		const hdrSetting = Object.assign(document.createElement("span"), { className: "settingsLabel", textContent: "Setting" });
		const hdrMin = Object.assign(document.createElement("span"), { className: "settingsValue", textContent: "Min" });
		const hdrMax = Object.assign(document.createElement("span"), { className: "settingsValue", textContent: "Max" });
		hdrRow.append(hdrSetting, hdrMin, hdrMax);

		const minRows = Object.assign(makeSelect("", [3, 4, 5, 6], sys.minRows, "settingsValue"), { id: "setMinRows" });
		const maxRows = Object.assign(makeSelect("", [3, 4, 5, 6], sys.maxRows, "settingsValue"), { id: "setMaxRows" });
		const minCols = Object.assign(makeSelect("", [3, 4, 5, 6], sys.minCols, "settingsValue"), { id: "setMinCols" });
		const maxCols = Object.assign(makeSelect("", [3, 4, 5, 6], sys.maxCols, "settingsValue"), { id: "setMaxCols" });
		const minLblLenVal = Object.assign(document.createElement("span"), {className: "settingsValue", textContent: sys.minLabelLen.toString()});
		const blankMax = Object.assign(document.createElement("span"), { className: "settingsValue" });
		const minLabelSlct = makeSelect("setMinLabelLen", [3, 4, 5, 6, 7, 8], sys.minLabelLen, "settingsValue");
		const maxTabLabelSlct = makeSelect("setMaxTabLabelLen", [8, 9, 10, 11, 12], sys.maxTabLabelLen, "settingsValue");
		const maxDialLabelSlct = makeSelect("setMaxDialLabelLen", [8, 9, 10, 11, 12, 13, 14, 15, 16], sys.maxDialLabelLen, "settingsValue");

		block.append(title, hdrRow);

		for (const rowData of  [
			["Rows", minRows, maxRows],
			["Columns", minCols, maxCols],
			["Label length", minLabelSlct, blankMax],
			["Tab label", minLblLenVal, maxTabLabelSlct],
			["Dial label", minLblLenVal.cloneNode(true), maxDialLabelSlct]
		]) {
			const row = Object.assign(document.createElement("div"), { className: "settingsRow sysSettingsRow" });
			const label = Object.assign(document.createElement("span"), {className: "settingsLabel", textContent: rowData[0]});
			row.append(label, rowData[1], rowData[2]);
			block.appendChild(row);
		}

		return block;
	};

	const buildArchiveBlock = () => {
		const archiveDials = JSDStore.tabDials(archTabId);
		const archiveCount = archiveDials.length.toString();
		const block = Object.assign(document.createElement("div"), { className: "settingsBlock archiveBlock" });
		const title = Object.assign(document.createElement("h3"), { textContent: "Archive" });
		const countRow = Object.assign(document.createElement("div"), { className: "settingsRow" });
		const lblCount = Object.assign(document.createElement("span"), { className: "settingsLabel", textContent: "Items:" });
		const valCount = Object.assign(document.createElement("span"), { className: "settingsValue", textContent:  archiveCount });
		countRow.append(lblCount, valCount);
		const list = Object.assign(document.createElement("div"), { className: "archiveList" });

		if (!archiveDials.length) {
			const emptyRow = Object.assign(document.createElement("div"), {className: "archiveRow", textContent: "Archive empty"});
			list.appendChild(emptyRow);
		}

		for (const [idx, dial] of archiveDials.entries()) {
			const row = Object.assign(document.createElement("div"), { className: "archiveRow" });
			const order = Object.assign(document.createElement("span"), { className: "archiveOrder", textContent: (idx + 1).toString() });
			const label = Object.assign(document.createElement("span"), { className: "archiveLabel", textContent: dial.label || "" });
			const archPos = cloneData(dial.position);
			const restoreBtn = makeButton("restore", () => runArchiveAction(() => JSDArch.restoreFromArchPos(archPos)));
			const deleteBtn = makeButton("really delete", () => runArchiveAction(() => JSDArch.deleteFromArchPos(archPos)));
			row.append(order, label, restoreBtn, deleteBtn);
			list.appendChild(row);
		}

		block.append(title, countRow, list);
		return block;
	};

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
		pinGridBox.append(lblPinGrid, valPinGrid);
		maxPinsRow.append(lblMaxPins, valMaxPins, pinGridBox);

		const activeTabRow = Object.assign(document.createElement("div"), { className: "settingsRow" });
		const lblActiveTab = Object.assign(document.createElement("span"), { className: "settingsLabel", textContent: "Active tab:" });
		const valActiveTab = Object.assign(document.createElement("span"), { className: "settingsValue", textContent: usr.activeTabId });
		maxTabsRow.append(lblMaxTabs, valMaxTabs);
		activeTabRow.append(lblActiveTab, valActiveTab);
		block.append(title, maxTabsRow, maxPinsRow, activeTabRow);
		return block;
	};

	const buildUserSttsBlock = () => {
		const sys = JSDStore.getSys();
		const usr = JSDStore.getUsr();
		const viewLabels = { vView: "tabs left", hView: "tabs on top"};
		const nextView = usr.view === "vView" ? "hView" : "vView";

		const block = Object.assign(document.createElement("div"), { className: "settingsBlock usrSettingsBlock" });
		const title = Object.assign(document.createElement("h3"), { textContent: "User settings" });

		const viewRow = Object.assign(document.createElement("div"), { className: "settingsRow" });
		const lblView = Object.assign(document.createElement("span"), { className: "settingsLabel", textContent: "View:" });
		const bttnView = makeButton(viewLabels[nextView], () => {
			setView(nextView);
			renderApp();
			document.getElementById("settingsDlg").remove();
		});
		bttnView.className = "bttnViewToggle";
		viewRow.append(lblView, bttnView);

		const themeRow = Object.assign(document.createElement("div"), { className: "settingsRow" });
		const lblTheme = Object.assign(document.createElement("span"), { className: "settingsLabel", textContent: "Theme:" });
		const valTheme = makeSelect("setTheme", sys.themeOptions, usr.theme, "settingsValue");
		themeRow.append(lblTheme, valTheme);

		const contrastRow = Object.assign(document.createElement("div"), { className: "settingsRow contrastRow" });
		const lblContrast = Object.assign(document.createElement("span"), { className: "settingsLabel", textContent: "Contrast:" });
		const minContrast = Object.assign(document.createElement("input"), {id: "setUserContrastMin", className: "settingsValue", type: "number", step: "0.1", value: usr.contrastLevel[0]});
		const sysMinCntrast = Object.assign(document.createElement("span"), { className: "settingsLabel", textContent: sys.contrastLimits[0].toString() });
		const maxContrast = Object.assign(document.createElement("input"), {id: "setUserContrastMax", className: "settingsValue", type: "number", step: "0.1", value: usr.contrastLevel[1]});
		const sysMaxCntrast = Object.assign(document.createElement("span"), { className: "settingsLabel", textContent: sys.contrastLimits[1].toString() });
		contrastRow.append(lblContrast, minContrast, sysMinCntrast, maxContrast, sysMaxCntrast);

		const addDialsRow = Object.assign(document.createElement("div"), { className: "settingsRow" });
		const lblAddDials = Object.assign(document.createElement("span"), { className: "settingsLabel", textContent: "Show add dials:" });
		const valAddDials = makeSelect("setShowAddDials", ["true", "false"], usr.showAddDials, "settingsValue");
		valAddDials.options[0].textContent = "visible";
		valAddDials.options[1].textContent = "hidden";
		addDialsRow.append(lblAddDials, valAddDials);

		const jsonRow = Object.assign(document.createElement("div"), { className: "settingsRow" });
		const lblJson = Object.assign(document.createElement("span"), { className: "settingsLabel", textContent: "JSON:" });
		const jsonBtn = makeButton("import-export", () => {
			document.getElementById("settingsDlg").remove();
			openJsonDialog();
		}, "jsonImportExportBtn");
		jsonRow.append(lblJson, jsonBtn);

		block.append(title, viewRow, themeRow, contrastRow, addDialsRow, jsonRow);
		return block;
	};

	frm.body.appendChild(makeDialogRow(buildUserSttsBlock(), buildRdOnlyBlock()));
	frm.body.appendChild(makeDialogRow(buildArchiveBlock(), buildSysSttsBlock()));

	const handleApply = () => {
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
		const showAddDialsInput = document.getElementById("setShowAddDials");
		const msgs = [];

		if (Number(minRowsInput.value) > Number(maxRowsInput.value)) {msgs.push("minRows cannot be greater than maxRows");}
		if (Number(minColsInput.value) > Number(maxColsInput.value)) {msgs.push("minCols cannot be greater than maxCols");}
		if (Number(userContrastMinInput.value) > Number(userContrastMaxInput.value)) {msgs.push("user contrast min cannot be greater than max");}
		if (msgs.length) {setDialogMssg(settingsMssg, msgs);return;}

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
			contrastLevel: [Number(userContrastMinInput.value), Number(userContrastMaxInput.value)],
			theme: themeInput.value,
			showAddDials: showAddDialsInput.value === "true"
		};

		JSDStore.saveSettings(newSys, newUsr);
		renderApp();
		frm.dialog.remove();
		showMssgs(["settings saved"]);
	};

	const mssgRow = makeDialogRow(settingsMssg);
	mssgRow.firstChild.colSpan = 2;
	frm.body.appendChild(mssgRow);

	const applyBtn = makeButton("Apply", handleApply);
	const closeBtn = makeButton("Close", () => document.getElementById("settingsDlg").remove());
	const actions = makeDialogActions(applyBtn, closeBtn);

	const ftrRow = makeDialogRow(actions);
	ftrRow.firstChild.colSpan = 2;
	frm.foot.appendChild(ftrRow);

	setDialogMssg(settingsMssg, []);
	frm.dialog.tabIndex = -1;
	frm.dialog.addEventListener("keydown", (evt) => {if (evt.key === "Escape") {frm.dialog.remove();}});
	document.body.appendChild(frm.dialog);
	frm.dialog.focus();
};