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
for (const phase of ["1", "2", "3", "4", "5"]) {
  assert(builderHtml.includes(`data-phase="${phase}"`), `Missing builder phase ${phase}`);
}

assert(builderHtml.includes("exploded-algebra.html?authoring=builder&amp;v="), "Builder must embed the versioned real player in authoring mode");
assert(!builderHtml.includes("builder-header") && !builderHtml.includes("phase-nav") && !builderHtml.includes("phase-heading"), "The linear builder must not include title, phase-navigation, or explanatory header chrome");
assert(!builderHtml.includes("data-go-phase") && !builderHtml.includes("Back to Solving") && !builderHtml.includes("Edit Starting Expression") && !builderHtml.includes("Edit Setup"), "The builder must not provide backward phase navigation");
assert(!builderHtml.includes("resumeBackdrop") && !builderHtml.includes("Discard Draft") && !builderHtml.includes("saveStatus"), "The builder must not expose draft save, resume, or discard UI");
assert(!builderJs.includes("DRAFT_STORAGE_KEY") && !builderJs.includes("saveDraftNow") && !builderJs.includes("scheduleSave") && !builderJs.includes("readSavedDraft"), "The streamlined builder must not save or resume drafts");
for (const ruleId of [
  "nonnegativeArithmetic",
  "signedArithmetic",
  "nonnegativeFractionSimplification",
  "signedFractionSimplification",
  "inverseOne",
  "inverseNegativeOne",
  "doubleNegative"
]) {
  assert(builderJs.includes(`id: "${ruleId}"`), `Setup must define numerical rule ${ruleId}`);
}
assert(builderJs.includes('{ forward: "manual", reverse: "manual" }'), "Setup must default every numerical rule direction to Manual");
assert(builderJs.includes('value === "manual" ? " checked" : ""'), "Setup must visibly select Manual for every numerical permission by default");
assert(builderJs.includes('automatic: "Automatic"') && builderJs.includes('manual: "Manual"') && builderJs.includes('"not-allowed": "Not allowed"'), "Setup must render the required forward and reverse radio choices");
assert(builderHtml.includes('id="numericalPermissionsTable"') && builderHtml.includes('role="list"'), "Setup must render the numerical permission outline");
assert(builderJs.includes('class="numerical-permission-rule" role="listitem"') && builderJs.includes('class="permission-direction-title">Forward') && builderJs.includes('class="permission-direction-title">Reverse'), "Every numerical rule and direction must be vertically outlined");
assert(builderCss.includes(".numerical-permission-rule") && builderCss.includes(".permission-direction") && /\.permission-options \{[^}]*display: grid;/.test(builderCss) && !/\.numerical-permissions \{[^}]*grid-template-columns:/.test(builderCss), "The numerical permission outline must keep rules, directions, and choices vertically stacked without a wide table grid");
assert(builderJs.includes('id: "nonnegativeArithmetic"') && builderJs.includes('label: "Nonnegative addition and multiplication"') && builderJs.includes('forward: ["automatic", "manual"], reverse: ["manual"]'), "Nonnegative addition and multiplication must share one always-available permission row");
assert(builderJs.includes('id: "signedArithmetic"') && builderJs.includes('label: "Signed number addition and multiplication"') && builderJs.includes('forward: ["automatic", "manual", "not-allowed"], reverse: ["manual", "not-allowed"]'), "Signed addition and multiplication must share one permission row");
assert(builderJs.includes('id: "nonnegativeFractionSimplification"') && builderJs.includes('id: "signedFractionSimplification"'), "Phase 1 must provide separate non-negative and signed fraction categories");
for (const ruleId of ["inverseOne", "inverseNegativeOne", "doubleNegative"]) {
  const rulePattern = new RegExp(`id: "${ruleId}"[^\\n]*forward: \\["automatic", "manual"\\][^\\n]*reverse: \\["manual"\\]`);
  assert(rulePattern.test(builderJs), `${ruleId} must offer Automatic and Manual forward with Manual reverse`);
}
assert(builderJs.indexOf('id: "doubleNegative"') > builderJs.indexOf('id: "inverseNegativeOne"'), "Negative one times negative one must be item 7 after items 5 and 6");
assert(!builderHtml.includes("fixed-numerical-note"), "The negative-one product must not appear as a separate note below the list");
assert(builderJs.includes("const CONFIGURABLE_NUMERICAL_REWRITE_RULES = NUMERICAL_REWRITE_RULES;"), "All seven numerical rules must be exported with their selected permissions");
assert(!builderJs.includes('id: "positiveAddition"') && !builderJs.includes('id: "positiveMultiplication"') && !builderJs.includes('id: "signedAddition"') && !builderJs.includes('id: "signedMultiplication"'), "Setup must not expose separate addition and multiplication permission rows");
assert(!builderJs.includes("positiveAdditionNoCarry") && !builderJs.includes("positiveAdditionWithCarry") && !builderJs.includes("positiveMultiplicationOneSignificantFigure") && !builderJs.includes("positiveMultiplicationUnrestricted"), "Setup must not expose carrying or significant-figure permission categories");
assert(!builderJs.includes("NUMERICAL_PERMISSION_HIERARCHIES") && !builderJs.includes("applyMonotonicNumericalPermissions"), "Setup must not retain hierarchy code for removed categories");
assert(!builderHtml.includes('id="additionPermission"') && !builderHtml.includes('id="multiplicationPermission"') && !builderHtml.includes('id="allowNegativeOne"') && !builderHtml.includes('id="allowInverses"'), "Setup must not expose the obsolete broad numerical controls");
assert(builderHtml.includes('name="includeUndo" value="no" checked') && !builderHtml.includes('name="includeUndo" value="yes" checked') && builderHtml.indexOf('name="includeUndo" value="no"') < builderHtml.indexOf('name="includeUndo" value="yes"'), "Undo recording must be off by default and listed before Yes in Setup");
assert(builderHtml.includes("whether Guided mode should replay failed approaches") && !builderHtml.includes("High assistance"), "Undo recording guidance must use the Guided mode name");
assert(builderHtml.includes('class="radio-row undo-radio-options"') && builderCss.includes(".undo-radio-options { display: grid;"), "Recorded undo choices must be vertically ordered with No on top");
assert(builderJs.includes("includeUndoActions: false"), "The in-memory undo-recording default must match Setup");
assert(builderJs.includes("function initializeSetupDefaults()") && builderJs.includes("const timestamp = String(Date.now())") && builderJs.includes('byId("exerciseTitle").value = timestamp'), "The exercise name must default to a timestamp");
assert(!builderHtml.includes("Legacy evaluation level") && !builderHtml.includes('id="evaluationLevel"') && !builderJs.includes("evaluationLevel"), "The Exercise Builder must not expose or export the legacy evaluation level");
assert(!builderHtml.includes('id="exerciseInstruction"') && !builderHtml.includes('id="completionMessage"'), "Phase 1 must omit opening-instruction and completion-message fields");
assert(!builderHtml.includes("Advanced tool permissions") && !builderHtml.includes('id="toolPermissionList"'), "Phase 1 must omit advanced tool permissions");
assert(!builderHtml.includes('id="finishRecordingButton"') && !builderCss.includes(".record-step-button"), "Phase 3 must not use a detached checkpoint overlay");
assert(playerHtml.includes('data-workspace-action="authoringFinishRecording"') && playerHtml.indexOf('data-workspace-action="authoringFinishRecording"') < playerHtml.indexOf('class="workspace-tool-group workspace-selection-group"'), "All Done must be the first control in the Phase 3 preselection toolbar");
assert(playerHtml.includes('body.authoring-recording-session .workspace-toolbar [data-workspace-action="authoringFinishRecording"] { grid-column: 4 / span 3; grid-row: 4; }'), "All Done must occupy the lower-right three cells during recording");
for (const selector of [
  '[data-workspace-action="zoomIn"]',
  '[data-workspace-action="zoomOut"]',
  '[data-workspace-action="resetZoom"]',
  '[data-workspace-mode="pan"]',
  '[data-workspace-mode="select"]',
  '[data-workspace-action="undoExpression"]'
]) {
  assert(!playerHtml.includes(`body.authoring-recording-session .workspace-toolbar ${selector}`), `Instructor recording must not override the shared placement of ${selector}`);
}
assert(builderHtml.includes('exploded-algebra.html?authoring=builder&amp;v=20260923-guided-unguided'), "The Exercise Builder must load the current Guided/Unguided player");
assert(builderHtml.includes('id="curationTable"') && builderHtml.includes('aria-roledescription="carousel"'), "Review phase must include the recorded-step carousel");
assert(builderJs.includes("if (validateSetup(true)) setPhase(2)") && builderJs.includes("await setPhase(3)") && builderJs.includes("setPhase(4)") && builderJs.includes('setPhase(5)'), "The builder must advance directly through setup, expression entry, solving, step review, and exercise guidance");
assert(builderJs.includes('<span>Pre-completion</span>') && builderJs.includes('<span>Post-completion</span>') && !builderJs.includes('<span>Instructions</span>'), "Each candidate step must contain only pre-completion and post-completion editing fields");
assert(!builderJs.includes('data-toggle-step') && !builderJs.includes('candidate.included') && !builderJs.includes('candidate.required'), "Phase 4 must not provide step-inclusion controls");
assert(builderJs.includes('<fieldset class="step-editor-fields">'), "Every recorded step must remain editable in Phase 4");
assert(builderJs.includes('let currentCurationMode = "view"') && builderJs.includes('data-curation-mode="view"') && builderJs.includes('data-curation-mode="edit"'), "Phase 4 must default to View and provide a View/Edit toggle");
assert(builderJs.includes('data-step-view="beforeKatex"') && builderJs.includes('data-step-view="afterKatex"') && builderJs.includes("renderKatex(slide.querySelector"), "View mode must render pre/post fields with KaTeX");
assert(builderJs.includes('aria-roledescription="slide"') && builderJs.includes('data-carousel-direction="previous"') && builderJs.includes('data-carousel-direction="next"'), "Phase 4 must render one navigable carousel slide per step");
assert(/<header class="step-slide-header">[\s\S]*?<nav class="step-carousel-navigation"[\s\S]*?data-carousel-direction="previous"[\s\S]*?<span class="step-number"[\s\S]*?data-carousel-direction="next"[\s\S]*?<div class="step-mode-toggle"/.test(builderJs), "Phase 4 must place Previous, Step number, and Next at the upper left before the View/Edit toggle");
assert(!builderJs.includes('step-carousel-position') && !builderCss.includes('.step-carousel-position'), "Phase 4 must not show a separate carousel position label");
assert(builderJs.includes('key: "initial-expression"') && builderJs.includes('const stepNumber = candidate.isInitial ? 0 : index'), "Phase 4 must begin with a Step 0 slide for the original expression");
assert(builderJs.includes('Pre-completion is not applicable for step 0') && builderJs.includes('>N/A</div>'), "Step 0 pre-completion must be marked N/A in Phase 4");
assert(builderCss.includes(".step-carousel-slide") && builderCss.includes(".step-carousel-navigation") && builderCss.includes(".step-mode-toggle") && builderCss.includes(".step-math-view"), "Phase 4 must style the carousel and its View/Edit modes");
assert(/data-step-field="beforeKatex"[\s\S]*?data-step-field="afterKatex"/.test(builderJs) && !builderJs.includes('data-step-field="instruction"'), "Edit mode must order only the pre-completion and post-completion fields");
assert(/data-step-view="beforeKatex"[\s\S]*?data-step-view="afterKatex"/.test(builderJs) && !builderJs.includes("step-instruction-view"), "View mode must render only pre-completion and post-completion notation");
assert(!builderJs.includes("renderMixedInstruction") && !builderJs.includes("candidate.instruction") && !builderCss.includes("step-instruction-view"), "The builder must fully remove individual step instructions");
assert(!builderJs.includes("actionSummary") && !builderJs.includes("step-range"), "Phase 4 must omit recorded-action details");
assert(!builderHtml.includes("initialKatexPreview") && !builderHtml.includes("initialKatexInput"), "Phase 4 must omit the separate starting-expression card");
assert(builderJs.includes("const generatedStepKatex = api.generateKatex(expression)") && builderJs.includes("beforeKatex: generatedStepKatex") && builderJs.includes("afterKatex: generatedStepKatex"), "Each recorded step's pre/post fields must default to the same expression");
assert(!builderJs.includes("candidate.beforeKatex = previousKept.afterKatex"), "Visibility curation must preserve identical default pre/post versions for each retained step");
assert(builderCss.includes("body.phase2-expression-building > main") && builderCss.includes("body.phase3-recording > main"), "Expression entry and solving must fill the viewport");
assert(builderJs.includes("acceptInitialExpressionAndSolve"), "Submitting the initial expression must advance directly to solving");
assert(builderJs.includes("tap each operation in the expression"), "Initial-expression guidance must describe integrated grouping");
assert(builderJs.includes("function recordAutomaticMajorStep(snapshot, api)") && builderJs.includes("actionStartIndex") && builderJs.includes("actionEndIndex: actions.length"), "Every completed expression-changing manipulation must be saved automatically with its action boundary");
assert(builderJs.includes('event.data.detail.preselectionActive') && builderJs.includes("recordAutomaticMajorStep(snapshot, api)"), "Returning to preselection must automatically capture the completed major step");
assert(playerJs.includes("setFinishRecordingControlVisible(visible = true)") && playerJs.includes('notifyAuthoringHost("finish-recording")'), "The embedded All Done control must finish Phase 3 without manually marking a step");
assert(/\.workspace-toolbar \[data-workspace-action="authoringFinishRecording"\] \{[\s\S]*?color: #000;[\s\S]*?\}/.test(playerHtml), "The embedded All Done control must use black text");
assert(!builderJs.includes("recordStepOrFinish") && !builderJs.includes("currentStepIsRecorded") && !builderJs.includes("recordCurrentStep"), "Phase 3 must not retain the manual Record Step workflow");
assert(builderJs.includes("reconcileRecordedSteps(snapshot)") && builderJs.includes("candidate.actionPrefix === getActionPrefix"), "Automatically saved steps discarded by an unrecorded undo must be removed from the saved path");
assert(builderJs.includes("const recordedCandidates = draft.recording.candidates || []") && !builderJs.includes("includedCandidates"), "Export must contain all steps retained by the visibility curation pass");
assert(builderHtml.includes('id="continueToGuidanceButton"') && builderHtml.includes('>Continue to Exercise Guidance</button>') && builderJs.includes('byId("continueToGuidanceButton").hidden = !isFinalSlide'), "The final Step carousel slide must continue to the Exercise Guidance phase");
assert(builderHtml.includes('data-phase="5"') && builderHtml.includes('id="exerciseGuidance"') && builderHtml.includes('id="exerciseGuidanceView"') && builderHtml.includes('id="exerciseGuidanceEditor"'), "Phase 5 must provide one Exercise Guidance field with view and edit surfaces");
assert(builderHtml.includes('data-guidance-mode="view"') && builderHtml.includes('data-guidance-mode="edit"') && builderJs.includes('let currentGuidanceMode = "view"'), "Phase 5 must default to View and provide the same View/Edit toggle pattern as Phase 4");
assert(/\.exercise-guidance-view\[hidden\],[\s\S]*?\.exercise-guidance-editor\[hidden\] \{ display: none !important; \}/.test(builderCss), "Phase 5 must display exactly one of its View and Edit surfaces at a time");
assert(!builderHtml.includes('id="guidanceProblemExpression"') && !builderHtml.includes('id="guidanceNumericalRestrictions"') && !builderHtml.includes('automatic-guidance-section'), "Phase 5 must not split guidance across separate automatic sections");
assert(builderJs.includes('function buildPrefilledExerciseGuidance()') && builderJs.includes('"## Problem Statement"') && builderJs.includes('"## Numerical Manipulation Restrictions"') && builderJs.includes('draft.settings.numericalRewrite.rules[rule.id]'), "The single Phase 5 field must be prefilled with the problem statement and numerical restrictions");
assert(builderJs.includes('function renderGuidanceMode()') && builderJs.includes('function renderGuidancePreview()') && builderJs.includes('data-guidance-math'), "Phase 5 View mode must format and render the combined field with KaTeX");
assert(builderJs.includes('level.exerciseGuidance = draft.metadata.exerciseGuidance.trim()') && builderJs.includes('level.exerciseGuidanceIsComplete = true') && !builderJs.includes('step.guidance ='), "Export must store the complete exercise-level guidance field and no per-step guidance");
assert(builderHtml.includes('id="completeExerciseButton"') && builderHtml.includes('>All Done</button>') && !builderHtml.includes("testAssistanceLevel") && !builderHtml.includes("testLevelButton") && !builderHtml.includes("downloadJsonButton"), "Phase 5 must finish with one All Done button");
assert(/\.complete-exercise-button \{ color: #000; \}/.test(builderCss), "The Phase 5 All Done control must use black text");
assert(!builderHtml.includes('id="deleteStepButton"') && !builderHtml.includes('>Delete Step</button>'), "Final step editing must not offer deletion after visibility curation is complete");
assert(!builderJs.includes("deleteCurrentCurationStep") && !builderJs.includes("deleteCurationCandidateAt") && !builderCss.includes("delete-step-button"), "Final step editing must not retain obsolete deletion behavior or styling");
assert(builderJs.includes("function syncFinishRecordingControl(snapshot)") && builderJs.includes("snapshot.preselectionActive === true") && builderJs.includes("api.setFinishRecordingControlVisible(isAvailable)") && playerJs.includes('notifyAuthoringHost("interaction-state"'), "The Phase 3 All Done control must appear only while the workspace is in preselection");
assert(builderJs.includes("syncFinishRecordingControl(event.data.detail)"), "Phase 3 must read preselection state from the authoring message detail payload");
assert(builderJs.includes('byId("completeExerciseButton").addEventListener("click", finishExercise)') && builderJs.includes("downloadLevel(level)"), "Phase 5 All Done must download the completed JSON");
assert(builderJs.includes('window.open("about:blank", "_blank")') && builderJs.includes("previewWindow.location.href = previewUrl"), "Phase 5 All Done must automatically open a preview tab");
assert(/const previewUrl = `exploded-algebra\.html\?source=builder&draftKey=\$\{[^`]+&level=\$\{[^`]+`/.test(builderJs) && !/const previewUrl[^\n]+(?:assistance|mode)=/.test(builderJs), "The automatic preview URL must omit assistance and legacy mode parameters");
assert(playerJs.includes("ExplodedAlgebraRenderer.expressionBuilderToKatex(activeBuilder.root)") && playerJs.includes('class="textbook-solution builder-conventional-live"'), "Every active Expression Builder must render its live conventional expression in panel one");
assert(playerJs.includes("ExplodedAlgebraRenderer.expressionToKatex(activeBuilder.originalSelectedNode)") && playerJs.includes('class="solution-step builder-conventional-selected"'), "Panel one must show the selected expression above the live construction");
assert(playerJs.includes('activeBuilder.tool === "authorInitial"') && playerJs.includes('class="builder-conventional-arrow"'), "Initial-expression authoring must omit the nonexistent selected row while rewrites show the selected-to-new transition");
assert(playerJs.includes("if (builderActive) {\n                renderLevelInfo(currentLevelIndex);"), "The live conventional Builder expression must refresh after every entry or grouping change");
assert(!playerHtml.includes("body.authoring-session:not(.expression-builder-active) .left-panel,") && !playerHtml.includes("body.authoring-session.expression-builder-active.builder-entry-mode .left-panel {\n            display: none"), "Exercise Builder authoring must retain the conventional-notation panel throughout");
assert(playerJs.includes('authoringPhase === "recording" && expressionRoot') && playerJs.includes("ExplodedAlgebraRenderer.expressionToKatex(expressionRoot)") && playerJs.includes("\\\\text{Recording in progress}"), "Solution recording must show the current conventional expression with its recording status");
assert(playerJs.includes("const selectionPath = findPathToNode(expressionRoot, selection.node)") && playerJs.includes("path: selectionPath.slice()"), "Recorded selections must preserve their exact expression-tree path");
assert(playerJs.includes("const exactTarget = findDemoSelectionTargetByPath(step, targetNode)") && playerJs.includes("selection.node === target.node"), "Guided playback must prefer the recorded path and require the exact selected occurrence");
assert(playerHtml.includes("authoring-initial-session .quadrant-menu"), "Initial authoring must hide settings throughout expression building");
assert(builderJs.includes('formatVersion: FORMAT_VERSION'), "Export must include a format version");
assert(playerJs.includes('navigationSource === "builder"'), "Player must accept temporary builder test levels");
assert(/function isExpressionBuilderTool[\s\S]*?"authorInitial"/.test(playerJs), "Authoring mode must pass the shared Expression Builder tool gate");
assert(playerJs.includes('builder.tool === "authorInitial"'), "Initial authoring must have a single-expression preview path");
assert(playerJs.includes('builderRewritePreview.classList.toggle("single-expression", isInitialExpression)'), "Initial authoring must not use the rewrite comparison layout");
assert(playerJs.includes('flowVersion: 5'), "Shared Expression Builder must use the direct-notation level-navigation flow");
assert(playerJs.includes('data-builder-action="pendingOperation"'), "Integrated entry must provide pending Sum and Product operations");
assert(playerJs.includes('data-builder-action="enterInverse"'), "Integrated entry must provide Inverse");
assert(!playerJs.includes('data-builder-action="moveUpOperation"'), "Integrated entry must leave the former Move Up grid cell blank");
assert(!playerJs.includes('data-builder-action="exitInverse"'), "The live builder must not retain the special-purpose Exit Inverse button");
assert(playerJs.includes('data-builder-action="undo"'), "Integrated entry must provide a unified Undo control");
assert(!playerJs.includes('class="builder-cancel-button"'), "Expression Builder must not render a separate Cancel button");
assert(/function undoExpressionBuilderStep[\s\S]*?expressionBuilderIsEmpty\(builder\)[\s\S]*?cancelExpressionBuilder\(\)/.test(playerJs), "Undo must cancel the Expression Builder after its contents are empty");
assert(playerJs.includes('class="builder-review-button" data-builder-review') && playerJs.includes("showBuilderOriginalReview") && playerJs.includes("hideBuilderOriginalReview"), "Expression Builder must provide click-to-open original-expression peek");
assert(/builderCommandPanel\.addEventListener\("click"[\s\S]{0,300}button\[data-builder-review\][\s\S]{0,300}showBuilderOriginalReview\(\)/.test(playerJs), "Peek must open with a click rather than a pointer hold");
assert(playerJs.includes('builderPeekDismissLayer.addEventListener("click"') && playerJs.includes("hideBuilderOriginalReview()"), "A click anywhere on the full-screen Peek dismissal layer must restore the builder");
assert(playerHtml.includes("body.builder-review-active .builder-peek-dismiss-layer") && playerHtml.includes('id="builderPeekDismissLayer"'), "Peek must place an invisible full-screen dismissal layer over the expression");
assert(playerJs.includes('const reviewDisabled = builder.tool === "authorInitial"') && playerJs.includes('${reviewDisabled ? " disabled" : ""}'), "Starting-expression authoring must disable the eye review button");
assert(playerHtml.includes('data-workspace-action="showExerciseGuidance"') && playerHtml.includes('aria-label="Exercise guidance"'), "Student pre-selection must provide an Exercise Guidance button");
assert(playerJs.includes('function showExerciseGuidance()') && playerJs.includes('<span class="exercise-guidance-popover-title">Exercise Guidance</span>'), "The Exercise Guidance button must open the combined guidance view");
assert(playerJs.includes('function getProblemStatementKatex(level)') && playerJs.includes('<h3>Problem Statement</h3>'), "Exercise Guidance must automatically include the problem statement expression");
assert(playerJs.includes('function getNumericalRestrictionsTreeHtml(profile)') && playerJs.includes('<h3>Numerical Manipulation Restrictions</h3>'), "Exercise Guidance must automatically include the two-level numerical restrictions");
assert(playerJs.includes('normalizeTextBlocks(level.exerciseGuidance)') && playerJs.includes('<h3>Additional Guidance</h3>'), "Exercise Guidance must include the author-provided exercise-level guidance");
assert(playerJs.includes('function getCompleteExerciseGuidanceHtml(source)') && playerJs.includes('level.exerciseGuidanceIsComplete && authorGuidance.length'), "The player must render a combined author-edited guidance field without duplicating its prefilled sections");
assert(playerJs.includes('function getMixedInstructionHtml(source)') && playerJs.includes('data-display-mode="${match.displayMode}"'), "Author guidance must recognize mixed plain text and KaTeX");
assert(playerJs.includes('node.dataset.displayMode === "true"') && playerHtml.includes(".exercise-guidance-popover .instruction-math-display"), "Author guidance KaTeX must render in inline or display mode");
assert(!playerJs.includes("getStepGuidanceForDisplay") && !playerJs.includes("showStepGuidance") && !playerJs.includes("view-step-guidance-button"), "Student steps must no longer expose individual guidance");
assert(playerJs.includes('"exerciseGuidance"'), "Level validation must accept the exercise-level guidance field");
assert(playerHtml.includes(".builder-keypad-panel .builder-review-button:disabled"), "The unavailable starting-expression eye button must be visibly grayed out");
assert(/builderReviewActive[\s\S]*?drawBasicSelectionHighlight/.test(playerJs), "Original-expression review must restore the selection highlight");
assert(playerHtml.includes('.builder-keypad-panel .builder-variable-button { grid-column: 2; grid-row: 1; }'), "x must sit above the Builder view controls in the second column from the left");
assert(playerHtml.includes('.builder-keypad-panel .builder-prod-button { grid-column: 6; grid-row: 1 / span 2; }') && playerHtml.includes('.builder-keypad-panel .builder-sum-button { grid-column: 6; grid-row: 3 / span 2; }'), "Multiplication and addition must be double-height buttons in the rightmost column");
assert(playerHtml.includes('.builder-keypad-panel .builder-inv-button { grid-column: 5; grid-row: 4; }') && !playerHtml.includes('.builder-move-up-button'), "Inverse must occupy the lower-right corner of the number pad");
assert(playerHtml.includes('[data-builder-action="digit"][data-value="7"] { grid-column: 3; grid-row: 1; }') && playerHtml.includes('[data-builder-action="digit"][data-value="9"] { grid-column: 5; grid-row: 1; }'), "The number pad must occupy columns three through five");
assert(playerHtml.includes('M1 100 H500') && playerHtml.includes('M1 200 H599') && playerHtml.includes('M100 300 H500'), "The Builder grid overlay must preserve both double-height operation buttons and the left-column double-height Submit cell");
assert(playerHtml.includes('.builder-keypad-panel .builder-undo-button { grid-column: 1; grid-row: 1; }') && playerHtml.includes('button.builder-submit-button {\n            grid-column: 1;\n            grid-row: 3 / span 2;'), "Backspace, Peek, and Submit must stack in the leftmost column");
assert(playerHtml.includes('.builder-keypad-panel .builder-action-row button.builder-review-button {\n            grid-column: 1;\n            grid-row: 2;'), "Peek must sit between Backspace and Submit");
assert(playerHtml.includes('.builder-keypad-panel .builder-zoom-in-button { grid-column: 2; grid-row: 2; }') && playerHtml.includes('.builder-keypad-panel .builder-reset-view-button { grid-column: 2; grid-row: 4; }'), "Builder zoom and reset controls must fill the bottom three cells of the second column from the left");
assert(playerHtml.includes('grid-template-rows: repeat(4, var(--main-key-size));'), "The Builder keypad must contain exactly four button rows without empty rows above");
assert(/\.bottom-controls-panel > \.builder-keypad-panel \{[\s\S]*?grid-template-columns: subgrid;[\s\S]*?grid-template-rows: subgrid;[\s\S]*?width: 100%;[\s\S]*?height: 100%;/.test(playerHtml), "The Builder keypad must inherit the entire resizable panel's six-by-four grid");
assert(!/builder-submit-button,\s*\.builder-keypad-panel \.builder-action-row button\.builder-review-button\s*\{\s*position: fixed;/.test(playerHtml), "Submit and Review must not remain detached fixed-position controls");
assert(!playerHtml.includes('left-handed') && !playerHtml.includes('handedness'), "Expression Builder must not retain an obsolete left-handed variant");
assert(!playerJs.includes('data-builder-view-action="pan"') && !playerHtml.includes('builder-pan-button'), "Integrated Expression Builder must not show a separate Pan button");
assert(playerJs.includes('data-builder-view-action="zoomIn"') && playerJs.includes('data-builder-view-action="zoomOut"') && playerJs.includes('data-builder-view-action="resetZoom"'), "Integrated Expression Builder must retain zoom and reset controls");
assert(playerJs.includes('const panningView = !integratedBuilder && uiState.workspaceMode === "pan"'), "Integrated Expression Builder gestures must not depend on the main workspace Pan mode");
assert(playerJs.includes('["pan", "builderPan"]') && !playerJs.includes('["pan", "builderOperator", "builderPan"]'), "The integrated Expression Builder canvas must be dedicated to drag-panning rather than operation grouping");
const whitespacePanHandler = playerJs.match(/svgContainer\.addEventListener\("pointerdown", e => \{([\s\S]*?)\n        \}\);\n\n        workspaceSvg\.addEventListener\("pointerdown"/);
assert(whitespacePanHandler && whitespacePanHandler[1].includes('isIntegratedExpressionBuilder(uiState.expressionBuilder)') && whitespacePanHandler[1].includes('? "builderPan"') && whitespacePanHandler[1].includes('? "pan"'), "Expression Builder panning must begin on workspace whitespace");
assert(/\.builder-keypad-panel\s*\{[\s\S]*?pointer-events:\s*none;[\s\S]*?\}/.test(playerHtml), "The transparent Expression Builder keypad grid must not block workspace whitespace");
assert(/\.builder-keypad-panel button,[\s\S]*?\.builder-keypad-panel \.builder-action-row button\s*\{[\s\S]*?pointer-events:\s*auto;[\s\S]*?\}/.test(playerHtml), "Expression Builder buttons must remain interactive inside the click-through keypad grid");
assert(!/if \(isIntegratedExpressionBuilder\(\) && !builderReviewActive\)[\s\S]*?workspaceZoom = Math\.max/.test(playerJs), "Integrated Expression Builder must not automatically fit or zoom the expression");
assert(playerJs.includes('M9 5h10.5A1.5 1.5 0 0 1 21 6.5v11'), "Integrated Expression Builder Undo must use the backspace icon");
assert(playerJs.includes('Cycle the most recent ${operationName} to its next level') && playerJs.includes('canCycleDirectBuilderOperationWithButton(builder, type)'), "Repeated addition and multiplication presses must expose operation-level cycling");
assert(playerJs.includes('event.key === "ArrowRight" && !integrated'), "Right Arrow must no longer move operations in the integrated builder");
assert(/function placeDirectBuilderOperationAtLowestLevel[\s\S]*?parent\.type === type[\s\S]*?parent\.args\.push\(emptyRight\)[\s\S]*?new ExprNode\(type, \[current, emptyRight\]/.test(playerJs), "Matching operations must flatten immediately while different operations become real exploded nodes at the latest value");
assert(/function moveDirectBuilderOperationUp[\s\S]*?getDirectBuilderLastOperation[\s\S]*?directBuilderOperationPrefix[\s\S]*?combineDirectBuilderContext[\s\S]*?rememberIntegratedBuilderOperation/.test(playerJs), "Move Up must relocate the most recently entered exploded operation one level at a time");
assert(/function installLiftedDirectBuilderOperation[\s\S]*?parent\.type === lifted\.type[\s\S]*?parent\.args\.splice\(childIndex, 1, \.\.\.lifted\.args\)/.test(playerJs), "Level cycling must flatten adjacent nested sums and products after lifting");
assert(playerJs.includes("function cycleDirectBuilderOperationToLowestLevel") && playerJs.includes("cloneBuilderMoveCycle(builder.moveCycle)"), "Repeated operation presses must cycle from the highest level back to the lowest placement");
assert(/function getBuilderUndoSnapshot[\s\S]*?lastOperation[\s\S]*?moveCycle/.test(playerJs) && /builderDraft: builder \? \{[\s\S]*?lastOperation[\s\S]*?moveCycle/.test(playerJs), "Undo and authoring drafts must preserve the operation target and movement cycle");
assert(playerJs.includes('collapseCompletedIntegratedBuilderNode') && playerJs.includes('if (isBuilderPlaceholder(node)) return null;'), "Submit must reject an unfinished direct-notation operand");
assert(/function enterDirectBuilderValue[\s\S]*?implicitOperation = String\(value\) === "x" \? "prod" : null/.test(playerJs), "Expression Builder must insert multiplication before x without inserting addition before negative one");
assert(/function enterDirectBuilderInverse[\s\S]*?placeDirectBuilderOperationAtLowestLevel\(builder, "prod"\)/.test(playerJs), "Expression Builder must insert multiplication before an inverse");
assert(/function appendDirectBuilderDigit[\s\S]*?String\(current\.value\) === "-1"[\s\S]*?placeDirectBuilderOperationAtLowestLevel\(builder, "prod"\)/.test(playerJs), "Expression Builder must insert multiplication between negative one and a following digit");
assert(playerJs.includes("maximumExplicitCommonCount") && playerJs.includes("Math.min(matchedCommonCount, maximumExplicitCommonCount)"), "Factoring must not synthesize a coefficient of 1 when a term is entirely factored");
assert(/activeTool === "commute"[\s\S]{0,350}uiState\.stage === "preview"[\s\S]{0,350}return "";/.test(playerJs), "Three-or-more-item commute must not show bottom instructions or buttons");
assert(playerJs.includes("function getClosestIndexWithinSelection(x, y)") && playerJs.includes("releasedIndex === pointerStart.commuteIndex"), "Commute choices must match the closest region at pointer down and pointer up");
assert(/if \(pointerStart\.mode === "commute"\)[\s\S]{0,500}releaseWorkspacePointer\(\);[\s\S]{0,100}return;[\s\S]{0,200}const movement =/.test(playerJs), "Commute choices must bypass the ordinary tap-movement threshold");
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
assert(playerJs.includes('data-builder-action="value" data-value="x"'), "The shared builder must expose x");
assert(playerJs.includes('const disabled = !builderAllowsVariables(uiState.activeTool);') && playerJs.includes('${disabled ? " disabled" : ""}'), "The x button must remain visible and become disabled only when variables are unavailable");
assert(!/if \(disabled\) \{\s*builderVariableRail\.replaceChildren\(\);\s*return;\s*\}/.test(playerJs), "A disallowed x must be disabled rather than removed from the keypad");
assert(!playerJs.includes('data-value="y"'), "The shared builder must not expose additional variables");
assert(builderJs.includes('const VARIABLES = ["x"]'), "The Exercise Builder must expose only x");
assert(playerJs.includes('flowVersion: 5') && playerJs.includes('root: makePlaceholderNode()'), "New Expression Builder sessions must begin directly in exploded notation rather than a diagonal sequence");
assert(!rendererJs.includes('builderItemOutlineBoxes'), "Builder entries must not have surrounding boxes");
assert(rendererJs.includes('builderOperationFill: "rgb(235, 235, 235)"'), "Unresolved Builder operations must use a light-gray fill");
assert(rendererJs.includes('drawingContext.arc(') && rendererJs.includes('box.width / 2'), "Unresolved Builder operations must be shown in circular highlights");
assert(!rendererJs.includes('builderRecentFill') && !rendererJs.includes('drawBuilderRecentHighlightsToContext') && !playerJs.includes('drawBuilderRecentHighlightsToContext'), "Expression Builder must not render purple entry highlighting");
assert(!rendererJs.includes('builderPotentialBoxes') && !rendererJs.includes('builderPlaceholderBox'), "Builder layout must not retain future-entry placeholder boxes");
assert(playerJs.includes("solutionRecorder.includeUndoActions === false"), "Undo-exclusion recording path is missing");
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
const cases = [
  [new renderer.ExprNode("sum", [value("x"), value("1")]), "x + 1"],
  [new renderer.ExprNode("prod", [value("3"), value("x")]), "3x"],
  [new renderer.ExprNode("prod", [value("x"), value("x")]), "x^{2}"],
  [new renderer.ExprNode("prod", [value("2"), value("x"), value("x"), value("x")]), "2x^{3}"],
  [new renderer.ExprNode("inv", [new renderer.ExprNode("sum", [value("x"), value("4")])]), "\\frac{1}{x + 4}"],
  [new renderer.ExprNode("sum", [value("x"), new renderer.ExprNode("prod", [value("-1"), value("3")])]), "x - 3"],
  [new renderer.ExprNode("sum", [value("x"), value("-1")]), "x - 1"],
  [new renderer.ExprNode("prod", [value("2"), value("x"), new renderer.ExprNode("inv", [value("3")])]), "\\frac{2x}{3}"],
  [new renderer.ExprNode("prod", [value("-1"), value("2"), new renderer.ExprNode("inv", [value("3")])]), "-\\frac{2}{3}"],
  [new renderer.ExprNode("prod", [value("2"), new renderer.ExprNode("inv", [value("3")]), value("x")]), "\\frac{2}{3} \\cdot x"],
  [new renderer.ExprNode("prod", [new renderer.ExprNode("sum", [value("a"), value("b")]), new renderer.ExprNode("sum", [value("c"), value("d")])]), "\\left(a + b\\right)\\left(c + d\\right)"]
];
for (const [expression, expected] of cases) {
  assert(renderer.expressionToKatex(expression) === expected, `Unexpected KaTeX generation for ${expected}`);
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
assert(renderer.expressionBuilderToKatex(inverseBuilder) === "\\frac{1}{2 + 3 \\cdot 4}", "Unresolved operations inside an inverse must remain flat in its conventional denominator");
assert(renderer.expressionBuilderToKatex(new renderer.ExprNode("sum", [value("x"), value("-1")])) === "x - 1", "Builder conventional notation must show addition of negative one as subtraction");
assert(renderer.expressionBuilderToKatex(new renderer.ExprNode("prod", [value("2"), value("x"), new renderer.ExprNode("inv", [value("3")])])) === "\\frac{2x}{3}", "Builder conventional notation must collect factors preceding an inverse into the numerator");
assert(renderer.expressionBuilderToKatex(new renderer.ExprNode("prod", [value("-1"), value("2"), new renderer.ExprNode("inv", [value("3")])])) === "-\\frac{2}{3}", "Builder conventional notation must place a fraction's negative sign in front");
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

for (const file of fs.readdirSync(path.join(root, "levels")).filter(name => name.endsWith(".json"))) {
  const level = JSON.parse(read(path.join("levels", file)));
  assert(level.id && level.title && level.startExpression, `${file} is missing required metadata`);
  assert(Array.isArray(level.steps) && level.steps.length > 0, `${file} has no steps`);
}

console.log("Exercise Builder static integration checks passed.");
