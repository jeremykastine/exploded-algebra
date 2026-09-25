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

function check(initial, expression, expected) {
    const scope = { completedSteps: initial.slice(), level,
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

assert(source.includes('const isSkipped = completion[index] === "skipped";'));
assert(source.includes('aria-label="Skipped" title="Skipped">⏭︎</span>'));
assert(source.includes('completion.findIndex(isComplete => !isComplete)'),
    "The panel must reveal the step following a later match");
console.log("Step skipping checks passed.");
