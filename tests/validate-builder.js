const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const builderHtml = read("problem-builder.html");
const playerHtml = read("exploded-algebra.html");
const playerJs = read("exploded-algebra-tool.js");
const rendererJs = read("exploded-algebra-renderer.js");

assert(builderHtml.includes('content="0;url=exploded-algebra.html"'), "The old editor URL must forward to Free Play");
assert(!fs.existsSync(path.join(root, "problem-builder.js")), "The retired editor implementation must be removed");
assert(playerJs.includes("ExplodedAlgebraRenderer.expressionToCodeMarkup(displayRoot, !!builder, true)") &&
  playerJs.includes("renderWorkspaceNotation(explodedDisplayRoot, builder)"), "Both notation views must use the same live replacement tree");
assert(playerJs.includes("const selectionPath = findPathToNode(expressionRoot, selection.node)") && playerJs.includes("path: selectionPath.slice()"), "Recorded selections must preserve their exact expression-tree path");
assert(playerJs.includes("const exactTarget = findDemoSelectionTargetByPath(step, targetNode)") && playerJs.includes("isSelectionTargetInside(selection, target)"), "Guided playback must prefer the recorded path and require selection within the outlined occurrence");
assert(playerJs.includes('flowVersion: 5'), "Shared Expression Builder must use the direct-notation level-navigation flow");
assert(playerJs.includes('data-builder-action="pendingOperation"'), "Integrated entry must provide pending Sum and Product operations");
assert(playerJs.includes('data-builder-action="enterInverse"'), "Integrated entry must provide Inverse");
assert(!playerJs.includes('data-builder-action="moveUpOperation"'), "Integrated entry must leave the former Move Up grid cell blank");
assert(!playerJs.includes('data-builder-action="exitInverse"'), "The live builder must not retain the special-purpose Exit Inverse button");
assert(playerJs.includes('performBuilderAction(isIntegratedExpressionBuilder(builder) ? "undo" : "undoBackspace")') && !playerJs.includes('class="builder-undo-button"'), "The permanent workspace Undo must handle Builder backspace");
assert(!playerJs.includes('class="builder-cancel-button"'), "Expression Builder must not render a separate Cancel button");
assert(/function undoExpressionBuilderStep[\s\S]*?expressionBuilderIsEmpty\(builder\)[\s\S]*?cancelExpressionBuilder\(\)/.test(playerJs), "Undo must cancel the Expression Builder after its contents are empty");
assert(!playerJs.includes('data-builder-review') && !playerHtml.includes('builderPeekDismissLayer'), "The Builder keypad must omit Peek");
assert(!/exercise[ -]guidance|showExerciseGuidance/i.test([builderHtml, playerHtml, playerJs].join("\n")),
  "The player and editor must omit the retired help interface");
