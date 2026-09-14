const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const builderHtml = read("exercise-builder.html");
const builderCss = read("exercise-builder.css");
const builderJs = read("exercise-builder.js");
const playerHtml = read("exploded-algebra.html");
const playerJs = read("exploded-algebra-tool.js");

const htmlIds = new Set(Array.from(builderHtml.matchAll(/\bid="([^"]+)"/g), match => match[1]));
const requestedIds = new Set(Array.from(builderJs.matchAll(/\bbyId\("([^"]+)"\)/g), match => match[1]));
for (const id of requestedIds) {
  assert(htmlIds.has(id), `exercise-builder.js references missing HTML id: ${id}`);
}
for (const phase of ["1", "2", "3", "4"]) {
  assert(builderHtml.includes(`data-phase="${phase}"`), `Missing builder phase ${phase}`);
}

assert(builderHtml.includes("exploded-algebra.html?authoring=builder&amp;v="), "Builder must embed the versioned real player in authoring mode");
assert(!/<section class="phase" data-phase="2" hidden>\s*<div class="phase-heading">/.test(builderHtml), "Phase 2 must not include explanatory heading chrome");
assert(!/<section class="phase" data-phase="3" hidden>\s*<div class="phase-heading">/.test(builderHtml), "Phase 3 must not include explanatory heading chrome");
assert(builderHtml.includes('id="finishRecordingButton"') && builderHtml.includes("All Done"), "Clean solving mode must provide an All Done control");
assert(builderHtml.includes('id="curationTable"'), "Review phase must include the recorded-step curation table");
assert(builderJs.includes("Before completion") && builderJs.includes("After completion"), "Each candidate step must have editable pre/post notation");
assert(builderCss.includes("body.phase2-expression-building > .builder-header"), "Active Phase 2 builder must hide the outer page header");
assert(builderCss.includes("body.phase3-recording > .builder-header"), "Active solving mode must hide the outer page header");
assert(builderJs.includes("acceptInitialExpressionAndSolve"), "Submitting the initial expression must advance directly to solving");
assert(builderJs.includes("tap each operation in the expression"), "Initial-expression guidance must describe integrated grouping");
assert(builderJs.includes("deriveStepCandidates"), "Recorded expression states must be converted into curation candidates");
assert(builderJs.includes('candidate.included !== false'), "Hidden candidate steps must be omitted from export");
assert(builderJs.includes("candidates[candidates.length - 1].required = true"), "The final expression must remain an included completion target");
assert(playerHtml.includes("authoring-initial-session.expression-builder-active"), "Initial authoring must collapse the conventional-notation row");
assert(playerHtml.includes("authoring-initial-session .quadrant-menu"), "Initial authoring must hide settings throughout expression building");
assert(builderJs.includes('formatVersion: FORMAT_VERSION'), "Export must include a format version");
assert(playerJs.includes('navigationSource === "builder"'), "Player must accept temporary builder test levels");
assert(/function isExpressionBuilderTool[\s\S]*?"authorInitial"/.test(playerJs), "Authoring mode must pass the shared Expression Builder tool gate");
assert(playerJs.includes('builder.tool === "authorInitial"'), "Initial authoring must have a single-expression preview path");
assert(playerJs.includes('builderRewritePreview.classList.toggle("single-expression", isInitialExpression)'), "Initial authoring must not use the rewrite comparison layout");
assert(playerJs.includes('flowVersion: 3'), "Shared Expression Builder must use the integrated flow");
assert(playerJs.includes('data-builder-action="pendingOperation"'), "Integrated entry must provide pending Sum and Product operations");
assert(playerJs.includes('data-builder-action="enterInverse"'), "Integrated entry must provide Inverse");
assert(playerJs.includes('data-builder-action="exitInverse"'), "Integrated entry must provide Exit Inverse");
assert(playerJs.includes('data-builder-action="undo"'), "Integrated entry must provide a unified Undo control");
assert(playerJs.includes('performBuilderAction("groupOperator"'), "Canvas operation taps must resolve grouping");
assert(playerJs.includes('new ExprNode(type, [left, right], null)'), "Grouping must resolve only the tapped operation without flattening neighboring groups");
assert(playerJs.includes('getIntegratedBuilderCompletedRoot'), "Submit must require one completely resolved root");
assert(!playerJs.includes('authoring-variable-select'), "Authoring must not use a variable dropdown");
assert(playerJs.includes('data-builder-action="value" data-value="x"'), "The shared builder must expose x");
assert(!playerJs.includes('data-value="y"'), "The shared builder must not expose additional variables");
assert(builderJs.includes('const VARIABLES = ["x"]'), "The Exercise Builder must expose only x");
assert(playerJs.includes('root.isBuilderSequence = true'), "Builder values must use the diagonal sequence workspace");
assert(playerJs.includes("solutionRecorder.includeUndoActions === false"), "Undo-exclusion recording path is missing");
assert(!/recordSolutionAction\s*\(\s*\{[^}]*type:\s*["']view["']/s.test(playerJs), "View/zoom actions must not be recorded");

const rendererContext = { window: {}, console };
vm.createContext(rendererContext);
vm.runInContext(read("exploded-algebra-renderer.js"), rendererContext);
const renderer = rendererContext.window.ExplodedAlgebraRenderer;
const value = text => new renderer.ExprNode("value", [], text);
const cases = [
  [new renderer.ExprNode("sum", [value("x"), value("1")]), "x + 1"],
  [new renderer.ExprNode("prod", [value("3"), value("x")]), "3x"],
  [new renderer.ExprNode("inv", [new renderer.ExprNode("sum", [value("x"), value("4")])]), "\\frac{1}{x + 4}"],
  [new renderer.ExprNode("sum", [value("x"), new renderer.ExprNode("prod", [value("-1"), value("3")])]), "x - 3"]
];
for (const [expression, expected] of cases) {
  assert(renderer.expressionToKatex(expression) === expected, `Unexpected KaTeX generation for ${expected}`);
}

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
assert(pending.args[1].left() > pending.args[0].right(), "Each pending value must be fully to the right of the previous value");
assert(pending.args[1].top() > pending.args[0].bottom(), "Each pending value must be fully below the previous value");
assert(pending.layout.builderOperatorBoxes[0].x > pending.args[0].right(), "A pending operator must remain after the previous value");
assert(pending.layout.builderOperatorBoxes[0].x + pending.layout.builderOperatorBoxes[0].width < pending.args[1].left(), "A pending operator must remain before the next value");
assert(pending.layout.builderOperatorBoxes[0].y > pending.args[0].bottom(), "A pending operator must remain below the previous value");
assert(pending.layout.builderOperatorBoxes[0].y + pending.layout.builderOperatorBoxes[0].height < pending.args[1].top(), "A pending operator must remain above the next value");
const inversePending = new renderer.ExprNode("inv", [pending]);
inversePending.isBuilderInverseOpen = true;
const outerPending = new renderer.ExprNode("sum", [inversePending]);
outerPending.isBuilderSequence = true;
outerPending.builderOperators = [];
renderer.layoutExpressionWithSettings(outerPending, fakeContext, renderer.SETTINGS, 20, 20);
assert(inversePending.args[0].layout.builderOperatorBoxes.length === 1, "Open inverses must retain a nested tappable builder sequence");
assert(inversePending.layout.width > inversePending.args[0].layout.width, "The inverse template must surround its pending contents");
const inverseDiagonal = new renderer.ExprNode("sum", [value("2"), inversePending, value("x")]);
inverseDiagonal.isBuilderSequence = true;
inverseDiagonal.builderOperators = ["sum", "prod"];
renderer.layoutExpressionWithSettings(inverseDiagonal, fakeContext, renderer.SETTINGS, 20, 20);
assert(inversePending.left() > inverseDiagonal.args[0].right() && inversePending.top() > inverseDiagonal.args[0].bottom(), "An inverse must sit fully below and to the right of its previous entry");
assert(inverseDiagonal.args[2].left() > inversePending.right() && inverseDiagonal.args[2].top() > inversePending.bottom(), "The entry after an inverse must sit fully below and to its right");
const dangling = new renderer.ExprNode("sum", [value("2")]);
dangling.isBuilderSequence = true;
dangling.builderOperators = ["sum"];
renderer.layoutExpressionWithSettings(dangling, fakeContext, renderer.SETTINGS, 20, 20);
assert(dangling.layout.builderPlaceholderBox, "A dangling operation must show the dotted box for its next value");
assert(dangling.layout.builderOperatorBoxes[0].groupable === false, "A dangling operation must not group before its next value exists");

for (const file of fs.readdirSync(path.join(root, "levels")).filter(name => name.endsWith(".json"))) {
  const level = JSON.parse(read(path.join("levels", file)));
  assert(level.id && level.title && level.startExpression, `${file} is missing required metadata`);
  assert(Array.isArray(level.steps) && level.steps.length > 0, `${file} has no steps`);
}

console.log("Exercise Builder static integration checks passed.");
