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
assert(builderJs.includes("deriveStepCandidates"), "Recorded expression states must be converted into curation candidates");
assert(builderJs.includes('candidate.included !== false'), "Hidden candidate steps must be omitted from export");
assert(builderJs.includes("candidates[candidates.length - 1].required = true"), "The final expression must remain an included completion target");
assert(playerHtml.includes("authoring-initial-session.expression-builder-active"), "Initial authoring must collapse the conventional-notation row");
assert(playerHtml.includes("authoring-initial-session:not(.builder-grouping-mode) .quadrant-menu"), "Initial entry may hide settings until grouping begins");
assert(playerHtml.includes("builder-grouping-mode:not(.builder-grouping-selection) .quadrant-menu"), "Grouping must expose the familiar settings control");
assert(playerHtml.includes("builder-grouping-mode:not(.builder-grouping-selection) .quadrant-tools"), "Grouping must expose the familiar workspace tools");
assert(builderJs.includes('formatVersion: FORMAT_VERSION'), "Export must include a format version");
assert(playerJs.includes('navigationSource === "builder"'), "Player must accept temporary builder test levels");
assert(/function isExpressionBuilderTool[\s\S]*?"authorInitial"/.test(playerJs), "Authoring mode must pass the shared Expression Builder tool gate");
assert(playerJs.includes('builder.tool === "authorInitial"'), "Initial authoring must have a single-expression preview path");
assert(playerJs.includes('builderRewritePreview.classList.toggle("single-expression", isInitialExpression)'), "Initial authoring must not use the rewrite comparison layout");
assert(playerJs.includes('flowVersion: 2'), "Shared Expression Builder must use the two-phase flow");
assert(playerJs.includes('data-builder-action="newEntry"'), "Entry phase must provide New Entry");
assert(playerJs.includes('data-builder-action="allDone"'), "Entry phase must provide All Done");
assert(playerJs.includes('data-builder-action="group" data-value="sum"'), "Grouping phase must provide Sum for multi-item selections");
assert(playerJs.includes('data-builder-action="group" data-value="prod"'), "Grouping phase must provide Product for multi-item selections");
assert(playerJs.includes('data-builder-action="group" data-value="inv"'), "Grouping phase must provide Inverse for single-item selections");
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

for (const file of fs.readdirSync(path.join(root, "levels")).filter(name => name.endsWith(".json"))) {
  const level = JSON.parse(read(path.join("levels", file)));
  assert(level.id && level.title && level.startExpression, `${file} is missing required metadata`);
  assert(Array.isArray(level.steps) && level.steps.length > 0, `${file} has no steps`);
}

console.log("Exercise Builder static integration checks passed.");
