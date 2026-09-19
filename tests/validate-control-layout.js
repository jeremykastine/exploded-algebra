const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const playerHtml = fs.readFileSync(path.resolve(__dirname, "..", "exploded-algebra.html"), "utf8");

assert(playerHtml.includes('grid-template-columns: repeat(6, minmax(0, 1fr));'));
assert(playerHtml.includes('grid-template-rows: repeat(4, minmax(0, 1fr));'));
assert(playerHtml.includes('[data-workspace-action="resetZoom"] { grid-column: 5; grid-row: 4; }'));
assert(playerHtml.includes('[data-workspace-mode="select"] { grid-column: 6; grid-row: 2; }'));
assert(playerHtml.includes('[data-workspace-action="undoExpression"] { grid-column: 6; grid-row: 3; }'));
assert(
    playerHtml.includes('id="bottomControlsPanel"') && playerHtml.includes('id="bottomPanelResizeHandle"'),
    "The app must provide a distinct bottom controls panel and resize handle"
);
assert(
    /grid-template-rows:\s*min\(var\(--top-panel-height\), 25dvh\)\s*var\(--divider-size\)\s*minmax\(0, 1fr\)\s*var\(--divider-size\)\s*min\(var\(--bottom-panel-height\), 33\.333dvh\);/.test(playerHtml),
    "The student view must use separate top, workspace, and bottom control rows"
);
assert(/\.main-action-panel \{[\s\S]*?overflow: visible;/.test(playerHtml), "The top Commute button must not be clipped by the action-panel boundary");
assert(
    /\.bottom-controls-panel \{[\s\S]*?grid-row: 5;[\s\S]*?pointer-events: auto;/.test(playerHtml),
    "The controls panel must own bottom-panel white-space taps"
);
assert(
    /\.quadrant-tools,[\s\S]*?\.main-action-panel,[\s\S]*?align-self: stretch;[\s\S]*?width: 100%;[\s\S]*?height: 100%;/.test(playerHtml),
    "All control modes must fill the shared bottom-panel footprint"
);
assert(
    playerHtml.indexOf('id="bottomControlsPanel"') < playerHtml.indexOf('class="quadrant-tools"') &&
        playerHtml.indexOf('class="quadrant-tools"') < playerHtml.indexOf('id="mainActionPanel"') &&
        playerHtml.indexOf('id="mainActionPanel"') < playerHtml.indexOf('id="builderKeypadPanel"') &&
        playerHtml.indexOf('id="builderKeypadPanel"') < playerHtml.indexOf('id="bottomPanelResizeHandle"') &&
        playerHtml.indexOf('id="bottomPanelResizeHandle"') < playerHtml.indexOf('id="mainArea"'),
    "All three control modes must be children of the shared bottom controls panel"
);
assert(
    /\.bottom-controls-panel \{[\s\S]*?grid-template-columns: repeat\(6, minmax\(0, 1fr\)\);[\s\S]*?grid-template-rows: repeat\(4, minmax\(0, 1fr\)\);/.test(playerHtml) &&
        /\.bottom-controls-panel > \.quadrant-tools,[\s\S]*?\.bottom-controls-panel > \.main-action-panel,[\s\S]*?\.bottom-controls-panel > \.builder-keypad-panel \{[\s\S]*?grid-template-columns: subgrid;[\s\S]*?grid-template-rows: subgrid;/.test(playerHtml),
    "Pre-selection, post-selection, and Expression Builder must use the panel's single four-by-six grid"
);
assert(playerHtml.includes('id="settingsButton"'), "The pre-selection controls must retain the Settings button");
assert(playerHtml.includes('.workspace-toolbar .settings-button { grid-column: 6; grid-row: 4; }'), "Settings must occupy the lower-right pre-selection cell");
assert(playerHtml.includes('body.selection-active:not(.expression-builder-active) .quadrant-tools { display: none; }'), "Post-selection must hide the complete pre-selection toolbar, including Settings");
assert(/body\.expression-builder-active \.quadrant-menu,[\s\S]*?body\.expression-builder-active \.quadrant-tools,[\s\S]*?display: none;/.test(playerHtml), "Expression Builder must hide the Settings toolbar");
assert(!playerHtml.includes('cancel-selection-button'), "The post-selection grid must not include a Cancel Selection button");

const expectedPostSelectionPositions = [
    ['[data-direct-commute="·"]', 3, 3],
    ['[data-direct-commute="+"]', 4, 3],
    ['[data-auto-compute-placeholder]', 5, 3],
    ['.manual-compute-button', 6, 3],
    ['[data-direct-inverse-number-slot="inverse-one"]', 2, 3],
    ['[data-direct-inverse-number-slot="inverse-negative-one"]', 2, 4]
];
expectedPostSelectionPositions.forEach(([selector, column, row]) => {
    assert(
        playerHtml.includes(`.main-action-panel .intent-category-actions > ${selector} { grid-column: ${column}; grid-row: ${row}; }`),
        `Post-selection control ${selector} must occupy column ${column}, row ${row}`
    );
});
const expectedPairedButtonPositions = [
    ['[data-tool="factorLeft"]', 3, 4],
    ['[data-tool="distributeLeftToRight"]', 4, 4],
    ['[data-tool="distributeRightToLeft"]', 5, 4],
    ['[data-tool="factorRight"]', 6, 4],
    ['[data-tool="factorProductOfInverses"]', 1, 3],
    ['[data-tool="distributeInverseOverProduct"]', 1, 4]
];
expectedPairedButtonPositions.forEach(([selector, column, row]) => {
    assert(
        playerHtml.includes(`.main-action-panel .intent-category-actions > ${selector} { grid-column: ${column}; grid-row: ${row}; }`),
        `Paired control ${selector} must retain column ${column}, row ${row}`
    );
});
const expectedDirectOptionPositions = [
    ['insert', 'insertIdentityAddZeroBottom', null, 6, 1],
    ['insert', 'insertIdentityMultiplyByOneRight', null, 4, 1],
    ['insert', 'cancelOpposites', null, 5, 1],
    ['insert', 'replaceOneWithInverseProduct', null, 1, 1],
    ['delete', 'eliminateIdentities', 'additive', 6, 2],
    ['delete', 'eliminateIdentities', 'multiplicative', 4, 2],
    ['delete', 'cancelOpposites', null, 5, 2],
    ['delete', 'cancelProductWithInverse', null, 1, 2]
];
expectedDirectOptionPositions.forEach(([category, tool, variant, column, row]) => {
    const selector = `[data-direct-rule-category="${category}"][data-tool="${tool}"]${variant ? `[data-direct-rule-variant="${variant}"]` : ""}`;
    assert(
        playerHtml.includes(`.main-action-panel .intent-category-actions > ${selector} { grid-column: ${column}; grid-row: ${row}; }`),
        `${category} option ${tool} must retain column ${column}, row ${row}`
    );
});
[
    ["double-inverse-insert", 1],
    ["double-inverse-cancel", 2],
].forEach(([slot, row]) => assert(
    playerHtml.includes(`.main-action-panel .intent-category-actions > [data-direct-rule-slot="${slot}"] { grid-column: 2; grid-row: ${row}; }`),
    `${slot} must occupy column 2, row ${row}`
));
[
    ["zero-product-insert", 1],
    ["zero-product-cancel", 2]
].forEach(([slot, row]) => assert(
    playerHtml.includes(`.main-action-panel .intent-category-actions > [data-direct-rule-slot="${slot}"] { grid-column: 3; grid-row: ${row}; }`),
    `${slot} must occupy column 3, row ${row}`
));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-tool="factorProductOfInverses"],'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-tool="distributeLeftToRight"] { grid-column: 3; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-tool="factorLeft"] { grid-column: 4; }'));
assert(/\.quadrant-tools \.workspace-toolbar,[\s\S]*?grid-template-columns: repeat\(6, minmax\(0, 1fr\)\);[\s\S]*?grid-template-rows: repeat\(4, minmax\(0, 1fr\)\);[\s\S]*?width: 100%;[\s\S]*?height: 100%;/.test(playerHtml));
assert(/\.main-action-panel \.intent-category-actions \{[\s\S]*?grid-template-columns: repeat\(6, minmax\(0, 1fr\)\);[\s\S]*?grid-template-rows: repeat\(4, minmax\(0, 1fr\)\);/.test(playerHtml));

const playerJs = fs.readFileSync(path.resolve(__dirname, "..", "exploded-algebra-tool.js"), "utf8");
assert(playerJs.includes("function isPointInsideCurrentSelection(x, y)"), "Selection presses must use the highlighted selection bounds");
assert(/function selectFromWorkspaceTap\(x, y, pointerType, allowSelectionCancel = true\) \{[\s\S]*?allowSelectionCancel && selection\.node && isPointInsideCurrentSelection\(x, y\)[\s\S]*?clearSelection\(\);[\s\S]*?return true;/.test(playerJs), "Pressing inside the current selection must clear it");
assert(playerJs.includes("selectFromWorkspaceTap(startPoint.x, startPoint.y, pointerStart.pointerType, false);") && playerJs.includes("selectFromWorkspaceTap(endPoint.x, endPoint.y, pointerStart.pointerType, false);"), "Dragging from the selection must remain a two-endpoint selection gesture rather than a cancel press");
assert(!playerJs.includes("clearingSelectionFromEmptySpace"), "Empty workspace presses must no longer clear the selection");
assert(!playerJs.includes('action === "cancelSelection"'), "The old Cancel Selection action must be removed");
const expectedDirectRules = [
    ['distributeLeftToRight', 'Distribute left'],
    ['factorLeft', 'Factor left'],
    ['factorRight', 'Factor right'],
    ['distributeRightToLeft', 'Distribute right'],
    ['distributeInverseOverProduct', 'Separate inverse'],
    ['factorProductOfInverses', 'Combine inverses']
];
expectedDirectRules.forEach(([tool, label]) => {
    assert(
        playerJs.includes(`{ tool: "${tool}", label: "${label}" }`),
        `${label} must be rendered as a direct branching-rule button`
    );
});
assert(playerJs.includes('{ tool: "insertIdentityAddZeroBottom", label: "Add zero", icon: "A+0" }'));
assert(playerJs.includes('{ tool: "insertIdentityMultiplyByOneRight", label: "Multiply by one", icon: "A·1" }'));
assert(playerJs.includes('{ tool: "cancelOpposites", label: "Introduce additive inverses", icon: "A−A", variant: "insert" }'));
assert(playerJs.includes('{ tool: "replaceOneWithInverseProduct", label: "Introduce multiplicative inverses", icon: "A÷A" }'));
assert(playerJs.includes('{ tool: "eliminateIdentities", label: "Remove additive identity", icon: "A", variant: "additive" }'));
assert(playerJs.includes('{ tool: "eliminateIdentities", label: "Remove multiplicative identity", icon: "A", variant: "multiplicative" }'));
assert(playerJs.includes('{ tool: "cancelOpposites", label: "Cancel additive inverses", icon: "0", variant: "delete" }'));
assert(playerJs.includes('{ tool: "cancelProductWithInverse", label: "Cancel multiplicative inverses", icon: "1" }'));
assert(playerJs.includes('{ tool: "insertDoubleInverse", label: "Introduce double inverse", icon: "÷÷A", category: "insert", slot: "double-inverse-insert" }'));
assert(playerJs.includes('{ tool: "eliminateDoubleInverse", label: "Cancel double inverse", icon: "A", category: "delete", slot: "double-inverse-cancel" }'));
assert(playerJs.includes('{ tool: "insertZeroProductRight", label: "Introduce zero product", icon: "A·0", category: "insert", slot: "zero-product-insert" }'));
assert(playerJs.includes('{ tool: "zeroProduct", label: "Cancel zero product", icon: "0", category: "delete", slot: "zero-product-cancel" }'));
assert(playerJs.includes('{ tool: "rewriteInvOneToOne", label: "Simplify inverse of one", operand: "1", result: "1", slot: "inverse-one" }'));
assert(playerJs.includes('{ tool: "rewriteInvNegOneToNegOne", label: "Simplify inverse of negative one", operand: "−1", result: "−1", slot: "inverse-negative-one" }'));
assert(playerJs.includes('buildDirectCommuteButtonHtml("commuteFactors", "·", "Commute multiplication")'));
assert(playerJs.includes('buildDirectCommuteButtonHtml("commuteTerms", "+", "Commute addition")'));
assert(playerJs.includes('class="intent-category-button numerical-rewrite-mode-button auto-compute-placeholder" data-auto-compute-placeholder') && playerJs.includes('disabled>'));
assert(playerJs.includes('class="intent-category-button numerical-rewrite-mode-button manual-compute-button" data-tool="numericalRewrite"'));
assert(playerJs.includes('function buildSplitRulePairHtml(pairName, orientation, buttonsHtml, options = {})'));
assert(playerJs.includes('function buildDirectOptionRulePairHtml(pairName, firstRule, firstCategory, secondRule, secondCategory, label)'));
assert(!playerJs.includes('const categoryIds = ["numericalRewrite", "commute"];'));
assert(playerJs.includes('data-direct-rule-category="${categoryId}"'));
assert(playerJs.includes('data-direct-rule-variant="${escapeHtml(rule.variant)}"'));
assert(playerJs.includes('targetTool === "cancelOpposites"') && playerJs.includes('data-direct-rule-category="${directCategory}"'));
assert(playerJs.includes('function isDirectRuleButtonApplicable(button, toolName)'));
assert(playerJs.includes('identityData.kind === "sum"') && playerJs.includes('identityData.kind === "prod"'));
assert(!playerJs.includes('data-remaining-actions-menu') && !playerHtml.includes('remaining-actions-menu-button'));
assert(!playerHtml.includes('direct-rule-icon.crossed-out'));
assert(playerJs.includes('function buildDirectBranchRulePairHtml(pairName, orientation, firstTool, secondTool, options = {})'));
assert(playerJs.includes('function buildBranchPairOverlayHtml(pairName)'));
assert(playerJs.includes('function buildReversePairOverlayHtml(pairName, orientation)'));
['double-inverse', 'zero-product', 'additive-identity', 'multiplicative-identity', 'additive-inverse', 'multiplicative-inverse'].forEach(pair => {
    assert(playerJs.includes(`"${pair}"`), `${pair} must have a two-way relationship arrow`);
});
assert(playerJs.includes('M50 88 V118 M43 96 L50 88 L57 96 M43 110 L50 118 L57 110'));
assert(playerJs.includes('M88 82 H118 M96 75 L88 82 L96 89 M110 75 L118 82 L110 89'));
assert(/\.main-action-panel \.reverse-pair-overlay \{[\s\S]*?pointer-events: none;/.test(playerHtml));
assert(/\.main-action-panel \.split-rule-frame \{[\s\S]*?border: 0;[\s\S]*?border-radius: 0;/.test(playerHtml));
assert(!playerHtml.includes('.main-action-panel .split-rule-frame::after {'));
assert(!playerHtml.includes('.main-action-panel .split-rule-frame-horizontal::after {'));
assert(!playerHtml.includes('.main-action-panel .split-rule-frame-vertical::after {'));
assert(playerJs.includes('<span class="split-rule-frame split-rule-frame-${orientation} split-rule-frame-${pairName}" data-rule-pair="${pairName}" aria-hidden="true"></span>'));
assert(!playerJs.includes('<div class="split-rule-button'));
assert(!/\.main-action-panel \.intent-category-actions > button\.direct-branch-rule-button,[^}]*\bwidth:/.test(playerHtml));
assert(!/\.main-action-panel \.intent-category-actions > button\.direct-branch-rule-button,[^}]*\bheight:/.test(playerHtml));
assert(playerJs.includes('function isAlwaysAllowedNumericalRewriteExchange(originalNode, proposedNode)'));
assert(playerJs.includes('isExactDoubleNegativeProduct(originalNode) && proposedIsOne'));
assert(playerJs.includes('isExactInverseOfNegativeOne(originalNode) && proposedIsNegativeOne'));
assert(playerJs.includes('data-branch-pair="left"') && playerJs.includes('data-branch-pair="right"') && playerJs.includes('data-branch-pair="inverse"'));
assert(playerJs.includes('M62 50 H82 C104 50 108 25 130 25 H144 M62 50 H82 C104 50 108 75 130 75 H144'));
assert(playerJs.includes('M62 25 H76 C98 25 102 50 124 50 H144 M62 75 H76 C98 75 102 50 124 50 H144'));
assert(playerJs.includes('M50 62 V82 C50 104 28 108 28 130 V144 M50 62 V82 C50 104 72 108 72 130 V144'));
assert(playerJs.includes('class="branch-arrowhead"'));
assert(playerJs.includes('M62 50 L70 44 V56 Z M144 25 L136 20 V30 Z M144 75 L136 70 V80 Z'));
assert(playerJs.includes('M62 25 L70 20 V30 Z M62 75 L70 70 V80 Z M144 50 L136 44 V56 Z'));
assert(playerJs.includes('M50 62 L44 70 H56 Z M28 144 L22 136 H34 Z M72 144 L66 136 H78 Z'));
assert(!playerJs.includes('buildDirectBranchRulePairHtml("distribute-left", "horizontal", "factorLeft", "distributeLeftToRight", { branch: true, reverse: true'));
assert(!playerJs.includes('buildDirectBranchRulePairHtml("distribute-right", "horizontal", "distributeRightToLeft", "factorRight", { branch: true, reverse: true'));
assert(/body\.left-handed \.main-action-panel \[data-branch-pair="left"\],[\s\S]*?transform: scaleX\(-1\);/.test(playerHtml));
assert(/\.main-action-panel \.branch-pair-overlay \{[\s\S]*?pointer-events: none;/.test(playerHtml));
assert(playerJs.includes('ruleName === "rewriteInvOneToOne"') && playerJs.includes('isInvNode(node) && isValueNode(node.args[0], "1") ? valueNode("1") : null'));
assert(playerHtml.includes('.main-action-panel .branch-rule-symbol-2') && playerHtml.includes('.main-action-panel .direct-commute-icon'));
assert(playerHtml.includes('.main-action-panel .split-rule-frame-numerical-rewrite { grid-column: 5 / span 2; grid-row: 3; }'));
assert(playerJs.includes('class="post-selection-grid-overlay"') && playerJs.includes('M1 1 H599 V399 H1 Z'));
assert(playerJs.includes('M300 1 V300') && playerJs.includes('M500 1 V300') && playerJs.includes('M100 300 H599'));
assert(/\.main-action-panel \.post-selection-grid-overlay \{[\s\S]*?grid-column: 1 \/ -1;[\s\S]*?grid-row: 1 \/ -1;[\s\S]*?pointer-events: none;/.test(playerHtml));
assert(/body\.selection-active:not\(\.expression-builder-active\) \.bottom-controls-panel,[\s\S]*?gap: 0;/.test(playerHtml));
assert(/body\.left-handed \.main-action-panel \.post-selection-grid-overlay \{[\s\S]*?transform: scaleX\(-1\);/.test(playerHtml));
assert(/\.main-action-panel \.intent-category-actions > button\.intent-category-button::before \{[\s\S]*?inset: clamp\(4px,[\s\S]*?border: 0;[\s\S]*?border-radius: clamp\(6px,[\s\S]*?background: #eeeeee;[\s\S]*?pointer-events: none;/.test(playerHtml));
assert(/\.main-action-panel \.intent-category-actions > button\.intent-category-button > \* \{[\s\S]*?position: relative;[\s\S]*?z-index: 1;/.test(playerHtml));
assert(playerHtml.includes('exploded-algebra-tool.js?v=20260919-inset-action-tiles'));
assert(playerJs.includes("function applyResponsiveMainButtonSize()"));
assert(playerJs.includes('const availableWidth = Math.max(1, bottomControlsPanel.clientWidth);'));
assert(playerJs.includes('const availableHeight = Math.max(1, bottomControlsPanel.clientHeight);'));
assert(playerJs.includes("const columns = 6;"));
assert(playerJs.includes("const rows = 4;"));
assert(playerJs.includes("Math.min(widthLimit, heightLimit)"));
assert(!playerJs.includes("mainButtonSize"));
assert(!playerHtml.includes("Button size"));
assert(playerJs.includes("function installBottomPanelResizing()"));
assert(playerJs.includes("const BOTTOM_PANEL_MAX_VIEWPORT_RATIO = 1 / 3;"));
assert(playerJs.includes('document.body.classList.toggle("selection-active", selectionActive);\n            applyResponsiveMainButtonSize();'));

console.log("Control layout checks passed.");
