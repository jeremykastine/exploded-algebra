const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const playerHtml = fs.readFileSync(path.join(projectRoot, "exploded-algebra.html"), "utf8");
const playerJs = fs.readFileSync(path.join(projectRoot, "exploded-algebra-tool.js"), "utf8");

assert(
    /svgContainer\.addEventListener\("pointerdown",[\s\S]*?e\.target !== svgContainer[\s\S]*?const panningView = !integratedBuilder && uiState\.workspaceMode === "pan"[\s\S]*?cancelingSelectionFromBlankWorkspace[\s\S]*?"builderPan"[\s\S]*?"pan"[\s\S]*?"cancelSelection"/.test(playerJs),
    "The blank workspace container must start a normal pan, an Expression Builder pan, or a selection-cancel tap"
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
    playerJs.includes("let workspaceViewManuallyPanned = false") &&
        playerJs.includes('["pan", "builderPan"].includes(workspacePointerStart.mode)') &&
        playerJs.includes("workspaceViewManuallyPanned = true"),
    "Only a real workspace Pan gesture may mark the normal or builder view as intentionally offset"
);
assert(
    /function getDefaultWorkspacePan\(\)[\s\S]*?getWorkspaceContentBounds\(\)[\s\S]*?viewportBounds\.left[\s\S]*?contentBounds\.top \* workspaceZoom[\s\S]*?function resetWorkspacePanToDefault/.test(playerJs)
        && /scheduleResponsiveLayoutRecalculation\(\)[\s\S]*?workspaceViewManuallyPanned[\s\S]*?resetWorkspacePanToDefault\(\)/.test(playerJs),
    "Responsive mode changes must keep the combined notation group anchored at the upper-left"
);
assert(
    /body\.workspace-pan-active #svgContainer\s*\{[\s\S]*?touch-action: none;/.test(playerHtml),
    "The entire workspace must suppress native touch scrolling while Pan is active"
);
assert(
    /The expression workspace fills the screen[\s\S]*?\.bottom-controls-panel \{[\s\S]*?position: fixed;/.test(playerHtml),
    "Button clusters must float above rather than reduce the workspace"
);
assert(
    /\.workspace-notation-layer \{[\s\S]*?position: absolute;[\s\S]*?pointer-events: none;[\s\S]*?transform-origin: 0 0;/.test(playerHtml)
        && /function applyWorkspaceContentTransform\(\)[\s\S]*?workspaceSvg\.style\.transform[\s\S]*?workspaceNotationLayer\.style\.transform/.test(playerJs),
    "The conventional line must share the exploded expression's pan and zoom transform"
);
assert(
    /function positionWorkspaceConventionalLine\(\)[\s\S]*?bounds\.top - lineHeight - gap/.test(playerJs),
    "The single conventional line must sit immediately above the exploded notation"
);
assert(
    !playerJs.includes('view-step-guidance-button')
        && !playerJs.includes('showStepGuidance')
        && playerHtml.includes('data-workspace-action="showExerciseGuidance"'),
    "Guidance must live in the pre-selection Exercise Guidance control rather than on individual steps"
);
assert(
    !playerJs.includes('step-card step-hold-target'),
    "Conventional expressions must no longer use long-hold guidance"
);

console.log("Workspace pan checks passed.");
