/*
	dlg_Tab.js
	Version = 20260526
*/
"use strict";
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const openTabDialog = (tab = null) => {
	const appData = JSDStore.getData();
	const sys = JSDStore.getSys();
	const editMode = Boolean(tab);
	const oldId = editMode ? tab.tabId : null;
	const workTab = tab ? cloneData(tab) : JSDStore.newTab();
	const dialog = makeElement("div", { id: "tabDlg" });
	const panel = makeElement("div", { id: "tabDlgPanel" });
	const title = makeElement("h2", { textContent: editMode ? "Edit tab" : "Add tab" });
	const tabInput = makeTextInput("tabIdInput", workTab.tabId, sys.minLabelLen, sys.maxTabLabelLen);
	const rowsSelect = makeNumberSelect("tabRowsSelect", sys.minRows, sys.maxRows, workTab.rows);
	const colsSelect = makeNumberSelect("tabColsSelect", sys.minCols, sys.maxCols, workTab.cols);
	const ordSelect = makeNumberSelect("tabOrderSelect", 1, JSDStore.usrTabs().length + (editMode ? 0 : 1), workTab.order);
	const bgInput = makeColorInput("tabBgInput", workTab.bgColor);
	const txtInput = makeColorInput("tabTxtInput", workTab.txtColor);
	const delCheck = makeElement("input", { id: "tabDelCheck" });
	const delBtn = makeElement("button", { id: "tabDelBtn", textContent: "Delete" });
	const delRow = makeElement("div", { className: "dialogRow delRow" });
	const actions = makeElement("div", { className: "dialogActions" });
	const applyBtn = makeElement("button", { textContent: editMode ? "Apply" : "Add" });
	const cancelBtn = makeElement("button", { textContent: "Cancel" });
	const validTab = (tabId) => {
		if (tabId.length < sys.minLabelLen || tabId.length > sys.maxTabLabelLen) {return false;}
		for (const oldTab of JSDStore.getTabs()) {
			if (oldId !== null && oldTab.tabId === oldId) {continue;}
			if (oldTab.tabId.toLowerCase() === tabId.toLowerCase()) {return false;}
		}
		return true;
	};
	delCheck.type = "checkbox";
	delBtn.type = "button";
	delBtn.hidden = true;
	applyBtn.type = "button";
	cancelBtn.type = "button";
	delCheck.addEventListener("change", () => {
		delBtn.hidden = !delCheck.checked;
	});
	applyBtn.addEventListener("click", () => {
		if (!validTab(tabInput.value)) {
			if (typeof showMssgs === "function") {showMssgs(["Tab name not valid or already used: " + tabInput.value]);}
			return;
		}
		workTab.tabId = tabInput.value;
		workTab.rows = Number(rowsSelect.value);
		workTab.cols = Number(colsSelect.value);
		workTab.order = Number(ordSelect.value);
		workTab.bgColor = bgInput.value;
		workTab.txtColor = txtInput.value;
		const res = JSDStore.saveTab(workTab, oldId);
		if (res.ok) {renderApp(appData);dialog.remove();}
		if (typeof showMssgs === "function") {showMssgs(res.mssgs);}
	});
	delBtn.addEventListener("click", () => {
		const res = JSDStore.delTab(oldId);
		if (res.ok) {renderApp(appData);dialog.remove();}
		if (typeof showMssgs === "function") {showMssgs(res.mssgs);}
	});
	cancelBtn.addEventListener("click", () => dialog.remove());
	delRow.appendChild(makeElement("label", { textContent: "Delete tab" }));
	delRow.appendChild(delCheck);
	actions.appendChild(delBtn);
	actions.appendChild(applyBtn);
	actions.appendChild(cancelBtn);
	panel.appendChild(title);
	panel.appendChild(makeDialogRow("Tab", tabInput));
	panel.appendChild(makeDialogRow("Rows", rowsSelect));
	panel.appendChild(makeDialogRow("Columns", colsSelect));
	panel.appendChild(makeDialogRow("Order", ordSelect));
	panel.appendChild(makeDialogRow("Background", bgInput));
	panel.appendChild(makeDialogRow("Text", txtInput));
	if (editMode) {panel.appendChild(delRow);}
	panel.appendChild(actions);
	dialog.appendChild(panel);
	document.body.appendChild(dialog);
	tabInput.focus();
};