const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.resolve(__dirname, "..", "exploded-algebra-tool.js"), "utf8");

function extractFunction(name) {
    const match = source.match(new RegExp(`        function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?\\n        \\}`));
    assert(match, `Could not extract ${name}`);
    return match[0];
}

const functionNames = [
    "makePlaceholderNode",
    "isBuilderPlaceholder",
    "getNodeAtPath",
    "setNodeAtPath",
    "getDirectBuilderCurrentNode",
    "directBuilderExpectsValue",
    "clearIntegratedBuilderActiveState",
    "rememberIntegratedBuilderOperation",
    "setDirectBuilderCurrentValue",
    "placeDirectBuilderOperationAtLowestLevel",
    "getDirectBuilderLastOperation",
    "directBuilderOperationPrefix",
    "pathStartsWith",
    "canMoveDirectBuilderOperationUp",
    "moveDirectBuilderOperationUp"
];

const context = {
    ExprNode: class ExprNode {
        constructor(type, args = [], value = null) {
            this.type = type;
            this.args = args;
            this.value = value;
        }
    },
    uiState: { expressionBuilder: null },
    expressionRoot: null,
    isDirectNotationExpressionBuilder: builder => !!builder && builder.flowVersion >= 5,
    valueNode: value => new context.ExprNode("value", [], String(value)),
    pushExpressionBuilderUndoState() {},
    refreshExpressionBuilderPreview() {}
};
vm.createContext(context);
vm.runInContext(`${functionNames.map(extractFunction).join("\n\n")}
this.api = { ${functionNames.join(", ")} };`, context);

const value = text => new context.ExprNode("value", [], text);
const makeBuilder = root => ({ flowVersion: 5, root, currentPath: [], lastOperation: null });
const assertJsonEqual = (actual, expected, message) => {
    assert.equal(JSON.stringify(actual), JSON.stringify(expected), message);
};

const flattened = makeBuilder(value("2"));
context.uiState.expressionBuilder = flattened;
context.api.placeDirectBuilderOperationAtLowestLevel(flattened, "sum");
context.api.setDirectBuilderCurrentValue(flattened, "3");
context.api.placeDirectBuilderOperationAtLowestLevel(flattened, "sum");
context.api.setDirectBuilderCurrentValue(flattened, "4");
assert.equal(flattened.root.type, "sum", "Addition must be represented by a real exploded-notation sum node");
assert.equal(flattened.root.isBuilderSequence, undefined, "New builds must not create diagonal builder sequences");
assert.equal(flattened.root.args.length, 3, "Repeated addition must flatten immediately into one sum");
assertJsonEqual(flattened.root.args.map(node => node.value), ["2", "3", "4"], "Flattening must preserve entry order");
assertJsonEqual(flattened.lastOperation, { path: [], index: 1 }, "The latest flattened separator must remain the navigation target");

const nested = makeBuilder(new context.ExprNode("sum", [value("2"), value("3")], null));
nested.currentPath = [1];
context.uiState.expressionBuilder = nested;
context.api.placeDirectBuilderOperationAtLowestLevel(nested, "prod");
assert.equal(nested.root.args[1].type, "prod", "A different operation must be created directly around the latest value");
assert.equal(context.api.isBuilderPlaceholder(nested.root.args[1].args[1]), true, "A pending operation must expose one empty operand in exploded notation");
context.api.setDirectBuilderCurrentValue(nested, "4");
assertJsonEqual(nested.lastOperation, { path: [1], index: 0 }, "Move Up must target the most recently entered operation");

assert.equal(context.api.moveDirectBuilderOperationUp(), true, "A nested latest operation must move up");
assert.equal(nested.root.type, "prod", "Moving multiplication up must make it the outer exploded operation");
assert.equal(nested.root.args[0].type, "sum", "The earlier sum must become multiplication's left input");
assert.equal(nested.root.args[1].value, "4", "Moving an operation must preserve its right input");
assertJsonEqual(nested.currentPath, [1], "The entry cursor must continue to follow the moved right input");
assert.equal(context.api.canMoveDirectBuilderOperationUp(nested), false, "An outermost operation cannot move any higher");

const product = new context.ExprNode("prod", [value("3"), value("4")], null);
const flattenedAfterMove = makeBuilder(new context.ExprNode("sum", [value("2"), product], null));
flattenedAfterMove.currentPath = [1, 1];
context.uiState.expressionBuilder = flattenedAfterMove;
context.api.placeDirectBuilderOperationAtLowestLevel(flattenedAfterMove, "sum");
context.api.setDirectBuilderCurrentValue(flattenedAfterMove, "5");
assertJsonEqual(flattenedAfterMove.lastOperation, { path: [1, 1], index: 0 }, "A new operation must begin at the deepest latest value");
assert.equal(context.api.moveDirectBuilderOperationUp(), true, "The deepest operation must move across its surrounding product");
assert.equal(flattenedAfterMove.root.type, "sum", "A moved operation must flatten when it reaches a matching exploded level");
assert.equal(flattenedAfterMove.root.args.length, 3, "The matching sum must absorb the moved operation immediately");
assert.equal(flattenedAfterMove.root.args[1].type, "prod", "Moving the latest sum must preserve the product below it");
assert.equal(flattenedAfterMove.root.args[2].value, "5", "The moved operation must retain its latest right input");

const denominatorSum = new context.ExprNode("sum", [value("2"), value("3")], null);
const inverseBuilder = makeBuilder(new context.ExprNode("inv", [denominatorSum], null));
inverseBuilder.currentPath = [0, 1];
inverseBuilder.lastOperation = { path: [0], index: 0 };
context.uiState.expressionBuilder = inverseBuilder;

assert.equal(context.api.moveDirectBuilderOperationUp(), true, "An operation inside an inverse must move outside it");
assert.equal(inverseBuilder.root.type, "sum", "The addition must become a real exploded sum outside the inverse");
assert.equal(inverseBuilder.root.args[0].type, "inv", "The inverse of the left input must remain intact");
assert.equal(inverseBuilder.root.args[0].args[0].value, "2", "Only the left side must remain inside the inverse");
assert.equal(inverseBuilder.root.args[1].value, "3", "The right input must move outside the inverse");
assertJsonEqual(inverseBuilder.lastOperation, { path: [], index: 0 }, "Leaving an inverse must not create a redundant navigation level");

console.log("Expression Builder direct-notation checks passed.");
