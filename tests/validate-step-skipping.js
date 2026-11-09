const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "exploded-algebra-tool.js"), "utf8");
const start = source.indexOf("        function updateStepCompletion(level) {");
const end = source.indexOf("        function getStepCompletionStates(level) {", start);
assert.ok(start >= 0 && end > start);
const updateSource = source.slice(start, end);
const level = { steps: ["start", "one", "two", "three"].map(expression => ({ expression })) };

function check(initial, expression, expected, buildingStartingExpression = false) {
    const scope = { completedSteps: initial.slice(), level, buildingStartingExpression,
        expressionMatchesParenthesizedText: target => target === expression,
        maybePrepareCompletedLevelExport() {} };
    vm.runInNewContext(`${updateSource}; updateStepCompletion(level);`, scope);
    assert.deepEqual(scope.completedSteps, expected);
}

check([true, false, false, false], "two", [true, "skipped", true, false]);
check([true, false, false, false], "one", [true, true, false, false]);
check([true, false, false, false], "unmatched", [true, false, false, false]);
check([true, false, false, false], "three", [true, "skipped", "skipped", true]);
check([true, "skipped", true, false], "three", [true, "skipped", true, true]);
check([true, false, false, false], "start", [true, false, false, false]);
check([false, false, false, false], "start", [false, false, false, false], true);

const matchingScope = vm.createContext({
    window: {},
    buildingStartingExpression: false,
    maybePrepareCompletedLevelExport() {},
});
vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "exploded-algebra-renderer.js"), "utf8"), matchingScope);
for (const name of [
    "findMatchingCloseParen", "isWrappedBySingleOuterPair", "splitTopLevelByOperator",
    "findTopLevelOperatorIndex", "parseParenthesizedExpressionStrict", "makeInverseNode",
    "cloneNode", "sameExpression", "normalizeCloneForMatching", "sameExpressionForMatching",
    "normalizeExpressionTree", "isValueNode", "isInvNode", "expressionMatchesParenthesizedText",
    "numericalRewriteNodesHaveSameStructure",
]) {
    const start = source.indexOf(`        function ${name}(`);
    assert.notEqual(start, -1, `Missing production function ${name}`);
    const end = source.indexOf("\n        function ", start + 1);
    vm.runInContext(source.slice(start, end), matchingScope);
}

for (const [first, second, expected] of [
    ["(1*(1/6))", "(1/6)", true],
    ["((x*1)*(1/6)*y)", "(x*(1/6)*y)", true],
    ["(1*1*(1/6)*1*(1/7))", "((1/6)*(1/7))", true],
    ["(1/(x+(1*(1/6))))", "(1/(x+(1/6)))", true],
    ["(1*(1/6))", "(1/7)", false],
    ["((-1)*(1/6))", "(1/6)", false],
    ["((1/6)*1)", "(1/6)", false],
    ["(1*x*(1/6))", "(x*(1/6))", false],
    ["(1+x)", "x", false],
    ["(1*(1/6)*x)", "(x*(1/6))", false],
]) {
    for (const [entered, target] of [[first, second], [second, first]]) {
        matchingScope.currentExpressionRoot = matchingScope.parseParenthesizedExpressionStrict(entered);
        const before = JSON.stringify(matchingScope.currentExpressionRoot);
        assert.equal(matchingScope.expressionMatchesParenthesizedText(target), expected, `${entered} vs. ${target}`);
        assert.equal(JSON.stringify(matchingScope.currentExpressionRoot), before, "Matching must preserve the entered tree");
    }
}

matchingScope.currentExpressionRoot = matchingScope.parseParenthesizedExpressionStrict("(1*(1/6))");
matchingScope.level = { steps: [{ expression: "x" }, { expression: "(1/6)" }] };
matchingScope.completedSteps = [true, false];
vm.runInContext(`${updateSource}; updateStepCompletion(level);`, matchingScope);
assert.deepEqual(matchingScope.completedSteps, [true, true]);
assert.equal(matchingScope.numericalRewriteNodesHaveSameStructure(
    matchingScope.currentExpressionRoot,
    matchingScope.parseParenthesizedExpressionStrict("(1/6)")
), false, "Numerical rewrite validation must still distinguish the two structures");

assert(source.includes('const isSkipped = completion[index] === "skipped";'));
assert(source.includes('aria-label="Skipped" title="Skipped">⏭︎</span>'));
assert(source.includes('completion.findIndex(isComplete => !isComplete)'),
    "The panel must reveal the step following a later match");
console.log("Step skipping checks passed.");
