const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const playerHtml = fs.readFileSync(path.resolve(__dirname, "..", "exploded-algebra.html"), "utf8");

assert(playerHtml.includes('grid-template-columns: repeat(5, var(--main-key-size));'));
assert(playerHtml.includes('grid-template-rows: repeat(3, var(--main-key-size));'));
assert(playerHtml.includes('[data-workspace-action="resetZoom"] { grid-column: 4; grid-row: 3; }'));
assert(playerHtml.includes('[data-workspace-mode="select"] { grid-column: 5; grid-row: 1; }'));
assert(playerHtml.includes('[data-workspace-action="undoExpression"] { grid-column: 5; grid-row: 2; }'));
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
    /\.main-action-panel \{[\s\S]*?width: var\(--workspace-keypad-width\);[\s\S]*?height: var\(--post-keypad-height\);/.test(playerHtml),
    "Post-selection controls must fit the shared bottom-panel footprint"
);
assert(
    playerHtml.indexOf('id="mainActionPanel"') < playerHtml.indexOf('id="mainArea"'),
    "Post-selection controls must be a direct app-grid item rather than an independently positioned child of the workspace"
);
assert(
    /\.quadrant-tools,[\s\S]*?\.main-action-panel,[\s\S]*?grid-row: 5;/.test(playerHtml),
    "Pre-selection, settings, and post-selection controls must share the bottom panel row"
);
assert(
    !/body\.selection-active:not\(\.expression-builder-active\) \.quadrant-menu\s*\{[^}]*display:\s*none/.test(playerHtml),
    "Settings must remain visible after an expression selection"
);

