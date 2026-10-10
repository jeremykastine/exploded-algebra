const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");
const renderer = fs.readFileSync(path.join(projectRoot, "exploded-algebra-renderer.js"), "utf8");
const player = fs.readFileSync(path.join(projectRoot, "exploded-algebra-tool.js"), "utf8");
const context = vm.createContext({ window: {} });
vm.runInContext(renderer, context);

// Exercise the player's actual hit testing against the shared renderer's
// geometry and helpers, including dependencies between these two scripts.
for (const name of ["getSelectionBufferWidth", "distanceFromPointToRect",
    "distanceFromPointToSegment", "getSelectionTargetArea",
    "collectVisibleObjectCandidates", "findNearestVisibleObject"]) {
    const start = player.indexOf(`        function ${name}(`);
    assert(start >= 0, `Missing selection function ${name}`);
    const end = player.indexOf("\n        function ", start + 1);
    assert(end > start, `Missing end of selection function ${name}`);
    vm.runInContext(player.slice(start, end), context);
}

const ExprNode = vm.runInContext("ExprNode", context);
const settings = vm.runInContext("SETTINGS", context);
const measuring = {
    measureText(text) {
        return { width: String(text).length * 10, actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 3 };
    }
};
const value = text => new ExprNode("value", [], text);

for (const type of ["sum", "prod"]) {
    for (const nested of [false, true]) {
        const pair = new ExprNode(type, [value("12"), value("34")]);
        const root = nested ? new ExprNode(type === "sum" ? "prod" : "sum", [pair, value("56")]) : pair;
        context.layoutExpressionWithSettings(root, measuring, settings, 20, 20);
        context.expressionRoot = root;
        const x = type === "sum" ? pair.left() + 1 : context.relVLine(pair, 1);
        const y = type === "prod" ? pair.top() + 1 : context.relHLine(pair, 1);
        const target = context.findNearestVisibleObject(x, y, "mouse");
        assert.equal(target.node, pair, `${type}: clicking the separator bar must select its operation`);
        assert.equal(target.firstPart, 0);
        assert.equal(target.lastPart, 1);
        const leaf = pair.args[0];
        const leafTarget = context.findNearestVisibleObject((leaf.left() + leaf.right()) / 2,
            (leaf.top() + leaf.bottom()) / 2, "touch");
        assert.equal(leafTarget.node, leaf, `${type}: values must remain individually selectable`);
    }
}

console.log("Selection hit-testing checks passed.");
