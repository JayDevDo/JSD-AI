/*
	dlg_Json.js
	Version = 20260526
*/
"use strict";
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const jsonMsg = (elm, text) => {elm.textContent = text;console.info(text);};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const openJsonDialog = () => {
	let importParts = null;
	let tdChk = null;
	const dialog = makeElement("div", { id: "jsonDlg" });
	const panel = makeElement("div", { id: "jsonDlgPanel" });
	const title = makeElement("h2", { textContent: "JSON import / export" });
	const textWrap = makeElement("div", { id: "jsonTextWrap" });
	const textLbl = makeElement("label", { textContent: "JSON text" });
	const jsonText = makeElement("textarea", { id: "jsonText" });
	const mssg = makeElement("div", { id: "jsonMssg", textContent: "Paste JSON, or click Export." });
	const actions = makeElement("div", { className: "dialogActions" });
	const exportBtn = makeElement("button", { textContent: "Export" });
	const loadBtn = makeElement("button", { textContent: "Load JSON file" });
	const fileInput = makeElement("input", { id: "jsonFileInput" });
	const setBtn = makeElement("button", { textContent: "Import settings" });
	const tdBtn = makeElement("button", { textContent: "Import tabs+dials" });
	const bothBtn = makeElement("button", { textContent: "Import both" });
	const cancelBtn = makeElement("button", { textContent: "Cancel" });
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
	const closeDialog = () => {	renderApp();dialog.remove();};
	const doImport = (mode) => {
		if (jsonText.value.length === 0) {jsonText.focus();	jsonMsg(mssg, "Paste JSON first.");	return;	}
		analyseText();
		const msgs = JSDJson.importMode(mode, importParts, tdChk);
		if (!msgs.length) {	jsonMsg(mssg, "Selected import is not valid.");	return;	}
		showMssgs(msgs);
		closeDialog();
	};
	exportBtn.type = "button";
	loadBtn.type = "button";
	fileInput.type = "file";
	fileInput.accept = ".json,application/json";
	fileInput.hidden = true;
	setBtn.type = "button";
	tdBtn.type = "button";
	bothBtn.type = "button";
	cancelBtn.type = "button";
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
	exportBtn.addEventListener("click", () => {
		jsonText.value = JSDStore.exportJson(true);
		importParts = null;
		tdChk = null;
		jsonText.focus();
		jsonText.select();
		jsonMsg(mssg, "Export JSON ready to copy.");
		showBtns();
	});
	loadBtn.addEventListener("click", () => {
		fileInput.value = "";
		fileInput.click();
	});
	fileInput.addEventListener("change", () => {
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
	});
	setBtn.addEventListener("click", () => doImport("settings"));
	tdBtn.addEventListener("click", () => doImport("tabsDials"));
	bothBtn.addEventListener("click", () => doImport("both"));
	cancelBtn.addEventListener("click", closeDialog);
	dialog.addEventListener("keydown", (event) => {	if (event.key === "Escape") {closeDialog();}});
	textWrap.appendChild(textLbl);
	textWrap.appendChild(jsonText);
	actions.appendChild(exportBtn);
	actions.appendChild(loadBtn);
	actions.appendChild(setBtn);
	actions.appendChild(tdBtn);
	actions.appendChild(bothBtn);
	actions.appendChild(cancelBtn);
	panel.appendChild(title);
	panel.appendChild(textWrap);
	panel.appendChild(fileInput);
	panel.appendChild(mssg);
	panel.appendChild(actions);
	dialog.appendChild(panel);
	document.body.appendChild(dialog);
	jsonText.focus();
};