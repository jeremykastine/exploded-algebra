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
    "cloneBuilderNodeForHistory",
    "cloneBuilderMoveCycle",
    "getNodeAtPath",
    "setNodeAtPath",
    "getDirectBuilderCurrentNode",
    "directBuilderExpectsValue",
    "clearIntegratedBuilderActiveState",
    "rememberIntegratedBuilderOperation",
    "setDirectBuilderCurrentValue",
    "placeDirectBuilderOperationAtLowestLevel",
    "appendDirectBuilderDigit",
    "enterDirectBuilderValue",
    "getDirectBuilderLastOperation",
    "directBuilderOperationPrefix",
    "pathStartsWith",
    "makeDirectBuilderOperation",
    "installLiftedDirectBuilderOperation",
    "combineDirectBuilderContext",
    "cycleDirectBuilderOperationToLowestLevel",
    "canMoveDirectBuilderOperationUp",
    "moveDirectBuilderOperationUp",
    "canCycleDirectBuilderOperationWithButton",
    "insertDirectBuilderOperation",
    "enterDirectBuilderInverse"
];

const context = {
    ExprNode: class ExprNode {
        constructor(type, args = [], value = null) {
            this.type = type;
            this.args = args;
            this.value = value;
        }
    },
    uiState: { expressionBuilder: null, message: "" },
    expressionRoot: null,
    isDirectNotationExpressionBuilder: builder => !!builder && builder.flowVersion >= 5,
    valueNode: value => new context.ExprNode("value", [], String(value)),
    pushExpressionBuilderUndoState() {},
    renderToolArea() {},
    refreshExpressionBuilderPreview() {}
};
vm.createContext(context);
vm.runInContext(`${functionNames.map(extractFunction).join("\n\n")}
this.api = { ${functionNames.join(", ")} };`, context);

