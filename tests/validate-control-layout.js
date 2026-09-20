const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const playerHtml = fs.readFileSync(path.resolve(__dirname, "..", "exploded-algebra.html"), "utf8");
const playerJs = fs.readFileSync(path.resolve(__dirname, "..", "exploded-algebra-tool.js"), "utf8");

assert(playerHtml.includes('grid-template-columns: repeat(6, minmax(0, 1fr));'));
assert(playerHtml.includes('grid-template-rows: repeat(4, minmax(0, 1fr));'));
assert(playerHtml.includes('[data-workspace-action="resetZoom"] { grid-column: 3; grid-row: 4; }'));
assert(playerHtml.includes('[data-workspace-mode="select"] { grid-column: 4; grid-row: 1; }'));
assert(playerHtml.includes('[data-workspace-action="undoExpression"] { grid-column: 4; grid-row: 2; }'));
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
assert(!playerHtml.includes('id="settingsButton"') && !playerHtml.includes('id="levelMenuPanel"'), "Settings must live directly in the pre-selection toolbar");
["steps-lines", "bar-style", "bar-shading"].forEach(setting => {
    assert(playerHtml.includes(`data-workspace-setting="${setting}"`), `Missing inline ${setting} setting button`);
});
assert(!playerHtml.includes('data-workspace-setting="handedness"') && !playerJs.includes("setLeftHandedLayout"), "The left-handedness option must be removed");
assert(playerHtml.includes('data-workspace-action="resetExercise"'), "Reset Exercise must remain available as a pre-selection action");
assert(playerHtml.includes('.workspace-toolbar [data-workspace-mode="pan"] { grid-column: 3; grid-row: 1; }'));
assert(playerHtml.includes('.workspace-toolbar [data-workspace-mode="select"] { grid-column: 4; grid-row: 1; }'));
assert(playerHtml.includes('.workspace-toolbar [data-workspace-setting="steps-lines"] { grid-column: 1 / span 2; grid-row: 1; }'));
assert(playerHtml.includes('.workspace-toolbar [data-workspace-setting="bar-style"] { grid-column: 1 / span 2; grid-row: 2; }'));
assert(playerHtml.includes('.workspace-toolbar [data-workspace-setting="bar-shading"] { grid-column: 1 / span 2; grid-row: 3; }'));
assert(playerHtml.includes('.workspace-toolbar [data-workspace-action="resetExercise"] { grid-column: 1 / span 2; grid-row: 4; }'));
assert(playerHtml.includes('.workspace-toolbar [data-workspace-action="zoomIn"] { grid-column: 3; grid-row: 2; }'));
assert(playerHtml.includes('.workspace-toolbar [data-workspace-action="zoomOut"] { grid-column: 3; grid-row: 3; }'));
assert(playerHtml.includes('.workspace-toolbar [data-workspace-action="resetZoom"] { grid-column: 3; grid-row: 4; }'));
assert(playerHtml.includes('.workspace-toolbar [data-workspace-action="undoExpression"] { grid-column: 4; grid-row: 2; }'));
assert(playerHtml.includes('body.selection-active:not(.expression-builder-active) .quadrant-tools { display: none; }'), "Post-selection must hide all pre-selection settings and tools");
assert(/body\.expression-builder-active \.quadrant-menu,[\s\S]*?body\.expression-builder-active \.quadrant-tools,[\s\S]*?display: none;/.test(playerHtml), "Expression Builder must hide the pre-selection toolbar");
assert(playerHtml.includes('cancel-selection-button'), "The post-selection grid must include a Cancel Selection button");
assert(playerHtml.includes('.main-action-panel .intent-category-actions > [data-contextual-commute] { grid-column: 3 / span 2; grid-row: 3; }'));
assert(playerHtml.includes('.main-action-panel .intent-category-actions > [data-contextual-numerical-rewrite] { grid-column: 5 / span 2; grid-row: 3; }'));
assert(playerHtml.includes('.main-action-panel .intent-category-actions > [data-cancel-selection] { grid-column: 1; grid-row: 3 / span 2; }'));
const expectedContextualButtonPositions = [
    ["multiplicative-inverse", "1", "1 / span 2"],
    ["double-inverse", "2", "1 / span 2"],
    ["zero-product", "3", "1 / span 2"],
    ["multiplicative-identity", "4", "1 / span 2"],
    ["additive-inverse", "5", "1 / span 2"],
    ["additive-identity", "6", "1 / span 2"],
    ["inverse", "2", "3 / span 2"],
    ["distribute-left", "3 / span 2", "4"],
    ["distribute-right", "5 / span 2", "4"]
];
expectedContextualButtonPositions.forEach(([pair, column, row]) => {
    assert(
        playerHtml.includes(`.main-action-panel .intent-category-actions > [data-contextual-rule-pair="${pair}"] { grid-column: ${column}; grid-row: ${row}; }`),
        `Contextual control ${pair} must occupy column ${column}, row ${row}`
    );
});
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-contextual-rule-pair="inverse"] { grid-column: 5; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-contextual-rule-pair="distribute-left"] { grid-column: 3 / span 2; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-contextual-rule-pair="distribute-right"] { grid-column: 1 / span 2; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-contextual-numerical-rewrite] { grid-column: 1 / span 2; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-cancel-selection] { grid-column: 6; }'));
assert(/\.quadrant-tools \.workspace-toolbar,[\s\S]*?grid-template-columns: repeat\(6, minmax\(0, 1fr\)\);[\s\S]*?grid-template-rows: repeat\(4, minmax\(0, 1fr\)\);[\s\S]*?width: 100%;[\s\S]*?height: 100%;/.test(playerHtml));
assert(/\.main-action-panel \.intent-category-actions \{[\s\S]*?grid-template-columns: repeat\(6, minmax\(0, 1fr\)\);[\s\S]*?grid-template-rows: repeat\(4, minmax\(0, 1fr\)\);/.test(playerHtml));

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
assert(!playerJs.includes('data-direct-inverse-number-slot'));
assert(playerJs.includes('function buildContextualCommuteButtonHtml()'));
assert(playerJs.includes('buildDirectCommuteIconHtml("·")') && playerJs.includes('buildDirectCommuteIconHtml("+")'));
assert(playerJs.includes('class="intent-category-button contextual-numerical-rewrite-button" data-contextual-numerical-rewrite'));
assert(playerJs.includes('aria-label="Numerical Manipulation" title="Numerical Manipulation"'));
assert(playerJs.includes('<span class="contextual-numerical-rewrite-label">Numerical<br>Manipulation</span>'));
assert(playerJs.includes('class="intent-category-button cancel-selection-button" data-cancel-selection'));
assert(playerJs.includes('function buildContextualRuleButtonHtml(pairName, orientation, label, firstVisualHtml, secondVisualHtml)'));
assert(playerJs.includes('function buildDirectOptionRulePairHtml(pairName, firstRule, firstCategory, secondRule, secondCategory, label)'));
assert(!playerJs.includes('const categoryIds = ["numericalRewrite", "commute"];'));
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
assert(!playerHtml.includes('.main-action-panel .split-rule-frame'));
assert(playerJs.includes('data-contextual-rule-pair="${pairName}"'));
assert(playerJs.includes('class="contextual-rule-side contextual-rule-side-first"'));
assert(playerJs.includes('class="contextual-rule-side contextual-rule-side-second"'));
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
assert(playerJs.includes('function resolveContextualRulePair(pairName)'));
assert(playerJs.includes('if (canFactorProductOfInverses())') && playerJs.includes('if (canDistributeInverseOverProduct())'));
assert(playerJs.includes('if (canEliminateDoubleInverse())') && playerJs.includes('return canInsertDoubleInverse()'));
assert(playerJs.includes('if (canZeroProduct())') && playerJs.includes('return canInsertZeroProduct()'));
assert(playerJs.includes('if (getCancelOppositesData())') && playerJs.includes('canReplaceZeroWithOppositeSum()'));
assert(playerJs.includes('if (canCancelProductWithInverse())') && playerJs.includes('canReplaceOneWithInverseProduct()'));
assert(playerJs.includes('button[data-contextual-rule-pair]') && playerJs.includes('recordToolForSolution(resolved.toolName, beforeExpression)'));
assert(playerJs.includes('function resolveContextualCommuteTool()'));
assert(playerJs.includes('selection.node.type === "sum"') && playerJs.includes('toolName: "commuteTerms"'));
assert(playerJs.includes('selection.node.type === "prod"') && playerJs.includes('toolName: "commuteFactors"'));
assert(playerJs.includes('function resolveAutomaticNumericalRewriteTool()'));
assert(playerJs.includes('canApplyInverseRewrite("rewriteInvOneToOne")'));
assert(playerJs.includes('canApplyInverseRewrite("rewriteInvNegOneToNegOne")'));
assert(playerJs.includes('getDoubleNegativeData()'));
assert(playerJs.includes('function classifyNumericalRewriteCategory(node)'));
assert(playerJs.includes('"positiveAdditionNoCarry"') && playerJs.includes('"positiveAdditionWithCarry"'));
assert(playerJs.includes('"positiveMultiplicationOneSignificantFigure"') && playerJs.includes('"positiveMultiplicationUnrestricted"'));
assert(playerJs.includes('"signedAddition"') && playerJs.includes('"signedMultiplication"') && playerJs.includes('"fractionSimplification"'));
assert(playerJs.includes('function getAutomaticNumericalRewriteData()') && playerJs.includes('function applyAutomaticNumericalRewrite()'));
assert(playerJs.includes('function validateManualNumericalRewriteExchange(originalNode, proposedNode)'));
assert(playerJs.includes('getNumericalRewriteRuleSetting(proposedRuleId).reverse === "manual"'));
assert(playerJs.includes('(isExactInverseOfOne(originalNode) && proposedIsOne)'));
assert(playerJs.includes('function resolveContextualNumericalRewriteAction()'));
assert(playerJs.includes('mode: "automatic"') && playerJs.includes('mode: "manual"'));
assert(playerJs.includes('button[data-cancel-selection]') && playerJs.includes('cancelSelectionButton.addEventListener("click"'));
assert(/cancelSelectionButton\.addEventListener\("click", \(\) => \{[\s\S]*?if \(isDemoModeActive\(\)\)[\s\S]*?clearSelection\(\);[\s\S]*?clearInteraction\(\);/.test(playerJs));
assert(playerJs.includes('ruleName === "rewriteInvOneToOne"') && playerJs.includes('isInvNode(node) && isValueNode(node.args[0], "1") ? valueNode("1") : null'));
assert(playerHtml.includes('.main-action-panel .branch-rule-symbol-2') && playerHtml.includes('.main-action-panel .direct-commute-icon'));
assert(playerJs.includes('class="post-selection-grid-overlay"') && playerJs.includes('M1 1 H599 V399 H1 Z'));
assert(playerJs.includes('M300 1 V200') && playerJs.includes('M500 1 V200') && playerJs.includes('M200 300 H599'));
assert(/\.main-action-panel \.post-selection-grid-overlay \{[\s\S]*?grid-column: 1 \/ -1;[\s\S]*?grid-row: 1 \/ -1;[\s\S]*?pointer-events: none;/.test(playerHtml));
assert(/body\.selection-active:not\(\.expression-builder-active\) \.bottom-controls-panel,[\s\S]*?gap: 0;/.test(playerHtml));
assert(/body\.left-handed \.main-action-panel \.post-selection-grid-overlay \{[\s\S]*?transform: scaleX\(-1\);/.test(playerHtml));
assert(!playerHtml.includes('button.intent-category-button::before'));
assert(/button\.contextual-rule-button,[\s\S]*?button\.cancel-selection-button \{[\s\S]*?border: 0;[\s\S]*?border-radius: 0;[\s\S]*?background: transparent;/.test(playerHtml));
assert(/\.main-action-panel \.intent-category-actions > button\.contextual-rule-button \{[\s\S]*?display: grid;[\s\S]*?padding: 0;/.test(playerHtml));
assert(playerHtml.includes('exploded-algebra-tool.js?v=20260920-automatic-major-steps'));
assert(playerJs.includes('function cycleQuickSetting(setting)'));
assert(playerJs.includes('getNextCyclicOption(OPERATION_BAR_STYLE_OPTIONS'));
assert(playerJs.includes('getNextCyclicOption(OPERATION_BAR_SHADING_OPTIONS'));
assert(playerJs.includes('const STEPS_VISIBLE_LINE_MIN = 1;') && playerJs.includes('const STEPS_VISIBLE_LINE_MAX = 3;'));
assert(playerJs.includes('function calculateStepsFontSizeForVisibleLines'));
assert(playerJs.includes('function setStepsVisibleLineCount'));
assert(playerJs.includes('scheduleStepsFontSizeRecalculation();'));
assert(playerJs.includes('const lineHeightRatio = 1.2;'));
assert(/\.problem-statement,[\s\S]*?\.step-column \{[\s\S]*?line-height: 1\.2;/.test(playerHtml));
assert(/\.solution-column,[\s\S]*?padding: 0 6px;/.test(playerHtml));
assert(/\.solution-step,[\s\S]*?padding: 0;[\s\S]*?line-height: inherit;/.test(playerHtml));
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
