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
    "getInverseHeaderBottom", "collectVisibleObjectCandidates", "findNearestVisibleObject",
    "getCommonPath", "selectionTargetContainingPaths", "selectionRectangle", "findWorkspaceRectangleTarget"]) {
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

const row = new ExprNode("prod", [value("12"), value("34"), value("56")]);
context.layoutExpressionWithSettings(row, measuring, settings, 20, 20);
context.expressionRoot = row;
const [first, second, third] = row.args;
const backwards = context.selectionRectangle(third.right() + 20, row.bottom() + 20,
    second.left(), row.top() - 20);
const range = context.findWorkspaceRectangleTarget(backwards);
assert.equal(range.node, row);
assert.equal(range.firstPart, 1);
assert.equal(range.lastPart, 2);
const single = context.findWorkspaceRectangleTarget(context.selectionRectangle(
    first.left() - 20, first.top() - 20, first.right(), first.bottom()));
assert.equal(single.node, first);
assert.equal(context.findWorkspaceRectangleTarget(context.selectionRectangle(0, 0, 10, 10)), null);

const inverse = new ExprNode("inv", [value("24")]);
context.layoutExpressionWithSettings(inverse, measuring, settings, 20, 20);
context.expressionRoot = inverse;
assert.equal(context.findWorkspaceRectangleTarget(context.selectionRectangle(
    inverse.left(), inverse.top(), inverse.right(), inverse.top() + 1)).node, inverse);
const [denominator] = inverse.args;
assert.equal(context.findWorkspaceRectangleTarget(context.selectionRectangle(
    denominator.left(), denominator.top(), denominator.right(), denominator.bottom())).node, denominator);

console.log("Selection hit-testing checks passed.");