const value = text => new context.ExprNode("value", [], text);
const makeBuilder = root => ({
    flowVersion: 5,
    root,
    currentPath: [],
    lastOperation: null,
    moveCycle: null,
    history: []
});
const assertJsonEqual = (actual, expected, message) => {
    assert.equal(JSON.stringify(actual), JSON.stringify(expected), message);
};
const assertNoAdjacentMatchingOperations = node => {
    if (!node || !Array.isArray(node.args)) return;
    node.args.forEach(child => {
        assert.notEqual(
            child && child.type,
            node.type === "sum" || node.type === "prod" ? node.type : "",
            `A ${node.type} must not directly contain another ${node.type}`
        );
        assertNoAdjacentMatchingOperations(child);
    });
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
assertJsonEqual(nested.lastOperation, { path: [1], index: 0 }, "The repeated-operation cycle must target the most recently entered operation");
assert.equal(context.api.canCycleDirectBuilderOperationWithButton(nested, "prod"), true, "The pending matching operation button must remain enabled for cycling");
assert.equal(context.api.canCycleDirectBuilderOperationWithButton(nested, "sum"), false, "The other operation must not cycle a pending multiplication");
assert.equal(context.api.insertDirectBuilderOperation("prod"), true, "Pressing multiplication again must move the pending multiplication up");
assert.equal(nested.root.type, "prod", "Moving multiplication up must make it the outer exploded operation");
assert.equal(nested.root.args[0].type, "sum", "The earlier sum must become multiplication's left input");
assertJsonEqual(nested.currentPath, [1], "The entry cursor must continue to follow the moved right input");
assert.equal(context.api.insertDirectBuilderOperation("prod"), true, "Pressing again at the highest level must cycle to the lowest placement");
assert.equal(nested.root.type, "sum", "Cycling must restore the earlier outer sum");
assert.equal(nested.root.args[1].type, "prod", "Cycling must restore the multiplication around its original value");
context.api.setDirectBuilderCurrentValue(nested, "4");
assert.equal(context.api.canCycleDirectBuilderOperationWithButton(nested, "prod"), false, "Level cycling must end once the right-hand value has been entered");

const product = new context.ExprNode("prod", [value("3"), value("4")], null);
const flattenedAfterMove = makeBuilder(new context.ExprNode("sum", [value("2"), product], null));
flattenedAfterMove.currentPath = [1, 1];
context.uiState.expressionBuilder = flattenedAfterMove;
context.api.placeDirectBuilderOperationAtLowestLevel(flattenedAfterMove, "sum");
assertJsonEqual(flattenedAfterMove.lastOperation, { path: [1, 1], index: 0 }, "A new operation must begin at the deepest latest value");
assert.equal(context.api.insertDirectBuilderOperation("sum"), true, "A repeated addition press must move the deepest pending operation across its surrounding product");
context.api.setDirectBuilderCurrentValue(flattenedAfterMove, "5");
assert.equal(flattenedAfterMove.root.type, "sum", "A moved operation must flatten when it reaches a matching exploded level");
assert.equal(flattenedAfterMove.root.args.length, 3, "A moved addition must flatten into the matching outer sum");
assert.equal(flattenedAfterMove.root.args[1].type, "prod", "Moving the latest sum must preserve the product below it");
assert.equal(flattenedAfterMove.root.args[2].value, "5", "The moved operation must retain its latest right input");
assertNoAdjacentMatchingOperations(flattenedAfterMove.root);

const sumInsideProduct = makeBuilder(new context.ExprNode("prod", [
    value("2"),
    new context.ExprNode("sum", [value("3"), value("4")], null)
], null));
sumInsideProduct.currentPath = [1, 1];
context.uiState.expressionBuilder = sumInsideProduct;
assert.equal(context.api.insertDirectBuilderOperation("prod"), true, "A multiplication must begin at the lowest level inside the sum");
assert.equal(context.api.insertDirectBuilderOperation("prod"), true, "A repeated multiplication must lift into the matching outer product");
context.api.setDirectBuilderCurrentValue(sumInsideProduct, "5");
assert.equal(sumInsideProduct.root.type, "prod");
assert.equal(sumInsideProduct.root.args.length, 3, "A lifted multiplication must flatten into the matching outer product");
assert.equal(sumInsideProduct.root.args[1].type, "sum", "The intervening sum must retain its grouping inside the product");
assert.equal(sumInsideProduct.root.args[2].value, "5");
assertNoAdjacentMatchingOperations(sumInsideProduct.root);

const groupedCycle = makeBuilder(new context.ExprNode("sum", [value("2"), value("3"), value("4")], null));
groupedCycle.currentPath = [2];
context.uiState.expressionBuilder = groupedCycle;

assert.equal(context.api.insertDirectBuilderOperation("prod"), true, "The first multiplication press must use the lowest level");
assert.equal(groupedCycle.root.args[2].type, "prod");
assert.equal(context.api.insertDirectBuilderOperation("prod"), true, "The second multiplication press must absorb one preceding addend");
assert.equal(groupedCycle.root.type, "sum");
assert.equal(groupedCycle.root.args.length, 2);
assert.equal(groupedCycle.root.args[1].type, "prod");
assertJsonEqual(
    groupedCycle.root.args[1].args[0].args.map(node => node.value),
    ["3", "4"],
    "The second press must produce a pending 2 + (3 + 4) × □"
);

assert.equal(context.api.insertDirectBuilderOperation("prod"), true, "The third multiplication press must absorb the next preceding addend");
assert.equal(groupedCycle.root.type, "prod");
assertJsonEqual(
    groupedCycle.root.args[0].args.map(node => node.value),
    ["2", "3", "4"],
    "The third press must produce a pending (2 + 3 + 4) × □"
);

assert.equal(context.api.insertDirectBuilderOperation("prod"), true, "A fourth multiplication press must wrap to the lowest placement");
assert.equal(groupedCycle.root.type, "sum");
assertJsonEqual(groupedCycle.root.args.slice(0, 2).map(node => node.value), ["2", "3"]);
assert.equal(groupedCycle.root.args[2].type, "prod");
assert.equal(context.api.isBuilderPlaceholder(groupedCycle.root.args[2].args[1]), true, "Cycling must return to the pending lowest placement");
context.api.setDirectBuilderCurrentValue(groupedCycle, "5");
assertJsonEqual(groupedCycle.root.args[2].args.map(node => node.value), ["4", "5"], "Entering the value after cycling must complete 2 + 3 + 4 × 5");
assert.equal(groupedCycle.moveCycle, null, "Completing the cycle must clear its saved starting position");
assertNoAdjacentMatchingOperations(groupedCycle.root);

const inverseBuilder = makeBuilder(new context.ExprNode("inv", [value("2")], null));
inverseBuilder.currentPath = [0];
context.uiState.expressionBuilder = inverseBuilder;

assert.equal(context.api.insertDirectBuilderOperation("sum"), true, "The first addition press inside an inverse must use the lowest level");
assert.equal(context.api.insertDirectBuilderOperation("sum"), true, "The next addition press must move the pending operation outside the inverse");
assert.equal(inverseBuilder.root.type, "sum", "The addition must become a real exploded sum outside the inverse");
assert.equal(inverseBuilder.root.args[0].type, "inv", "The inverse of the left input must remain intact");
assert.equal(inverseBuilder.root.args[0].args[0].value, "2", "Only the left side must remain inside the inverse");
assertJsonEqual(inverseBuilder.lastOperation, { path: [], index: 0 }, "Leaving an inverse must not create a redundant navigation level");
assert.equal(context.api.insertDirectBuilderOperation("sum"), true, "Another addition press must cycle the pending operation back inside the inverse");
assert.equal(inverseBuilder.root.type, "inv");
assert.equal(inverseBuilder.root.args[0].type, "sum");
assertNoAdjacentMatchingOperations(inverseBuilder.root);

const valueThenX = makeBuilder(value("2"));
context.uiState.expressionBuilder = valueThenX;
assert.equal(context.api.enterDirectBuilderValue("x"), true, "x after a value must insert multiplication");
assert.equal(valueThenX.root.type, "prod");
assertJsonEqual(valueThenX.root.args.map(node => node.value), ["2", "x"], "Implicit multiplication before x must use the lowest level");

const valueThenNegativeOne = makeBuilder(new context.ExprNode("prod", [value("2"), value("3")], null));
valueThenNegativeOne.currentPath = [1];
context.uiState.expressionBuilder = valueThenNegativeOne;
assert.equal(context.api.enterDirectBuilderValue("-1"), false, "negative one after a value must require an explicit operation");
assert.equal(valueThenNegativeOne.root.type, "prod");
assert.equal(valueThenNegativeOne.root.args[1].value, "3", "Rejected implicit addition must leave the expression unchanged");

const valueThenInverse = makeBuilder(new context.ExprNode("sum", [value("2"), value("3")], null));
valueThenInverse.currentPath = [1];
context.uiState.expressionBuilder = valueThenInverse;
assert.equal(context.api.enterDirectBuilderInverse(), true, "an inverse after a value must insert multiplication");
assert.equal(valueThenInverse.root.type, "sum");
assert.equal(valueThenInverse.root.args[1].type, "prod");
assert.equal(valueThenInverse.root.args[1].args[0].value, "3");
assert.equal(valueThenInverse.root.args[1].args[1].type, "inv");
assert.equal(context.api.isBuilderPlaceholder(valueThenInverse.root.args[1].args[1].args[0]), true);
assertJsonEqual(valueThenInverse.currentPath, [1, 1, 0], "Entry must move inside the lowest-level implicitly multiplied inverse");

const negativeOneThenDigit = makeBuilder(value("-1"));
context.uiState.expressionBuilder = negativeOneThenDigit;
assert.equal(context.api.appendDirectBuilderDigit("4"), true, "a digit after negative one must insert multiplication");
assert.equal(negativeOneThenDigit.root.type, "prod");
assertJsonEqual(negativeOneThenDigit.root.args.map(node => node.value), ["-1", "4"], "Implicit multiplication after negative one must use the lowest level");

console.log("Expression Builder direct-notation checks passed.");
