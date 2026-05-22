/*
	dlg_Json.js
	Version = 20260522
*/
"use strict";
//==============================================================================
const jsonParts = (data) => {
	const parts = { settings: null, tabs: null, dials: null };
	if (data.systemSettings || data.userSettings) {
		parts.settings = {};
		if (data.systemSettings) {
			parts.settings.systemSettings = data.systemSettings;
		}
		if (data.userSettings) {
			parts.settings.userSettings = data.userSettings;
		}
	}
	if (data.settings) {
		parts.settings = parts.settings || {};
		if (data.settings.systemSettings) {
			parts.settings.systemSettings = data.settings.systemSettings;
		}
		if (data.settings.userSettings) {
			parts.settings.userSettings = data.settings.userSettings;
		}
		if (!data.settings.systemSettings && !data.settings.userSettings) {
			parts.settings.userSettings = data.settings;
		}
	}
	if (Array.isArray(data.allTabs)) {
		parts.tabs = data.allTabs;
	}
	if (Array.isArray(data.tabs)) {
		parts.tabs = data.tabs;
	}
	if (Array.isArray(data.allDials)) {
		parts.dials = data.allDials;
	}
	if (Array.isArray(data.dials)) {
		parts.dials = data.dials;
	}
	return parts;
};
//==============================================================================
const jsonMsg = (elm, text) => {
	elm.textContent = text;
	console.info(text);
};
//==============================================================================
const jsonUserTabs = (tabs) => tabs.filter((tab) => tab.tabId !== archTabId);
//==============================================================================
const jsonTabMap = (tabs) => {
	const map = {};
	for (const tab of tabs) {
		map[tab.tabId] = tab;
	}
	return map;
};
//==============================================================================
const chkTabsDials = (tabs, dials) => {
	const res = { ok: true, mssgs: [] };
	const maxTabs = JSDStore.getSys().maxTabs - 1;
	const userTabs = jsonUserTabs(tabs);
	const tabMap = jsonTabMap(tabs);
	const tabNames = {};
	const dialPos = {};
	if (userTabs.length > maxTabs) {
		res.ok = false;
		res.mssgs.push("tabs invalid: " + userTabs.length + " user tabs, max is " + maxTabs);
	}
	for (const tab of tabs) {
		if (tabNames[tab.tabId]) {
			res.ok = false;
			res.mssgs.push("tabs invalid: duplicate tab " + tab.tabId);
		}
		tabNames[tab.tabId] = true;
	}
	for (const dial of dials) {
		const pos = dial.position || {};
		const tab = tabMap[pos.tabId];
		const key = pos.tabId + ":" + pos.row + ":" + pos.col;
		if (!tab) {
			res.ok = false;
			res.mssgs.push("dials invalid: missing tab " + pos.tabId + " for " + dial.label);
			continue;
		}
		if (pos.row < 0 || pos.col < 0 || pos.row >= tab.rows || pos.col >= tab.cols) {
			res.ok = false;
			res.mssgs.push("dials invalid: position outside tab for " + dial.label);
		}
		if (dialPos[key]) {
			res.ok = false;
			res.mssgs.push("dials invalid: duplicate position " + key);
		}
		dialPos[key] = true;
	}
	return res;
};
//==============================================================================
const jsonSummary = (parts, tdChk) => {
	const found = [
		parts.settings ? "settings" : null,
		parts.tabs ? "tabs" : null,
		parts.dials ? "dials" : null
	].filter(Boolean).join(", ");
	const lines = ["Found: " + (found || "nothing importable")];
	if (parts.settings) {
		lines.push("settings OK");
	}
	if (parts.dials) {
		if (tdChk.ok) {
			lines.push(parts.tabs ? "tabs+dials OK" : "dials OK with current tabs");
			if (parts.tabs) {
				lines.push("user tabs: " + JSDStore.usrTabs().length + " -> " + jsonUserTabs(parts.tabs).length);
			}
			lines.push("dials: " + JSDStore.getDials().length + " -> " + parts.dials.length);
		} else {
			lines.push(tdChk.mssgs.join("\n"));
		}
	} else if (parts.tabs) {
		lines.push("tabs+dials unavailable: dials key is required with tabs.");
	}
	return lines.join("\n");
};
//==============================================================================
const openJsonDialog = () => {
	let importParts = null;
	let tdChk = null;
	const dialog = makeElement("div", { id: "jsonDlg" });
	const panel = makeElement("div", { id: "jsonDlgPanel" });
	const title = makeElement("h2", { textContent: "JSON import / export" });
	const textWrap = makeElement("div", { className: "jsonText" });
	const textLbl = makeElement("label", { textContent: "JSON text" });
	const jsonText = makeElement("textarea", { id: "jsonText" });
	const mssg = makeElement("div", { className: "jsonMssg", textContent: "Paste JSON, or click Export." });
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
	const analyseJson = () => {
		try {
			importParts = jsonParts(JSON.parse(jsonText.value));
			tdChk = importParts.dials ? chkTabsDials(importParts.tabs || JSDStore.getTabs(), importParts.dials) : null;
			jsonMsg(mssg, jsonSummary(importParts, tdChk));
		} catch (err) {
			importParts = null;
			tdChk = null;
			jsonMsg(mssg, "JSON parse failed: " + err.message);
		}
		showBtns();
	};
	const importSettings = () => {
		const data = {};
		if (importParts.settings.systemSettings) {
			data.systemSettings = importParts.settings.systemSettings;
		}
		if (importParts.settings.userSettings) {
			data.userSettings = importParts.settings.userSettings;
		}
		JSDStore.replUsr(data);
		return ["settings imported"];
	};
	const importTabsDials = () => {
		if (importParts.tabs) {
			return JSDStore.replTabsDials(importParts.tabs, importParts.dials).mssgs;
		}
		return JSDStore.replDials(importParts.dials).mssgs;
	};
	const closeDialog = () => {
		renderApp();
		dialog.remove();
	};
	const doImport = (mode) => {
		const msgs = [];
		if (jsonText.value.length === 0) {
			jsonText.focus();
			jsonMsg(mssg, "Paste JSON first.");
			return;
		}
		analyseJson();
		if (mode === "settings" && importParts && importParts.settings) {
			msgs.push(importSettings().join("\n"));
		}
		if (mode === "tabsDials" && importParts && importParts.dials && tdChk && tdChk.ok) {
			msgs.push(importTabsDials().join("\n"));
		}
		if (mode === "both" && importParts && importParts.settings && importParts.dials && tdChk && tdChk.ok) {
			msgs.push(importSettings().join("\n"));
			msgs.push(importTabsDials().join("\n"));
		}
		if (!msgs.length) {
			jsonMsg(mssg, "Selected import is not valid.");
			return;
		}
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
		analyseJson();
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
		if (!fileInput.files.length) {
			return;
		}
		const reader = new FileReader();
		reader.addEventListener("load", () => {
			jsonText.value = reader.result;
			analyseJson();
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
	dialog.addEventListener("keydown", (event) => {
		if (event.key === "Escape") {
			closeDialog();
		}
	});
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
