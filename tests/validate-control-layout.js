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
    /\.quadrant-menu,[\s\S]*?margin: 0 var\(--main-control-edge\) max\(12px, env\(safe-area-inset-bottom\)\) 0;/.test(playerHtml),
    "Settings must occupy the bottom corner beside the view controls"
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

console.log("Control layout checks passed.");