assert(/\.builder-keypad-panel \.builder-variable-rail \{[^}]*grid-column: 5;\s*grid-row: 4;/.test(playerHtml), "XYZ must occupy the cell below 3");
assert(playerHtml.includes('.builder-keypad-panel .builder-prod-button { grid-column: 6; grid-row: 1 / span 2; }') && playerHtml.includes('.builder-keypad-panel .builder-sum-button { grid-column: 6; grid-row: 3 / span 2; }'), "Times and Plus must each occupy two rows in column six");
assert(playerHtml.includes('.builder-keypad-panel .builder-inv-button { grid-column: 2; grid-row: 1 / span 2; }') && playerHtml.includes('.builder-keypad-panel .builder-negative-one-button { grid-column: 2; grid-row: 3 / span 2; }'), "Inverse and negative one must each occupy two rows in column two");
assert(playerHtml.includes('[data-builder-action="digit"][data-value="0"] { grid-column: 3 / span 2; grid-row: 4; }'), "Zero must span the cells below 1 and 2");
assert(playerHtml.includes('[data-builder-action="digit"][data-value="7"] { grid-column: 3; grid-row: 1; }') && playerHtml.includes('[data-builder-action="digit"][data-value="9"] { grid-column: 5; grid-row: 1; }'), "The number pad must occupy columns three through five");
assert(playerHtml.includes('M100 0 V400 M200 0 V400 M300 0 V300 M400 0 V400 M500 0 V400 M200 100 H500 M100 200 H600 M200 300 H500'), "The Builder grid overlay must leave the tall controls and the wide zero key undivided");
assert(/button\.builder-submit-button,\s*\.builder-keypad-panel \.builder-action-row button\.builder-next-submit-button \{\s*grid-column: 1;\s*grid-row: 1 \/ span 4;/.test(playerHtml), "Enter must occupy all four Builder rows on the left");
assert(!playerJs.includes('data-builder-view-action') && playerHtml.includes('data-workspace-action="resetZoom"'), "The Builder must use the permanent workspace view controls");
assert(playerHtml.includes('grid-template-rows: repeat(4, var(--main-key-size));'), "The Builder keypad must contain exactly four button rows without empty rows above");
assert(/\.palette-content > \.builder-keypad-panel \{[\s\S]*?grid-template-columns: subgrid;[\s\S]*?grid-template-rows: subgrid;[\s\S]*?width: 100%;[\s\S]*?height: 100%;/.test(playerHtml), "The Builder keypad must inherit the floating palette's entire six-by-four grid");
assert(!playerHtml.includes('left-handed') && !playerHtml.includes('handedness'), "Expression Builder must not retain an obsolete left-handed variant");
assert(/function handleWorkspaceTap[\s\S]*?if \(builder\) \{[\s\S]*?isIntegratedExpressionBuilder\(builder\)[\s\S]*?return;/.test(playerJs),
  "An integrated Expression Builder tap must leave the current entry in place");
assert(/\.builder-keypad-panel\s*\{[\s\S]*?pointer-events:\s*none;[\s\S]*?\}/.test(playerHtml), "The transparent Expression Builder keypad grid must not block workspace whitespace");
assert(/\.builder-keypad-panel button,[\s\S]*?\.builder-keypad-panel \.builder-action-row button\s*\{[\s\S]*?pointer-events:\s*auto;[\s\S]*?\}/.test(playerHtml), "Expression Builder buttons must remain interactive inside the click-through keypad grid");
assert(playerJs.includes('builder ? "Backspace Delete" : "Control+Z Meta+Z"'), "Undo must support the Backspace and Delete shortcuts during Builder entry");
assert(playerJs.includes('Cycle the most recent ${operationName} to its next level') && playerJs.includes('canCycleDirectBuilderOperationWithButton(builder, type)'), "Repeated addition and multiplication presses must expose operation-level cycling");
assert(playerJs.includes('event.key === "ArrowRight" && !integrated'), "Right Arrow must no longer move operations in the integrated builder");
assert(/function placeDirectBuilderOperationAtLowestLevel[\s\S]*?parent\.type === type[\s\S]*?parent\.args\.push\(emptyRight\)[\s\S]*?new ExprNode\(type, \[current, emptyRight\]/.test(playerJs), "Matching operations must flatten immediately while different operations become real exploded nodes at the latest value");
assert(/function moveDirectBuilderOperationUp[\s\S]*?getDirectBuilderLastOperation[\s\S]*?directBuilderOperationPrefix[\s\S]*?combineDirectBuilderContext[\s\S]*?rememberIntegratedBuilderOperation/.test(playerJs), "Move Up must relocate the most recently entered exploded operation one level at a time");
assert(/function installLiftedDirectBuilderOperation[\s\S]*?parent\.type === lifted\.type[\s\S]*?parent\.args\.splice\(childIndex, 1, \.\.\.lifted\.args\)/.test(playerJs), "Level cycling must flatten adjacent nested sums and products after lifting");
assert(playerJs.includes("function cycleDirectBuilderOperationToLowestLevel") && playerJs.includes("cloneBuilderMoveCycle(builder.moveCycle)"), "Repeated operation presses must cycle from the highest level back to the lowest placement");
assert(/function getBuilderUndoSnapshot[\s\S]*?lastOperation[\s\S]*?moveCycle/.test(playerJs), "Undo snapshots must preserve the operation target and movement cycle");
assert(playerJs.includes('collapseCompletedIntegratedBuilderNode') && playerJs.includes('if (isBuilderPlaceholder(node)) return null;'), "Submit must reject an unfinished direct-notation operand");
assert(/function enterDirectBuilderValue[\s\S]*?implicitOperation = BUILDER_VARIABLES\.includes\(value\) \? "prod" : null/.test(playerJs), "Expression Builder must insert multiplication before each variable without inserting addition before negative one");
assert(/function enterDirectBuilderInverse[\s\S]*?placeDirectBuilderOperationAtLowestLevel\(builder, "prod"\)/.test(playerJs), "Expression Builder must insert multiplication before an inverse");
assert(/function appendDirectBuilderDigit[\s\S]*?String\(current\.value\) === "-1"[\s\S]*?placeDirectBuilderOperationAtLowestLevel\(builder, "prod"\)/.test(playerJs), "Expression Builder must insert multiplication between negative one and a following digit");
assert(playerJs.includes("maximumExplicitCommonCount") && playerJs.includes("Math.min(matchedCommonCount, maximumExplicitCommonCount)"), "Factoring must not synthesize a coefficient of 1 when a term is entirely factored");
assert(/activeTool === "commute"[\s\S]{0,350}uiState\.stage === "preview"[\s\S]{0,350}return "";/.test(playerJs), "Three-or-more-item commute must not show bottom instructions or buttons");
assert(playerJs.includes("function getClosestIndexWithinSelection(x, y)") && playerJs.includes("releasedIndex === pressedIndex"), "Commute choices must match the closest region at pointer down and pointer up");
assert(playerJs.includes('let currentProduct = completedArgs[0]') && playerJs.includes('completedTerms.push(currentProduct)'), "Submit must resolve unresolved multiplication before unresolved addition");
assert(!/getIntegratedBuilderCompletedRoot[\s\S]{0,250}builder\.currentPath\.length/.test(playerJs), "A complete expression must be submittable while entry remains inside an inverse");

const collapseMatch = playerJs.match(/function collapseCompletedIntegratedBuilderNode\(node\) \{([\s\S]*?)\n        \}\n\n        function getIntegratedBuilderCompletedRoot/);
assert(collapseMatch, "Integrated-builder completion logic must remain testable");
const collapseContext = {
  ExprNode: class ExprNode {
    constructor(type, args = [], value = null) {
      this.type = type;
      this.args = args;
      this.value = value;
    }
  },
  builderSequenceExpectsValue(sequence) {
    return !sequence || sequence.args.length === 0 || sequence.builderOperators.length >= sequence.args.length;
  },
  isBuilderPlaceholder(node) {
    return !!node && !!node.isBuilderPlaceholder;
  }
};
vm.createContext(collapseContext);
vm.runInContext(`function collapseCompletedIntegratedBuilderNode(node) {${collapseMatch[1]}\n}\nthis.collapseCompletedIntegratedBuilderNode = collapseCompletedIntegratedBuilderNode;`, collapseContext);
const pendingSequence = (args, builderOperators) => ({
  type: "sum",
  args,
  value: null,
  isBuilderSequence: true,
  isBuilderInverseOpen: false,
  builderOperators
});
const testValue = value => ({ type: "value", args: [], value });
const uniformSum = collapseContext.collapseCompletedIntegratedBuilderNode(
  pendingSequence([testValue("2"), testValue("3"), testValue("4")], ["sum", "sum"])
);
assert(uniformSum && uniformSum.type === "sum" && uniformSum.args.length === 3, "Submit must resolve an entirely ungrouped sum");
const uniformProduct = collapseContext.collapseCompletedIntegratedBuilderNode(
  pendingSequence([testValue("2"), testValue("3"), testValue("4")], ["prod", "prod"])
);
assert(uniformProduct && uniformProduct.type === "prod" && uniformProduct.args.length === 3, "Submit must resolve an entirely ungrouped product");
const mixedOperations = collapseContext.collapseCompletedIntegratedBuilderNode(
  pendingSequence([testValue("2"), testValue("3"), testValue("4")], ["sum", "prod"])
);
assert(mixedOperations && mixedOperations.type === "sum" && mixedOperations.args[1].type === "prod", "Submit must resolve mixed operations using multiplication-before-addition precedence");
const completeOpenInverse = {
  type: "inv",
  args: [pendingSequence([testValue("3")], [])],
  value: null,
  isBuilderInverseOpen: true
};
const productWithOpenInverse = collapseContext.collapseCompletedIntegratedBuilderNode(
  pendingSequence([testValue("2"), completeOpenInverse], ["prod"])
);
assert(productWithOpenInverse && productWithOpenInverse.type === "prod" && productWithOpenInverse.args[1].type === "inv", "Submit must accept a well-formed inverse without requiring Exit Inverse");
const incompleteOpenInverse = {
  type: "inv",
  args: [pendingSequence([], [])],
  value: null,
  isBuilderInverseOpen: true
};
assert(collapseContext.collapseCompletedIntegratedBuilderNode(
  pendingSequence([testValue("2"), incompleteOpenInverse], ["prod"])
) === null, "Submit must remain disabled when an inverse contains a genuinely missing entry");
assert(!playerJs.includes('authoring-variable-select'), "Authoring must not use a variable dropdown");
assert(playerHtml.includes('data-builder-action="value" data-value="x">XYZ</button>'), "The shared builder must expose XYZ");
assert(playerJs.includes('builderVariableButton.disabled = !builderAllowsVariables(uiState.activeTool);'), "XYZ must stay visible and become disabled when variables are unavailable");
assert(playerJs.includes('flowVersion: 5') && playerJs.includes('root: makePlaceholderNode()'), "New Expression Builder sessions must begin directly in exploded notation rather than a diagonal sequence");
assert(!rendererJs.includes('builderItemOutlineBoxes'), "Builder entries must not have surrounding boxes");
assert(rendererJs.includes('builderOperationFill: "rgb(235, 235, 235)"'), "Unresolved Builder operations must use a light-gray fill");
assert(rendererJs.includes('drawingContext.arc(') && rendererJs.includes('box.width / 2'), "Unresolved Builder operations must be shown in circular highlights");
assert(!rendererJs.includes('builderRecentFill') && !rendererJs.includes('drawBuilderRecentHighlightsToContext') && !playerJs.includes('drawBuilderRecentHighlightsToContext'), "Expression Builder must not render purple entry highlighting");
assert(!rendererJs.includes('builderPotentialBoxes') && !rendererJs.includes('builderPlaceholderBox'), "Builder layout must not retain future-entry placeholder boxes");
assert(!playerJs.includes("recordUndoForSolution") &&
  playerJs.includes("Math.min(solutionRecorder.actions.length, snapshot.recorderActionCount)"),
  "Undo must prune the recorded actions");
assert(!playerHtml.includes('data-workspace-action="openProblemEditor"') && !playerHtml.includes('data-workspace-action="editLevelCopy"'), "The workspace must omit retired editor actions");
assert(!/recordSolutionAction\s*\(\s*\{[^}]*type:\s*["']view["']/s.test(playerJs), "View/zoom actions must not be recorded");

const rendererContext = { window: {}, console };
vm.createContext(rendererContext);
vm.runInContext(rendererJs, rendererContext);
const renderer = rendererContext.window.ExplodedAlgebraRenderer;
const value = text => new renderer.ExprNode("value", [], text);
const exactPathFunctionMatch = playerJs.match(/function findDemoSelectionTargetByPath\(step, targetNode\) \{([\s\S]*?)\n        \}\n\n        function findDemoSelectionTarget\(/);
assert(exactPathFunctionMatch, "The exact guided-selection path resolver must remain testable");
const coefficientTwo = value("2");
const constantTwo = value("2");
const ambiguousSelectionRoot = new renderer.ExprNode("sum", [
  new renderer.ExprNode("prod", [coefficientTwo, value("3"), value("x")]),
  constantTwo
]);
const exactPathContext = {
  expressionRoot: ambiguousSelectionRoot,
  nodeAtPath: renderer.nodeAtPath,
  selectionRangeMatchesDemoTarget(node, firstPart, lastPart, targetNode) {
    return firstPart === 0 && lastPart === 0 && node.type === targetNode.type && node.value === targetNode.value;
  }
};
vm.createContext(exactPathContext);
vm.runInContext(`
function findDemoSelectionTargetByPath(step, targetNode) {${exactPathFunctionMatch[1]}
}
result = findDemoSelectionTargetByPath({ path: [1], firstPart: 0, lastPart: 0 }, { type: "value", value: "2" });
`, exactPathContext);
assert(exactPathContext.result && exactPathContext.result.node === constantTwo, "A recorded path must distinguish identical values in different terms");
const negativeTerm = new renderer.ExprNode("prod", [value("-1"), new renderer.ExprNode("sum", [value("2"), value("4")])]);
const guidedRoot = new renderer.ExprNode("sum", [negativeTerm, value("4")]);
const guidedTarget = { node: guidedRoot, firstPart: 0, lastPart: 0 };
const guidedSelectionContext = {
  expressionRoot: guidedRoot,
  selection: { node: negativeTerm, firstPart: 0, lastPart: 1 },
  getCurrentDemoStep: () => ({ type: "select", expression: "((-1)*((2)+(4)))" }),
  findDemoSelectionTarget: () => guidedTarget,
  getDemoTargetNode: () => negativeTerm,
  selectionRangeMatchesDemoTarget: (node, first, last, target) => node === target && first === 0 && last === 1
};
const guidedMatcherNames = ["findPathToNode", "getCoveragePathsForSelectionTarget", "isCoveragePathInsideSelectionTarget", "isSelectionTargetInside", "currentSelectionMatchesDemoStep"];
const guidedMatcherSource = guidedMatcherNames.map(name => {
  const match = playerJs.match(new RegExp(`function ${name}\\([^]*?\\n        \\}`));
  assert(match, `Missing ${name} for guided selection checks`);
  return match[0];
}).join("\n");
vm.createContext(guidedSelectionContext);
vm.runInContext(`${guidedMatcherSource}\nresult = currentSelectionMatchesDemoStep();`, guidedSelectionContext);
assert(guidedSelectionContext.result, "Guided selection must accept a nested product when the yellow outline targets the equivalent parent sum slice");
guidedSelectionContext.selection = { node: guidedRoot.args[1], firstPart: 0, lastPart: 0 };
vm.runInContext("result = currentSelectionMatchesDemoStep();", guidedSelectionContext);
assert(!guidedSelectionContext.result, "Guided selection must not accept a different term outside the outlined target");
const productOf = (...factors) => new renderer.ExprNode("prod", factors.map(factor =>
  typeof factor === "string" ? value(factor) : factor));
const inverseOf = factor => new renderer.ExprNode("inv", [typeof factor === "string" ? value(factor) : factor]);
const cases = [
  [new renderer.ExprNode("sum", [value("x"), value("1")]), "x + 1"],
  [new renderer.ExprNode("prod", [value("3"), value("x")]), "3x"],
  [new renderer.ExprNode("prod", [value("x"), value("x")]), "x^{2}"],
  [new renderer.ExprNode("prod", [value("2"), value("x"), value("x"), value("x")]), "2x^{3}"],
  [new renderer.ExprNode("inv", [new renderer.ExprNode("sum", [value("x"), value("4")])]), "1 \\div \\left(x + 4\\right)"],
  [new renderer.ExprNode("sum", [value("x"), new renderer.ExprNode("prod", [value("-1"), value("3")])]), "x - 3"],
  [new renderer.ExprNode("sum", [value("x"), value("-1")]), "x - 1"],
  [new renderer.ExprNode("prod", [value("2"), value("x"), new renderer.ExprNode("inv", [value("3")])]), "2 \\times x \\div 3"],
  [new renderer.ExprNode("prod", [value("-1"), value("2"), new renderer.ExprNode("inv", [value("3")])]), "-2 \\div 3"],
  [new renderer.ExprNode("prod", [value("2"), new renderer.ExprNode("inv", [value("3")]), value("x")]), "2 \\div 3 \\times x"],
  [productOf("a", inverseOf("b"), inverseOf("c")), "a \\div b \\div c"],
  [productOf("a", inverseOf(productOf("b", "c"))), "a \\div \\left(b \\cdot c\\right)"],
  [inverseOf(inverseOf("x")), "1 \\div \\left(1 \\div x\\right)"],
  [productOf("5", "-1", "3", "-1"), "5 \\cdot \\left(-1\\right) \\cdot 3 \\cdot \\left(-1\\right)"],
  [productOf("-1", "-1", "5"), "-\\left(-1\\right) \\cdot 5"],
  [productOf("5", inverseOf("3"), "-1"), "5 \\div 3 \\times \\left(-1\\right)"],
  [new renderer.ExprNode("sum", [value("a"), productOf("-1", new renderer.ExprNode("sum", [value("b"), value("c")]))]), "a - \\left(b + c\\right)"],
  [new renderer.ExprNode("prod", [new renderer.ExprNode("sum", [value("a"), value("b")]), new renderer.ExprNode("sum", [value("c"), value("d")])]), "\\left(a + b\\right)\\left(c + d\\right)"]
];
for (const [expression, expected] of cases) {
  assert(renderer.expressionToKatex(expression) === expected, `Unexpected KaTeX generation for ${expected}`);
  assert(renderer.expressionBuilderToKatex(expression) === expected, `Unexpected builder KaTeX generation for ${expected}`);
}

const builderSequence = (args, operators) => {
  const sequence = new renderer.ExprNode("sum", args);
  sequence.isBuilderSequence = true;
  sequence.builderOperators = operators;
  return sequence;
};
const flatBuilder = builderSequence([value("2"), value("3"), value("4")], ["sum", "prod"]);
assert(renderer.expressionBuilderToKatex(flatBuilder) === "2 + 3 \\cdot 4", "Unresolved Builder operations must remain a flat conventional sequence without inferred grouping");
const groupedBuilder = builderSequence([
  value("2"),
  new renderer.ExprNode("prod", [value("3"), value("4")])
], ["sum"]);
assert(renderer.expressionBuilderToKatex(groupedBuilder) === "2 + 3 \\cdot 4", "A resolved product inside a sum must not receive unnecessary parentheses");
const necessaryParenthesesBuilder = builderSequence([
  new renderer.ExprNode("sum", [value("2"), value("3")]),
  value("4")
], ["prod"]);
assert(renderer.expressionBuilderToKatex(necessaryParenthesesBuilder) === "\\left(2 + 3\\right) \\cdot 4", "A resolved sum multiplied on the outside must retain necessary parentheses");
const danglingBuilder = builderSequence([value("2")], ["sum"]);
assert(renderer.expressionBuilderToKatex(danglingBuilder) === "2 + ", "A pending Builder operation must remain visible before its next value is entered");
const inverseBuilder = new renderer.ExprNode("inv", [flatBuilder]);
assert(renderer.expressionBuilderToKatex(inverseBuilder) === "1 \\div \\left(2 + 3 \\cdot 4\\right)", "Unresolved operations inside an inverse must remain flat in its conventional denominator");
assert(renderer.expressionBuilderToKatex(new renderer.ExprNode("sum", [value("x"), value("-1")])) === "x - 1", "Builder conventional notation must show addition of negative one as subtraction");
assert(renderer.expressionBuilderToKatex(new renderer.ExprNode("prod", [value("2"), value("x"), new renderer.ExprNode("inv", [value("3")])])) === "2 \\times x \\div 3", "Builder conventional notation must display division inline after the preceding factors");
assert(renderer.expressionBuilderToKatex(new renderer.ExprNode("prod", [value("-1"), value("2"), new renderer.ExprNode("inv", [value("3")])])) === "-2 \\div 3", "Builder conventional notation must place the negative sign in front");
assert(renderer.expressionBuilderToKatex(new renderer.ExprNode("prod", [new renderer.ExprNode("sum", [value("a"), value("b")]), new renderer.ExprNode("sum", [value("c"), value("d")])])) === "\\left(a + b\\right)\\left(c + d\\right)", "Builder conventional notation must juxtapose multiplied sums without a multiplication dot");

const pending = new renderer.ExprNode("sum", [value("2"), value("x")]);
pending.isBuilderSequence = true;
pending.builderOperators = ["prod"];
const fakeContext = {
  font: "20px Verdana",
  measureText(text) {
    return { width: String(text).length * 12, actualBoundingBoxLeft: 0, actualBoundingBoxRight: String(text).length * 12, actualBoundingBoxAscent: 15, actualBoundingBoxDescent: 5 };
  }
};
renderer.layoutExpressionWithSettings(pending, fakeContext, renderer.SETTINGS, 20, 20);
assert(pending.layout.builderOperatorBoxes.length === 1, "Pending builder operations must receive tappable layout boxes");
const nearlyEqual = (left, right) => Math.abs(left - right) < 0.001;
const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const pendingOperator = pending.layout.builderOperatorBoxes[0];
const pendingCenterX = pendingOperator.x + pendingOperator.width / 2;
const pendingCenterY = pendingOperator.y + pendingOperator.height / 2;
const pendingRadius = pendingOperator.width / 2;
assert(nearlyEqual(distance(pending.args[0].right(), pending.args[0].bottom(), pendingCenterX, pendingCenterY), pendingRadius), "The operation circle must just touch the preceding entry's lower-right corner");
assert(nearlyEqual(distance(pendingCenterX, pendingCenterY, pending.args[1].left(), pending.args[1].top()), pendingRadius), "The operation circle must just touch the following entry's upper-left corner");
const activeNumber = value("23");
activeNumber.isBuilderActive = true;
const activeNumberSequence = new renderer.ExprNode("sum", [activeNumber]);
activeNumberSequence.isBuilderSequence = true;
activeNumberSequence.builderOperators = [];
renderer.layoutExpressionWithSettings(activeNumberSequence, fakeContext, renderer.SETTINGS, 20, 20);
assert(nearlyEqual(activeNumberSequence.layout.x + activeNumberSequence.layout.width, activeNumber.right() + activeNumberSequence.layout.builderOuterPadding), "An active number must not reserve box or future-entry space after itself");
const activeVariable = value("x");
activeVariable.isBuilderActive = true;
const activeVariableSequence = new renderer.ExprNode("sum", [activeVariable]);
activeVariableSequence.isBuilderSequence = true;
activeVariableSequence.builderOperators = [];
renderer.layoutExpressionWithSettings(activeVariableSequence, fakeContext, renderer.SETTINGS, 20, 20);
const inversePending = new renderer.ExprNode("inv", [pending]);
inversePending.isBuilderInverseOpen = true;
const outerPending = new renderer.ExprNode("sum", [inversePending]);
outerPending.isBuilderSequence = true;
outerPending.builderOperators = [];
renderer.layoutExpressionWithSettings(outerPending, fakeContext, renderer.SETTINGS, 20, 20);
assert(inversePending.args[0].layout.builderOperatorBoxes.length === 1, "Open inverses must retain their nested builder sequence");
assert(inversePending.layout.width > inversePending.args[0].layout.width, "The inverse template must surround its pending contents");
const inverseDiagonal = new renderer.ExprNode("sum", [value("2"), inversePending, value("x")]);
inverseDiagonal.isBuilderSequence = true;
inverseDiagonal.builderOperators = ["sum", "prod"];
renderer.layoutExpressionWithSettings(inverseDiagonal, fakeContext, renderer.SETTINGS, 20, 20);
const beforeInverseOperator = inverseDiagonal.layout.builderOperatorBoxes[0];
const afterInverseOperator = inverseDiagonal.layout.builderOperatorBoxes[1];
const beforeInverseCenterX = beforeInverseOperator.x + beforeInverseOperator.width / 2;
const beforeInverseCenterY = beforeInverseOperator.y + beforeInverseOperator.height / 2;
const afterInverseCenterX = afterInverseOperator.x + afterInverseOperator.width / 2;
const afterInverseCenterY = afterInverseOperator.y + afterInverseOperator.height / 2;
assert(nearlyEqual(distance(beforeInverseCenterX, beforeInverseCenterY, inversePending.left(), inversePending.top()), beforeInverseOperator.width / 2), "The preceding operation circle must just touch an inverse's upper-left corner");
assert(nearlyEqual(distance(inversePending.right(), inversePending.bottom(), afterInverseCenterX, afterInverseCenterY), afterInverseOperator.width / 2), "The following operation circle must just touch an inverse's lower-right corner");
const dangling = new renderer.ExprNode("sum", [value("2")]);
dangling.isBuilderSequence = true;
dangling.builderOperators = ["sum"];
renderer.layoutExpressionWithSettings(dangling, fakeContext, renderer.SETTINGS, 20, 20);
assert(dangling.layout.builderOperatorBoxes[0].groupable === false, "A dangling operation must not group before its next value exists");
const danglingOperator = dangling.layout.builderOperatorBoxes[0];
assert(nearlyEqual(dangling.layout.x + dangling.layout.width, danglingOperator.x + danglingOperator.width + dangling.layout.builderOuterPadding), "A dangling operation must end immediately after its circle with no extra value space");

console.log("Problem Builder static integration checks passed.");
