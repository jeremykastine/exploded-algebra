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
        playerJs.includes('workspacePointerStart.mode === "pan"') &&
        playerJs.includes("workspaceViewManuallyPanned = true"),
    "Only a real Pan gesture may mark the main workspace view as intentionally offset"
);
assert(
    /function getDefaultWorkspacePan\(\)[\s\S]*?leftPanel\.getBoundingClientRect\(\)\.bottom \+ spacing[\s\S]*?viewportBounds\.left[\s\S]*?function resetWorkspacePanToDefault/.test(playerJs)
        && /scheduleResponsiveLayoutRecalculation\(\)[\s\S]*?workspaceViewManuallyPanned[\s\S]*?resetWorkspacePanToDefault\(\)/.test(playerJs),
    "Responsive mode changes must keep an unpanned expression left-aligned below conventional notation"
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
    /\.left-panel \{[\s\S]*?position: fixed !important;[\s\S]*?z-index: 110;/.test(playerHtml),
    "The conventional panel must float above the full-screen workspace"
);
assert(
    /\.textbook-solution \{[\s\S]*?flex-direction: column;/.test(playerHtml)
        && /\.running-solution \{[\s\S]*?flex-direction: column;/.test(playerHtml),
    "Conventional expressions must be arranged vertically"
);
assert(
    playerJs.includes('leftPanel.scrollTop = startTop + (endTop - startTop) * easedProgress;'),
    "Step progression must auto-scroll vertically"
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
