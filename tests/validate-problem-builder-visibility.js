const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const builder = fs.readFileSync(path.join(root, "problem-builder.js"), "utf8");
const player = fs.readFileSync(path.join(root, "exploded-algebra-tool.js"), "utf8");
const html = fs.readFileSync(path.join(root, "problem-builder.html"), "utf8");
function extract(source, name, indent) {
  const match = source.match(new RegExp(`${indent}(?:async )?function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?\\n${indent}\\}`));
  assert(match, `Missing ${name}`);
  return match[0];
}

async function checkBuilder(showSteps) {
  const actions = [{ type: "tool", tool: "numericalRewrite" }];
  const demoSteps = [{ type: "select", expression: "((2)+(3))" }, { type: "tool", tool: "numericalRewrite" }];
  const snapshot = { currentExpression: "(5)", recorder: { actions, demoSteps } };
  const phaseChanges = [];
  const scope = {
    CONFIGURABLE_NUMERICAL_REWRITE_RULES: [], FORMAT_VERSION: 1,
    document: { querySelector: selector => ({ value: selector.includes("showConventionalSteps") && !showSteps ? "no" : "yes" }) },
    byId: id => ({ value: id === "problemTitle" ? "Add" : "add" }),
    readNumericalPermissionChoices: () => ({}),
    setPhase: async phase => phaseChanges.push(phase),
    currentCurationIndex: 99, currentCurationMode: "edit", curationStage: "edit",
    curationSelectionIndex: 99, curationSelectionSource: [], curationKeepDecisions: [],
    window: { alert: message => { throw new Error(message); } }
  };
  vm.createContext(scope);
  const names = ["makeFreshDraft", "collectSetup", "getLevelBase", "inferVariables", "sameExpressionText", "getRecordedActions", "getActionPrefix", "reconcileRecordedSteps", "recordAutomaticMajorStep", "makeInitialCurationCandidate", "finishRecording", "buildExportLevel"];
  vm.runInContext(`${names.map(name => extract(builder, name, "  ")).join("\n")}\nvar draft = makeFreshDraft();`, scope);
  assert.equal(vm.runInContext("draft.settings.showConventionalSteps", scope), true);
  vm.runInContext('collectSetup(); draft.initial.expression = "((2)+(3))"; draft.initial.katex = "2 + 3";', scope);
  scope.snapshot = snapshot;
  scope.api = { generateKatex: expression => expression === "(5)" ? "5" : "2 + 3" };
  await vm.runInContext("finishRecording(snapshot, api)", scope);
  assert.deepEqual(phaseChanges, [showSteps ? 4 : 5]);
  const exported = JSON.parse(vm.runInContext("JSON.stringify(buildExportLevel())", scope));
  assert.equal(exported.showConventionalSteps, showSteps);
  assert.deepEqual(exported.recordedActions, actions);
  assert.deepEqual(exported.demo.steps, demoSteps);
  assert.equal(exported.finalExpression, "(5)");
  assert.deepEqual(exported.steps.map(step => step.expression), ["((2)+(3))", "(5)"]);
  if (!showSteps) assert.equal(scope.curationSelectionSource.length, 0, "Hidden steps must bypass all curation setup");
}

function checkPlayer() {
  const classes = new Set();
  const scope = {
    authoringSessionActive: false, leftPanel: { hidden: false },
    document: { body: { classList: { toggle(name, on) { if (on) classes.add(name); else classes.delete(name); } } } }
  };
  vm.createContext(scope);
  vm.runInContext(extract(player, "syncConventionalStepsVisibility", "        "), scope);
  for (const [level, expected] of [[{}, false], [{ showConventionalSteps: true }, false], [{ showConventionalSteps: false }, true], [null, false]]) {
    scope.level = level;
    assert.equal(vm.runInContext("syncConventionalStepsVisibility(level)", scope), expected);
    assert.equal(scope.leftPanel.hidden, expected);
    assert.equal(classes.has("conventional-steps-hidden"), expected);
  }
  scope.authoringSessionActive = true;
  scope.level = { showConventionalSteps: false };
  assert.equal(vm.runInContext("syncConventionalStepsVisibility(level)", scope), false, "Authoring retains the conventional preview");

  scope.clonePlainData = value => JSON.parse(JSON.stringify(value));
  scope.ExplodedAlgebraRenderer = { expressionToKatex: () => "0" };
  scope.textToExpression = value => value;
  vm.runInContext(extract(player, "makeAuthoringLevel", "        "), scope);
  assert.equal(vm.runInContext("makeAuthoringLevel({}, '(0)').showConventionalSteps", scope), true);
  assert.equal(vm.runInContext("makeAuthoringLevel({showConventionalSteps: false}, '(0)').showConventionalSteps", scope), false);

  scope.authoringSessionActive = false;
  scope.level = { showConventionalSteps: false, steps: [{ expression: "((2)+(3))" }, { expression: "(5)" }] };
  scope.LEVELS = [scope.level];
  scope.completedSteps = [true, false];
  scope.expressionMatchesParenthesizedText = expression => expression === "(5)";
  scope.maybePrepareCompletedLevelExport = () => {};
  scope.levelContent = { replaceChildren() {} };
  scope.renderMoveHistoryControls = () => {};
  scope.getCurrentLevel = () => scope.level;
  scope.isInteractiveLevel = () => true;
  scope.uiState = { mode: "edit", stage: "idle", expressionBuilder: null };
  for (const name of ["updateStepCompletion", "renderLevelInfo", "isExerciseFinished"]) {
    vm.runInContext(extract(player, name, "        "), scope);
  }
  vm.runInContext("renderLevelInfo(0)", scope);
  assert.equal(scope.completedSteps[1], true, "Hidden panels must still track the final solution step");
  assert.equal(vm.runInContext("isExerciseFinished()", scope), true, "Hidden-step problems must expose completion controls");

  scope.isValidTextBlocks = () => true;
  vm.runInContext(extract(player, "validateChosenLevel", "        "), scope);
  scope.level = { id: "add", title: "Add", startExpression: "(2)", steps: [{ expression: "(2)" }], showConventionalSteps: "no" };
  assert.throws(() => vm.runInContext("validateChosenLevel(level, 'test')", scope), /invalid showConventionalSteps/);
}

(async () => {
  assert(html.includes('name="showConventionalSteps" value="yes" checked'));
  await checkBuilder(true);
  await checkBuilder(false);
  checkPlayer();
  console.log("Problem Builder visibility, shortened workflow, and export checks passed.");
})().catch(error => { console.error(error); process.exitCode = 1; });
