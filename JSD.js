/*
	JSD.js
	Version = 20260526
*/
"use strict";
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const homePageUrl = "https://github.com/JayDevDo/JSD-AI";
let dragDialPos = null;
let navHomeMsgTmr = null;
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const getElm = (elmId) => document.getElementById(elmId);
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const clearElm = (elm) => {	while (elm.firstChild) {elm.removeChild(elm.firstChild);}};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const makeElement = (tag, opts = {}) => {
	const elm = document.createElement(tag);
	if (opts.id) {elm.id = opts.id;}
	if (opts.className) {elm.className = opts.className;}
	if (opts.textContent) {elm.textContent = opts.textContent;}
	return elm;
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
const makeColorInput = (elmId, value) => {
	const input = makeElement("input", { id: elmId });
	input.type = "color";
	input.value = value;
	return input;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const makeNumSelect = (elmId, minVal, maxVal, selVal) => {
	const select = makeElement("select", { id: elmId });
	for (let val = minVal; val <= maxVal; val++) {
		const option = makeElement("option", { textContent: val.toString() });
		option.value = val.toString();
		option.selected = val === selVal;
		select.appendChild(option);
	}
	return select;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const makeNumberSelect = (elmId, minVal, maxVal, selVal) => makeNumSelect(elmId, minVal, maxVal, selVal);
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const makeDialogRow = (labelTxt, input) => {
	const row = makeElement("div", { className: "dialogRow" });
	const label = makeElement("label", { textContent: labelTxt });
	label.htmlFor = input.id;
	row.appendChild(label);
	row.appendChild(input);
	return row;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const showMssgs = (mssgs) => {for (const mssg of mssgs) {console.info(mssg);}};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const updAddBtn = () => {getElm("addTabBtn").hidden = JSDStore.usrTabs().length >= JSDStore.getSys().maxTabs - 1;};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const setView = (view) => {
	getElm("app").classList.remove("vView", "hView");
	getElm("app").classList.add(view);
	JSDStore.saveUsr({ view: view });
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const updNavHome = (tab) => {
	getElm("navHome").textContent = tab.tabId;
	getElm("navHome").style.color = "#66CCFF";
	getElm("navHome").style.borderColor = "#66CCFF";
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const showNavHomeDragMsg = (text, color) => {
	getElm("navHome").textContent = text;
	getElm("navHome").style.color = color;
	getElm("navHome").style.borderColor = color;
	clearTimeout(navHomeMsgTmr);
	navHomeMsgTmr = setTimeout(() => {updNavHome(getActTab());}, 650);
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const openHome = () => {window.open(homePageUrl, "_blank");};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const getActTab = () => {
	const tab = JSDStore.tabById(JSDStore.getUsr().activeTabId);
	if (tab && tab.tabId !== archTabId) {return tab;}
	JSDStore.setActTab(JSDStore.tabsByOrd()[0].tabId);
	return JSDStore.tabById(JSDStore.getUsr().activeTabId);
};
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
const dialForPos = (pos) => {
	if (pos.tabId !== archTabId) {return pinAt(pos.row, pos.col) || JSDStore.dialAt(pos);}
	return JSDStore.dialAt(pos);
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const openDial = (dial) => {JSDStore.setLastClk(dial.position);	window.open(dial.url, "_blank"); };
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const moveDraggedDial = (pos) => {
	if (!dragDialPos) {return;}
	const res = JSDStore.moveDial(dragDialPos, pos);
	dragDialPos = null;
	updNavHome(getActTab());
	if (typeof showMssgs === "function") {showMssgs(res.mssgs);}
	if (res.ok) {buildTabGrid();}
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const addDialBtn = (tab, pos) => {
	const bttn = makeElement("button", { className: "addDial", textContent: "Add Dial" });
	bttn.style.background = tab.bgColor;
	bttn.style.color = tab.txtColor;
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
		showNavHomeDragMsg("can't drop here (" + (dial.position.row+1) + "X" + (dial.position.col+1) + ")", "#FF3232");
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
		item.addEventListener("dragend", () => {dragDialPos = null;	updNavHome(getActTab());});
	}
	return item;
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const buildTabGrid = () => {
	const tab = getActTab();
	const grid = getElm("dialGrid");
	const pinGrid = JSDStore.getPinGridSize();
	const pgBrdrClr = "#66CCFF";
	const pgBrdrWdth = "3px";
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
		}
	}
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const buildTabs = () => {
	const navTabs = getElm("navTabs");
	const navHome = getElm("navHome");
	clearElm(navTabs);
	navTabs.appendChild(navHome);
	for (const tab of JSDStore.tabsByOrd()) {
		const tabElm = makeElement("div", { className: "tab" });
		const menuBtn = makeElement("button", { className: "tabMenu", textContent: "🛠" });
		const nameBtn = makeElement("button", { className: "tabName", textContent: tab.tabId });
		tabElm.style.background = tab.bgColor;
		tabElm.style.color = tab.txtColor;
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
const renderApp = () => {buildTabs();buildTabGrid();updAddBtn();};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const wireHome = () => {
	getElm("navHome").addEventListener("click", openHome);
	getElm("addTabBtn").addEventListener("click", () => openTabDialog());
	getElm("settingsBtn").addEventListener("click", () => openSettingsDialog());
};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
const initApp = async () => {await JSDStore.initData();setView(JSDStore.getUsr().view);wireHome();renderApp();};
//- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
document.addEventListener("DOMContentLoaded", initApp);