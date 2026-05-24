/*
	dlg_Dial.js
	Version = 20260524
*/
"use strict";
//==============================================================================
const openDialDialog = (pos, dial = null) => {
	const appData = JSDStore.getData();
	const sys = JSDStore.getSys();
	const editMode = Boolean(dial);
	const oldPos = editMode ? cloneData(dial.position) : null;
	const workDial = dial ? cloneData(dial) : JSDStore.newDial(pos);
	if (!editMode) {
		const tab = JSDStore.tabById(pos.tabId);
		workDial.bgColor = tab.txtColor;
		workDial.txtColor = tab.bgColor;
	}
	const lockPos = editMode && workDial.pinned;
	const dialog = makeElement("div", { id: "dialDlg" });
	const panel = makeElement("div", { id: "dialDlgPanel" });
	const title = makeElement("h2", { textContent: editMode ? "Edit dial" : "Add dial" });
	const tabSelect = makeElement("select", { id: "dialTabSelect" });
	const rowSelect = makeElement("select", { id: "dialRowSelect" });
	const colSelect = makeElement("select", { id: "dialColSelect" });
	const labelInput = makeTextInput("dialLabelInput", workDial.label, sys.minLabelLen, sys.maxDialLabelLen);
	const urlInput = makeElement("textarea", { id: "dialUrlInput" });
	const bgInput = makeColorInput("dialBgInput", workDial.bgColor);
	const txtInput = makeColorInput("dialTxtInput", workDial.txtColor);
	const pinInput = makeElement("input", { id: "dialPinInput" });
	const pinRow = makeDialogRow("Pinned", pinInput);
	const delCheck = makeElement("input", { id: "dialDelCheck" });
	const delBtn = makeElement("button", { id: "dialDelBtn", textContent: "Delete" });
	const delRow = makeElement("div", { className: "dialogRow delRow" });
	const actions = makeElement("div", { className: "dialogActions" });
	const applyBtn = makeElement("button", { textContent: editMode ? "Apply" : "Add" });
	const cancelBtn = makeElement("button", { textContent: "Cancel" });
	const planMssg = makeElement("div", { id: "dialPlanMssg" });
	let pinPlanConfirmed = false;
	urlInput.value = workDial.url;
	urlInput.rows = 3;
	urlInput.wrap = "soft";
	urlInput.spellcheck = false;
	pinInput.type = "checkbox";
	pinInput.checked = workDial.pinned;
	delCheck.type = "checkbox";
	delBtn.type = "button";
	delBtn.hidden = true;
	applyBtn.type = "button";
	cancelBtn.type = "button";
	pinRow.hidden = true;
	planMssg.hidden = true;
	const resetPinPlan = () => {
		pinPlanConfirmed = false;
		planMssg.hidden = true;
		planMssg.textContent = "";
		applyBtn.textContent = editMode ? "Apply" : "Add";
	};
	const addOpt = (select, value, label, selected = false) => {
		const opt = makeElement("option", { textContent: label });
		opt.value = value;
		opt.selected = selected;
		select.appendChild(opt);
	};
	const slotFree = (tabId, row, col) => {
		return !JSDPos.posTaken(JSDStore.makePos(tabId, row, col), oldPos);
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
		pinRow.style.display = hidePin ? "none" : "contents";
		if (hidePin) {pinInput.checked = false;}
	};
	const rowFree = (tabId, row) => {
		const tab = JSDStore.tabById(tabId);
		for (let col = 0; col < tab.cols; col++) {
			if (slotFree(tabId, row, col)) {return true;}
		}
		return false;
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
			if (rowFree(tab.tabId, row)) {
				addOpt(rowSelect, row.toString(), (row + 1).toString(), row === wantRow);
			}
		}
		if (wantRow !== null) {rowSelect.value = wantRow.toString();}
		if (rowSelect.options.length && rowSelect.selectedIndex === -1) {rowSelect.selectedIndex = 0;}
		fillCols(wantCol);
	};
	const fillTabs = () => {
		clearElm(tabSelect);
		if (lockPos) {
			addOpt(tabSelect, workDial.position.tabId, workDial.position.tabId, true);
			return;
		}
		for (const tab of JSDStore.tabsByOrd()) {
			if (JSDPos.tabHasFree(tab.tabId, oldPos)) {
				addOpt(tabSelect, tab.tabId, tab.tabId, tab.tabId === workDial.position.tabId);
			}
		}
		if (editMode) {addOpt(tabSelect, archTabId, archTabId, false);}
		tabSelect.value = workDial.position.tabId;
		if (tabSelect.options.length && tabSelect.selectedIndex === -1) {tabSelect.selectedIndex = 0;}
	};
	delCheck.addEventListener("change", () => {
		delBtn.hidden = !delCheck.checked;
	});
	tabSelect.addEventListener("change", () => {
		resetPinPlan();
		fillRows(0, 0);
	});
	rowSelect.addEventListener("change", () => {
		resetPinPlan();
		fillCols(Number(colSelect.value));
	});
	colSelect.addEventListener("change", () => {
		resetPinPlan();
		fillRows(Number(rowSelect.value), Number(colSelect.value));
	});
	pinInput.addEventListener("change", resetPinPlan);
	applyBtn.addEventListener("click", () => {
		if (tabSelect.value === archTabId) {
			const res = editMode ? JSDArch.delToArch(oldPos) : { ok: false, mssgs: ["Cannot archive new dial"] };
			if (res.ok) {
				JSDStore.commit();
				buildTabGrid();
				dialog.remove();
			}
			if (typeof showMssgs === "function") {showMssgs(res.mssgs);}
			return;
		}
		workDial.label = labelInput.value;
		workDial.url = urlInput.value;
		workDial.bgColor = bgInput.value;
		workDial.txtColor = txtInput.value;
		workDial.position = JSDStore.makePos(tabSelect.value, Number(rowSelect.value), Number(colSelect.value));
		workDial.pinned = !pinRow.hidden && pinInput.checked;
		if (workDial.pinned && (!editMode || !dial.pinned)) {
			const plan = JSDPos.pinMovePlan(workDial, oldPos);
			if (!plan.ok) {
				planMssg.hidden = false;
				planMssg.textContent = plan.mssgs.join("\n");
				return;
			}
			if (plan.moves.length && !pinPlanConfirmed) {
				pinPlanConfirmed = true;
				planMssg.hidden = false;
				planMssg.textContent = "Pinning will move:\n" + plan.mssgs.join("\n");
				applyBtn.textContent = "Confirm pin";
				return;
			}
		}
		const res = JSDStore.saveDial(workDial, oldPos);
		if (res.ok) {
			renderApp(appData);
			dialog.remove();
		}
		if (typeof showMssgs === "function") {showMssgs(res.mssgs);}
	});
	delBtn.addEventListener("click", () => {
		const res = JSDArch.delToArch(oldPos);
		if (res.ok) {
			JSDStore.commit();
			buildTabGrid();
			dialog.remove();
		}
		if (typeof showMssgs === "function") {showMssgs(res.mssgs);}
	});
	cancelBtn.addEventListener("click", () => dialog.remove());
	delRow.appendChild(makeElement("label", { textContent: "Delete dial" }));
	delRow.appendChild(delCheck);
	actions.appendChild(delBtn);
	actions.appendChild(applyBtn);
	actions.appendChild(cancelBtn);
	fillTabs();
	fillRows(workDial.position.row, workDial.position.col);
	if (lockPos) {
		tabSelect.disabled = true;
		rowSelect.disabled = true;
		colSelect.disabled = true;
	}
	updPinRow();
	panel.appendChild(title);
	panel.appendChild(makeDialogRow("Label", labelInput));
	panel.appendChild(makeDialogRow("URL", urlInput));
	panel.appendChild(makeDialogRow("Background", bgInput));
	panel.appendChild(makeDialogRow("Text", txtInput));
	panel.appendChild(makeDialogRow("Tab", tabSelect));
	panel.appendChild(makeDialogRow("Row", rowSelect));
	panel.appendChild(makeDialogRow("Column", colSelect));
	panel.appendChild(pinRow);
	if (editMode) {panel.appendChild(delRow);}
	panel.appendChild(planMssg);
	panel.appendChild(actions);
	dialog.appendChild(panel);
	document.body.appendChild(dialog);
	labelInput.focus();
};