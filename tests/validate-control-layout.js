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
    ['[data-tool="factorLeft"]', 6, 1],
    ['[data-tool="distributeLeftToRight"]', 6, 2],
    ['[data-tool="factorRight"]', 7, 1],
    ['[data-tool="distributeRightToLeft"]', 7, 2]
];
expectedPostSelectionPositions.forEach(([selector, column, row]) => {
    assert(
        playerHtml.includes(`.main-action-panel .intent-category-actions > ${selector} { grid-column: ${column}; grid-row: ${row}; }`),
        `Post-selection control ${selector} must occupy column ${column}, row ${row}`
    );
});
const expectedDirectOptionPositions = [
    ['insert', 'insertIdentityAddZeroBottom', 3, 3],
    ['insert', 'insertIdentityMultiplyByOneRight', 4, 3],
    ['insert', 'insertDoubleInverse', 5, 3],
    ['insert', 'replaceOneWithInverseProduct', 6, 3],
    ['insert', 'cancelOpposites', 7, 3],
    ['delete', 'doubleNegative', 1, 4],
    ['delete', 'zeroProduct', 2, 4],
    ['delete', 'rewriteInvNegOneToNegOne', 3, 4],
    ['delete', 'eliminateIdentities', 4, 4],
    ['delete', 'eliminateDoubleInverse', 5, 4],
    ['delete', 'cancelProductWithInverse', 6, 4],
    ['delete', 'cancelOpposites', 7, 4]
];
expectedDirectOptionPositions.forEach(([category, tool, column, row]) => {
    const selector = `[data-direct-rule-category="${category}"][data-tool="${tool}"]`;
    assert(
        playerHtml.includes(`.main-action-panel .intent-category-actions > ${selector} { grid-column: ${column}; grid-row: ${row}; }`),
        `${category} option ${tool} must occupy column ${column}, row ${row}`
    );
});
assert(playerHtml.includes('.main-action-panel .cancel-selection-button { grid-column: 8; grid-row: 3; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-tool="factorProductOfInverses"] { grid-column: 5; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-tool="distributeLeftToRight"] { grid-column: 3; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-tool="factorLeft"] { grid-column: 3; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-tool="distributeRightToLeft"] { grid-column: 2; }'));
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
const expectedInsertRules = [
    'insertIdentityAddZeroBottom',
    'insertIdentityMultiplyByOneRight',
    'insertDoubleInverse',
    'replaceOneWithInverseProduct',
    'cancelOpposites'
];
const expectedDeleteRules = [
    'doubleNegative',
    'zeroProduct',
    'rewriteInvNegOneToNegOne',
    'eliminateIdentities',
    'eliminateDoubleInverse',
    'cancelProductWithInverse',
    'cancelOpposites'
];
expectedInsertRules.forEach(tool => assert(
    playerJs.includes(`{ tool: "${tool}",`),
    `${tool} must be present in the direct Pencil row`
));
expectedDeleteRules.forEach(tool => assert(
    playerHtml.includes(`[data-direct-rule-category="delete"][data-tool="${tool}"]`),
    `${tool} must be positioned in the direct Eraser row`
));
assert(playerJs.includes('const categoryIds = ["numericalRewrite", "commute"];'));
assert(playerJs.includes('DIRECT_INSERT_RULE_BUTTONS.map(rule => buildDirectOptionRuleButtonHtml(rule, "insert"))'));
assert(playerJs.includes('DIRECT_DELETE_RULE_BUTTONS.map(rule => buildDirectOptionRuleButtonHtml(rule, "delete"))'));
assert(!playerJs.includes('const categoryIds = ["numericalRewrite", "insert", "delete", "commute"];'));
assert(playerJs.includes('data-direct-rule-category="${categoryId}"'));
assert(playerJs.includes('targetTool === "cancelOpposites"') && playerJs.includes('data-direct-rule-category="${directCategory}"'));
assert(playerJs.includes('DIRECT_BRANCH_RULE_BUTTONS.map(buildDirectBranchRuleButtonHtml)'));
assert(playerJs.includes('function buildSharedBranchPairOverlaysHtml()'));
assert(playerJs.includes('data-branch-pair="left"') && playerJs.includes('data-branch-pair="right"') && playerJs.includes('data-branch-pair="inverse"'));
assert(playerJs.includes('M50 50 V84 C50 106 32 112 32 132 V156 M50 50 V84 C50 106 68 112 68 132 V156'));
assert(playerJs.includes('<circle cx="50" cy="50" r="5"/><circle cx="32" cy="156" r="5"/><circle cx="68" cy="156" r="5"/>'));
assert(/\.main-action-panel \.branch-pair-left \{ grid-column: 6; grid-row: 1 \/ span 2; \}/.test(playerHtml));
assert(/\.main-action-panel \.branch-pair-right \{ grid-column: 7; grid-row: 1 \/ span 2; \}/.test(playerHtml));
assert(/\.main-action-panel \.branch-pair-inverse \{ grid-column: 4; grid-row: 1 \/ span 2; \}/.test(playerHtml));
assert(/body\.left-handed \.main-action-panel \.branch-pair-left \{\s*grid-column: 3;\s*\}/.test(playerHtml));
assert(/body\.left-handed \.main-action-panel \.branch-pair-right \{\s*grid-column: 2;\s*\}/.test(playerHtml));
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
