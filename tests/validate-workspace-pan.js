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
    /scheduleResponsiveLayoutRecalculation\(\)[\s\S]*?workspaceViewManuallyPanned[\s\S]*?setWorkspacePan\(0, 0\)/.test(playerJs),
    "Responsive mode changes must keep an unpanned expression anchored at the workspace's upper left"
);
assert(
    /body\.workspace-pan-active #svgContainer\s*\{[\s\S]*?touch-action: none;/.test(playerHtml),
    "The entire workspace must suppress native touch scrolling while Pan is active"
);
assert(
    /\.quadrant-tools,\s*\.quadrant-menu,\s*\.main-action-panel\s*\{[\s\S]*?grid-row: 5;/.test(playerHtml),
    "Button clusters must occupy the dedicated controls row"
);
assert(
    /grid-template-rows:\s*min\(var\(--top-panel-height\), 25dvh\)\s*var\(--divider-size\)\s*minmax\(0, 1fr\)\s*var\(--divider-size\)\s*min\(var\(--bottom-panel-height\), 33\.333dvh\);/.test(playerHtml),
    "The conventional panel must stay below one quarter and controls below one third of the viewport"
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
    playerJs.includes('class="view-step-guidance-button"')
        && playerJs.includes('aria-label="View guidance" title="View guidance">?</button>')
        && playerJs.includes('showStepGuidance(Number(button.dataset.stepGuidanceIndex), "button")'),
    "The active step must expose guidance through a compact question-mark button"
);
assert(
    !playerJs.includes('step-card step-hold-target'),
    "Conventional expressions must no longer use long-hold guidance"
);

console.log("Workspace pan checks passed.");
