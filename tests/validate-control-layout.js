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
    ['[data-rule-category="numericalRewrite"]', 8, 2],
    ['[data-rule-category="commute"]', 8, 1],
    ['[data-tool="factorProductOfInverses"]', 4, 1],
    ['[data-tool="distributeInverseOverProduct"]', 4, 2],
    ['[data-tool="factorLeft"]', 5, 2],
    ['[data-tool="distributeLeftToRight"]', 6, 2],
    ['[data-tool="factorRight"]', 7, 1],
    ['[data-tool="distributeRightToLeft"]', 6, 1]
];
expectedPostSelectionPositions.forEach(([selector, column, row]) => {
    assert(
        playerHtml.includes(`.main-action-panel .intent-category-actions > ${selector} { grid-column: ${column}; grid-row: ${row}; }`),
        `Post-selection control ${selector} must occupy column ${column}, row ${row}`
    );
});
const expectedDirectOptionPositions = [
    ['insert', 'insertIdentityAddZeroBottom', null, 7, 3],
    ['insert', 'insertIdentityMultiplyByOneRight', null, 6, 3],
    ['insert', 'cancelOpposites', null, 5, 3],
    ['insert', 'replaceOneWithInverseProduct', null, 4, 3],
    ['delete', 'eliminateIdentities', 'additive', 7, 4],
    ['delete', 'eliminateIdentities', 'multiplicative', 6, 4],
    ['delete', 'cancelOpposites', null, 5, 4],
    ['delete', 'cancelProductWithInverse', null, 4, 4]
];
expectedDirectOptionPositions.forEach(([category, tool, variant, column, row]) => {
    const selector = `[data-direct-rule-category="${category}"][data-tool="${tool}"]${variant ? `[data-direct-rule-variant="${variant}"]` : ""}`;
    assert(
        playerHtml.includes(`.main-action-panel .intent-category-actions > ${selector} { grid-column: ${column}; grid-row: ${row}; }`),
        `${category} option ${tool} must occupy column ${column}, row ${row}`
    );
});
assert(playerHtml.includes('.main-action-panel .cancel-selection-button { grid-column: 8; grid-row: 3; }'));
[
    ["double-inverse-insert", 1],
    ["double-inverse-cancel", 2],
    ["zero-product-insert", 3],
    ["zero-product-cancel", 4]
].forEach(([slot, row]) => assert(
    playerHtml.includes(`.main-action-panel .intent-category-actions > [data-direct-rule-slot="${slot}"] { grid-column: 3; grid-row: ${row}; }`),
    `${slot} must occupy the new sixth action column at row ${row}`
));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-tool="factorProductOfInverses"] { grid-column: 5; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-tool="distributeLeftToRight"] { grid-column: 3; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-tool="factorLeft"] { grid-column: 4; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-tool="distributeRightToLeft"] { grid-column: 3; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-tool="factorRight"] { grid-column: 2; }'));
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
assert(playerJs.includes('{ tool: "insertDoubleInverse", label: "Introduce double inverse", icon: "1/(1/A)", category: "insert", slot: "double-inverse-insert" }'));
assert(playerJs.includes('{ tool: "eliminateDoubleInverse", label: "Cancel double inverse", icon: "A", category: "delete", slot: "double-inverse-cancel" }'));
assert(playerJs.includes('{ tool: "insertZeroProductRight", label: "Introduce zero product", icon: "A·0", category: "insert", slot: "zero-product-insert" }'));
assert(playerJs.includes('{ tool: "zeroProduct", label: "Cancel zero product", icon: "0", category: "delete", slot: "zero-product-cancel" }'));
assert(playerJs.includes('const categoryIds = ["numericalRewrite", "commute"];'));
assert(playerJs.includes('DIRECT_IDENTITY_RULE_BUTTONS.map(rule => buildDirectOptionRuleButtonHtml(rule, "insert"))'));
assert(playerJs.includes('DIRECT_REVERSE_RULE_BUTTONS.map(rule => buildDirectOptionRuleButtonHtml(rule, "delete"))'));
assert(!playerJs.includes('const categoryIds = ["numericalRewrite", "insert", "delete", "commute"];'));
assert(playerJs.includes('data-direct-rule-category="${categoryId}"'));
assert(playerJs.includes('data-direct-rule-variant="${escapeHtml(rule.variant)}"'));
assert(playerJs.includes('targetTool === "cancelOpposites"') && playerJs.includes('data-direct-rule-category="${directCategory}"'));
assert(playerJs.includes('function isDirectRuleButtonApplicable(button, toolName)'));
assert(playerJs.includes('identityData.kind === "sum"') && playerJs.includes('identityData.kind === "prod"'));
assert(!playerJs.includes('data-remaining-actions-menu') && !playerHtml.includes('remaining-actions-menu-button'));
assert(!playerHtml.includes('direct-rule-icon.crossed-out'));
assert(playerJs.includes('DIRECT_BRANCH_RULE_BUTTONS.map(buildDirectBranchRuleButtonHtml)'));
assert(playerJs.includes('function buildSharedBranchPairOverlaysHtml()'));
assert(playerJs.includes('function buildReversePairOverlaysHtml()'));
['double-inverse', 'zero-product', 'additive-identity', 'multiplicative-identity', 'additive-inverse', 'multiplicative-inverse', 'distribute-left', 'distribute-right'].forEach(pair => {
    assert(playerJs.includes(`"${pair}"`), `${pair} must have a two-way relationship arrow`);
});
assert(playerJs.includes('M20 88 V118 M13 96 L20 88 L27 96 M13 110 L20 118 L27 110'));
assert(playerJs.includes('M88 82 H118 M96 75 L88 82 L96 89 M110 75 L118 82 L110 89'));
assert(/\.main-action-panel \.reverse-pair-overlay \{[\s\S]*?pointer-events: none;/.test(playerHtml));
assert(/\.main-action-panel \.reverse-pair-double-inverse \{ grid-column: 3; grid-row: 1 \/ span 2; \}/.test(playerHtml));
assert(/\.main-action-panel \.reverse-pair-zero-product \{ grid-column: 3; grid-row: 3 \/ span 2; \}/.test(playerHtml));
assert(/\.main-action-panel \.reverse-pair-distribute-left \{ grid-column: 5 \/ span 2; grid-row: 2; \}/.test(playerHtml));
assert(/\.main-action-panel \.reverse-pair-distribute-right \{ grid-column: 6 \/ span 2; grid-row: 1; \}/.test(playerHtml));
assert(playerJs.includes('function isAlwaysAllowedNumericalRewriteExchange(originalNode, proposedNode)'));
assert(playerJs.includes('isExactDoubleNegativeProduct(originalNode) && proposedIsOne'));
assert(playerJs.includes('isExactInverseOfNegativeOne(originalNode) && proposedIsNegativeOne'));
assert(playerJs.includes('data-branch-pair="left"') && playerJs.includes('data-branch-pair="right"') && playerJs.includes('data-branch-pair="inverse"'));
assert(playerJs.includes('M50 50 H84 C106 50 112 32 132 32 H156 M50 50 H84 C106 50 112 68 132 68 H156'));
assert(playerJs.includes('M50 32 H74 C94 32 100 50 122 50 H156 M50 68 H74 C94 68 100 50 122 50 H156'));
assert(playerJs.includes('M50 50 V84 C50 106 32 112 32 132 V156 M50 50 V84 C50 106 68 112 68 132 V156'));
assert(playerJs.includes('<circle cx="50" cy="50" r="5"/><circle cx="32" cy="156" r="5"/><circle cx="68" cy="156" r="5"/>'));
assert(/\.main-action-panel \.branch-pair-left \{ grid-column: 5 \/ span 2; grid-row: 2; \}/.test(playerHtml));
assert(/\.main-action-panel \.branch-pair-right \{ grid-column: 6 \/ span 2; grid-row: 1; \}/.test(playerHtml));
assert(/\.main-action-panel \.branch-pair-inverse \{ grid-column: 4; grid-row: 1 \/ span 2; \}/.test(playerHtml));
assert(/body\.left-handed \.main-action-panel \.branch-pair-left \{[\s\S]*?grid-column: 3 \/ span 2;[\s\S]*?transform: scaleX\(-1\);/.test(playerHtml));
assert(/body\.left-handed \.main-action-panel \.branch-pair-right \{[\s\S]*?grid-column: 2 \/ span 2;[\s\S]*?transform: scaleX\(-1\);/.test(playerHtml));
assert(/\.main-action-panel \.branch-pair-overlay \{[\s\S]*?pointer-events: none;/.test(playerHtml));
assert(playerJs.includes("function applyResponsiveMainButtonSize()"));
assert(playerJs.includes('const availableWidth = Math.max(1, bottomControlsPanel.clientWidth);'));
assert(playerJs.includes('const availableHeight = Math.max(1, bottomControlsPanel.clientHeight);'));
assert(playerJs.includes("const columns = builderActive ? 7 : (selectionActive ? 8 : (authoringRecordingActive ? 6 : 5));"));
assert(playerJs.includes("const rows = builderActive ? 6 : (selectionActive ? 4 : 3);"));
assert(playerJs.includes("Math.min(widthLimit, heightLimit)"));
assert(!playerJs.includes("mainButtonSize"));
assert(!playerHtml.includes("Button size"));
assert(playerJs.includes("function installBottomPanelResizing()"));
assert(playerJs.includes("const BOTTOM_PANEL_MAX_VIEWPORT_RATIO = 1 / 3;"));
assert(playerJs.includes('document.body.classList.toggle("selection-active", selectionActive);\n            applyResponsiveMainButtonSize();'));

console.log("Control layout checks passed.");
