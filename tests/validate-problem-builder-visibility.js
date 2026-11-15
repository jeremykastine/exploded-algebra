const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const player = fs.readFileSync(path.join(root, "exploded-algebra-tool.js"), "utf8");
function extract(source, name, indent) {
  const match = source.match(new RegExp(`${indent}(?:async )?function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?\\n${indent}\\}`));
  assert(match, `Missing ${name}`);
  return match[0];
}

function checkPlayer() {
  const classes = new Set();
  const scope = {
    leftPanel: { hidden: false },
    document: { body: { classList: { toggle(name, on) { if (on) classes.add(name); else classes.delete(name); } } } }
  };
  vm.createContext(scope);
  vm.runInContext(extract(player, "syncConventionalStepsVisibility", "        "), scope);
  for (const [level, expected] of [[{}, true], [{ showConventionalSteps: true }, true], [{ showConventionalSteps: false }, true], [null, false]]) {
    scope.level = level;
    assert.equal(vm.runInContext("syncConventionalStepsVisibility(level)", scope), expected);
    assert.equal(scope.leftPanel.hidden, true);
    assert.equal(classes.has("conventional-steps-hidden"), expected);
  }
  scope.ExplodedAlgebraRenderer = { expressionToKatex: () => "0" };
  scope.textToExpression = value => value;
  scope.level = { showConventionalSteps: false, startExpression: "((2)+(3))", initialKatex: "2+3", steps: [{ expression: "((2)+(3))" }, { expression: "(5)", afterKatex: "5" }] };
  scope.LEVELS = [scope.level];
  scope.completedSteps = [true, false];
  scope.buildingStartingExpression = false;
  scope.expressionMatchesParenthesizedText = expression => expression === "(5)";
  scope.maybePrepareCompletedLevelExport = () => {};
  scope.levelContent = { replaceChildren() {} };
  scope.updateExerciseMenu = () => {};
  scope.renderWorkspaceConventionalLine = () => {};
  scope.getCurrentLevel = () => scope.level;
  scope.isInteractiveLevel = () => true;
  scope.expressionRoot = {};
  scope.uiState = { mode: "edit", stage: "idle", expressionBuilder: null };
  for (const name of ["updateStepCompletion", "getStepCompletionStates", "renderLevelInfo", "getWorkspaceConventionalLineContent"]) {
    vm.runInContext(extract(player, name, "        "), scope);
  }
  vm.runInContext("renderLevelInfo(0)", scope);
  assert.equal(scope.completedSteps[1], true, "Hidden panels must still track the final solution step");
  scope.expressionMatchesParenthesizedText = () => false;
  const completion = vm.runInContext("getWorkspaceConventionalLineContent()", scope);
  assert.equal(completion.heading, "You transformed", "The completion message must persist after further edits");
  assert.equal(completion.sourceKatex, "2+3");
  assert.equal(completion.targetKatex, "5");

  scope.isValidTextBlocks = () => true;
  vm.runInContext(extract(player, "validateChosenLevel", "        "), scope);
  scope.level = { id: "add", title: "Add", startExpression: "(2)", steps: [{ expression: "(2)" }], showConventionalSteps: "no" };
  assert.throws(() => vm.runInContext("validateChosenLevel(level, 'test')", scope), /invalid showConventionalSteps/);
}

checkPlayer();
console.log("Player compatibility checks for legacy step visibility passed.");

const editor = fs.readFileSync(path.join(root, "problem-builder.js"), "utf8");

