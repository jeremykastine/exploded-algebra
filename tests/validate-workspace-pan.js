const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");
const playerHtml = fs.readFileSync(path.join(projectRoot, "exploded-algebra.html"), "utf8");
const playerJs = fs.readFileSync(path.join(projectRoot, "exploded-algebra-tool.js"), "utf8");

const workspaceListeners = {};
const documentListeners = {};
const classes = new Set();
const workspace = {
    addEventListener(type, listener) { workspaceListeners[type] = listener; },
    getBoundingClientRect() { return { left: 40, top: 60 }; },
    setPointerCapture() { throw new Error("Pointer capture unavailable"); }
};
const svgChild = {};
const taps = [];
const context = vm.createContext({
    currentExpressionRoot: {},
    workspacePointerStart: null,
    workspacePointers: new Map(),
    workspacePinchStart: null,
    workspaceZoom: 1,
    WORKSPACE_ZOOM_MIN: 0.5,
    WORKSPACE_ZOOM_MAX: 3,
    workspaceViewManuallyPanned: false,
    workspacePanX: 0,
    workspacePanY: 0,
    svgContainer: workspace,
    workspaceSvg: { contains: target => target === svgChild, style: {} },
    workspaceNotationLayer: { style: {} },
    getSvgWidth: () => 500,
    getSvgHeight: () => 400,
    document: {
        body: { classList: { add: value => classes.add(value), remove: value => classes.delete(value) } },
        addEventListener(type, listener) { documentListeners[type] = listener; }
    },
    setWorkspacePan(x, y) {
        context.workspacePanX = x;
        context.workspacePanY = y;
        context.applyWorkspaceContentTransform();
    },
    handleWorkspaceTap(event) { taps.push(event); }
});
for (const name of ["releaseWorkspacePointer", "isWorkspaceTap", "applyWorkspaceZoomSizing", "applyWorkspaceContentTransform"]) {
    const start = playerJs.indexOf(`        function ${name}(`);
    const end = playerJs.indexOf("\n        function ", start + 1);
    vm.runInContext(playerJs.slice(start, end), context);
}
vm.runInContext(playerJs.slice(
    playerJs.indexOf("        function updateWorkspacePan("),
    playerJs.indexOf('        document.addEventListener("pointerdown", e => {\n            if (dismissNumericalRewriteError())')
), context);

function pointer(clientX, clientY, options = {}) {
    return { clientX, clientY, pointerId: 1, pointerType: "mouse", button: 0, target: workspace, ...options };
}
workspaceListeners.pointerdown(pointer(10, 20, { target: svgChild }));
documentListeners.pointermove(pointer(14, 20));
assert.equal(context.workspacePanX, 0, "Small pointer jitter must leave the workspace in place");
documentListeners.pointerup(pointer(14, 20));
assert.equal(taps.length, 1, "A tap on the expression must select");

workspaceListeners.pointerdown(pointer(10, 20));
documentListeners.pointermove(pointer(50, 60, { pointerId: 2 }));
assert.equal(context.workspacePanX, 0, "A second pointer must not move the workspace");
documentListeners.pointermove(pointer(50, 60));
assert.equal(context.workspacePanX, 40, "A drag on blank workspace must pan");
assert.equal(context.workspacePanY, 40);
assert.equal(context.workspaceViewManuallyPanned, true);
assert(classes.has("workspace-panning"));
documentListeners.pointerup(pointer(10, 20));
assert.equal(context.workspacePanX, 0);
assert.equal(taps.length, 1, "A drag that returns to its start must not become a tap");
assert(!classes.has("workspace-panning"));

workspaceListeners.pointerdown(pointer(10, 20, { target: svgChild, pointerType: "touch" }));
documentListeners.pointermove(pointer(35, 20, { pointerType: "touch" }));
assert.equal(context.workspacePanX, 25, "A touch drag on the expression must pan");
workspaceListeners.lostpointercapture(pointer(35, 20));
assert.equal(context.workspacePointerStart, null);
assert(!classes.has("workspace-panning"));
documentListeners.pointerup(pointer(35, 20));
assert.equal(taps.length, 1, "A cancelled drag must not select");

