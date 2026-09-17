const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const playerHtml = fs.readFileSync(path.join(projectRoot, "exploded-algebra.html"), "utf8");
const playerJs = fs.readFileSync(path.join(projectRoot, "exploded-algebra-tool.js"), "utf8");

assert(
    /svgContainer\.addEventListener\("pointerdown",[\s\S]*?e\.target !== svgContainer[\s\S]*?const panningView = !integratedBuilder && uiState\.workspaceMode === "pan"[\s\S]*?mode: integratedBuilder \? "builderOperator" : "pan"/.test(playerJs),
    "The blank workspace container must start either a normal pan or an Expression Builder tap-or-pan gesture"
);
assert(
    playerJs.includes('svgContainer.addEventListener("pointermove"'),
    "Pan movement must continue for gestures captured by the workspace container"
);
assert(
    playerJs.includes('svgContainer.addEventListener("lostpointercapture"'),
    "Container-started pan gestures must clean up lost pointer capture"
);
assert(
    /body\.workspace-pan-active #svgContainer\s*\{[\s\S]*?touch-action: none;/.test(playerHtml),
    "The entire workspace must suppress native touch scrolling while Pan is active"
);
assert(
    /\.quadrant-tools,\s*body\.left-handed \.quadrant-tools,\s*\.quadrant-menu,\s*body\.left-handed \.quadrant-menu,\s*\.main-action-panel,\s*body\.left-handed \.main-action-panel\s*\{\s*grid-row: 2;\s*\}/.test(playerHtml),
    "Button clusters must overlay the workspace row instead of creating a clipping row"
);

console.log("Workspace pan checks passed.");
