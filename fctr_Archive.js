/*
	fctr_Archive.js
	Version = 20260524
*/
"use strict";
//==============================================================================
const archList = () => JSDStore.tabDials(archTabId);
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
const JSDArch = {
	archList: archList,
	archDial: archDial,
	delToArch: delToArch
};