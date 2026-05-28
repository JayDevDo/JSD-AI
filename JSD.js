/*
	JSD.js
	Version = 20260528 19h00
*/
"use strict";
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const homePageUrl = "https://github.com/JayDevDo/JSD-AI";
let dialSearchLocked = false;
let dialSearchMode = false;
let dialSearchText = "";
let dragDialPos = null;
let navHomeMsgTmr = null;
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const addDialBtn = (tab, pos) => {
	const bttn = makeElement("button", { className: "addDial", textContent: "Add Dial" });
	bttn.style.background = tab.bgColor;
	bttn.style.color = tab.txtColor;
	if (!JSDStore.getUsr().showAddDials) {bttn.classList.add("addDialHidden");}
	bttn.addEventListener("click", () => openDialDialog(pos));
	bttn.addEventListener("dragover", (evt) => {
		if (!dragDialPos) {return;}
		evt.preventDefault();
		evt.dataTransfer.dropEffect = "move";
		showNavHomeDragMsg("drop allowed (" + (pos.row + 1) + "X" + (pos.col + 1) + ")", "#66CCFF");
	});
	bttn.addEventListener("drop", (evt) => {evt.preventDefault();moveDraggedDial(pos);});
	return bttn;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const buildTabGrid = () => {
	const tab = getActTab();
	const grid = getElm("dialGrid");
	const pinGrid = JSDStore.getPinGridSize();
	const pgBrdrClr = "#66CCFF";
	const pgBrdrWdth = "3px";
	const searchMode = dialSearchMode;
	const searchTerm = dialSearchText.toLowerCase();
	clearElm(grid);
	updNavHome(tab);
	grid.style.background = tab.bgColor;
	grid.style.gridTemplateRows = "repeat(" + tab.rows + ", 1fr)";
	grid.style.gridTemplateColumns = "repeat(" + tab.cols + ", 1fr)";
	for (let row = 0; row < tab.rows; row++) {
		const gpgBottomEdge = row === pinGrid.bottom;
		for (let col = 0; col < tab.cols; col++) {
			const pos = JSDStore.makePos(tab.tabId, row, col);
			const dial = dialForPos(pos);
			const elm = dial ? dialBttn(dial) : addDialBtn(tab, pos);
			if (gpgBottomEdge && col <= pinGrid.right) {
				elm.style.borderBottomColor = pgBrdrClr;
				elm.style.borderBottomWidth = pgBrdrWdth;
			}
			if (col === pinGrid.right && row <= pinGrid.bottom) {
				elm.style.borderRightColor = pgBrdrClr;
				elm.style.borderRightWidth = pgBrdrWdth;
			}
			grid.appendChild(elm);
			if (searchMode) {
				if (!dial) {elm.classList.add("searchHiddenCell");
				} else if (!(dial.label + dial.url).toLowerCase().includes(searchTerm)) {
					elm.classList.add("searchHiddenCell");
				} else {elm.classList.add("searchInclCell");}
			}
		}
	}
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const buildTabs = () => {
	const navTabs = getElm("navTabs");
	const navHome = getElm("navHome");
	const tabs = JSDStore.tabsByOrd();
	const searchRes = dialSearchMode ? JSDStore.findDials(dialSearchText.toLowerCase()) : null;
	clearElm(navTabs);
	navTabs.appendChild(navHome);
	for (let idx = 0; idx < tabs.length; idx++) {
		const tab = tabs[idx];
		const tabElm = makeElement("div", { className: "tab" });
		const menuBtn = makeElement("button", { className: "tabMenu", textContent: "🛠" });
		const nameBtn = makeElement("button", { className: "tabName", textContent: tab.tabId });
		const dialsFound = searchRes ? searchRes.tabs[idx].dialsFound : 1;
		tabElm.style.background = dialsFound ? tab.bgColor : "#303030";
		tabElm.style.color = dialsFound ? tab.txtColor : "#777777";
		if (tab.tabId === JSDStore.getUsr().activeTabId) {tabElm.classList.add("active");}
		menuBtn.addEventListener("click", () => openTabDialog(tab));
		nameBtn.addEventListener("click", () => {
			JSDStore.setActTab(tab.tabId);
			buildTabs();
			buildTabGrid();
			updAddBtn();
		});
		tabElm.appendChild(menuBtn);
		tabElm.appendChild(nameBtn);
		navTabs.appendChild(tabElm);
	}
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const clearElm = (elm) => {while (elm.firstChild) {elm.removeChild(elm.firstChild);}};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const dialBttn = (dial) => {
	const item = makeElement("div", { className: "dial" });
	const nameBtn = makeElement("button", { className: "dialName", textContent: dial.label });
	const menuBtn = makeElement("button", { className: "dialMenu", textContent: "🛠" });
	item.style.background = dial.bgColor;
	item.style.color = dial.txtColor;
	menuBtn.style.background = dial.txtColor;
	menuBtn.style.color = dial.bgColor;
	menuBtn.style.borderColor = dial.bgColor;
	nameBtn.addEventListener("click", () => openDial(dial));
	menuBtn.addEventListener("click", () => openDialDialog(dial.position, dial));
	item.addEventListener("dragover", () => {
		if (!dragDialPos) {return;}
		showNavHomeDragMsg("can't drop here (" + (dial.position.row + 1) + "X" + (dial.position.col + 1) + ")", "#FF3232");
	});
	item.appendChild(nameBtn);
	item.appendChild(menuBtn);
	if (dial.pinned) {
		const pinIco = makeElement("div", { className: "dialPin" });
		pinIco.style.background = dial.txtColor;
		pinIco.style.color = dial.txtColor;
		pinIco.style.borderColor = dial.txtColor;
		pinIco.style.setProperty("--pin-hole", dial.bgColor);
		item.appendChild(pinIco);
	} else {
		item.draggable = true;
		item.addEventListener("dragstart", (evt) => {
			dragDialPos = cloneData(dial.position);
			evt.dataTransfer.setData("text/plain", JSON.stringify(dragDialPos));
			evt.dataTransfer.effectAllowed = "move";
		});
		item.addEventListener("dragend", () => {dragDialPos = null;updNavHome(getActTab());});
	}
	return item;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const dialForPos = (pos) => {
	if (pos.tabId !== archTabId) {return pinAt(pos.row, pos.col) || JSDStore.dialAt(pos);}
	return JSDStore.dialAt(pos);
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const getActTab = () => {
	const tab = JSDStore.tabById(JSDStore.getUsr().activeTabId);
	if (tab && tab.tabId !== archTabId) {return tab;}
	JSDStore.setActTab(JSDStore.tabsByOrd()[0].tabId);
	return JSDStore.tabById(JSDStore.getUsr().activeTabId);
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const getElm = (elmId) => document.getElementById(elmId);
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const initApp = async () => {
	await JSDStore.initData();
	setView(JSDStore.getUsr().view);
	wireApp();
	renderApp();
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const makeButton = (text, cb = null, elmId = "") => {
	const bttn = makeElement("button", { id: elmId, textContent: text });
	bttn.type = "button";
	if (cb) {bttn.addEventListener("click", cb);}
	return bttn;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const makeColorInput = (elmId, value) => {
	const input = makeElement("input", { id: elmId });
	input.type = "color";
	input.value = value;
	return input;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const makeElement = (tag, opts = {}) => {
	const elm = document.createElement(tag);
	if (opts.id) {elm.id = opts.id;}
	if (opts.className) {elm.className = opts.className;}
	if (opts.textContent !== undefined) {elm.textContent = opts.textContent;}
	return elm;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const makeNumberSelect = (elmId, minVal, maxVal, selVal) => {
	const values = [];
	for (let val = minVal; val <= maxVal; val++) {values.push(val);}
	return makeSelect(elmId, values, selVal);
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const makeSelect = (elmId = "", values = [], selectedValue = null, className = "") => {
	const select = makeElement("select", { id: elmId, className: className });
	for (const value of values) {
		const valueText = value.toString();
		const option = makeElement("option", { textContent: valueText });
		option.value = valueText;
		option.selected = selectedValue !== null && valueText === selectedValue.toString();
		select.appendChild(option);
	}
	return select;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const makeTextInput = (elmId, value, minLen, maxLen) => {
	const input = makeElement("input", { id: elmId });
	input.type = "text";
	input.value = value;
	input.minLength = minLen;
	input.maxLength = maxLen;
	return input;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const moveDraggedDial = (pos) => {
	if (!dragDialPos) {return;}
	const res = JSDStore.moveDial(dragDialPos, pos);
	dragDialPos = null;
	updNavHome(getActTab());
	showMssgs(res.mssgs);
	if (res.ok) {buildTabGrid();}
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const openDial = (dial) => {JSDStore.setLastClk(dial.position);window.open(dial.url, "_blank");};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const openHome = () => {window.open(homePageUrl, "_blank");};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const pinAt = (row, col) => {
	for (const dial of JSDStore.getDials()) {
		if (dial.pinned && dial.position.tabId !== archTabId && dial.position.row === row && dial.position.col === col) {
			return dial;
		}
	}
	return null;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const renderApp = () => {buildTabs();buildTabGrid();updAddBtn();};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const setView = (view) => {
	getElm("app").classList.remove("vView", "hView");
	getElm("app").classList.add(view);
	JSDStore.saveUsr({ view: view });
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const showMssgs = (mssgs) => {for (const mssg of mssgs) {console.info(mssg);}};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const showNavHomeDragMsg = (text, color) => {
	getElm("navHome").textContent = text;
	getElm("navHome").style.color = color;
	getElm("navHome").style.borderColor = color;
	clearTimeout(navHomeMsgTmr);
	navHomeMsgTmr = setTimeout(() => {updNavHome(getActTab());}, 650);
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const updAddBtn = () => {getElm("addTabBtn").hidden = JSDStore.usrTabs().length >= JSDStore.getSys().maxTabs - 1;};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const updNavHome = (tab) => {getElm("navHome").textContent = tab.tabId;};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const wireApp = () => {
	getElm("navHome").addEventListener("click", openHome);
	getElm("addTabBtn").addEventListener("click", () => openTabDialog());
	getElm("settingsBtn").addEventListener("click", () => openSettingsDialog());
	getElm("searchIcon").addEventListener("click", () => toggleDialSearch(true));
	getElm("searchClose").addEventListener("click", () => toggleDialSearch(false));
	getElm("searchText").addEventListener("input", updateSearchInput);
	getElm("searchText").addEventListener("paste", (evt) => evt.preventDefault());
	getElm("searchText").addEventListener("drop", (evt) => evt.preventDefault());
	getElm("searchText").addEventListener("dragover", (evt) => evt.preventDefault());
	getElm("searchClose").hidden = true;
	getElm("searchText").hidden = true;
};

// Search functions
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const toggleDialSearch = (active = !dialSearchMode) => {
	dialSearchMode = active;
	getElm("searchIcon").hidden = dialSearchMode;
	getElm("searchClose").hidden = !dialSearchMode;
	getElm("searchText").hidden = !dialSearchMode;
	if (dialSearchMode) {
		getElm("searchText").focus();
	} else {
		dialSearchLocked = false;
		dialSearchText = "";
		getElm("searchText").value = "";
		getElm("searchText").style.borderColor = "";
	}
	renderApp();
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const updateSearchInput = (evt) => {
	const input = getElm("searchText");
	if (dialSearchLocked && evt.inputType && evt.inputType.startsWith("insert")) {
		input.value = dialSearchText;
		console.info("dialSearchMode", dialSearchMode, "searchInput", dialSearchText, "searchCount", 0, "dialSearchLocked", dialSearchLocked);
		return;
	}
	dialSearchText = input.value;
	dialSearchLocked = false;
	input.style.borderColor = "#0000FF";
	renderApp();
	const searchRes = JSDStore.findDials(dialSearchText.toLowerCase());
	if (dialSearchText.length && searchRes.total === 0) {
		dialSearchLocked = true;
		input.style.borderColor = "#FF0000";
	}
	console.info("dialSearchMode", dialSearchMode, "searchInput", dialSearchText, "searchCount", searchRes.total, "dialSearchLocked", dialSearchLocked);
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
document.addEventListener("DOMContentLoaded", initApp);