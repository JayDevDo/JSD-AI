/*
	fctr_Positioning.js
	Version = 20260524
	Rules:
	- Owns position, collision, pin, and move planning logic.
	- Reads app data through JSDStore.
	- May mutate in-memory dial positions.
	- Does not write localStorage.
	- Does not render UI.
*/
"use strict";
//==============================================================================
const samePos = (posA, posB) => posA.tabId === posB.tabId && posA.row === posB.row && posA.col === posB.col;
//==============================================================================
const sameCell = (posA, posB) => posA.row === posB.row && posA.col === posB.col;
//==============================================================================
const skipPosMatch = (dialPos, skipPos) => {
	if (!skipPos) {return false;}
	if (!Array.isArray(skipPos)) {return samePos(dialPos, skipPos);}
	return skipPos.some((pos) => samePos(dialPos, pos));
};
//==============================================================================
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
//==============================================================================
const getPins = () => {
	const pins = [];
	for (const dial of JSDStore.getDials()) {
		if (dial.pinned) {pins.push(dial);}
	}
	return pins;
};
//==============================================================================
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
//==============================================================================
const posDist = (posA, posB) => Math.abs(posA.row - posB.row) + Math.abs(posA.col - posB.col);
//==============================================================================
const sortByDist = (slots, fromPos) => {
	return slots.slice().sort((posA, posB) => {
		const distA = posDist(posA, fromPos);
		const distB = posDist(posB, fromPos);
		if (distA !== distB) {return distA - distB;}
		if (posA.row !== posB.row) {return posA.row - posB.row;}
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
const sharedGrid = () => {
	let rows = null;
	let cols = null;
	for (const tab of JSDStore.usrTabs()) {
		rows = rows === null ? tab.rows : Math.min(rows, tab.rows);
		cols = cols === null ? tab.cols : Math.min(cols, tab.cols);
	}
	return { rows: rows || 0, cols: cols || 0 };
};
//==============================================================================
const pinCellUsed = (pos, oldPos = null) => {
	for (const dial of JSDStore.getDials()) {
		if (oldPos && samePos(dial.position, oldPos)) {continue;}
		if (dial.pinned && sameCell(dial.position, pos)) {return true;}
	}
	return false;
};
//==============================================================================
const pinTargetFor = (fromPos, oldPos = null) => {
	const grid = sharedGrid();
	if (fromPos.tabId === archTabId || fromPos.row >= grid.rows || fromPos.col >= grid.cols) {return null;}
	if (pinCellUsed(fromPos, oldPos)) {return null;}
	return fromPos;
};
//==============================================================================
const pinMovePlan = (dial, oldPos = null) => {
	const res = { ok: true, mssgs: [], moves: [] };
	if (!pinTargetFor(dial.position, oldPos)) {
		return { ok: false, mssgs: ["Selected position is outside the shared pin grid or already pinned"], moves: [] };
	}
	for (const tab of JSDStore.usrTabs()) {
		const pos = JSDStore.makePos(tab.tabId, dial.position.row, dial.position.col);
		const oldDial = JSDStore.dialAt(pos);
		const toPos = freePosClosest(tab.tabId, pos, [pos, oldPos].filter(Boolean), null, null, dial.position);
		if (!toPos) {return { ok: false, mssgs: ["Cannot pin, no free slot on tab: " + tab.tabId], moves: [] };}
		if (!oldDial || oldDial.pinned || (oldPos && samePos(oldDial.position, oldPos))) {continue;}
		res.moves.push({ from: cloneData(pos), to: cloneData(toPos), label: oldDial.label });
		res.mssgs.push("Move " + oldDial.label + " on " + tab.tabId + " to r" + toPos.row + " c" + toPos.col);
	}
	return res;
};
//==============================================================================
const pinOK = (dial, oldPos = null) => {
	if (!dial.pinned) {return { ok: true, mssgs: [] };}
	const oldDial = oldPos ? JSDStore.dialAt(oldPos) : null;
	if (oldDial && oldDial.pinned && !samePos(oldPos, dial.position)) {
		return { ok: false, mssgs: ["Pinned dial must be unpinned before moving"] };
	}
	if ((!oldDial || !oldDial.pinned) && getPins().length >= JSDStore.getSys().maxPins) {
		return { ok: false, mssgs: ["Max pinned dials reached"] };
	}
	return pinMovePlan(dial, oldPos);
};
//==============================================================================
const moveForPin = (dial, oldPos = null) => {
	const res = pinMovePlan(dial, oldPos);
	if (!res.ok) {return res;}
	for (const move of res.moves) {
		const oldDial = JSDStore.dialAt(move.from);
		if (oldDial) {oldDial.position = cloneData(move.to);}
	}
	return res;
};
//==============================================================================
const moveOut = (tab, rows, cols) => {
	const res = { ok: true, mssgs: [] };
	for (const dial of JSDStore.tabDials(tab.tabId).slice()) {
		if (dial.position.row < rows && dial.position.col < cols) {continue;}
		if (dial.pinned) {return { ok: false, mssgs: ["Pinned dial would not fit: " + dial.label] };}
		const toPos = freePos(tab.tabId, dial.position, rows, cols);
		if (toPos) {
			dial.position = toPos;
			res.mssgs.push("Moved " + dial.label + " to r" + toPos.row + " c" + toPos.col);
			continue;
		}
		if (typeof JSDArch !== "undefined") {res.mssgs = res.mssgs.concat(JSDArch.archDial(dial).mssgs);}
	}
	return res;
};
//==============================================================================
const JSDPos = {
	samePos: samePos,
	sameCell: sameCell,
	posTaken: posTaken,
	getPins: getPins,
	freeSlots: freeSlots,
	tabHasFree: tabHasFree,
	freePos: freePos,
	freePosClosest: freePosClosest,
	sharedGrid: sharedGrid,
	pinTargetFor: pinTargetFor,
	pinMovePlan: pinMovePlan,
	pinOK: pinOK,
	moveForPin: moveForPin,
	moveOut: moveOut
};