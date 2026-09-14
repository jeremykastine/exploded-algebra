const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const playerHtml = fs.readFileSync(path.join(projectRoot, "exploded-algebra.html"), "utf8");
const playerJs = fs.readFileSync(path.join(projectRoot, "exploded-algebra-tool.js"), "utf8");

assert(
    /svgContainer\.addEventListener\("pointerdown",[\s\S]*?e\.target !== svgContainer[\s\S]*?uiState\.workspaceMode !== "pan"[\s\S]*?mode: "pan"/.test(playerJs),
    "The blank workspace container must be able to start a pan gesture"
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
    /\.quadrant-tools,\s*body\.left-handed \.quadrant-tools,\s*\.quadrant-menu,\s*body\.left-handed \.quadrant-menu\s*\{\s*grid-row: 2;\s*\}/.test(playerHtml),
    "Button clusters must overlay the workspace row instead of creating a clipping row"
);

console.log("Workspace pan checks passed.");
