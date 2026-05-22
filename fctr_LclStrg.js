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
const loadDefs = async () => {
	const resp = await fetch(defFile, { cache: "no-store" });
	if (!resp.ok) {
		throw new Error("Could not load " + defFile);
	}
	return await resp.json();
};
//==============================================================================
const hasStore = () => localStorage.getItem(lsKey) !== null;
//==============================================================================
const readStore = () => {
	const rawData = localStorage.getItem(lsKey);
	if (!rawData) {
		return null;
	}
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
const clearStore = () => localStorage.removeItem(lsKey);
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
const resetData = async () => {
	clearStore();
	appData = cloneData(await loadDefs());
	writeStore(appData);
	return appData;
};
//==============================================================================
const reloadData = async () => await initData();
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
const saveTabs = (tabs) => {
	appData.allTabs = cloneData(tabs);
	return saveData();
};
//==============================================================================
const saveDials = (dials) => {
	appData.allDials = cloneData(dials);
	return saveData();
};
//==============================================================================
const samePos = (posA, posB) => posA.tabId === posB.tabId && posA.row === posB.row && posA.col === posB.col;
//==============================================================================
const sameCell = (posA, posB) => posA.row === posB.row && posA.col === posB.col;
//==============================================================================
const skipPosMatch = (dialPos, skipPos) => {
	if (!skipPos) {
		return false;
	}
	if (Array.isArray(skipPos)) {
		for (const pos of skipPos) {
			if (samePos(dialPos, pos)) {
				return true;
			}
		}
		return false;
	}
	return samePos(dialPos, skipPos);
};
//==============================================================================
const posTaken = (pos, skipPos = null, pinPos = null) => {
	for (const dial of appData.allDials) {
		if (skipPosMatch(dial.position, skipPos)) {
			continue;
		}
		if (samePos(dial.position, pos)) {
			return true;
		}
		if (pos.tabId !== archTabId && dial.pinned && sameCell(dial.position, pos)) {
			return true;
		}
	}
	if (pinPos && pos.tabId !== archTabId && sameCell(pinPos, pos)) {
		return true;
	}
	return false;
};
//==============================================================================
const tabIdx = (tabId) => {
	for (let idx = 0; idx < appData.allTabs.length; idx++) {
		if (appData.allTabs[idx].tabId === tabId) {
			return idx;
		}
	}
	return -1;
};
//==============================================================================
const tabById = (tabId) => {
	const idx = tabIdx(tabId);
	if (idx === -1) {
		return null;
	}
	return appData.allTabs[idx];
};
//==============================================================================
const validTab = (tabId, oldId = null) => {
	if (tabId.length < appData.systemSettings.minLabelLen || tabId.length > appData.systemSettings.maxTabLabelLen) {
		return false;
	}
	for (const tab of appData.allTabs) {
		if (oldId !== null && tab.tabId === oldId) {
			continue;
		}
		if (tab.tabId.toLowerCase() === tabId.toLowerCase()) {
			return false;
		}
	}
	return true;
};
//==============================================================================
const fitPos = (pos, rows = null, cols = null) => {
	const tab = tabById(pos.tabId);
	return pos.row < (rows || tab.rows) && pos.col < (cols || tab.cols);
};
//==============================================================================
const dialAt = (pos) => {
	for (const dial of appData.allDials) {
		if (samePos(dial.position, pos)) {
			return dial;
		}
	}
	return null;
};
//==============================================================================
const tabDials = (tabId) => {
	return appData.allDials.filter((dial) => dial.position.tabId === tabId).sort((dialA, dialB) => {
		if (dialA.position.row !== dialB.position.row) {
			return dialA.position.row - dialB.position.row;
		}
		return dialA.position.col - dialB.position.col;
	});
};
//==============================================================================
const getPins = () => {
	const pins = [];
	for (const dial of appData.allDials) {
		if (dial.pinned) {
			pins.push(dial);
		}
	}
	return pins;
};
//==============================================================================
const freeSlots = (tabId, skipPos = null, rows = null, cols = null, pinPos = null) => {
	const tab = tabById(tabId);
	const slots = [];
	for (let row = 0; row < (rows || tab.rows); row++) {
		for (let col = 0; col < (cols || tab.cols); col++) {
			const pos = makePos(tabId, row, col);
			if (!posTaken(pos, skipPos, pinPos)) {
				slots.push(pos);
			}
		}
	}
	return slots;
};
//==============================================================================
const posDist = (posA, posB) => Math.abs(posA.row - posB.row) + Math.abs(posA.col - posB.col);
//==============================================================================
const sortByDist = (slots, fromPos) => {
	return slots.slice().sort((posA, posB) => {
		const distA = posDist(posA, fromPos);
		const distB = posDist(posB, fromPos);
		if (distA !== distB) {
			return distA - distB;
		}
		if (posA.row !== posB.row) {
			return posA.row - posB.row;
		}
		return posA.col - posB.col;
	});
};
//==============================================================================
const tabHasFree = (tabId, skipPos = null) => freeSlots(tabId, skipPos).length > 0;
//==============================================================================
const freePos = (tabId, skipPos = null, rows = null, cols = null, pinPos = null) => {
	const slots = freeSlots(tabId, skipPos, rows, cols, pinPos);
	return slots.length ? slots[0] : null;
};
//==============================================================================
const freePosClosest = (tabId, fromPos, skipPos = null, rows = null, cols = null, pinPos = null) => {
	const slots = sortByDist(freeSlots(tabId, skipPos, rows, cols, pinPos), fromPos);
	return slots.length ? slots[0] : null;
};
//==============================================================================
const sortTabs = (tabs) => tabs.slice().sort((tabA, tabB) => tabA.order - tabB.order);
//==============================================================================
const usrTabs = () => appData.allTabs.filter((tab) => tab.tabId !== archTabId);
//==============================================================================
const tabsByOrd = () => sortTabs(usrTabs());
//==============================================================================
const allByOrd = () => sortTabs(appData.allTabs);
//==============================================================================
const fixTabOrd = () => {
	appData.allTabs = [tabById(archTabId)].concat(tabsByOrd());
	for (let idx = 0; idx < appData.allTabs.length; idx++) {
		appData.allTabs[idx].order = idx;
	}
};
//==============================================================================
const setTabOrd = (tabId, order) => {
	const tab = tabById(tabId);
	const tabs = tabsByOrd().filter((oldTab) => oldTab.tabId !== tabId);
	tabs.splice(Math.max(0, Math.min(order - 1, tabs.length)), 0, tab);
	appData.allTabs = [tabById(archTabId)].concat(tabs);
	for (let idx = 0; idx < appData.allTabs.length; idx++) {
		appData.allTabs[idx].order = idx;
	}
};
//==============================================================================
const sharedGrid = () => {
	let rows = null;
	let cols = null;
	for (const tab of usrTabs()) {
		rows = rows === null ? tab.rows : Math.min(rows, tab.rows);
		cols = cols === null ? tab.cols : Math.min(cols, tab.cols);
	}
	return { rows: rows || 0, cols: cols || 0 };
};
//==============================================================================
const pinCellUsed = (pos, oldPos = null) => {
	for (const dial of appData.allDials) {
		if (oldPos && samePos(dial.position, oldPos)) {
			continue;
		}
		if (dial.pinned && sameCell(dial.position, pos)) {
			return true;
		}
	}
	return false;
};
//==============================================================================
const pinSlots = (fromPos, oldPos = null) => {
	const grid = sharedGrid();
	const slots = [];
	for (let row = 0; row < grid.rows; row++) {
		for (let col = 0; col < grid.cols; col++) {
			const pos = makePos(fromPos.tabId, row, col);
			if (!pinCellUsed(pos, oldPos)) {
				slots.push(pos);
			}
		}
	}
	return sortByDist(slots, fromPos);
};
//==============================================================================
const pinTargetFor = (fromPos, oldPos = null) => {
	const grid = sharedGrid();
	if (fromPos.tabId === archTabId || fromPos.row >= grid.rows || fromPos.col >= grid.cols) {
		return null;
	}
	if (pinCellUsed(fromPos, oldPos)) {
		return null;
	}
	return fromPos;
};
//==============================================================================
const pinMovePlan = (dial, oldPos = null) => {
	const res = { ok: true, mssgs: [], moves: [] };
	if (!pinTargetFor(dial.position, oldPos)) {
		return { ok: false, mssgs: ["Selected position is outside the shared pin grid or already pinned"], moves: [] };
	}
	for (const tab of usrTabs()) {
		const pos = makePos(tab.tabId, dial.position.row, dial.position.col);
		const oldDial = dialAt(pos);
		const toPos = freePosClosest(tab.tabId, pos, [pos, oldPos].filter(Boolean), null, null, dial.position);
		if (!toPos) {
			return { ok: false, mssgs: ["Cannot pin, no free slot on tab: " + tab.tabId], moves: [] };
		}
		if (!oldDial || oldDial.pinned || (oldPos && samePos(oldDial.position, oldPos))) {
			continue;
		}
		res.moves.push({ from: cloneData(pos), to: cloneData(toPos), label: oldDial.label });
		res.mssgs.push("Move " + oldDial.label + " on " + tab.tabId + " to r" + toPos.row + " c" + toPos.col);
	}
	return res;
};
//==============================================================================
const pinOK = (dial, oldPos = null) => {
	if (!dial.pinned) {
		return { ok: true, mssgs: [] };
	}
	const oldDial = oldPos ? dialAt(oldPos) : null;
	if (oldDial && oldDial.pinned && !samePos(oldPos, dial.position)) {
		return { ok: false, mssgs: ["Pinned dial must be unpinned before moving"] };
	}
	if ((!oldDial || !oldDial.pinned) && getPins().length >= appData.systemSettings.maxPins) {
		return { ok: false, mssgs: ["Max pinned dials reached"] };
	}
	return pinMovePlan(dial, oldPos);
};
//==============================================================================
const moveForPin = (dial, oldPos = null) => {
	const res = pinMovePlan(dial, oldPos);
	if (!res.ok) {
		return res;
	}
	for (const move of res.moves) {
		const oldDial = dialAt(move.from);
		if (oldDial) {
			oldDial.position = cloneData(move.to);
		}
	}
	return res;
};
//==============================================================================
const saveDial = (dial, oldPos = null) => {
	const chk = pinOK(dial, oldPos);
	if (!chk.ok) {
		return chk;
	}
	const res = { ok: true, mssgs: chk.mssgs };
	if (!dial.pinned && oldPos && !samePos(oldPos, dial.position)) {
		if (posTaken(dial.position, oldPos)) {
			return { ok: false, mssgs: ["Position is taken"] };
		}
	} else if (!oldPos && posTaken(dial.position)) {
		return { ok: false, mssgs: ["Position is taken"] };
	}
	appData.allDials = appData.allDials.filter((oldDial) => !samePos(oldDial.position, oldPos || dial.position));
	if (dial.pinned) {
		const moveRes = moveForPin(dial, oldPos);
		if (!moveRes.ok) {
			return moveRes;
		}
		res.mssgs = res.mssgs.concat(moveRes.mssgs);
	}
	appData.allDials.push(cloneData(dial));
	saveData();
	res.mssgs.push("Saved dial: " + dial.label);
	return res;
};
//==============================================================================
const moveOut = (tab, rows, cols) => {
	const res = { ok: true, mssgs: [] };
	for (const dial of tabDials(tab.tabId).slice()) {
		if (dial.position.row < rows && dial.position.col < cols) {
			continue;
		}
		if (dial.pinned) {
			return { ok: false, mssgs: ["Pinned dial would not fit: " + dial.label] };
		}
		const toPos = freePos(tab.tabId, dial.position, rows, cols);
		if (toPos) {
			dial.position = toPos;
			res.mssgs.push("Moved " + dial.label + " to r" + toPos.row + " c" + toPos.col);
			continue;
		}
		if (typeof JSDArch !== "undefined") {
			res.mssgs = res.mssgs.concat(JSDArch.archDial(dial).mssgs);
		}
	}
	return res;
};
//==============================================================================
const saveTab = (tab, oldId = null) => {
	if (!validTab(tab.tabId, oldId)) {
		return { ok: false, mssgs: ["Tab name not valid or already used: " + tab.tabId] };
	}
	const res = { ok: true, mssgs: [] };
	for (const dial of getPins()) {
		if (dial.position.row >= tab.rows || dial.position.col >= tab.cols) {
			return { ok: false, mssgs: ["Cannot resize, pinned dial would not fit: " + dial.label] };
		}
	}
	if (oldId !== null) {
		const chk = moveOut(tabById(oldId), tab.rows, tab.cols);
		if (!chk.ok) {
			return chk;
		}
		res.mssgs = res.mssgs.concat(chk.mssgs);
	}
	if (oldId !== null && oldId !== tab.tabId) {
		for (const dial of appData.allDials) {
			if (dial.position.tabId === oldId) {
				dial.position.tabId = tab.tabId;
			}
		}
		if (appData.userSettings.activeTabId === oldId) {
			appData.userSettings.activeTabId = tab.tabId;
		}
	}
	const idx = tabIdx(oldId || tab.tabId);
	if (idx === -1) {
		appData.allTabs.push(cloneData(tab));
	} else {
		appData.allTabs[idx] = cloneData(tab);
	}
	setTabOrd(tab.tabId, tab.order);
	saveData();
	res.mssgs.push("Saved tab: " + tab.tabId);
	return res;
};
//==============================================================================
const delDial = (pos) => {
	appData.allDials = appData.allDials.filter((dial) => !samePos(dial.position, pos));
	saveData();
	return { ok: true, mssgs: ["Deleted dial at " + pos.tabId + " r" + pos.row + " c" + pos.col] };
};
//==============================================================================
const delTab = (tabId) => {
	const idx = tabIdx(tabId);
	const res = { ok: true, mssgs: [] };
	if (tabId === archTabId) {
		return { ok: false, mssgs: ["Archive tab cannot be deleted"] };
	}
	if (idx === -1) {
		return { ok: false, mssgs: ["Tab not found: " + tabId] };
	}
	for (const dial of tabDials(tabId).slice()) {
		if (typeof JSDArch !== "undefined") {
			res.mssgs = res.mssgs.concat(JSDArch.archDial(dial).mssgs);
		}
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
	if (dial) {
		dial.lastClicked = new Date().toISOString();
	}
	return saveData();
};
//==============================================================================
const makePos = (tabId, row, col) => {return {tabId: tabId, row: row, col: col};};
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
const moveDial = (fromPos, toPos) => {
	const dial = dialAt(fromPos);
	if (!dial || posTaken(toPos, fromPos)) {
		return { ok: false, mssgs: ["Move blocked"] };
	}
	dial.position = cloneData(toPos);
	saveData();
	return { ok: true, mssgs: ["Moved dial: " + dial.label] };
};
//==============================================================================
const exportJson = (pretty = true) => {
	if (pretty) {
		return JSON.stringify(appData, null, "\t");
	}
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
	if (data.systemSettings) {
		appData.systemSettings = cloneData(data.systemSettings);
	}
	if (data.userSettings) {
		appData.userSettings = cloneData(data.userSettings);
	}
	if (data.allTabs) {
		appData.allTabs = cloneData(data.allTabs);
	}
	if (data.allDials) {
		appData.allDials = cloneData(data.allDials);
	}
	return saveData();
};
//==============================================================================
const importJson = (jsonText) => replUsr(JSON.parse(jsonText));
//==============================================================================
const JSDStore = {
	initData: initData,
	saveData: saveData,
	resetData: resetData,
	reloadData: reloadData,
	getData: getData,
	getSys: getSys,
	getUsr: getUsr,
	getTabs: getTabs,
	getDials: getDials,
	saveUsr: saveUsr,
	saveTabs: saveTabs,
	saveDials: saveDials,
	samePos: samePos,
	sameCell: sameCell,
	posTaken: posTaken,
	tabIdx: tabIdx,
	tabById: tabById,
	validTab: validTab,
	fitPos: fitPos,
	dialAt: dialAt,
	tabDials: tabDials,
	getPins: getPins,
	freeSlots: freeSlots,
	tabHasFree: tabHasFree,
	freePos: freePos,
	freePosClosest: freePosClosest,
	sharedGrid: sharedGrid,
	pinTargetFor: pinTargetFor,
	pinMovePlan: pinMovePlan,
	saveTab: saveTab,
	saveDial: saveDial,
	delTab: delTab,
	delDial: delDial,
	setActTab: setActTab,
	setLastClk: setLastClk,
	makePos: makePos,
	newTab: newTab,
	newDial: newDial,
	moveDial: moveDial,
	exportJson: exportJson,
	importJson: importJson,
	replDials: replDials,
	replTabsDials: replTabsDials,
	replUsr: replUsr,
	sortTabs: sortTabs,
	usrTabs: usrTabs,
	tabsByOrd: tabsByOrd,
	allByOrd: allByOrd,
	fixTabOrd: fixTabOrd,
	setTabOrd: setTabOrd,
	hasStore: hasStore,
	readStore: readStore,
	writeStore: writeStore,
	clearStore: clearStore
};
