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
    setPointerCapture() { throw new Error("Pointer capture unavailable"); }
};
const svgChild = {};
const taps = [];
const context = vm.createContext({
    currentExpressionRoot: {},
    workspacePointerStart: null,
    workspaceViewManuallyPanned: false,
    workspacePanX: 0,
    workspacePanY: 0,
    svgContainer: workspace,
    workspaceSvg: { contains: target => target === svgChild },
    document: {
        body: { classList: { add: value => classes.add(value), remove: value => classes.delete(value) } },
        addEventListener(type, listener) { documentListeners[type] = listener; }
    },
    setWorkspacePan(x, y) {
        context.workspacePanX = x;
        context.workspacePanY = y;
    },
    handleWorkspaceTap(event) { taps.push(event); }
});
for (const name of ["releaseWorkspacePointer", "isWorkspaceTap"]) {
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
    /function positionWorkspaceNotation\(\)[\s\S]*?bounds\.top - workspaceCurrentNotation\.offsetHeight - gap[\s\S]*?const arrowTop = bounds\.bottom \+ gap/.test(playerJs),
    "The current line stays above the exploded notation and the goal arrow clears its bottom"
);
assert(
    !playerJs.includes('step-card step-hold-target'),
    "Conventional expressions must have no long-hold interaction"
);

console.log("Workspace pan checks passed.");

// The enlarged outer outline belongs to the pan/zoom bounds, so default placement
// cannot clip its left edge when conventional notation shares the same anchor.
const boundsScope = vm.createContext({
    SETTINGS: { expressionOutline: true, expressionOutlinePadding: 16 },
    getExpressionBounds: () => ({ left: 20, top: 20, right: 60, bottom: 80 }),
    getSelectionMargin: () => 8,
    workspaceCurrentNotation: { hidden: true }, workspaceGoalNotation: { hidden: true },
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
