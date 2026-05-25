/*
	fctr_Json.js
	Version = 20260525
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
const analyseJson = (jsonText) => {
	let data = JSON.parse(jsonText);
	if (typeof JSDOldJson !== "undefined" && JSDOldJson.isOldJson(data)) {data = JSDOldJson.convertDataToImportJson(data);}
	const parts = jsonParts(data);
	const tdChk = parts.dials ? chkTabsDials(parts.tabs || JSDStore.getTabs(), parts.dials) : null;
	return {
		ok: true,
		parts: parts,
		tdChk: tdChk,
		mssg: jsonSummary(parts, tdChk)
	};
};
//==============================================================================
const importSettings = (parts) => {
	const data = {};
	if (parts.settings.systemSettings) {
		data.systemSettings = parts.settings.systemSettings;
	}
	if (parts.settings.userSettings) {
		data.userSettings = parts.settings.userSettings;
	}
	JSDStore.replUsr(data);
	return ["settings imported"];
};
//==============================================================================
const importTabsDials = (parts) => {
	if (parts.tabs) {
		return JSDStore.replTabsDials(parts.tabs, parts.dials).mssgs;
	}
	return JSDStore.replDials(parts.dials).mssgs;
};
//==============================================================================
const importMode = (mode, parts, tdChk) => {
	const msgs = [];
	if (mode === "settings" && parts && parts.settings) {
		msgs.push(importSettings(parts).join("\n"));
	}
	if (mode === "tabsDials" && parts && parts.dials && tdChk && tdChk.ok) {
		msgs.push(importTabsDials(parts).join("\n"));
	}
	if (mode === "both" && parts && parts.settings && parts.dials && tdChk && tdChk.ok) {
		msgs.push(importSettings(parts).join("\n"));
		msgs.push(importTabsDials(parts).join("\n"));
	}
	return msgs;
};
//==============================================================================
const JSDJson = {
	analyseJson: analyseJson,
	importMode: importMode
};