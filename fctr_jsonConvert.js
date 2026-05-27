/*
	fctr_jsonConvert.js
	Version = 20260526
*/
"use strict";
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const oldJsonArchiveId = () => typeof archTabId !== "undefined" ? archTabId : "ARCHIVE";
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const oldJsonArchTab = () => {
	return {
		tabId: oldJsonArchiveId(),
		rows: 4,
		cols: 6,
		bgColor: "#000000",
		txtColor: "#FFFFFF",
		order: 0
	};
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const oldJsonTabId = (tabName) => tabName.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 8) || "TAB";
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const oldJsonPosKey = (position) => position.tabId + ":" + position.row + ":" + position.col;
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const oldJsonTime = (timestamp) => {
	if (!timestamp) {return 0;}
	const parsed = Date.parse(timestamp);
	if (Number.isNaN(parsed)) {return 0;}
	return parsed;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const isOldJsonDial = (item) => item && Array.isArray(item.pos) && item.pos.length === 4;
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const isOldJsonTab = (item) => item && Array.isArray(item.matrix) && item.matrix.length === 2;
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const oldJsonParts = (oldData) => {
	const oldDials = [];
	const oldTabs = [];
	for (const itemArray of oldData) {
		for (const item of itemArray) {
			if (isOldJsonTab(item)) {oldTabs.push(item);}
			else if (isOldJsonDial(item)) {oldDials.push(item);}
		}
	}
	return { oldDials: oldDials, oldTabs: oldTabs };
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const isOldJson = (data) => {
	if (!Array.isArray(data) || data.length !== 2) {return false;}
	if (!Array.isArray(data[0]) || !Array.isArray(data[1])) {return false;}
	const parts = oldJsonParts(data);
	return parts.oldDials.length > 0 && parts.oldTabs.length > 0;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const oldJsonPages = (oldTabs) => {
	const pageMap = new Map();
	pageMap.set(oldJsonArchiveId(), oldJsonArchTab());
	for (let oldIndex = 0; oldIndex < oldTabs.length; oldIndex++) {
		const oldTab = oldTabs[oldIndex];
		pageMap.set(oldIndex, {
			tabId: oldJsonTabId(oldTab.name),
			rows: oldTab.matrix[0],
			cols: oldTab.matrix[1],
			bgColor: oldTab.color,
			txtColor: "#000000",
			order: oldIndex + 1
		});
	}
	return pageMap;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const oldJsonDial = (oldDial, pageMap) => {
	const oldPos = oldDial.pos;
	const page = pageMap.get(oldPos[0]);
	if (!page) {throw new Error("No tab found for old tab index: " + oldPos[0]);}
	return {
		label: oldDial.name,
		url: oldDial.url,
		bgColor: oldDial.bgClr,
		txtColor: oldDial.fgClr,
		position: { tabId: page.tabId, row: oldPos[1], col: oldPos[2] },
		pinned: oldPos[3],
		lastClicked: oldDial.lstVst || ""
	};
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const oldJsonNewestByPosition = (dials) => {
	const dialMap = new Map();
	const droppedDials = [];
	for (const dial of dials) {
		const posKey = oldJsonPosKey(dial.position);
		const oldDial = dialMap.get(posKey);
		if (!oldDial) {dialMap.set(posKey, dial);}
		else if (oldJsonTime(dial.lastClicked) > oldJsonTime(oldDial.lastClicked)) {
			droppedDials.push(oldDial);
			dialMap.set(posKey, dial);
		}else{
			droppedDials.push(dial);
		}
	}
	return { dials: Array.from(dialMap.values()), droppedDials: droppedDials };
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const convertOldJsdData = (oldData) => {
	const parts = oldJsonParts(oldData);
	const pageMap = oldJsonPages(parts.oldTabs);
	const dials = parts.oldDials.map((oldDial) => oldJsonDial(oldDial, pageMap));
	const dialResult = oldJsonNewestByPosition(dials);
	return {
		pages: Array.from(pageMap.values()),
		dials: dialResult.dials,
		droppedDials: dialResult.droppedDials
	};
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const convertOldJsdDataToImportJson = (oldData) => {
	const result = convertOldJsdData(oldData);
	return {
		allTabs: result.pages,
		allDials: result.dials
	};
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const convertOldJsdString = (oldJsonString) => convertOldJsdData(JSON.parse(oldJsonString));
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const convertOldJsdStringToImportJson = (oldJsonString) => convertOldJsdDataToImportJson(JSON.parse(oldJsonString));
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const JSDOldJson = {
	isOldJson: isOldJson,
	convertData: convertOldJsdData,
	convertString: convertOldJsdString,
	convertDataToImportJson: convertOldJsdDataToImportJson,
	convertStringToImportJson: convertOldJsdStringToImportJson
};