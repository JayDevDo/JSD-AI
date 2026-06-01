/*
	fctr_Positioning.js
	Version = 20260601 16h00
*/
"use strict";
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const newMovePlan = () => {return {ok: true,mssgs: [],moves: [],archives: [],drops: []};};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const samePos = (posA, posB) => posA.tabId === posB.tabId && posA.row === posB.row && posA.col === posB.col;
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const skipPosMatch = (dialPos, skipPos) => {
	if (!skipPos) {return false;}
	if (!Array.isArray(skipPos)) {return samePos(dialPos, skipPos);}
	return skipPos.some((pos) => samePos(dialPos, pos));
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const posTaken = (pos, skipPos = null, pinPos = null) => {
	const normalTab = pos.tabId !== archTabId;
	if (pinPos && normalTab && sameCell(pinPos, pos)) {return true;}
	for (const dial of JSDStore.getDials()) {
		if (skipPosMatch(dial.position, skipPos)) {continue;}
		if (samePos(dial.position, pos)) {return true;}
		if (normalTab && dial.pinned && sameCell(dial.position, pos)) {return true;}
	}
	return false;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const getPins = () => {
	const pins = [];
	for (const dial of JSDStore.getDials()) {if (dial.pinned) {pins.push(dial);}}
	return pins;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const posDist = (posA, posB) => Math.abs(posA.row - posB.row) + Math.abs(posA.col - posB.col);
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const sortByDist = (slots, fromPos) => {
	return slots.slice().sort((posA, posB) => {
		const distA = posDist(posA, fromPos);
		const distB = posDist(posB, fromPos);
		if (distA !== distB) {return distA - distB;}
		if (posA.row !== posB.row) {return posA.row - posB.row;}
		return posA.col - posB.col;
	});
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const tabHasFree = (tabId, skipPos = null) => freeSlots(tabId, skipPos).length > 0;
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const freePos = (tabId, skipPos = null, rows = null, cols = null, pinPos = null) => {
	const slots = freeSlots(tabId, skipPos, rows, cols, pinPos);
	return slots.length ? slots[0] : null;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const pinCellUsed = (pos, oldPos = null) => {
	for (const dial of JSDStore.getDials()) {
		if (oldPos && samePos(dial.position, oldPos)) {continue;}
		if (dial.pinned && sameCell(dial.position, pos)) {return true;}
	}
	return false;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const pinMovePlan = (dial, oldPos = null) => {
	const res = newMovePlan();
	if (!pinTargetFor(dial.position, oldPos)) {
		res.ok = false;
		res.mssgs.push("Selected position is outside the shared pin grid or already pinned");
		return res;
	}
	for (const tab of JSDStore.usrTabs()) {
		const pos = JSDStore.makePos(tab.tabId, dial.position.row, dial.position.col);
		const oldDial = JSDStore.dialAt(pos);
		const toPos = freePosClosest(tab.tabId, pos, [pos, oldPos].filter(Boolean), null, null, dial.position);
		if (!toPos) {
			res.ok = false;
			res.mssgs = ["Cannot pin, no free slot on tab: " + tab.tabId];
			res.moves = [];
			return res;
		}
		if (!oldDial || oldDial.pinned || (oldPos && samePos(oldDial.position, oldPos))) {continue;}
		res.moves.push({ from: cloneData(pos), to: cloneData(toPos), label: oldDial.label });
		res.mssgs.push("Move " + oldDial.label + " on " + tab.tabId + " to r" + toPos.row + " c" + toPos.col);
	}
	return res;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const pinOK = (dial, oldPos = null) => {
	if (!dial.pinned) {return newMovePlan();}
	const oldDial = oldPos ? JSDStore.dialAt(oldPos) : null;
	if (oldDial && oldDial.pinned && !samePos(oldPos, dial.position)) {
		const res = newMovePlan();
		res.ok = false;
		res.mssgs.push("Pinned dial must be unpinned before moving");
		return res;
	}
	if ((!oldDial || !oldDial.pinned) && getPins().length >= JSDStore.getSys().maxPins) {
		const res = newMovePlan();
		res.ok = false;
		res.mssgs.push("Max pinned dials reached");
		return res;
	}
	return pinMovePlan(dial, oldPos);
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const moveForPin = (dial, oldPos = null) => {
	const res = pinMovePlan(dial, oldPos);
	if (!res.ok) {return res;}
	for (const move of res.moves) {const oldDial=JSDStore.dialAt(move.from);if(oldDial){oldDial.position=cloneData(move.to);}}
	return res;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const moveOutPlan = (tab, rows, cols) => {
	let planDials = JSDStore.getDials().map((dial) => cloneData(dial));
	let archiveDials = JSDStore.tabDials(archTabId).map((dial) => cloneData(dial));
	const archiveTab = JSDStore.tabById(archTabId);
	const res = newMovePlan();
	for (const dial of getPins()) {
		if (dial.position.row >= rows || dial.position.col >= cols) {
			res.ok = false;
			res.mssgs.push("Cannot resize, pinned dial would not fit: " + dial.label);
			return res;
		}
	}

	const planPosTaken = (pos, skipPos = null) => {
		const normalTab = pos.tabId !== archTabId;
		for (const dial of planDials) {
			if (skipPosMatch(dial.position, skipPos)) {continue;}
			if (samePos(dial.position, pos)) {return true;}
			if (normalTab && dial.pinned && sameCell(dial.position, pos)) {return true;}
		}
		return false;
	};

	const planFreePos = (tabId, skipPos = null) => {
		for (let row = 0; row < rows; row++) {
			for (let col = 0; col < cols; col++) {
				const pos = JSDStore.makePos(tabId, row, col);
				if (!planPosTaken(pos, skipPos)) {return pos;}
			}
		}
		return null;
	};

	const planArchiveDial = (dial) => {
		const fifo = [cloneData(dial)].concat(archiveDials);
		const newArch = [];
		for (let row = 0; row < archiveTab.rows; row++) {
			for (let col = 0; col < archiveTab.cols; col++) {
				if (row === 0 && col === 0) {continue;}
				if (fifo.length === 0) {continue;}
				const item = cloneData(fifo.shift());
				item.position = { tabId: archTabId, row: row, col: col };
				item.pinned = false;
				newArch.push(item);
			}
		}
		planDials = planDials.filter((oldDial) => {
			return oldDial.position.tabId !== archTabId && !samePos(oldDial.position, dial.position);
		});
		planDials = planDials.concat(newArch);
		archiveDials = newArch;
		res.archives.push({ label: dial.label });
		res.mssgs.push(dial.label + " -> Archive");
		if (fifo.length) {
			res.drops.push({ label: fifo[0].label });
			res.mssgs.push("Archive full, dropped: " + fifo[0].label);
		}
	};

	for (const dial of JSDStore.tabDials(tab.tabId).slice()) {
		if (dial.position.row < rows && dial.position.col < cols) {continue;}
		if (dial.pinned) {
			res.ok = false;
			res.mssgs = ["Pinned dial would not fit: " + dial.label];
			res.moves = [];
			res.archives = [];
			res.drops = [];
			return res;
		}
		const toPos = planFreePos(tab.tabId, dial.position);
		if (toPos) {
			const oldDial = planDials.find((item) => samePos(item.position, dial.position));
			if (oldDial) {oldDial.position = cloneData(toPos);}
			res.moves.push({ from: cloneData(dial.position), to: cloneData(toPos), label: dial.label });
			res.mssgs.push("Moved " + dial.label + " to r" + toPos.row + " c" + toPos.col);
			continue;
		}
		if (archiveTab) {planArchiveDial(dial);}
		else {res.mssgs.push("Archive unavailable for: " + dial.label);}
	}
	return res;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const moveOut = (tab, rows, cols) => {
	const res = newMovePlan();
	for (const dial of JSDStore.tabDials(tab.tabId).slice()) {
		if (dial.position.row < rows && dial.position.col < cols) {continue;}
		if (dial.pinned) {
			res.ok = false;
			res.mssgs.push("Pinned dial would not fit: " + dial.label);
			return res;
		}
		const toPos = freePos(tab.tabId, dial.position, rows, cols);
		if (toPos) {
			dial.position = toPos;
			res.moves.push({ from: cloneData(dial.position), to: cloneData(toPos), label: dial.label });
			res.mssgs.push("Moved " + dial.label + " to r" + toPos.row + " c" + toPos.col);
			continue;
		}
		if (typeof JSDArch !== "undefined") {
			const archRes = JSDArch.archDial(dial);
			res.mssgs = res.mssgs.concat(archRes.mssgs);
			res.archives.push({ label: dial.label });
		}
	}
	return res;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const freeSlots = (tabId, skipPos = null, rows = null, cols = null, pinPos = null) => {
	const tab = JSDStore.tabById(tabId);
	const slots = [];
	for (let row = 0; row < (rows || tab.rows); row++) {
		for (let col = 0; col < (cols || tab.cols); col++) {
			const pos = JSDStore.makePos(tabId, row, col);
			if (!posTaken(pos, skipPos, pinPos)) {slots.push(pos);}
		}
	}
	return slots;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const sameCell = (posA, posB) => posA.row === posB.row && posA.col === posB.col;
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  
const freePosClosest = (tabId, fromPos, skipPos = null, rows = null, cols = null, pinPos = null) => {
	const slots = sortByDist(freeSlots(tabId, skipPos, rows, cols, pinPos), fromPos);
	return slots.length ? slots[0] : null;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const sharedGrid = () => {
	let rows = null;
	let cols = null;
	for (const tab of JSDStore.usrTabs()) {
		rows = rows === null ? tab.rows : Math.min(rows, tab.rows);
		cols = cols === null ? tab.cols : Math.min(cols, tab.cols);
	}
	return { rows: rows || 0, cols: cols || 0 };
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const pinTargetFor = (fromPos, oldPos = null) => {
	const grid = sharedGrid();
	if (fromPos.tabId === archTabId || fromPos.row >= grid.rows || fromPos.col >= grid.cols) {return null;}
	if (pinCellUsed(fromPos, oldPos)) {return null;}
	return fromPos;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
const JSDPos = {
	freePos: freePos,
	freePosClosest: freePosClosest,
	freeSlots: freeSlots,
	getPins: getPins,
	moveForPin: moveForPin,
	moveOut: moveOut,
	moveOutPlan: moveOutPlan,
	pinMovePlan: pinMovePlan,
	pinOK: pinOK,
	pinTargetFor: pinTargetFor,
	posTaken: posTaken,
	sameCell: sameCell,
	samePos: samePos,
	sharedGrid: sharedGrid,
	tabHasFree: tabHasFree
};

/*
Not exported:
	- newMovePlan
	- sortByDist
	- skipPosMatch
	- posDist
	- pinCellUsed
*/