function touch(id, x, y) {
    return pointer(x, y, { pointerId: id, pointerType: "touch" });
}
function resetView() {
    for (const pointer of [...context.workspacePointers.values()]) documentListeners.pointercancel(pointer);
    context.workspaceZoom = 1;
    context.workspacePanX = 20;
    context.workspacePanY = 30;
    context.workspaceViewManuallyPanned = false;
}
function beginPinch() {
    workspaceListeners.pointerdown(touch(1, 140, 160));
    workspaceListeners.pointerdown(touch(2, 240, 160));
}
resetView();
beginPinch();
assert.equal(context.workspaceViewManuallyPanned, true, "A pinch preserves the view during builder redraws");
assert.equal(context.workspacePointerStart, null, "Pinching suspends single-pointer selection/pan");
documentListeners.pointermove(touch(1, 90, 160));
documentListeners.pointermove(touch(2, 290, 160));
assert.equal(context.workspaceZoom, 2, "Doubling the finger distance doubles app zoom");
assert.equal(context.workspacePanX, -110);
assert.equal(context.workspacePanY, -40);
assert.equal((150 - context.workspacePanX) / context.workspaceZoom, 130,
    "The expression point beneath the pinch midpoint stays fixed, including workspace offsets");
assert.equal(context.workspaceSvg.style.width, "1000px", "The exploded SVG scales with the pinch");
assert.equal(context.workspaceNotationLayer.style.transform, "translate3d(-110px, -40px, 0) scale(2)",
    "Conventional notation shares app zoom while controls remain outside the transform");
documentListeners.pointerup(touch(2, 290, 160));
assert.equal(context.workspaceZoom, 2);
assert.equal(context.workspacePanX, -110, "Lifting a finger must not move the view");
assert.equal(context.workspacePointerStart.tapBlocked, true);
documentListeners.pointermove(touch(1, 120, 180));
assert.equal(context.workspacePanX, -80, "The remaining finger resumes panning from its current position");
assert.equal(context.workspacePanY, -20);
documentListeners.pointerup(touch(1, 120, 180));
assert.equal(taps.length, 1, "Neither finger of a pinch may select");
assert.equal(context.workspacePointers.size, 0);
assert(!classes.has("workspace-panning"));

resetView();
beginPinch();
documentListeners.pointermove(touch(1, 180, 185));
documentListeners.pointermove(touch(2, 280, 185));
assert.equal(context.workspaceZoom, 1, "Moving both fingers together only pans");
assert.equal(context.workspacePanX, 60);
assert.equal(context.workspacePanY, 55);
// Extra fingers and cancelled pointer capture must rebase without jumps.
workspaceListeners.pointerdown(touch(3, 330, 200));
const viewBeforeCancel = [context.workspaceZoom, context.workspacePanX, context.workspacePanY];
documentListeners.pointercancel(touch(1, 180, 185));
documentListeners.pointermove(touch(2, 280, 185));
assert.deepEqual([context.workspaceZoom, context.workspacePanX, context.workspacePanY], viewBeforeCancel);
workspaceListeners.lostpointercapture(touch(3, 330, 200));
documentListeners.pointerup(touch(2, 280, 185));
assert.equal(taps.length, 1, "Cancelled or extra fingers must not become taps");
assert.equal(context.workspacePinchStart, null);