function checkImportAndExport() {
  const scope = vm.createContext({ window: {} });
  vm.runInContext(fs.readFileSync(path.join(root, "exploded-algebra-renderer.js"), "utf8"), scope);
  vm.runInContext("const ExplodedAlgebraRenderer = window.ExplodedAlgebraRenderer;", scope);
  const names = [
    "isDemoOnlyLevel", "textToExpression", "findMatchingCloseParen", "isWrappedBySingleOuterPair",
    "splitTopLevelByOperator", "findTopLevelOperatorIndex", "parseParenthesizedExpressionStrict",
    "makeInverseNode", "normalizeExpressionTree", "expressionToFullyParenthesizedText",
    "traversePreOrder", "sameExpression", "cloneNode", "getNodeAtPath", "getWholeNumberBigIntFromNode",
    "evaluateNumericalRewriteNodeExactly", "greatestCommonDivisorBigInt", "makeExactRational",
    "addExactRationals", "multiplyExactRationals", "exactRationalsAreEqual",
    "inferRecordedNumericalReplacement", "inspectMoveHistory", "getPrescribedNumericalRewriteChoices",
    "canNumericalRewrite", "makePrescribedNumericalGuide", "numericalRewriteNodesHaveSameStructure",
    "normalizeCloneForMatching"
  ];
  vm.runInContext(names.map(name => extract(player, name, "        ")).join("\n"), scope);
  scope.isNumericalRewriteTool = tool => tool === "numericalRewrite";

  const initial = "((x)+(2)+(4))";
  const undone = "((x)+(6))";
  const intermediate = "((x)+((3)*(2)))";
  const final = "((x)+(1)+(5))";
  const makeMove = (before, source, firstPart, lastPart, expression) => [
    { type: "select", expression: source, path: [], firstPart, lastPart, beforeExpression: before },
    { type: "tool", tool: "numericalRewrite", beforeExpression: before, afterExpression: before },
    { type: "builder", action: "digit", value: "9", beforeExpression: before, afterExpression: before },
    { type: "builder", action: "undo", beforeExpression: before, afterExpression: before },
    { type: "builder", action: "submit", beforeExpression: before, afterExpression: expression }
  ];
  scope.history = {
    kind: "demoOnly",
    startExpression: initial,
    finalExpression: final,
    recordedActions: [
      ...makeMove(initial, "((2)+(4))", 1, 2, undone),
      { type: "undo", beforeExpression: undone, afterExpression: initial },
      ...makeMove(initial, "((2)+(4))", 1, 2, intermediate),
      ...makeMove(intermediate, "((3)*(2))", 1, 1, final)
    ]
  };
  scope.history.demo = { steps: scope.history.recordedActions.map(({ type, tool, action, expression, path, firstPart, lastPart }) =>
    ({ type, tool, action, expression, path, firstPart, lastPart })) };
  // Existing downloads sometimes recorded only the starting side of a tool action.
  scope.history.recordedActions[10].afterExpression = initial;
  scope.imported = vm.runInContext("inspectMoveHistory(history)", scope);
  assert.deepEqual(Array.from(scope.imported.moves, move => move.expression), [intermediate, final]);
  assert.equal(scope.imported.moves[0].numericalRewrite.to, "((3)*(2))");
  assert(!scope.imported.moves.some(move => move.actions.some(action => action.action === "undo" || action.value === "9")));
  assert.equal(scope.imported.moves[1].numericalRewrite.to, "((1)+(5))",
    "Recover a legacy replacement that has flattened into its surrounding sum");

  vm.runInContext(extract(editor, "buildExportLevel", "  "), scope);
  scope.draft = {
    ...scope.imported,
    metadata: { id: "edited", title: "Edited", exerciseGuidance: "Solve the problem." },
    rows: [
      { expression: initial, katex: "x+2+4", beforeKatex: "", afterKatex: "x+2+4", isInitial: true, major: true },
      { expression: intermediate, katex: "x+6", beforeKatex: "", afterKatex: "6+x", moveIndex: 0, major: false },
      { expression: final, katex: "x+1+5", beforeKatex: "", afterKatex: "x+1+5", moveIndex: 1, major: false }
    ]
  };
  const exported = vm.runInContext("buildExportLevel('Edited', 'edited')", scope);
  assert.deepEqual(Array.from(exported.steps, step => step.expression), [initial, final]);
  assert.equal(exported.steps[1].actionEndIndex, 6);
  assert.equal(exported.steps[1].majorStep, false);
  assert.equal(exported.minorSteps[0].expression, intermediate);
  assert.equal(exported.minorSteps[0].afterKatex, "6+x");
  assert.equal(exported.demo.steps[2].action, "submit");
  assert.equal(exported.numericalRewriteMode, undefined);
  assert.equal(exported.prescribedNumericalRewrites, undefined);
  assert.equal(exported.moveHistory, undefined);
  scope.exported = exported;

  scope.prescribedGuide = vm.runInContext("makePrescribedNumericalGuide(exported)", scope);
  assert.deepEqual(Array.from(scope.prescribedGuide.steps, step => step.action || step.type),
    ["select", "tool", "chooseNumericalRewrite", "select", "tool", "chooseNumericalRewrite"]);
  assert.equal(scope.prescribedGuide.choices.size, 2);
  assert.deepEqual(Array.from(scope.prescribedGuide.moveEnds), [3, 6]);
  scope.getCurrentDemoStep = () => null;
  assert.deepEqual(Array.from(vm.runInContext("getPrescribedNumericalRewriteChoices(textToExpression('((2)+(4))'))", scope)),
    ["((3)*(2))"], "Only kept numerical moves may become choices");
  assert.deepEqual(Array.from(vm.runInContext("getPrescribedNumericalRewriteChoices(textToExpression('(9)'))", scope)), []);

  scope.prescribedRewritesEnabled = true;
  scope.cloneSelectedRangeNode = () => vm.runInContext("textToExpression('((1)/((2)+(3)))')", scope);
  assert.equal(vm.runInContext("canNumericalRewrite()", scope), false);
  scope.prescribedRewritesEnabled = false;
  assert.equal(vm.runInContext("canNumericalRewrite()", scope), true, "Free mode must allow nested exact numerical expressions");
}

