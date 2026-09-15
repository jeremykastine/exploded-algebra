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
const rendererJs = read("exploded-algebra-renderer.js");

const htmlIds = new Set(Array.from(builderHtml.matchAll(/\bid="([^"]+)"/g), match => match[1]));
const requestedIds = new Set(Array.from(builderJs.matchAll(/\bbyId\("([^"]+)"\)/g), match => match[1]));
for (const id of requestedIds) {
  assert(htmlIds.has(id), `exercise-builder.js references missing HTML id: ${id}`);
}
for (const phase of ["1", "2", "3", "4"]) {
  assert(builderHtml.includes(`data-phase="${phase}"`), `Missing builder phase ${phase}`);
}

assert(builderHtml.includes("exploded-algebra.html?authoring=builder&amp;v="), "Builder must embed the versioned real player in authoring mode");
assert(!builderHtml.includes("builder-header") && !builderHtml.includes("phase-nav") && !builderHtml.includes("phase-heading"), "The linear builder must not include title, phase-navigation, or explanatory header chrome");
assert(!builderHtml.includes("data-go-phase") && !builderHtml.includes("Back to Solving") && !builderHtml.includes("Edit Starting Expression") && !builderHtml.includes("Edit Setup"), "The builder must not provide backward phase navigation");
assert(!builderHtml.includes("resumeBackdrop") && !builderHtml.includes("Discard Draft") && !builderHtml.includes("saveStatus"), "The builder must not expose draft save, resume, or discard UI");
assert(!builderJs.includes("DRAFT_STORAGE_KEY") && !builderJs.includes("saveDraftNow") && !builderJs.includes("scheduleSave") && !builderJs.includes("readSavedDraft"), "The streamlined builder must not save or resume drafts");
assert(builderHtml.includes('<option value="expression-terms" selected>') && builderHtml.includes('<option value="unrestricted" selected>') && builderHtml.includes('<option value="3" selected>'), "Setup must select the most generous numerical and legacy evaluation levels by default");
assert(builderHtml.includes('id="allowNegativeOne" type="checkbox" checked') && builderHtml.includes('id="allowInverses" type="checkbox" checked'), "Negative-one and inverse numerical rewrites must be enabled by default");
assert(builderJs.includes('evaluationLevel: 3') && builderJs.includes('addition: "expression-terms"') && builderJs.includes('multiplication: "unrestricted"') && builderJs.includes('allowNegativeOne: true') && builderJs.includes('allowInverses: true'), "In-memory setup defaults must match the fully permissive form defaults");
assert(builderHtml.includes('id="finishRecordingButton"') && builderHtml.includes("All Done"), "Clean solving mode must provide an All Done control");
assert(builderHtml.includes('id="curationTable"') && builderHtml.includes('aria-roledescription="carousel"'), "Review phase must include the recorded-step carousel");
assert(builderJs.includes("if (validateSetup(true)) setPhase(2)") && builderJs.includes("await setPhase(3)") && builderJs.includes("setPhase(4)"), "The builder must advance directly through setup, expression entry, solving, and review");
assert(builderJs.includes('<span>Pre-completion</span>') && builderJs.includes('<span>Instructions</span>') && builderJs.includes('<span>Post-completion</span>'), "Each candidate step must have pre-completion, instructions, and post-completion editing fields");
assert(builderJs.includes('type="checkbox" data-toggle-step'), "Each review step must use an inclusion checkbox");
assert(builderJs.includes('fieldset class="step-editor-fields"${included ? "" : " disabled"}'), "Unchecked carousel steps must remain visible with disabled fields");
assert(builderCss.includes(".step-carousel-slide.is-disabled .step-editor-fields"), "Unchecked step fields must be visibly grayed out");
assert(builderJs.includes('let currentCurationMode = "view"') && builderJs.includes('data-curation-mode="view"') && builderJs.includes('data-curation-mode="edit"'), "Phase 4 must default to View and provide a View/Edit toggle");
assert(builderJs.includes('data-step-view="beforeKatex"') && builderJs.includes('data-step-view="afterKatex"') && builderJs.includes("renderKatex(slide.querySelector"), "View mode must render pre/post fields with KaTeX");
assert(builderJs.includes('aria-roledescription="slide"') && builderJs.includes('data-carousel-direction="previous"') && builderJs.includes('data-carousel-direction="next"'), "Phase 4 must render one navigable carousel slide per step");
assert(builderCss.includes(".step-carousel-slide") && builderCss.includes(".step-carousel-navigation") && builderCss.includes(".step-mode-toggle") && builderCss.includes(".step-math-view"), "Phase 4 must style the carousel and its View/Edit modes");
assert(/data-step-field="beforeKatex"[\s\S]*?data-step-field="instruction"[\s\S]*?data-step-field="afterKatex"/.test(builderJs), "Edit mode must order the three text fields as pre-completion, instructions, and post-completion");
assert(/data-step-view="beforeKatex"[\s\S]*?step-instruction-view[\s\S]*?data-step-view="afterKatex"/.test(builderJs), "View mode must order rendered pre-completion, instructions, and rendered post-completion");
assert(builderJs.includes("function renderMixedInstruction") && builderJs.includes('text.indexOf("\\\\(", cursor)') && builderJs.includes('text.indexOf("\\\\[", cursor)'), "Instructions must recognize inline and display KaTeX delimiters");
assert(builderJs.includes('displayMode: match.displayMode') && builderJs.includes('renderMixedInstruction(slide.querySelector(".step-instruction-view"), candidate.instruction)'), "Instruction math must render in the appropriate KaTeX mode while preserving surrounding text");
assert(builderCss.includes(".instruction-math-inline") && builderCss.includes(".instruction-math-display"), "Mixed instruction math must style inline and display forms separately");
assert(!builderJs.includes("actionSummary") && !builderJs.includes("step-range"), "Phase 4 must omit recorded-action details");
assert(!builderHtml.includes("initialKatexPreview") && !builderHtml.includes("initialKatexInput"), "Phase 4 must omit the separate starting-expression card");
assert(builderJs.includes("const generatedStepKatex = api.generateKatex(expression)") && builderJs.includes("beforeKatex: prior && prior.beforeKatex || generatedStepKatex") && builderJs.includes("afterKatex: prior && prior.afterKatex || generatedStepKatex"), "Each step's pre/post fields must default to the same recorded expression while preserving creator edits");
assert(builderCss.includes("body.phase2-expression-building > main") && builderCss.includes("body.phase3-recording > main"), "Expression entry and solving must fill the viewport");
assert(builderJs.includes("acceptInitialExpressionAndSolve"), "Submitting the initial expression must advance directly to solving");
assert(builderJs.includes("tap each operation in the expression"), "Initial-expression guidance must describe integrated grouping");
assert(builderJs.includes("deriveStepCandidates"), "Recorded expression states must be converted into curation candidates");
assert(builderJs.includes('candidate.included !== false'), "Hidden candidate steps must be omitted from export");
assert(builderJs.includes("candidates[candidates.length - 1].required = true"), "The final expression must remain an included completion target");
assert(builderHtml.includes('id="completeExerciseButton"') && builderHtml.includes('>All Done</button>') && !builderHtml.includes("testAssistanceLevel") && !builderHtml.includes("testLevelButton") && !builderHtml.includes("downloadJsonButton"), "Phase 4 must replace separate test/export controls with one All Done button");
assert(builderJs.includes('byId("completeExerciseButton").addEventListener("click", finishExercise)') && builderJs.includes("downloadLevel(level)"), "Phase 4 All Done must download the completed JSON");
assert(builderJs.includes('window.open("about:blank", "_blank")') && builderJs.includes("previewWindow.location.href = previewUrl"), "Phase 4 All Done must automatically open a preview tab");
assert(/const previewUrl = `exploded-algebra\.html\?source=builder&draftKey=\$\{[^`]+&level=\$\{[^`]+`/.test(builderJs) && !/const previewUrl[^\n]+(?:assistance|mode)=/.test(builderJs), "The automatic preview URL must omit assistance and legacy mode parameters");
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
assert(!playerJs.includes('class="builder-cancel-button"'), "Expression Builder must not render a separate Cancel button");
assert(/function undoExpressionBuilderStep[\s\S]*?expressionBuilderIsEmpty\(builder\)[\s\S]*?cancelExpressionBuilder\(\)/.test(playerJs), "Undo must cancel the Expression Builder after its contents are empty");
assert(playerJs.includes('class="builder-review-button" data-builder-review') && playerJs.includes("showBuilderOriginalReview") && playerJs.includes("hideBuilderOriginalReview"), "Expression Builder must provide press-and-hold original-expression review");
assert(playerJs.includes('const reviewDisabled = builder.tool === "authorInitial"') && playerJs.includes('${reviewDisabled ? " disabled" : ""}'), "Starting-expression authoring must disable the eye review button");
assert(playerHtml.includes(".builder-keypad-panel .builder-review-button:disabled"), "The unavailable starting-expression eye button must be visibly grayed out");
assert(/builderReviewActive[\s\S]*?drawBasicSelectionHighlight/.test(playerJs), "Original-expression review must restore the selection highlight");
assert(playerHtml.includes('.builder-keypad-panel .builder-variable-button { grid-column: 6; grid-row: 2; }'), "The x button must sit above 8");
assert(playerHtml.includes('.builder-keypad-panel .builder-inv-button { grid-column: 7; grid-row: 1; }') && playerHtml.includes('.builder-keypad-panel .builder-exit-inv-button { grid-column: 7; grid-row: 2; }'), "Inverse controls must stack above 9");
assert(playerHtml.includes('.builder-keypad-panel .builder-sum-button { grid-column: 3; grid-row: 6; }') && playerHtml.includes('.builder-keypad-panel .builder-prod-button { grid-column: 4; grid-row: 6; }'), "Addition and multiplication must sit immediately left of the number pad");
assert(playerHtml.includes('button.builder-submit-button {\n            grid-column: 1;') && playerHtml.includes('button.builder-review-button {\n            grid-column: 2;'), "Submit and Review must join the keypad bottom row");
assert(!/builder-submit-button,\s*\.builder-keypad-panel \.builder-action-row button\.builder-review-button\s*\{\s*position: fixed;/.test(playerHtml), "Submit and Review must not remain detached fixed-position controls");
assert(playerHtml.includes('body.left-handed .builder-keypad-panel .builder-prod-button { grid-column: 4; grid-row: 6; }') && playerHtml.includes('body.left-handed .builder-keypad-panel .builder-submit-button { grid-column: 7; grid-row: 6; }'), "Left-handed mode must mirror the complete keypad cluster");
assert(playerJs.includes('builder-exit-arrow-line') && playerJs.includes('M14 18 27 29'), "Exit Inverse must use a down-right arrow from the denominator");
assert(playerJs.includes('getIntegratedBuilderOperatorTarget') && playerJs.includes('groupIntegratedBuilderOperator(value)'), "Canvas operation taps must resolve grouping");
assert(playerJs.includes('visitIntegratedBuilderSequences(builder.root'), "Operation taps must search every unresolved scope");
assert(playerJs.includes('flattenIntegratedBuilderOperation(type, left, right)'), "Consecutive sums and products must flatten as they are grouped");
assert(!playerJs.includes('sequence.args.length !== 1 || sequence.builderOperators.length'), "Exit Inverse must not require its contents to be grouped first");
assert(playerJs.includes('collapseCompletedIntegratedBuilderNode'), "Submit must validate unresolved sequences nested inside inverses");
assert(playerJs.includes('getIntegratedBuilderCompletedRoot'), "Submit must require one completely resolved root");
assert(!playerJs.includes('authoring-variable-select'), "Authoring must not use a variable dropdown");
assert(playerJs.includes('data-builder-action="value" data-value="x"'), "The shared builder must expose x");
assert(!playerJs.includes('data-value="y"'), "The shared builder must not expose additional variables");
assert(builderJs.includes('const VARIABLES = ["x"]'), "The Exercise Builder must expose only x");
assert(playerJs.includes('root.isBuilderSequence = true'), "Builder values must use the diagonal sequence workspace");
assert(!rendererJs.includes('strokeRect(box.x, box.y, box.width, box.height)'), "Builder operation symbols must not have visible boxes");
assert(playerJs.includes("solutionRecorder.includeUndoActions === false"), "Undo-exclusion recording path is missing");
assert(!/recordSolutionAction\s*\(\s*\{[^}]*type:\s*["']view["']/s.test(playerJs), "View/zoom actions must not be recorded");

const rendererContext = { window: {}, console };
vm.createContext(rendererContext);
vm.runInContext(rendererJs, rendererContext);
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
const nearlyEqual = (left, right) => Math.abs(left - right) < 0.001;
const pendingPadding = pending.layout.builderItemPadding;
const pendingOperator = pending.layout.builderOperatorBoxes[0];
assert(nearlyEqual(pendingOperator.x, pending.args[0].right() + pendingPadding), "The previous entry's lower-right box corner must touch the operator's upper-left corner horizontally");
assert(nearlyEqual(pendingOperator.y, pending.args[0].bottom() + pendingPadding), "The previous entry's lower-right box corner must touch the operator's upper-left corner vertically");
assert(nearlyEqual(pendingOperator.x + pendingOperator.width, pending.args[1].left() - pendingPadding), "The operator's lower-right corner must touch the next entry's upper-left corner horizontally");
assert(nearlyEqual(pendingOperator.y + pendingOperator.height, pending.args[1].top() - pendingPadding), "The operator's lower-right corner must touch the next entry's upper-left corner vertically");
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
const inversePadding = inverseDiagonal.layout.builderItemPadding;
const beforeInverseOperator = inverseDiagonal.layout.builderOperatorBoxes[0];
const afterInverseOperator = inverseDiagonal.layout.builderOperatorBoxes[1];
assert(nearlyEqual(beforeInverseOperator.x + beforeInverseOperator.width, inversePending.left() - inversePadding) && nearlyEqual(beforeInverseOperator.y + beforeInverseOperator.height, inversePending.top() - inversePadding), "An inverse's entry box must touch the preceding operator corner");
assert(nearlyEqual(afterInverseOperator.x, inversePending.right() + inversePadding) && nearlyEqual(afterInverseOperator.y, inversePending.bottom() + inversePadding), "An inverse's entry box must touch the following operator corner");
const dangling = new renderer.ExprNode("sum", [value("2")]);
dangling.isBuilderSequence = true;
dangling.builderOperators = ["sum"];
renderer.layoutExpressionWithSettings(dangling, fakeContext, renderer.SETTINGS, 20, 20);
assert(dangling.layout.builderPlaceholderBox, "A dangling operation must show the dotted box for its next value");
assert(dangling.layout.builderOperatorBoxes[0].groupable === false, "A dangling operation must not group before its next value exists");
const danglingOperator = dangling.layout.builderOperatorBoxes[0];
assert(nearlyEqual(danglingOperator.x + danglingOperator.width, dangling.layout.builderPlaceholderBox.x) && nearlyEqual(danglingOperator.y + danglingOperator.height, dangling.layout.builderPlaceholderBox.y), "A dangling operation must touch the dotted next-entry box corner");

for (const file of fs.readdirSync(path.join(root, "levels")).filter(name => name.endsWith(".json"))) {
  const level = JSON.parse(read(path.join("levels", file)));
  assert(level.id && level.title && level.startExpression, `${file} is missing required metadata`);
  assert(Array.isArray(level.steps) && level.steps.length > 0, `${file} has no steps`);
}

console.log("Exercise Builder static integration checks passed.");
