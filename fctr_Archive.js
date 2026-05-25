/*
	fctr_Archive.js
	Version = 20260525
*/
"use strict";
//==============================================================================
const archList = () => JSDStore.tabDials(archTabId);
//==============================================================================
const archSize = () => archList().length;
//==============================================================================
const archDial = (dial) => {
	const data = JSDStore.getData();
	const tab = JSDStore.tabById(archTabId);
	const fifo = [cloneData(dial)].concat(archList());
	const newArch = [];
	const res = { ok: true, mssgs: [] };
	data.allDials = data.allDials.filter((oldDial) => {
		return oldDial.position.tabId !== archTabId && !JSDPos.samePos(oldDial.position, dial.position);
	});
	for (let row = 0; row < tab.rows; row++) {
		for (let col = 0; col < tab.cols; col++) {
			if (row === 0 && col === 0) {continue;}
			if (fifo.length === 0) {continue;}
			const item = cloneData(fifo.shift());
			item.position = { tabId: archTabId, row: row, col: col };
			item.pinned = false;
			newArch.push(item);
		}
	}
	data.allDials = data.allDials.concat(newArch);
	res.mssgs.push("Archived: " + dial.label);
	if (fifo.length) {res.mssgs.push("Archive full, dropped: " + fifo[0].label);}
	return res;
};
//==============================================================================
const delToArch = (pos) => {
	const dial = JSDStore.dialAt(pos);
	if (!dial) {return { ok: false, mssgs: ["No dial at selected position"] };}
	return archDial(dial);
};
//==============================================================================
const restoreFromArch = () => {
	const data = JSDStore.getData();
	const archived = archList();
	const tabId = JSDStore.getUsr().activeTabId;
	const tab = JSDStore.tabById(tabId);
	const res = { ok: true, mssgs: [] };

	if (!archived.length) {return { ok: false, mssgs: ["Archive is empty"] };}
	if (!tab || tab.tabId === archTabId) {return { ok: false, mssgs: ["No active user tab available"] };}

	const targetPos = JSDPos.freePos(tab.tabId);

	if (!targetPos) {return { ok: false, mssgs: ["No free slot on active tab: " + tab.tabId] };}

	const dial = cloneData(archived[0]);
	data.allDials = data.allDials.filter((oldDial) => !JSDPos.samePos(oldDial.position, archived[0].position));
	dial.position = targetPos;
	dial.pinned = false;
	data.allDials.push(dial);
	JSDStore.commit();

	res.mssgs.push("Restored: " + dial.label + " to " + tab.tabId + " r" + targetPos.row + " c" + targetPos.col);
	return res;
};
//==============================================================================
const JSDArch = {
	archList: archList,
	archSize: archSize,
	archDial: archDial,
	delToArch: delToArch,
	restoreFromArch: restoreFromArch
};