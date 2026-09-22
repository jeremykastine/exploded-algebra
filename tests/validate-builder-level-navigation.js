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
    "pathsEqual",
    "getNodeAtPath",
    "setNodeAtPath",
    "makeBuilderSequence",
    "getIntegratedBuilderSequence",
    "builderSequenceExpectsValue",
    "getUniformBuilderOperationType",
    "rememberIntegratedBuilderOperation",
    "placeIntegratedBuilderOperationAtLowestLevel",
    "clearIntegratedBuilderActiveState",
    "getIntegratedBuilderLastOperation",
    "builderSequencePrefix",
    "canMoveIntegratedBuilderOperationUp",
    "moveIntegratedBuilderOperationUp"
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
    isIntegratedExpressionBuilder: builder => !!builder && builder.flowVersion >= 3,
    pushExpressionBuilderUndoState() {},
    refreshExpressionBuilderPreview() {}
};
vm.createContext(context);
vm.runInContext(`${functionNames.map(extractFunction).join("\n\n")}
this.api = { ${functionNames.join(", ")} };`, context);

const value = text => new context.ExprNode("value", [], text);
const sequence = (args = [], operators = []) => context.api.makeBuilderSequence(args, operators);
const makeBuilder = root => ({ flowVersion: 4, root, currentPath: [], lastOperation: null });
const assertJsonEqual = (actual, expected, message) => {
    assert.equal(JSON.stringify(actual), JSON.stringify(expected), message);
};

const flattened = makeBuilder(sequence([value("2")], []));
context.uiState.expressionBuilder = flattened;
context.api.placeIntegratedBuilderOperationAtLowestLevel(flattened, "sum");
flattened.root.args.push(value("3"));
context.api.placeIntegratedBuilderOperationAtLowestLevel(flattened, "sum");
flattened.root.args.push(value("4"));
assertJsonEqual(flattened.root.builderOperators, ["sum", "sum"], "Repeated addition must flatten into one level immediately");
assert.equal(flattened.root.args.length, 3, "A flattened three-term sum must retain three direct arguments");
assertJsonEqual(flattened.lastOperation, { path: [], index: 1 }, "The latest flattened operation must remain the navigation target");

const nested = makeBuilder(sequence([value("2"), value("3")], ["sum"]));
context.uiState.expressionBuilder = nested;
const productLevel = context.api.placeIntegratedBuilderOperationAtLowestLevel(nested, "prod");
productLevel.args.push(value("4"));
assertJsonEqual(nested.currentPath, [1], "A different operation must begin at the most recently entered value");
assert.equal(nested.root.args[1].builderOperators[0], "prod", "The lowest level must contain the new operation");
assertJsonEqual(nested.lastOperation, { path: [1], index: 0 }, "Move Up must target the most recently entered operation");

assert.equal(context.api.moveIntegratedBuilderOperationUp(), true, "A nested latest operation must move up");
assertJsonEqual(nested.root.builderOperators, ["prod"], "Moving multiplication up must make it the outer operation");
assertJsonEqual(nested.root.args[0].builderOperators, ["sum"], "The earlier sum must become multiplication's left input");
assert.equal(nested.root.args[1].value, "4", "Moving an operation must preserve its right input");
assertJsonEqual(nested.lastOperation, { path: [], index: 0 }, "The moved operation must remain the latest operation");
assert.equal(context.api.canMoveIntegratedBuilderOperationUp(nested), false, "An outermost operation cannot move any higher");

const flattenedAfterMove = makeBuilder(sequence([
    value("2"),
    sequence([value("3"), value("4")], ["prod"])
], ["sum"]));
flattenedAfterMove.currentPath = [1];
context.uiState.expressionBuilder = flattenedAfterMove;
const deepestSum = context.api.placeIntegratedBuilderOperationAtLowestLevel(flattenedAfterMove, "sum");
deepestSum.args.push(value("5"));
assertJsonEqual(flattenedAfterMove.lastOperation, { path: [1, 1], index: 0 }, "A new operation must begin at the deepest latest value");
assert.equal(context.api.moveIntegratedBuilderOperationUp(), true, "The deepest operation must move across its surrounding product");
assertJsonEqual(flattenedAfterMove.root.builderOperators, ["sum", "sum"], "A moved operation must flatten immediately when it reaches a matching level");
assert.equal(flattenedAfterMove.root.args[1].builderOperators[0], "prod", "Moving the latest sum must preserve the product below it");
assert.equal(flattenedAfterMove.root.args[2].value, "5", "The moved operation must retain its latest right input");

const denominator = sequence([value("2"), value("3")], ["sum"]);
const inverse = new context.ExprNode("inv", [denominator], null);
const inverseBuilder = makeBuilder(sequence([inverse], []));
inverseBuilder.currentPath = [0, 0];
inverseBuilder.lastOperation = { path: [0, 0], index: 0 };
context.uiState.expressionBuilder = inverseBuilder;

assert.equal(context.api.moveIntegratedBuilderOperationUp(), true, "An operation inside an inverse must move outside it");
assertJsonEqual(inverseBuilder.root.builderOperators, ["sum"], "The root builder level must absorb the operation leaving an inverse");
assert.equal(inverseBuilder.root.args[0].type, "inv", "The inverse of the left input must remain intact");
assert.equal(inverseBuilder.root.args[1].value, "3", "The right input must move outside the inverse");
assertJsonEqual(inverseBuilder.lastOperation, { path: [], index: 0 }, "Leaving an inverse must not create a redundant navigation level");

console.log("Expression Builder level-navigation checks passed.");
