/*
	dlg_Settings.js
	Version = 20260525
*/
"use strict";
//==============================================================================
const makeDecimalInput = (elmId, value, step = "0.1") => {
	const input = makeElement("input", { id: elmId });
	input.type = "number";
	input.step = step;
	input.value = value;
	input.style.width = "7ch";
	return input;
};
//==============================================================================
const makeCompactNumSelect = (elmId, minVal, maxVal, selVal) => {
	const select = makeNumberSelect(elmId, minVal, maxVal, selVal);
	select.style.width = "7ch";
	return select;
};
//==============================================================================
const makeCompactSelect = (elmId, values, selectedValue) => {
	const select = makeElement("select", { id: elmId });
	select.style.width = "12ch";
	for (const value of values) {
		const option = makeElement("option", { textContent: value });
		option.value = value;
		option.selected = value === selectedValue;
		select.appendChild(option);
	}
	return select;
};
//==============================================================================
const makeViewToggleButton = (elmId, selectedValue) => {
	const labels = {
		vView: "tabs left",
		hView: "tabs on top"
	};
	const nextView = (view) => view === "vView" ? "hView" : "vView";
	const button = makeElement("button", { id: elmId, textContent: labels[nextView(selectedValue)] });
	button.type = "button";
	button.value = selectedValue;
	button.style.whiteSpace = "nowrap";
	button.addEventListener("click", () => {
		button.value = nextView(button.value);
		setView(button.value);
		renderApp();
		button.closest("#settingsDlg").remove();
	});
	return button;
};
//==============================================================================
const makeEmptySettingValue = () => {
	const value = makeElement("div", { textContent: "" });
	value.style.minWidth = "7ch";
	return value;
};
//==============================================================================
const makeReadOnlyValue = (text) => {
	const value = makeElement("div", { textContent: text.toString() });
	value.style.minWidth = "7ch";
	value.style.padding = "2px 0";
	value.style.color = "#aaaaaa";
	value.style.opacity = "0.75";
	return value;
};
//==============================================================================
const styleSettingsHeader = (elm) => {
	elm.style.fontSize = "1.15em";
	elm.style.fontWeight = "bold";
	elm.style.color = "#f8e45c";
	return elm;
};
//==============================================================================
const makeSettingsGridCell = (text) => {
	const cell = makeElement("div", { textContent: text });
	cell.style.display = "grid";
	cell.style.alignItems = "center";
	cell.style.minHeight = "24px";
	return cell;
};
//==============================================================================
const makeReadOnlyGridCell = (text) => {
	const cell = makeSettingsGridCell(text);
	cell.style.color = "#aaaaaa";
	cell.style.opacity = "0.75";
	return cell;
};
//==============================================================================
const makeArchiveHeader = (text) => {
	const cell = styleSettingsHeader(makeSettingsGridCell(text));
	cell.style.gridColumn = "1 / -1";
	cell.style.marginTop = "6px";
	return cell;
};
//==============================================================================
const makeSettingsGrid = (rows) => {
	const grid = makeElement("div");
	grid.style.display = "grid";
	grid.style.gridTemplateColumns = "max-content min-content min-content";
	grid.style.gap = "4px 10px";
	grid.style.alignItems = "center";
	grid.style.minWidth = "0";

	const keyHdr = makeSettingsGridCell("Setting");
	const minHdr = makeSettingsGridCell("Min");
	const maxHdr = makeSettingsGridCell("Max");
	keyHdr.style.fontWeight = "bold";
	minHdr.style.fontWeight = "bold";
	maxHdr.style.fontWeight = "bold";

	grid.appendChild(keyHdr);
	grid.appendChild(minHdr);
	grid.appendChild(maxHdr);

	for (const row of rows) {
		grid.appendChild(makeSettingsGridCell(row.label));
		grid.appendChild(row.min || makeEmptySettingValue());
		grid.appendChild(row.max || makeEmptySettingValue());
	}

	return grid;
};
//==============================================================================
const makeReadOnlySettingsGrid = (rows) => {
	const grid = makeElement("div");
	grid.style.display = "grid";
	grid.style.gridTemplateColumns = "max-content min-content";
	grid.style.gap = "4px 10px";
	grid.style.alignItems = "center";
	grid.style.minWidth = "0";

	for (const row of rows) {
		grid.appendChild(makeReadOnlyGridCell(row.label));
		grid.appendChild(row.value);
	}

	return grid;
};
//==============================================================================
const makeContrastPair = (input, sysLimit) => {
	const wrap = makeElement("div");
	wrap.style.display = "grid";
	wrap.style.gridTemplateColumns = "min-content min-content";
	wrap.style.gap = "4px";
	wrap.style.alignItems = "center";
	wrap.style.minWidth = "0";
	wrap.appendChild(input);
	wrap.appendChild(sysLimit);
	return wrap;
};
//==============================================================================
const makeArchiveTableCell = (text) => {
	const cell = makeElement("div", { textContent: text });
	cell.style.padding = "2px 4px";
	cell.style.whiteSpace = "nowrap";
	cell.style.overflow = "hidden";
	cell.style.textOverflow = "ellipsis";
	cell.style.minWidth = "0";
	return cell;
};
//==============================================================================
const makeArchiveTable = (archiveSizeValue) => {
	const wrap = makeElement("div");
	const body = makeElement("div");

	wrap.style.gridColumn = "1 / -1";
	wrap.style.width = "100%";
	wrap.style.maxWidth = "100%";
	wrap.style.minWidth = "0";
	wrap.style.height = "108px";
	wrap.style.minHeight = "108px";
	wrap.style.maxHeight = "108px";
	wrap.style.overflowY = "auto";
	wrap.style.overflowX = "hidden";
	wrap.style.border = "1px solid #444444";
	wrap.style.background = "#111111";
	wrap.style.boxSizing = "border-box";

	body.style.display = "grid";
	body.style.gridAutoRows = "min-content";
	body.style.minWidth = "0";

	wrap.appendChild(body);

	const redrawArchiveTable = () => {
		const archiveTab = JSDStore.tabById(archTabId);
		const archiveCols = archiveTab ? archiveTab.cols : 6;
		const archiveDials = JSDStore.tabDials(archTabId);

		clearElm(body);
		archiveSizeValue.textContent = archiveDials.length.toString();

		for (const dial of archiveDials) {
			const row = makeElement("div");
			const order = (dial.position.row * archiveCols) + dial.position.col;
			const pos = cloneData(dial.position);
			const restoreBtn = makeElement("button", { textContent: "restore" });
			const deleteBtn = makeElement("button", { textContent: "delete4ever" });

			restoreBtn.type = "button";
			deleteBtn.type = "button";
			restoreBtn.style.whiteSpace = "nowrap";
			deleteBtn.style.whiteSpace = "nowrap";

			row.style.display = "grid";
			row.style.gridTemplateColumns = "7ch minmax(0, 1fr) min-content min-content";
			row.style.minWidth = "0";

			restoreBtn.addEventListener("click", () => {
				const res = JSDArch.restoreFromArchPos(pos);
				redrawArchiveTable();
				renderApp();
				if (typeof showMssgs === "function") {showMssgs(res.mssgs);}
			});

			deleteBtn.addEventListener("click", () => {
				const res = JSDArch.deleteFromArchPos(pos);
				redrawArchiveTable();
				renderApp();
				if (typeof showMssgs === "function") {showMssgs(res.mssgs);}
			});

			row.appendChild(makeArchiveTableCell(order.toString()));
			row.appendChild(makeArchiveTableCell(dial.label || ""));
			row.appendChild(restoreBtn);
			row.appendChild(deleteBtn);
			body.appendChild(row);
		}

		if (!archiveDials.length) {
			const row = makeElement("div");
			row.style.display = "grid";
			row.style.gridTemplateColumns = "1fr";
			row.style.minWidth = "0";
			row.appendChild(makeArchiveTableCell("Archive empty"));
			body.appendChild(row);
		}
	};

	redrawArchiveTable();
	return wrap;
};
//==============================================================================
const makeUserGrid = (rows) => {
	const grid = makeElement("div");
	grid.style.display = "grid";
	grid.style.gridTemplateColumns = "max-content min-content max-content min-content";
	grid.style.gap = "4px 8px";
	grid.style.alignItems = "center";
	grid.style.minWidth = "0";

	for (const row of rows) {
		if (row.full) {
			row.full.style.gridColumn = "1 / -1";
			grid.appendChild(row.full);
			continue;
		}
		grid.appendChild(row.labelA || makeEmptySettingValue());
		grid.appendChild(row.valueA || makeEmptySettingValue());
		grid.appendChild(row.labelB || makeEmptySettingValue());
		grid.appendChild(row.valueB || makeEmptySettingValue());
	}

	return grid;
};
//==============================================================================
const makeSettingsBlock = (titleText, content) => {
	const block = makeElement("div");
	const title = styleSettingsHeader(makeElement("h3", { textContent: titleText }));

	block.style.display = "grid";
	block.style.gridAutoRows = "min-content";
	block.style.gap = "4px";
	block.style.alignContent = "start";
	block.style.minWidth = "0";
	block.style.overflow = "hidden";

	title.style.margin = "0 0 4px 0";

	block.appendChild(title);
	block.appendChild(content);

	return block;
};
//==============================================================================
const makeStackedBlocks = (blocks) => {
	const wrap = makeElement("div");
	wrap.style.display = "grid";
	wrap.style.gridAutoRows = "min-content";
	wrap.style.gap = "14px";
	wrap.style.alignContent = "start";
	wrap.style.minWidth = "0";
	wrap.style.overflow = "hidden";
	for (const block of blocks) {wrap.appendChild(block);}
	return wrap;
};
//==============================================================================
const makeSideBySideBlocks = (leftBlock, rightBlock) => {
	const wrap = makeElement("div");
	wrap.style.gridColumn = "1 / -1";
	wrap.style.display = "grid";
	wrap.style.gridTemplateColumns = "minmax(0, 1fr) minmax(0, 1fr)";
	wrap.style.gap = "18px";
	wrap.style.alignItems = "start";
	wrap.style.minWidth = "0";
	wrap.appendChild(leftBlock);
	wrap.appendChild(rightBlock);
	return wrap;
};
//==============================================================================
const openSettingsDialog = () => {
	const sys = cloneData(JSDStore.getSys());
	const usr = cloneData(JSDStore.getUsr());
	const dialog = makeElement("div", { id: "settingsDlg" });
	const panel = makeElement("div", { id: "settingsDlgPanel" });
	const title = makeElement("h2", { textContent: "Settings" });

	const minRowsInput = makeCompactNumSelect("setMinRows", 3, 6, sys.minRows);
	const maxRowsInput = makeCompactNumSelect("setMaxRows", 3, 6, sys.maxRows);
	const minColsInput = makeCompactNumSelect("setMinCols", 3, 6, sys.minCols);
	const maxColsInput = makeCompactNumSelect("setMaxCols", 3, 6, sys.maxCols);
	const minLabelInput = makeCompactNumSelect("setMinLabelLen", 3, 8, sys.minLabelLen);
	const maxTabLabelInput = makeCompactNumSelect("setMaxTabLabelLen", 8, 12, sys.maxTabLabelLen);
	const maxDialLabelInput = makeCompactNumSelect("setMaxDialLabelLen", 8, 16, sys.maxDialLabelLen);

	const themeInput = makeCompactSelect("setTheme", sys.themeOptions, usr.theme);
	const viewInput = makeViewToggleButton("setView", usr.view);

	const userContrastMinInput = makeDecimalInput("setUserContrastMin", usr.contrastLevel[0]);
	const userContrastMaxInput = makeDecimalInput("setUserContrastMax", usr.contrastLevel[1]);

	const maxTabsValue = makeReadOnlyValue(sys.maxTabs - 1);
	const maxPinsValue = makeReadOnlyValue(sys.maxPins);
	const activeTabValue = makeReadOnlyValue(usr.activeTabId);
	const contrastMinValue = makeReadOnlyValue(sys.contrastLimits[0]);
	const contrastMaxValue = makeReadOnlyValue(sys.contrastLimits[1]);
	const archiveSizeValue = makeReadOnlyValue(JSDStore.tabDials(archTabId).length);

	const jsonBtn = makeElement("button", { textContent: "import - export" });
	const actions = makeElement("div", { className: "dialogActions" });
	const applyBtn = makeElement("button", { textContent: "Apply" });
	const cancelBtn = makeElement("button", { textContent: "Cancel" });

	jsonBtn.type = "button";
	jsonBtn.addEventListener("click", () => {
		dialog.remove();
		openJsonDialog();
	});

	const sysGrid = makeSettingsGrid([
		{ label: "Rows", min: minRowsInput, max: maxRowsInput },
		{ label: "Columns", min: minColsInput, max: maxColsInput },
		{ label: "Label length", min: minLabelInput, max: makeEmptySettingValue() },
		{ label: "Tab label", min: makeEmptySettingValue(), max: maxTabLabelInput },
		{ label: "Dial label", min: makeEmptySettingValue(), max: maxDialLabelInput }
	]);

	const usrGrid = makeUserGrid([
		{
			labelA: makeSettingsGridCell("View"),
			valueA: viewInput,
			labelB: makeSettingsGridCell("Theme"),
			valueB: themeInput
		},
		{
			labelA: makeSettingsGridCell("Contrast"),
			valueA: makeContrastPair(userContrastMinInput, contrastMinValue),
			labelB: makeEmptySettingValue(),
			valueB: makeContrastPair(userContrastMaxInput, contrastMaxValue)
		},
		{
			labelA: makeSettingsGridCell("JSON"),
			valueA: jsonBtn,
			labelB: makeEmptySettingValue(),
			valueB: makeEmptySettingValue()
		},
		{
			full: makeArchiveHeader("Archive")
		},
		{
			labelA: makeSettingsGridCell("Items"),
			valueA: archiveSizeValue,
			labelB: makeEmptySettingValue(),
			valueB: makeEmptySettingValue()
		},
		{
			full: makeArchiveTable(archiveSizeValue)
		}
	]);

	const readOnlyGrid = makeReadOnlySettingsGrid([
		{ label: "Max user tabs", value: maxTabsValue },
		{ label: "Max pins", value: maxPinsValue },
		{ label: "Active tab", value: activeTabValue }
	]);

	const validateSettings = () => {
		const msgs = [];
		if (Number(minRowsInput.value) > Number(maxRowsInput.value)) {msgs.push("minRows cannot be greater than maxRows");}
		if (Number(minColsInput.value) > Number(maxColsInput.value)) {msgs.push("minCols cannot be greater than maxCols");}
		if (Number(userContrastMinInput.value) > Number(userContrastMaxInput.value)) {msgs.push("user contrast min cannot be greater than max");}
		return msgs;
	};

	applyBtn.type = "button";
	cancelBtn.type = "button";

	applyBtn.addEventListener("click", () => {
		const msgs = validateSettings();
		if (msgs.length) {
			if (typeof showMssgs === "function") {showMssgs(msgs);}
			return;
		}

		const newSys = {
			minRows: Number(minRowsInput.value),
			maxRows: Number(maxRowsInput.value),
			minCols: Number(minColsInput.value),
			maxCols: Number(maxColsInput.value),
			minLabelLen: Number(minLabelInput.value),
			maxTabLabelLen: Number(maxTabLabelInput.value),
			maxDialLabelLen: Number(maxDialLabelInput.value)
		};

		const newUsr = {
			contrastLevel: [Number(userContrastMinInput.value), Number(userContrastMaxInput.value)],
			theme: themeInput.value,
			view: viewInput.value
		};

		JSDStore.saveSettings(newSys, newUsr);
		setView(newUsr.view);
		renderApp();
		dialog.remove();

		if (typeof showMssgs === "function") {showMssgs(["settings saved"]);}
	});

	cancelBtn.addEventListener("click", () => dialog.remove());

	panel.appendChild(title);
	panel.appendChild(makeSideBySideBlocks(
		makeSettingsBlock("User settings", usrGrid),
		makeStackedBlocks([
			makeSettingsBlock("System settings", sysGrid),
			makeSettingsBlock("Read-only settings", readOnlyGrid)
		])
	));

	actions.appendChild(applyBtn);
	actions.appendChild(cancelBtn);
	panel.appendChild(actions);
	dialog.appendChild(panel);
	document.body.appendChild(dialog);
	themeInput.focus();
};