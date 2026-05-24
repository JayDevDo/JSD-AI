/*
	fctr_LclStrg.js
	Version = 20260521-test
	Rules:
	- Tabs are identified by tabId.
	- tabId is the visible tab name.
	- Dials are identified by position.
	- Tab display order is stored in tab.order.
	- allTabs array order is not trusted for display order.
	- LocalStorage wins when present.
	- Default data is used only when LocalStorage is empty.
	- Init only repairs missing ARCHIVE tab.
	- No jQuery.
	- No data-*.
	- No constructors.
	- No generated position classes.
*/
"use strict";
const lsKey = "JSD.appData";
const defFile = "default-JSD.json";
const archTabId = "ARCHIVE";
let appData = null;
//==============================================================================
const cloneData = (value) => JSON.parse(JSON.stringify(value));
//==============================================================================
const newTab = () => {
	return {
		tabId: "TAB" + appData.allTabs.length,
		rows: 4,
		cols: 6,
		bgColor: "#000000",
		txtColor: "#FFFFFF",
		order: appData.allTabs.length
	};
};
//==============================================================================
const newDial = (pos) => {
	return {
		label: "new dial",
		url: "https://",
		bgColor: "#000000",
		txtColor: "#FFFFFF",
		position: cloneData(pos),
		pinned: false,
		lastClicked: ""
	};
};
//==============================================================================
const loadDefs = async () => {
	const resp = await fetch(defFile, { cache: "no-store" });
	if (!resp.ok) {throw new Error("Could not load " + defFile);}
	return await resp.json();
};
//==============================================================================
const readStore = () => {
	const rawData = localStorage.getItem(lsKey);
	if (!rawData) {return null;}
	try {
		return JSON.parse(rawData);
	} catch (err) {
		console.error("readStore failed:", err);
		return null;
	}
};
//==============================================================================
const writeStore = (data) => localStorage.setItem(lsKey, JSON.stringify(data));
//==============================================================================
const initData = async () => {
	const defs = await loadDefs();
	const store = readStore();
	appData = store ? cloneData(store) : cloneData(defs);
	if (!store) {
		writeStore(appData);
		return appData;
	}
	if (!tabById(archTabId)) {
		appData.allTabs.unshift(cloneData(defs.allTabs.find((tab) => tab.tabId === archTabId)));
		fixTabOrd();
		writeStore(appData);
	}
	return appData;
};
//==============================================================================
const saveData = () => {
	writeStore(appData);
	return appData;
};
//==============================================================================
const getData = () => appData;
//==============================================================================
const getSys = () => appData.systemSettings;
//==============================================================================
const getUsr = () => appData.userSettings;
//==============================================================================
const getTabs = () => appData.allTabs;
//==============================================================================
const getDials = () => appData.allDials;
//==============================================================================
const saveUsr = (usr) => {
	appData.userSettings = Object.assign({}, appData.userSettings, usr);
	return saveData();
};
//==============================================================================
const tabIdx = (tabId) => {
	for (let idx = 0; idx < appData.allTabs.length; idx++) {
		if (appData.allTabs[idx].tabId === tabId) {return idx;}
	}
	return -1;
};
//==============================================================================
const tabById = (tabId) => {
	const idx = tabIdx(tabId);
	if (idx === -1) {return null;}
	return appData.allTabs[idx];
};
//==============================================================================
const dialAt = (pos) => {
	for (const dial of appData.allDials) {
		if (JSDPos.samePos(dial.position, pos)) {return dial;}
	}
	return null;
};
//==============================================================================
const tabDials = (tabId) => {
	return appData.allDials.filter((dial) => dial.position.tabId === tabId).sort((dialA, dialB) => {
		if (dialA.position.row !== dialB.position.row) {return dialA.position.row - dialB.position.row;}
		return dialA.position.col - dialB.position.col;
	});
};
//==============================================================================
const sortTabs = (tabs) => tabs.slice().sort((tabA, tabB) => tabA.order - tabB.order);
//==============================================================================
const usrTabs = () => appData.allTabs.filter((tab) => tab.tabId !== archTabId);
//==============================================================================
const tabsByOrd = () => sortTabs(usrTabs());
//==============================================================================
const fixTabOrd = () => {
	appData.allTabs = [tabById(archTabId)].concat(tabsByOrd());
	for (let idx = 0; idx < appData.allTabs.length; idx++) {appData.allTabs[idx].order = idx;}
};
//==============================================================================
const setTabOrd = (tabId, order) => {
	const tab = tabById(tabId);
	const tabs = tabsByOrd().filter((oldTab) => oldTab.tabId !== tabId);
	tabs.splice(Math.max(0, Math.min(order - 1, tabs.length)), 0, tab);
	appData.allTabs = [tabById(archTabId)].concat(tabs);
	for (let idx = 0; idx < appData.allTabs.length; idx++) {appData.allTabs[idx].order = idx;}
};
//==============================================================================
const saveDial = (dial, oldPos = null) => {
	const chk = JSDPos.pinOK(dial, oldPos);
	if (!chk.ok) {return chk;}
	const res = { ok: true, mssgs: chk.mssgs };
	if (!dial.pinned && oldPos && !JSDPos.samePos(oldPos, dial.position)) {
		if (JSDPos.posTaken(dial.position, oldPos)) {return { ok: false, mssgs: ["Position is taken"] };}
	} else if (!oldPos && JSDPos.posTaken(dial.position)) {
		return { ok: false, mssgs: ["Position is taken"] };
	}
	appData.allDials = appData.allDials.filter((oldDial) => !JSDPos.samePos(oldDial.position, oldPos || dial.position));
	if (dial.pinned) {
		const moveRes = JSDPos.moveForPin(dial, oldPos);
		if (!moveRes.ok) {return moveRes;}
		res.mssgs = res.mssgs.concat(moveRes.mssgs);
	}
	appData.allDials.push(cloneData(dial));
	saveData();
	res.mssgs.push("Saved dial: " + dial.label);
	return res;
};
//==============================================================================
const saveTab = (tab, oldId = null) => {
	const res = { ok: true, mssgs: [] };
	for (const dial of JSDPos.getPins()) {
		if (dial.position.row >= tab.rows || dial.position.col >= tab.cols) {
			return { ok: false, mssgs: ["Cannot resize, pinned dial would not fit: " + dial.label] };
		}
	}
	if (oldId !== null) {
		const chk = JSDPos.moveOut(tabById(oldId), tab.rows, tab.cols);
		if (!chk.ok) {return chk;}
		res.mssgs = res.mssgs.concat(chk.mssgs);
	}
	if (oldId !== null && oldId !== tab.tabId) {
		for (const dial of appData.allDials) {
			if (dial.position.tabId === oldId) {dial.position.tabId = tab.tabId;}
		}
		if (appData.userSettings.activeTabId === oldId) {appData.userSettings.activeTabId = tab.tabId;}
	}
	const idx = tabIdx(oldId || tab.tabId);
	if (idx === -1) {appData.allTabs.push(cloneData(tab));}
	else {appData.allTabs[idx] = cloneData(tab);}
	setTabOrd(tab.tabId, tab.order);
	saveData();
	res.mssgs.push("Saved tab: " + tab.tabId);
	return res;
};
//==============================================================================
const delTab = (tabId) => {
	const idx = tabIdx(tabId);
	const res = { ok: true, mssgs: [] };
	if (tabId === archTabId) {return { ok: false, mssgs: ["Archive tab cannot be deleted"] };}
	if (idx === -1) {return { ok: false, mssgs: ["Tab not found: " + tabId] };}
	for (const dial of tabDials(tabId).slice()) {
		if (typeof JSDArch !== "undefined") {res.mssgs = res.mssgs.concat(JSDArch.archDial(dial).mssgs);}
	}
	appData.allTabs.splice(tabIdx(tabId), 1);
	fixTabOrd();
	if (appData.userSettings.activeTabId === tabId) {
		appData.userSettings.activeTabId = tabsByOrd().length ? tabsByOrd()[0].tabId : archTabId;
	}
	saveData();
	res.mssgs.push("Deleted tab: " + tabId);
	return res;
};
//==============================================================================
const setActTab = (tabId) => {
	appData.userSettings.activeTabId = tabId;
	return saveData();
};
//==============================================================================
const setLastClk = (pos) => {
	const dial = dialAt(pos);
	if (dial) {dial.lastClicked = new Date().toISOString();}
	return saveData();
};
//==============================================================================
const makePos = (tabId, row, col) => {return { tabId: tabId, row: row, col: col };};
//==============================================================================
const exportJson = (pretty = true) => {
	if (pretty) {return JSON.stringify(appData, null, "\t");}
	return JSON.stringify(appData);
};
//==============================================================================
const replDials = (dials) => {
	const oldDials = appData.allDials.length;
	const res = { ok: true, mssgs: [] };
	appData.allDials = [];
	for (const dial of dials.filter((item) => !item.pinned)) {
		const chk = saveDial(dial);
		res.mssgs = res.mssgs.concat(chk.mssgs);
	}
	for (const dial of dials.filter((item) => item.pinned)) {
		const chk = saveDial(dial);
		res.mssgs = res.mssgs.concat(chk.mssgs);
	}
	saveData();
	res.mssgs.unshift("dials replaced: " + oldDials + " -> " + appData.allDials.length);
	return res;
};
//==============================================================================
const replTabsDials = (tabs, dials) => {
	const oldTabs = usrTabs().length;
	const res = { ok: true, mssgs: [] };
	appData.allTabs = cloneData(tabs);
	res.mssgs = res.mssgs.concat(replDials(dials).mssgs);
	if (!tabById(appData.userSettings.activeTabId)) {
		appData.userSettings.activeTabId = tabsByOrd().length ? tabsByOrd()[0].tabId : archTabId;
	}
	saveData();
	res.mssgs.unshift("user tabs replaced: " + oldTabs + " -> " + usrTabs().length);
	return res;
};
//==============================================================================
const replUsr = (data) => {
	if (data.systemSettings) {appData.systemSettings = cloneData(data.systemSettings);}
	if (data.userSettings) {appData.userSettings = cloneData(data.userSettings);}
	if (data.allTabs) {appData.allTabs = cloneData(data.allTabs);}
	if (data.allDials) {appData.allDials = cloneData(data.allDials);}
	return saveData();
};
//==============================================================================
const JSDStore = {
	initData: initData,
	commit: saveData,
	getData: getData,
	getSys: getSys,
	getUsr: getUsr,
	getTabs: getTabs,
	getDials: getDials,
	saveUsr: saveUsr,
	tabById: tabById,
	dialAt: dialAt,
	tabDials: tabDials,
	usrTabs: usrTabs,
	tabsByOrd: tabsByOrd,
	saveTab: saveTab,
	saveDial: saveDial,
	delTab: delTab,
	setActTab: setActTab,
	setLastClk: setLastClk,
	makePos: makePos,
	newTab: newTab,
	newDial: newDial,
	exportJson: exportJson,
	replDials: replDials,
	replTabsDials: replTabsDials,
	replUsr: replUsr
};