resetView();
beginPinch();
documentListeners.pointermove(touch(2, 1140, 160));
assert.equal(context.workspaceZoom, 3, "Pinch zoom respects the existing maximum");
documentListeners.pointermove(touch(2, 141, 160));
assert.equal(context.workspaceZoom, 0.5, "Pinch zoom respects the existing minimum");
assert(Number.isFinite(context.workspacePanX) && Number.isFinite(context.workspacePanY));
resetView();
beginPinch();
documentListeners.pointerup(touch(1, 140, 160));
documentListeners.pointerup(touch(2, 240, 160));
assert.equal(taps.length, 1, "Even a two-finger gesture with no movement must not select");
workspaceListeners.pointerdown(touch(1, 140, 160));
documentListeners.pointerup(touch(1, 140, 160));
assert.equal(taps.length, 2, "A fresh single-finger tap still selects after a pinch");

assert(
    /function getDefaultWorkspacePan\(\)[\s\S]*?getWorkspaceContentBounds\(\)[\s\S]*?viewportBounds\.left[\s\S]*?contentBounds\.top \* workspaceZoom[\s\S]*?function resetWorkspacePanToDefault/.test(playerJs)
        && /scheduleResponsiveLayoutRecalculation\(\)[\s\S]*?workspaceViewManuallyPanned[\s\S]*?resetWorkspacePanToDefault\(\)/.test(playerJs),
    "Responsive mode changes must keep the combined notation group anchored at the upper-left"
);
assert(
    /#svgContainer, #expressionWorkspaceSvg\s*\{[^}]*touch-action: none;/.test(playerHtml),
    "The workspace must suppress native touch scrolling for its gestures"
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
    /workspaceCurrentNotation\.style\.top = `\$\{bounds\.top - outlinePadding - gap - workspaceCurrentNotation\.offsetHeight\}px`/.test(playerJs)
        && /workspaceCompactNotation\.style\.left = `\$\{bounds\.left\}px`/.test(playerJs)
        && /workspaceCompactNotation\.style\.top = `\$\{bounds\.bottom \+ outlinePadding \+ gap\}px`/.test(playerJs),
    "The plain and expanded views clear the outline above and below, both aligned to its left"
);
assert(
    !playerJs.includes('step-card step-hold-target'),
    "Conventional expressions must have no long-hold interaction"
);

console.log("Workspace pan and pinch zoom checks passed.");

// The enlarged outer outline belongs to the pan/zoom bounds, so default placement
// cannot clip its left edge when conventional notation shares the same anchor.
const boundsScope = vm.createContext({
    SETTINGS: { expressionOutline: true, expressionOutlinePadding: 16 },
    getExpressionBounds: () => ({ left: 20, top: 20, right: 60, bottom: 80 }),
    getSelectionMargin: () => 8,
    workspaceCurrentNotation: { hidden: true }, workspaceCompactNotation: { hidden: true }, workspaceGoalNotation: { hidden: true },
    expressionRoot: {}, workspaceZoom: 1,
    svgContainer: { getBoundingClientRect: () => ({ left: 0, top: 0 }) },
    getFloatingPaletteViewportBounds: () => ({ left: 10, top: 10 }),
    clampWorkspacePan: (x, y) => ({ x, y })
});
for (const name of ['getWorkspaceContentBounds', 'getDefaultWorkspacePan']) {
    const match = playerJs.match(new RegExp(`        function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?\\n        \\}`));
    vm.runInContext(match[0], boundsScope);
}
assert.deepEqual(JSON.parse(JSON.stringify(boundsScope.getWorkspaceContentBounds())), { left: 4, top: 4, right: 76, bottom: 96 });
assert.deepEqual(JSON.parse(JSON.stringify(boundsScope.getDefaultWorkspacePan())), { x: 6, y: 6 });
boundsScope.SETTINGS.expressionOutline = false;
assert.equal(boundsScope.getWorkspaceContentBounds().left, 20);
boundsScope.workspaceCompactNotation = { hidden: false, style: { left: "100px", top: "20px" }, offsetWidth: 240, offsetHeight: 150 };
assert.deepEqual(JSON.parse(JSON.stringify(boundsScope.getWorkspaceContentBounds())), { left: 20, top: 20, right: 340, bottom: 170 },
    "The compact notation remains reachable through the shared workspace pan bounds");
