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
    /\.quadrant-menu,[\s\S]*?margin: 0 var\(--main-control-edge\) var\(--main-control-bottom\) 0;/.test(playerHtml),
    "Settings must occupy the bottom corner beside the view controls"
);
assert(
    /\.main-action-panel \{[\s\S]*?position: relative;[\s\S]*?grid-row: 3;[\s\S]*?margin: 0 var\(--main-control-edge\) var\(--main-control-bottom\) 0;/.test(playerHtml),
    "Post-selection controls must use the same grid baseline and bottom margin as Settings"
);
assert(/\.main-action-panel \{[\s\S]*?overflow: visible;/.test(playerHtml), "The top Commute button must not be clipped by the action-panel boundary");
assert(
    /\.main-action-panel \.panel-tool-menu \{[\s\S]*?pointer-events: none;/.test(playerHtml),
    "The post-selection menu container must let white-space taps reach the workspace"
);
assert(
    /\.main-action-panel button,[\s\S]*?\.main-action-panel \.builder-action-row button \{[\s\S]*?pointer-events: auto;/.test(playerHtml),
    "Post-selection buttons must remain tappable inside the click-through container"
);
assert(
    playerHtml.indexOf('id="mainActionPanel"') < playerHtml.indexOf('id="mainArea"'),
    "Post-selection controls must be a direct app-grid item rather than an independently positioned child of the workspace"
);
assert(
    /\.quadrant-menu,[\s\S]*?\.main-action-panel,[\s\S]*?grid-row: 2;/.test(playerHtml),
    "Settings and post-selection controls must resolve to the same final grid row"
);
assert(
    !/body\.selection-active:not\(\.expression-builder-active\) \.quadrant-menu/.test(playerHtml),
    "Settings must remain visible after an expression selection"
);

const expectedPostSelectionPositions = [
    [1, 5, 2], // Numerical Rewrite
    [2, 3, 4], // Pencil / Insert
    [3, 4, 4], // Eraser / Delete
    [4, 1, 4], // Separate
    [5, 2, 4], // Combine
    [6, 5, 1]  // Commute
];
expectedPostSelectionPositions.forEach(([child, column, row]) => {
    assert(
        playerHtml.includes(`.main-action-panel .intent-category-button:nth-child(${child}) { grid-column: ${column}; grid-row: ${row}; }`),
        `Post-selection category ${child} must occupy column ${column}, row ${row}`
    );
});
assert(playerHtml.includes('.main-action-panel .cancel-selection-button { grid-column: 5; grid-row: 3; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-button:nth-child(4) { grid-column: 5; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .cancel-selection-button { grid-column: 1; }'));

const playerJs = fs.readFileSync(path.resolve(__dirname, "..", "exploded-algebra-tool.js"), "utf8");
assert(playerJs.includes("function applyResponsiveMainButtonSize()"));
assert(playerJs.includes("const columns = builderActive ? 7 : 5;"));
assert(playerJs.includes("const rows = builderActive ? 6 : (selectionActive ? 4 : 3);"));
assert(playerJs.includes("Math.min(mainButtonSize, widthLimit, heightLimit)"));
assert(playerJs.includes('document.body.classList.toggle("selection-active", selectionActive);\n            applyResponsiveMainButtonSize();'));

console.log("Control layout checks passed.");
