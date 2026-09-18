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
    ['[data-rule-category="numericalRewrite"]', 5, 2],
    ['[data-rule-category="insert"]', 4, 3],
    ['[data-rule-category="delete"]', 4, 4],
    ['[data-rule-category="commute"]', 5, 1],
    ['[data-tool="factorProductOfInverses"]', 1, 3],
    ['[data-tool="distributeInverseOverProduct"]', 1, 4],
    ['[data-tool="distributeLeftToRight"]', 2, 3],
    ['[data-tool="factorLeft"]', 3, 3],
    ['[data-tool="factorRight"]', 2, 4],
    ['[data-tool="distributeRightToLeft"]', 3, 4]
];
expectedPostSelectionPositions.forEach(([selector, column, row]) => {
    assert(
        playerHtml.includes(`.main-action-panel .intent-category-actions > ${selector} { grid-column: ${column}; grid-row: ${row}; }`),
        `Post-selection control ${selector} must occupy column ${column}, row ${row}`
    );
});
assert(playerHtml.includes('.main-action-panel .cancel-selection-button { grid-column: 5; grid-row: 3; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-tool="factorProductOfInverses"] { grid-column: 5; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .cancel-selection-button { grid-column: 1; }'));
assert(playerHtml.includes('body.selection-active:not(.expression-builder-active) .quadrant-menu .settings-button {\n            grid-row: 4;'));

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
assert(playerJs.includes('const categoryIds = ["numericalRewrite", "insert", "delete", "commute"];'));
assert(playerJs.includes('DIRECT_BRANCH_RULE_BUTTONS.map(buildDirectBranchRuleButtonHtml)'));
assert(playerJs.includes('function buildSharedBranchPairOverlaysHtml()'));
assert(playerJs.includes('data-branch-pair="left"') && playerJs.includes('data-branch-pair="right"') && playerJs.includes('data-branch-pair="inverse"'));
assert(playerJs.includes('M50 40 C91 40 115 50 156 50 M50 60 C91 60 115 50 156 50'));
assert(playerJs.includes('M50 50 C50 91 40 115 40 156 M50 50 C50 91 60 115 60 156'));
assert(/\.main-action-panel \.branch-pair-left \{ grid-column: 2 \/ span 2; grid-row: 3; \}/.test(playerHtml));
assert(/\.main-action-panel \.branch-pair-right \{ grid-column: 2 \/ span 2; grid-row: 4; \}/.test(playerHtml));
assert(/\.main-action-panel \.branch-pair-inverse \{ grid-column: 1; grid-row: 3 \/ span 2; \}/.test(playerHtml));
assert(/body\.left-handed \.main-action-panel \.branch-pair-left,[\s\S]*?grid-column: 3 \/ span 2;[\s\S]*?transform: scaleX\(-1\);/.test(playerHtml));
assert(/\.main-action-panel \.branch-pair-overlay \{[\s\S]*?pointer-events: none;/.test(playerHtml));
assert(playerJs.includes("function applyResponsiveMainButtonSize()"));
assert(playerJs.includes('const availableWidth = Math.max(1, bottomControlsPanel.clientWidth);'));
assert(playerJs.includes('const availableHeight = Math.max(1, bottomControlsPanel.clientHeight);'));
assert(playerJs.includes("const columns = builderActive ? 7 : (authoringRecordingActive ? 6 : 5);"));
assert(playerJs.includes("const rows = builderActive ? 6 : (selectionActive ? 4 : 3);"));
assert(playerJs.includes("Math.min(widthLimit, heightLimit)"));
assert(!playerJs.includes("mainButtonSize"));
assert(!playerHtml.includes("Button size"));
assert(playerJs.includes("function installBottomPanelResizing()"));
assert(playerJs.includes("const BOTTOM_PANEL_MAX_VIEWPORT_RATIO = 1 / 3;"));
assert(playerJs.includes('document.body.classList.toggle("selection-active", selectionActive);\n            applyResponsiveMainButtonSize();'));

console.log("Control layout checks passed.");