const expectedPostSelectionPositions = [
    ['[data-rule-category="commute"]', 7, 3],
    ['[data-rule-category="numericalRewrite"]', 7, 4]
];
expectedPostSelectionPositions.forEach(([selector, column, row]) => {
    assert(
        playerHtml.includes(`.main-action-panel .intent-category-actions > ${selector} { grid-column: ${column}; grid-row: ${row}; }`),
        `Post-selection control ${selector} must occupy column ${column}, row ${row}`
    );
});
const expectedPairedButtonPositions = [
    ['[data-tool="distributeRightToLeft"]', 5, 3],
    ['[data-tool="factorRight"]', 6, 3],
    ['[data-tool="factorLeft"]', 4, 4],
    ['[data-tool="distributeLeftToRight"]', 5, 4],
    ['[data-tool="factorProductOfInverses"]', 3, 3],
    ['[data-tool="distributeInverseOverProduct"]', 3, 4]
];
expectedPairedButtonPositions.forEach(([selector, column, row]) => {
    assert(
        playerHtml.includes(`.main-action-panel .intent-category-actions > ${selector} { grid-column: ${column}; grid-row: ${row}; }`),
        `Paired control ${selector} must retain column ${column}, row ${row}`
    );
});
const expectedDirectOptionPositions = [
    ['insert', 'insertIdentityAddZeroBottom', null, 8, 1],
    ['insert', 'insertIdentityMultiplyByOneRight', null, 7, 1],
    ['insert', 'cancelOpposites', null, 6, 1],
    ['insert', 'replaceOneWithInverseProduct', null, 5, 1],
    ['delete', 'eliminateIdentities', 'additive', 8, 2],
    ['delete', 'eliminateIdentities', 'multiplicative', 7, 2],
    ['delete', 'cancelOpposites', null, 6, 2],
    ['delete', 'cancelProductWithInverse', null, 5, 2]
];
expectedDirectOptionPositions.forEach(([category, tool, variant, column, row]) => {
    const selector = `[data-direct-rule-category="${category}"][data-tool="${tool}"]${variant ? `[data-direct-rule-variant="${variant}"]` : ""}`;
    assert(
        playerHtml.includes(`.main-action-panel .intent-category-actions > ${selector} { grid-column: ${column}; grid-row: ${row}; }`),
        `${category} option ${tool} must retain column ${column}, row ${row}`
    );
});
assert(playerHtml.includes('.main-action-panel .cancel-selection-button { grid-column: 8; grid-row: 3; }'));
[
    ["double-inverse-insert", 1],
    ["double-inverse-cancel", 2],
].forEach(([slot, row]) => assert(
    playerHtml.includes(`.main-action-panel .intent-category-actions > [data-direct-rule-slot="${slot}"] { grid-column: 4; grid-row: ${row}; }`),
    `${slot} must occupy column 4, row ${row}`
));
[
    ["zero-product-insert", 1],
    ["zero-product-cancel", 2]
].forEach(([slot, row]) => assert(
    playerHtml.includes(`.main-action-panel .intent-category-actions > [data-direct-rule-slot="${slot}"] { grid-column: 3; grid-row: ${row}; }`),
    `${slot} must occupy column 3, row ${row}`
));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-tool="factorProductOfInverses"],'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-tool="distributeLeftToRight"] { grid-column: 4; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-tool="factorLeft"] { grid-column: 5; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .cancel-selection-button { grid-column: 1; }'));
assert(/body\.selection-active:not\(\.expression-builder-active\) \.quadrant-menu \.settings-button \{[\s\S]*?grid-column: 8;[\s\S]*?grid-row: 4;/.test(playerHtml));
assert(playerHtml.includes('body.selection-active:not(.expression-builder-active) .app-container {\n            --workspace-keypad-width: calc(var(--main-key-size) * 8 + var(--main-key-gap) * 7);'));
assert(playerHtml.includes('grid-template-columns: repeat(8, var(--main-key-size));'));

const playerJs = fs.readFileSync(path.resolve(__dirname, "..", "exploded-algebra-tool.js"), "utf8");
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
assert(playerJs.includes('const categoryIds = ["numericalRewrite", "commute"];'));
assert(playerJs.includes('function buildSplitRulePairHtml(pairName, orientation, buttonsHtml, options = {})'));
assert(playerJs.includes('function buildDirectOptionRulePairHtml(pairName, firstRule, firstCategory, secondRule, secondCategory, label)'));
assert(!playerJs.includes('const categoryIds = ["numericalRewrite", "insert", "delete", "commute"];'));
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
assert(/\.main-action-panel \.split-rule-frame \{[\s\S]*?border: 1px solid #999;[\s\S]*?border-radius: 7px;/.test(playerHtml));
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
assert(playerJs.includes('M12 50 H78 C102 50 108 25 134 25 H194 M12 50 H78 C102 50 108 75 134 75 H194'));
assert(playerJs.includes('M12 25 H72 C98 25 104 50 128 50 H194 M12 75 H72 C98 75 104 50 128 50 H194'));
assert(playerJs.includes('M50 12 V78 C50 102 25 108 25 134 V194 M50 12 V78 C50 102 75 108 75 134 V194'));
assert(playerJs.includes('class="branch-arrowhead"'));
assert(playerJs.includes('M12 50 L34 35 V65 Z M194 25 L172 12 V38 Z M194 75 L172 62 V88 Z'));
assert(playerJs.includes('M12 25 L34 12 V38 Z M12 75 L34 62 V88 Z M194 50 L172 35 V65 Z'));
assert(playerJs.includes('M50 12 L35 34 H65 Z M25 194 L12 172 H38 Z M75 194 L62 172 H88 Z'));
assert(!playerJs.includes('buildDirectBranchRulePairHtml("distribute-left", "horizontal", "factorLeft", "distributeLeftToRight", { branch: true, reverse: true'));
assert(!playerJs.includes('buildDirectBranchRulePairHtml("distribute-right", "horizontal", "distributeRightToLeft", "factorRight", { branch: true, reverse: true'));
assert(/body\.left-handed \.main-action-panel \[data-branch-pair="left"\],[\s\S]*?transform: scaleX\(-1\);/.test(playerHtml));
assert(/\.main-action-panel \.branch-pair-overlay \{[\s\S]*?pointer-events: none;/.test(playerHtml));
assert(playerJs.includes("function applyResponsiveMainButtonSize()"));
assert(playerJs.includes('const availableWidth = Math.max(1, bottomControlsPanel.clientWidth);'));
assert(playerJs.includes('const availableHeight = Math.max(1, bottomControlsPanel.clientHeight);'));
assert(playerJs.includes("const columns = builderActive ? 7 : (selectionActive ? 8 : (authoringRecordingActive ? 6 : 5));"));
assert(playerJs.includes("const rows = builderActive ? 4 : (selectionActive ? 4 : 3);"));
assert(playerJs.includes("Math.min(widthLimit, heightLimit)"));
assert(!playerJs.includes("mainButtonSize"));
assert(!playerHtml.includes("Button size"));
assert(playerJs.includes("function installBottomPanelResizing()"));
assert(playerJs.includes("const BOTTOM_PANEL_MAX_VIEWPORT_RATIO = 1 / 3;"));
assert(playerJs.includes('document.body.classList.toggle("selection-active", selectionActive);\n            applyResponsiveMainButtonSize();'));

console.log("Control layout checks passed.");