checkImportAndExport();
console.log("Move import, step selection, numerical choices, and level export passed.");

const notationScope = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, "conventional-notation.js"), "utf8") +
  "\nthis.notation = ExplodedAlgebraNotation;", notationScope);
const { verify } = notationScope.notation;
assert.equal(verify("((2)*(3))", "2 x 3"), "2\\times 3");
assert.equal(verify("((2)*(3))", "2x3"), "2\\times 3");
assert.equal(verify("((2)*(3))", "2⋅3"), "2\\cdot 3");
assert.equal(verify("((2)*(x))", "2x"), "2x");
assert.equal(verify("((1)/(x))", "x^-1"), "x^{-1}");
assert.equal(verify("((x)*(x))", "x²"), "x^{2}");
assert.equal(verify("((x)*(x))", "x^{1+1}"), "x^{1+1}");
assert.equal(verify("((x)*(x))", "x(x)"), "x(x)");
assert.equal(verify("(((1)/(2))*(x))", "\\frac{x}{2}"), "\\frac{x}{2}");
assert.equal(verify("(((1)/(2))*(x))", "x÷2"), "x\\div 2");
assert.equal(verify("((x)*(x))", "\\frac{x^3}{x}"), "\\frac{x^{3}}{x}");
assert.equal(verify("((x)*(x))", "\\left(x\\right)^2"), "\\left(x\\right)^{2}");
assert.equal(verify("((x)*(x))", "(x+1)(x-1)+1"), "(x+1)(x-1)+1");
assert.throws(() => verify("((x)*(x))", "x^3"), /not equivalent/);
assert.throws(() => verify("((x)*(x))", "x++"), /complete expression/);
assert.throws(() => verify("((x)*(x))", "x^2/(x-x)"), /zero/);
assert.throws(() => verify("((x)*(x))", "\\left(x)^2"), /Expected/);
assert.throws(() => verify("((x)*(x))", "x^{1/2}"), /integer exponent/);
console.log("Conventional notation syntax and exact equivalence checks passed.");
