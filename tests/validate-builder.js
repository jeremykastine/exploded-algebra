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
for (const ruleId of [
  "positiveAddition",
  "positiveMultiplication",
  "signedAddition",
  "signedMultiplication",
  "nonnegativeFractionSimplification",
  "signedFractionSimplification",
  "inverseOne",
  "inverseNegativeOne",
  "doubleNegative"
]) {
  assert(builderJs.includes(`id: "${ruleId}"`), `Setup must define numerical rule ${ruleId}`);
}
assert(builderJs.includes('{ forward: rule.forward[0], reverse: rule.reverse[0] }'), "Setup must default every configurable numerical rule to its first forward and reverse options");
assert(builderJs.includes('automatic: "Automatic"') && builderJs.includes('manual: "Manual"') && builderJs.includes('"not-allowed": "Not allowed"'), "Setup must render the required forward and reverse radio choices");
assert(builderHtml.includes('id="numericalPermissionsTable"') && builderHtml.includes('role="list"'), "Setup must render the numerical permission outline");
assert(builderJs.includes('class="numerical-permission-rule" role="listitem"') && builderJs.includes('class="permission-direction-title">Forward') && builderJs.includes('class="permission-direction-title">Reverse'), "Every numerical rule and direction must be vertically outlined");
assert(builderCss.includes(".numerical-permission-rule") && builderCss.includes(".permission-direction") && /\.permission-options \{[^}]*display: grid;/.test(builderCss) && !/\.numerical-permissions \{[^}]*grid-template-columns:/.test(builderCss), "The numerical permission outline must keep rules, directions, and choices vertically stacked without a wide table grid");
assert(builderJs.includes('id: "positiveAddition"') && builderJs.includes('forward: ["automatic", "manual"], reverse: ["manual"]'), "Positive whole-number addition must not offer Not allowed in either direction");
assert(builderJs.includes('id: "positiveMultiplication"') && builderJs.includes('forward: ["automatic", "manual"], reverse: ["manual"]'), "Positive whole-number multiplication must not offer Not allowed in either direction");
assert(builderJs.includes('id: "nonnegativeFractionSimplification"') && builderJs.includes('id: "signedFractionSimplification"'), "Phase 1 must provide separate non-negative and signed fraction categories");
assert(builderJs.includes('id: "inverseOne"') && builderJs.includes('id: "inverseNegativeOne"') && builderJs.includes('id: "doubleNegative"') && builderJs.match(/fixed: true/g)?.length === 3, "The two inverse rules and negative-one product must appear as fixed full list entries");
assert(builderJs.indexOf('id: "doubleNegative"') > builderJs.indexOf('id: "inverseNegativeOne"'), "Negative one times negative one must be item 9 after fixed items 7 and 8");
assert(!builderHtml.includes("fixed-numerical-note"), "The fixed negative-one product must not remain as a separate note below the list");
assert(builderJs.includes("CONFIGURABLE_NUMERICAL_REWRITE_RULES") && builderJs.includes(".filter(rule => !rule.fixed)"), "Fixed rows must not add redundant fields to exported numerical permissions");
assert(!builderJs.includes("positiveAdditionNoCarry") && !builderJs.includes("positiveAdditionWithCarry") && !builderJs.includes("positiveMultiplicationOneSignificantFigure") && !builderJs.includes("positiveMultiplicationUnrestricted"), "Setup must not expose carrying or significant-figure permission categories");
assert(!builderJs.includes("NUMERICAL_PERMISSION_HIERARCHIES") && !builderJs.includes("applyMonotonicNumericalPermissions"), "Setup must not retain hierarchy code for removed categories");
assert(!builderHtml.includes('id="additionPermission"') && !builderHtml.includes('id="multiplicationPermission"') && !builderHtml.includes('id="allowNegativeOne"') && !builderHtml.includes('id="allowInverses"'), "Setup must not expose the obsolete broad numerical controls");
assert(builderHtml.includes('name="includeUndo" value="no" checked') && !builderHtml.includes('name="includeUndo" value="yes" checked') && builderHtml.indexOf('name="includeUndo" value="no"') < builderHtml.indexOf('name="includeUndo" value="yes"'), "Undo recording must be off by default and listed before Yes in Setup");
assert(builderHtml.includes('class="radio-row undo-radio-options"') && builderCss.includes(".undo-radio-options { display: grid;"), "Recorded undo choices must be vertically ordered with No on top");
assert(builderJs.includes("includeUndoActions: false"), "The in-memory undo-recording default must match Setup");
assert(builderJs.includes("function initializeSetupDefaults()") && builderJs.includes("const timestamp = String(Date.now())") && builderJs.includes('byId("exerciseTitle").value = timestamp'), "The exercise name must default to a timestamp");
assert(!builderHtml.includes("Legacy evaluation level") && !builderHtml.includes('id="evaluationLevel"') && !builderJs.includes("evaluationLevel"), "The Exercise Builder must not expose or export the legacy evaluation level");
assert(!builderHtml.includes('id="exerciseInstruction"') && !builderHtml.includes('id="completionMessage"'), "Phase 1 must omit opening-instruction and completion-message fields");
assert(!builderHtml.includes("Advanced tool permissions") && !builderHtml.includes('id="toolPermissionList"'), "Phase 1 must omit advanced tool permissions");
assert(!builderHtml.includes('id="finishRecordingButton"') && !builderCss.includes(".record-step-button"), "Phase 3 must not use a detached checkpoint overlay");
assert(playerHtml.includes('data-workspace-action="authoringFinishRecording"') && playerHtml.indexOf('data-workspace-action="authoringFinishRecording"') < playerHtml.indexOf('class="workspace-tool-group workspace-selection-group"'), "All Done must be the first control in the Phase 3 preselection toolbar");
assert(playerHtml.includes('body.authoring-recording-session .workspace-toolbar [data-workspace-action="authoringFinishRecording"] { grid-column: 5 / span 2; grid-row: 4; }'), "All Done must remain visible without overlapping the double-wide settings block");
assert(builderHtml.includes('id="curationTable"') && builderHtml.includes('aria-roledescription="carousel"'), "Review phase must include the recorded-step carousel");
assert(builderJs.includes("if (validateSetup(true)) setPhase(2)") && builderJs.includes("await setPhase(3)") && builderJs.includes("setPhase(4)"), "The builder must advance directly through setup, expression entry, solving, and review");
assert(builderJs.includes('<span>Pre-completion</span>') && builderJs.includes('<span>Instructions</span>') && builderJs.includes('<span>Post-completion</span>'), "Each candidate step must have pre-completion, instructions, and post-completion editing fields");
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
assert(/data-step-field="beforeKatex"[\s\S]*?data-step-field="instruction"[\s\S]*?data-step-field="afterKatex"/.test(builderJs), "Edit mode must order the three text fields as pre-completion, instructions, and post-completion");
assert(/data-step-view="beforeKatex"[\s\S]*?step-instruction-view[\s\S]*?data-step-view="afterKatex"/.test(builderJs), "View mode must order rendered pre-completion, instructions, and rendered post-completion");
assert(builderJs.includes("function renderMixedInstruction") && builderJs.includes('text.indexOf("\\\\(", cursor)') && builderJs.includes('text.indexOf("\\\\[", cursor)'), "Instructions must recognize inline and display KaTeX delimiters");
assert(builderJs.includes('displayMode: match.displayMode') && builderJs.includes('renderMixedInstruction(slide.querySelector(".step-instruction-view"), candidate.instruction)'), "Instruction math must render in the appropriate KaTeX mode while preserving surrounding text");
assert(builderCss.includes(".instruction-math-inline") && builderCss.includes(".instruction-math-display"), "Mixed instruction math must style inline and display forms separately");
assert(!builderJs.includes("actionSummary") && !builderJs.includes("step-range"), "Phase 4 must omit recorded-action details");
assert(!builderHtml.includes("initialKatexPreview") && !builderHtml.includes("initialKatexInput"), "Phase 4 must omit the separate starting-expression card");
assert(builderJs.includes("const generatedStepKatex = api.generateKatex(expression)") && builderJs.includes("beforeKatex: generatedStepKatex") && builderJs.includes("afterKatex: generatedStepKatex"), "Each recorded step's pre/post fields must default to the same expression");
assert(builderCss.includes("body.phase2-expression-building > main") && builderCss.includes("body.phase3-recording > main"), "Expression entry and solving must fill the viewport");
assert(builderJs.includes("acceptInitialExpressionAndSolve"), "Submitting the initial expression must advance directly to solving");
assert(builderJs.includes("tap each operation in the expression"), "Initial-expression guidance must describe integrated grouping");
assert(builderJs.includes("function recordAutomaticMajorStep(snapshot, api)") && builderJs.includes("actionStartIndex") && builderJs.includes("actionEndIndex: actions.length"), "Every completed expression-changing manipulation must be saved automatically with its action boundary");
assert(builderJs.includes('event.data.detail.preselectionActive') && builderJs.includes("recordAutomaticMajorStep(snapshot, api)"), "Returning to preselection must automatically capture the completed major step");
assert(playerJs.includes("setFinishRecordingControlVisible(visible = true)") && playerJs.includes('notifyAuthoringHost("finish-recording")'), "The embedded All Done control must finish Phase 3 without manually marking a step");
assert(!builderJs.includes("recordStepOrFinish") && !builderJs.includes("currentStepIsRecorded") && !builderJs.includes("recordCurrentStep"), "Phase 3 must not retain the manual Record Step workflow");
assert(builderJs.includes("reconcileRecordedSteps(snapshot)") && builderJs.includes("candidate.actionPrefix === getActionPrefix"), "Automatically saved steps discarded by an unrecorded undo must be removed from the saved path");
assert(builderJs.includes("const recordedCandidates = draft.recording.candidates || []") && !builderJs.includes("includedCandidates"), "Export must contain all remaining automatic steps after Phase 4 deletion");
assert(builderHtml.includes('id="completeExerciseButton"') && builderHtml.includes('>All Done</button>') && !builderHtml.includes("testAssistanceLevel") && !builderHtml.includes("testLevelButton") && !builderHtml.includes("downloadJsonButton"), "Phase 4 must replace separate test/export controls with one All Done button");
assert(builderHtml.includes('class="primary-button complete-exercise-button" hidden') && builderJs.includes('byId("completeExerciseButton").hidden = !isFinalSlide'), "Phase 4 All Done must appear only on the final carousel slide");
assert(builderHtml.includes('id="deleteStepButton"') && builderHtml.includes('>Delete Step</button>'), "Phase 4 must provide a Delete Step control");
assert(builderJs.includes('byId("deleteStepButton").hidden = index === 0 || isFinalSlide') && builderJs.includes('byId("deleteStepButton").addEventListener("click", deleteCurrentCurationStep)'), "Delete Step must appear and act only on intermediate slides");
const deleteCandidateMatch = builderJs.match(/function deleteCurationCandidateAt\(candidates, index\) \{([\s\S]*?)\n  \}\n\n  function deleteCurrentCurationStep/);
assert(deleteCandidateMatch, "Phase 4 candidate deletion must remain testable");
const deleteCandidateContext = {};
vm.createContext(deleteCandidateContext);
vm.runInContext(`function deleteCurationCandidateAt(candidates, index) {${deleteCandidateMatch[1]}\n}\nthis.deleteCurationCandidateAt = deleteCurationCandidateAt;`, deleteCandidateContext);
const deletionCandidates = [
  { isInitial: true },
  { actionStartIndex: 0, actionEndIndex: 2, beforeExpression: "initial" },
  { actionStartIndex: 2, actionEndIndex: 4, beforeExpression: "middle" },
  { actionStartIndex: 4, actionEndIndex: 6, beforeExpression: "later" }
];
assert(deleteCandidateContext.deleteCurationCandidateAt(deletionCandidates, 1) === true && deletionCandidates.length === 3, "Deleting an intermediate Phase 4 step must remove it immediately");
assert(deletionCandidates[1].actionStartIndex === 0 && deletionCandidates[1].beforeExpression === "initial", "The next retained step must absorb the deleted step's action range");
assert(deleteCandidateContext.deleteCurationCandidateAt(deletionCandidates, 0) === false && deleteCandidateContext.deleteCurationCandidateAt(deletionCandidates, deletionCandidates.length - 1) === false, "The first and last Phase 4 steps must not be deletable");
assert(builderJs.includes("function syncFinishRecordingControl(snapshot)") && builderJs.includes("snapshot.preselectionActive === true") && builderJs.includes("api.setFinishRecordingControlVisible(isAvailable)") && playerJs.includes('notifyAuthoringHost("interaction-state"'), "The Phase 3 All Done control must appear only while the workspace is in preselection");
assert(builderJs.includes("syncFinishRecordingControl(event.data.detail)"), "Phase 3 must read preselection state from the authoring message detail payload");
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
assert(playerJs.includes('class="builder-review-button" data-builder-review') && playerJs.includes("showBuilderOriginalReview") && playerJs.includes("hideBuilderOriginalReview"), "Expression Builder must provide click-to-open original-expression peek");
assert(/builderCommandPanel\.addEventListener\("click"[\s\S]{0,300}button\[data-builder-review\][\s\S]{0,300}showBuilderOriginalReview\(\)/.test(playerJs), "Peek must open with a click rather than a pointer hold");
assert(playerJs.includes('builderPeekDismissLayer.addEventListener("click"') && playerJs.includes("hideBuilderOriginalReview()"), "A click anywhere on the full-screen Peek dismissal layer must restore the builder");
assert(playerHtml.includes("body.builder-review-active .builder-peek-dismiss-layer") && playerHtml.includes('id="builderPeekDismissLayer"'), "Peek must place an invisible full-screen dismissal layer over the expression");
assert(playerJs.includes('const reviewDisabled = builder.tool === "authorInitial"') && playerJs.includes('${reviewDisabled ? " disabled" : ""}'), "Starting-expression authoring must disable the eye review button");
assert(playerJs.includes('title: "Problem statement"') && !playerJs.includes('title: "Original expression"'), "Student guidance must call the original expression the Problem statement");
assert(/if \(stepIndex < 0\)[\s\S]*?title: "Problem statement",[\s\S]*?expression: ""/.test(playerJs), "Problem Statement must show instructions without repeating the expression");
assert(playerJs.includes('title: "Step guidance"') && playerJs.includes('expression: ""'), "Step Guidance must omit the expression");
assert(playerJs.includes('function getMixedInstructionHtml(source)') && playerJs.includes('data-display-mode="${match.displayMode}"'), "Student instructions must recognize mixed plain text and KaTeX");
assert(playerJs.includes('node.dataset.displayMode === "true"') && playerHtml.includes(".press-hold-popover .instruction-math-display"), "Student instruction KaTeX must render in inline or display mode as authored");
assert(playerJs.includes('"<p>None given</p>"'), "Empty student Step Guidance must say None given");
assert(playerHtml.includes(".builder-keypad-panel .builder-review-button:disabled"), "The unavailable starting-expression eye button must be visibly grayed out");
assert(/builderReviewActive[\s\S]*?drawBasicSelectionHighlight/.test(playerJs), "Original-expression review must restore the selection highlight");
assert(playerHtml.includes('.builder-keypad-panel .builder-variable-button { grid-column: 2; grid-row: 1; }'), "The x button must occupy Peek's former top position in the six-column grid");
assert(playerHtml.includes('.builder-keypad-panel .builder-inv-button { grid-column: 3; grid-row: 1; }') && playerHtml.includes('.builder-keypad-panel .builder-exit-inv-button { grid-column: 3; grid-row: 2; }'), "Inverse and Exit Inverse must top the column beside the number pad");
assert(playerHtml.includes('.builder-keypad-panel .builder-sum-button { grid-column: 3; grid-row: 4; }') && playerHtml.includes('.builder-keypad-panel .builder-prod-button { grid-column: 3; grid-row: 3; }'), "Addition and multiplication must bottom the column beside the number pad");
assert(playerHtml.includes('button.builder-submit-button {\n            grid-column: 2;\n            grid-row: 2 / span 3;') && playerHtml.includes('button.builder-review-button {\n            grid-column: 1;\n            grid-row: 1;'), "Submit must occupy the three cells below x, with Peek at the top of the neighboring column");
assert(playerHtml.includes('.builder-keypad-panel .builder-zoom-in-button { grid-column: 1; grid-row: 2; }') && playerHtml.includes('.builder-keypad-panel .builder-reset-view-button { grid-column: 1; grid-row: 4; }'), "Builder zoom and reset controls must sit below Peek");
assert(playerHtml.includes('grid-template-rows: repeat(4, var(--main-key-size));'), "The Builder keypad must contain exactly four button rows without empty rows above");
assert(/\.bottom-controls-panel > \.builder-keypad-panel \{[\s\S]*?grid-template-columns: subgrid;[\s\S]*?grid-template-rows: subgrid;[\s\S]*?width: 100%;[\s\S]*?height: 100%;/.test(playerHtml), "The Builder keypad must inherit the entire resizable panel's six-by-four grid");
assert(!/builder-submit-button,\s*\.builder-keypad-panel \.builder-action-row button\.builder-review-button\s*\{\s*position: fixed;/.test(playerHtml), "Submit and Review must not remain detached fixed-position controls");
assert(playerHtml.includes('body.left-handed .builder-keypad-panel .builder-variable-button { grid-column: 5; grid-row: 1; }') && playerHtml.includes('body.left-handed .builder-keypad-panel .builder-submit-button { grid-column: 5; grid-row: 2 / span 3; }') && playerHtml.includes('body.left-handed .builder-keypad-panel .builder-review-button { grid-column: 6; grid-row: 1; }') && playerHtml.includes('body.left-handed .builder-keypad-panel .builder-zoom-in-button { grid-column: 6; grid-row: 2; }'), "Left-handed mode must mirror the compact keypad cluster");
assert(!playerJs.includes('data-builder-view-action="pan"') && !playerHtml.includes('builder-pan-button'), "Integrated Expression Builder must not show a separate Pan button");
assert(playerJs.includes('data-builder-view-action="zoomIn"') && playerJs.includes('data-builder-view-action="zoomOut"') && playerJs.includes('data-builder-view-action="resetZoom"'), "Integrated Expression Builder must retain zoom and reset controls");
assert(playerJs.includes('const panningView = !integratedBuilder && uiState.workspaceMode === "pan"'), "Integrated Expression Builder gestures must not depend on the main workspace Pan mode");
assert(playerJs.includes('workspacePointerStart.mode = "builderPan"') && playerJs.includes('["pan", "builderOperator", "builderPan"]'), "Dragging the integrated Expression Builder canvas must transition from operator targeting to panning");
assert(/pointerStart\.mode === "builderOperator" && movement > tapTolerance[\s\S]*?setWorkspacePan/.test(playerJs), "An Expression Builder drag ending before a move event must still pan instead of resolving an operation");
const whitespacePanHandler = playerJs.match(/svgContainer\.addEventListener\("pointerdown", e => \{([\s\S]*?)\n        \}\);\n\n        workspaceSvg\.addEventListener\("pointerdown"/);
assert(whitespacePanHandler && whitespacePanHandler[1].includes('isIntegratedExpressionBuilder(uiState.expressionBuilder)') && whitespacePanHandler[1].includes('mode: integratedBuilder ? "builderOperator" : "pan"'), "Expression Builder tap-or-pan gestures must begin on workspace whitespace");
assert(/\.builder-keypad-panel\s*\{[\s\S]*?pointer-events:\s*none;[\s\S]*?\}/.test(playerHtml), "The transparent Expression Builder keypad grid must not block workspace whitespace");
assert(/\.builder-keypad-panel button,[\s\S]*?\.builder-keypad-panel \.builder-action-row button\s*\{[\s\S]*?pointer-events:\s*auto;[\s\S]*?\}/.test(playerHtml), "Expression Builder buttons must remain interactive inside the click-through keypad grid");
assert(!/if \(isIntegratedExpressionBuilder\(\) && !builderReviewActive\)[\s\S]*?workspaceZoom = Math\.max/.test(playerJs), "Integrated Expression Builder must not automatically fit or zoom the expression");
assert(playerJs.includes('M9 5h10.5A1.5 1.5 0 0 1 21 6.5v11'), "Integrated Expression Builder Undo must use the backspace icon");
assert(playerJs.includes('builder-exit-arrow-line') && playerJs.includes('M14 18 27 29'), "Exit Inverse must use a down-right arrow from the denominator");
assert(playerJs.includes('getClosestIntegratedBuilderOperatorTarget') && playerJs.includes('groupIntegratedBuilderOperator(value)'), "Canvas operation taps must resolve the nearest unresolved operation");
const closestOperatorMatch = playerJs.match(/function getClosestIntegratedBuilderOperatorTarget\(x, y\) \{([\s\S]*?)\n        \}\n\n        function findNodePathByReference/);
assert(closestOperatorMatch, "Nearest unresolved operation targeting must remain testable");
const closestOperatorContext = {
  uiState: {
    expressionBuilder: {
      root: {
        isBuilderSequence: true,
        layout: {
          builderOperatorBoxes: [
            { x: 10, y: 10, width: 10, height: 10, groupable: true },
            { x: 100, y: 100, width: 10, height: 10, groupable: true }
          ]
        }
      }
    }
  },
  isIntegratedExpressionBuilder: () => true,
  visitIntegratedBuilderSequences: (root, path, visit) => visit(root, path)
};
vm.createContext(closestOperatorContext);
vm.runInContext(`function getClosestIntegratedBuilderOperatorTarget(x, y) {${closestOperatorMatch[1]}\n}\nthis.getClosestIntegratedBuilderOperatorTarget = getClosestIntegratedBuilderOperatorTarget;`, closestOperatorContext);
assert(closestOperatorContext.getClosestIntegratedBuilderOperatorTarget(-1000, -1000).index === 0, "A distant press must choose the nearest unresolved operation rather than no operation");
assert(closestOperatorContext.getClosestIntegratedBuilderOperatorTarget(1000, 1000).index === 1, "Nearest-operation targeting must work throughout the workspace");
assert(playerJs.includes('visitIntegratedBuilderSequences(builder.root'), "Operation taps must search every unresolved scope");
assert(playerJs.includes('flattenIntegratedBuilderOperation(type, left, right)'), "Consecutive sums and products must flatten as they are grouped");
assert(!playerJs.includes('sequence.args.length !== 1 || sequence.builderOperators.length'), "Exit Inverse must not require its contents to be grouped first");
assert(playerJs.includes('collapseCompletedIntegratedBuilderNode'), "Submit must validate unresolved sequences nested inside inverses");
assert(playerJs.includes('const autoMultiplyAfterNegativeOne') && playerJs.includes('String(last.value) === "-1"'), "A digit entered after -1 must insert an implicit product");
assert(playerJs.includes('String(value) === "x"') && playerJs.includes('sequence.builderOperators.push("prod")'), "Entering x after a completed value must insert an implicit product");
assert(playerJs.includes('String(value) === "-1"') && playerJs.includes('? "sum"'), "Entering -1 after a completed value must insert an implicit sum");
assert(/function enterIntegratedBuilderInverse[\s\S]*?needsImplicitProduct[\s\S]*?sequence\.builderOperators\.push\("prod"\)/.test(playerJs), "Entering an inverse after a completed value must insert an implicit product");
assert(playerJs.includes("maximumExplicitCommonCount") && playerJs.includes("Math.min(matchedCommonCount, maximumExplicitCommonCount)"), "Factoring must not synthesize a coefficient of 1 when a term is entirely factored");
assert(/activeTool === "commute"[\s\S]{0,350}uiState\.stage === "preview"[\s\S]{0,350}return "";/.test(playerJs), "Three-or-more-item commute must not show bottom instructions or buttons");
assert(playerJs.includes("function getClosestIndexWithinSelection(x, y)") && playerJs.includes("releasedIndex === pointerStart.commuteIndex"), "Commute choices must match the closest region at pointer down and pointer up");
assert(/if \(pointerStart\.mode === "commute"\)[\s\S]{0,500}releaseWorkspacePointer\(\);[\s\S]{0,100}return;[\s\S]{0,200}const movement =/.test(playerJs), "Commute choices must bypass the ordinary tap-movement threshold");
assert(playerJs.includes('unresolvedOperation = { type: null }') && playerJs.includes('unresolvedOperation.type !== type'), "Submit must accept only one uniform type of unresolved operation");
assert(playerJs.includes('return new ExprNode(node.builderOperators[0], completedArgs, null)'), "Submit must collapse uniformly unresolved sums or products");

const collapseMatch = playerJs.match(/function collapseCompletedIntegratedBuilderNode\(node, unresolvedOperation = \{ type: null \}\) \{([\s\S]*?)\n        \}\n\n        function getIntegratedBuilderCompletedRoot/);
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
  }
};
vm.createContext(collapseContext);
vm.runInContext(`function collapseCompletedIntegratedBuilderNode(node, unresolvedOperation = { type: null }) {${collapseMatch[1]}\n}\nthis.collapseCompletedIntegratedBuilderNode = collapseCompletedIntegratedBuilderNode;`, collapseContext);
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
assert(mixedOperations === null, "Submit must still reject mixed unresolved operations");
assert(!playerJs.includes('authoring-variable-select'), "Authoring must not use a variable dropdown");
assert(playerJs.includes('data-builder-action="value" data-value="x"'), "The shared builder must expose x");
assert(playerJs.includes('const disabled = !builderAllowsVariables(uiState.activeTool);') && playerJs.includes('${disabled ? " disabled" : ""}'), "The x button must remain visible and become disabled only when variables are unavailable");
assert(!/if \(disabled\) \{\s*builderVariableRail\.replaceChildren\(\);\s*return;\s*\}/.test(playerJs), "A disallowed x must be disabled rather than removed from the keypad");
assert(!playerJs.includes('data-value="y"'), "The shared builder must not expose additional variables");
assert(builderJs.includes('const VARIABLES = ["x"]'), "The Exercise Builder must expose only x");
assert(playerJs.includes('root.isBuilderSequence = true'), "Builder values must use the diagonal sequence workspace");
assert(!rendererJs.includes('strokeRect(box.x, box.y, box.width, box.height)'), "Builder operation symbols must not have visible boxes");
assert(rendererJs.includes('builderPotentialFill: "rgb(231, 218, 244)"') && !rendererJs.includes('builderPotentialStroke'), "Builder next-entry targets must use one flat light-purple fill without an outline color");
assert(!/builderPotentialBoxes[\s\S]{0,250}strokeRect\(potential\./.test(rendererJs), "Builder next-entry targets must not draw outlines");
assert(!rendererJs.includes('setLineDash(child.isBuilderActive ? [4, 4] : [])'), "The actively edited Builder entry must retain a solid outline");
assert(playerJs.includes('sequence.isBuilderCurrentSequence = pathsEqual(path, builder.currentPath || [])'), "Only the currently editable Builder sequence may show potential landing boxes");
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
  [new renderer.ExprNode("prod", [value("x"), value("x")]), "x^{2}"],
  [new renderer.ExprNode("prod", [value("2"), value("x"), value("x"), value("x")]), "2x^{3}"],
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
const activeNumber = value("23");
activeNumber.isBuilderActive = true;
const activeNumberSequence = new renderer.ExprNode("sum", [activeNumber]);
activeNumberSequence.isBuilderSequence = true;
activeNumberSequence.builderOperators = [];
renderer.layoutExpressionWithSettings(activeNumberSequence, fakeContext, renderer.SETTINGS, 20, 20);
const digitTarget = activeNumberSequence.layout.builderPotentialBoxes.find(box => box.kind === "digit");
const operationTarget = activeNumberSequence.layout.builderPotentialBoxes.find(box => box.kind === "operation");
const activeNumberOutline = activeNumberSequence.layout.builderItemOutlineBoxes[0];
assert(digitTarget && operationTarget, "An active number must show potential landing boxes for another digit and the next diagonal operation");
assert(digitTarget.x > activeNumber.right() && digitTarget.x + digitTarget.width < activeNumberOutline.x + activeNumberOutline.width, "The active number's solid outline must expand around its next-digit target");
assert(nearlyEqual(operationTarget.x, activeNumberOutline.x + activeNumberOutline.width) && nearlyEqual(operationTarget.y, activeNumberOutline.y + activeNumberOutline.height), "The potential operation box must touch the enlarged active entry's lower-right corner");
const activeVariable = value("x");
activeVariable.isBuilderActive = true;
const activeVariableSequence = new renderer.ExprNode("sum", [activeVariable]);
activeVariableSequence.isBuilderSequence = true;
activeVariableSequence.builderOperators = [];
renderer.layoutExpressionWithSettings(activeVariableSequence, fakeContext, renderer.SETTINGS, 20, 20);
assert(activeVariableSequence.layout.builderPotentialBoxes.some(box => box.kind === "operation") && !activeVariableSequence.layout.builderPotentialBoxes.some(box => box.kind === "digit"), "A nonnumeric active entry must show only its valid next diagonal landing box");
activeVariableSequence.isBuilderCurrentSequence = false;
renderer.layoutExpressionWithSettings(activeVariableSequence, fakeContext, renderer.SETTINGS, 20, 20);
assert(activeVariableSequence.layout.builderPotentialBoxes.length === 0, "Closed or inactive nested Builder sequences must not show next-entry targets");
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
assert(dangling.layout.builderPlaceholderBox && dangling.layout.builderPotentialBoxes.some(box => box.kind === "value"), "A dangling operation must show a purple landing box for its next value");
assert(dangling.layout.builderOperatorBoxes[0].groupable === false, "A dangling operation must not group before its next value exists");
const danglingOperator = dangling.layout.builderOperatorBoxes[0];
assert(nearlyEqual(danglingOperator.x + danglingOperator.width, dangling.layout.builderPlaceholderBox.x) && nearlyEqual(danglingOperator.y + danglingOperator.height, dangling.layout.builderPlaceholderBox.y), "A dangling operation must touch the purple next-entry box corner");

for (const file of fs.readdirSync(path.join(root, "levels")).filter(name => name.endsWith(".json"))) {
  const level = JSON.parse(read(path.join("levels", file)));
  assert(level.id && level.title && level.startExpression, `${file} is missing required metadata`);
  assert(Array.isArray(level.steps) && level.steps.length > 0, `${file} has no steps`);
}

console.log("Exercise Builder static integration checks passed.");
