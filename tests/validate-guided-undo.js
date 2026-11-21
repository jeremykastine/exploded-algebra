const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'exploded-algebra-tool.js'), 'utf8');
function extract(name) {
  const m = source.match(new RegExp(`        function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?\\n        \\}`));
  assert(m, `Missing ${name}`);
  return m[0];
}
let controls = 0;
const scope = {
  isDemoModeActive: () => true, restoringGuidedUndo: false,
  buildingStartingExpression: true, demoStepIndex: 2, demoSelectionClickIndex: 0,
  selection: { clicks: [] }, clonePlainData: v => JSON.parse(JSON.stringify(v)),
  guidedUndoHistory: [], updateWorkspaceToolbar() { controls++; }
};
vm.createContext(scope);
for (const name of ['captureGuidedUndoPoint', 'rememberGuidedUndoPoint', 'guidedProgressMatches', 'undoGuidedAction']) {
  vm.runInContext(extract(name), scope);
}
const first = scope.captureGuidedUndoPoint();
scope.rememberGuidedUndoPoint(first);
scope.buildingStartingExpression = false; scope.demoStepIndex = 3; scope.demoSelectionClickIndex = 1;
const second = scope.captureGuidedUndoPoint();
scope.rememberGuidedUndoPoint(second);
assert.equal(scope.guidedUndoHistory.length, 2);
assert.equal(first.building, true, 'Points retain their original phase');
assert.equal(scope.guidedProgressMatches(first), false);
assert.equal(scope.guidedProgressMatches(second), true);
scope.demoSelectionClickIndex = 0;
assert.equal(scope.guidedProgressMatches(second), false, 'Two-click selections have distinct navigation positions');
scope.restoringGuidedUndo = true;
assert.equal(scope.captureGuidedUndoPoint(), null);
scope.rememberGuidedUndoPoint(second);
assert.equal(scope.guidedUndoHistory.length, 2, 'Reconstruction must not add navigation or recorded Undo events');
scope.restoringGuidedUndo = false;
scope.isDemoModeActive = () => false;
assert.equal(scope.captureGuidedUndoPoint(), null, 'Free Play keeps its independent Undo history');
scope.isDemoModeActive = () => true;
// A restore must replay only the prefix, retain the view, and keep the original recording untouched.
scope.compilingMoves = false;
scope.workspaceZoom = 1.5; scope.workspacePanX = 70; scope.workspacePanY = 40; scope.workspaceViewManuallyPanned = true;
scope.currentLevelIndex = 0; scope.buildFirstEnabled = true;
scope.originalRecording = 'unchanged';
scope.loadLevel = () => {
  assert(scope.restoringGuidedUndo && scope.compilingMoves);
  scope.buildingStartingExpression = false; scope.demoStepIndex = 3; scope.demoSelectionClickIndex = 0;
  scope.workspaceZoom = 1; scope.workspacePanX = 0; scope.workspacePanY = 0;
};
let actions = 0;
scope.replayGuidedActionForUndo = () => { actions++; scope.demoSelectionClickIndex++; return true; };
for (const name of ['refreshDemoBodyClass', 'renderLevelInfo', 'renderToolArea', 'refreshStatus', 'drawExpression']) scope[name] = () => {};
assert.equal(scope.undoGuidedAction(), true);
assert.equal(actions, 1, 'Only the outstanding recorded prefix is reconstructed');
assert.equal(scope.guidedUndoHistory.length, 1);
assert.equal(scope.compilingMoves, false);
assert.equal(scope.restoringGuidedUndo, false);
assert.deepEqual([scope.workspaceZoom, scope.workspacePanX, scope.workspacePanY, scope.workspaceViewManuallyPanned], [1.5, 70, 40, true]);
assert.equal(scope.originalRecording, 'unchanged');
assert(controls >= 3);
console.log('Guided Undo tracks build/selection progress, suppresses reconstruction history, preserves view and original recording.');

// Reconstruct a partial selection using the learner's alternative first tap.
const leaf = { value: 'learner target' };
const recordedLeaf = { value: 'recorded target' };
const replay = vm.createContext({
  getCurrentDemoStep: () => ({ type: 'select' }),
  buildingStartingExpression: false, demoStepIndex: 4, demoSelectionClickIndex: 0,
  expressionRoot: {}, nodeAtPath: (_root, path) => path[0] === 1 ? leaf : recordedLeaf,
  getDemoSelectionClickTargets: () => [{ node: recordedLeaf }],
  selectWorkspaceTarget: target => { replay.chosen = target; return true; }
});
vm.runInContext(extract('replayGuidedActionForUndo'), replay);
assert(replay.replayGuidedActionForUndo({ building: false, step: 4,
  selectionClicks: [{ path: [1], firstPart: 0, lastPart: 0 }] }));
assert.equal(replay.chosen.node, leaf);
assert(replay.replayGuidedActionForUndo({ building: false, step: 5, selectionClicks: [] }));
assert.equal(replay.chosen.node, recordedLeaf, 'Earlier completed selections can use the original route');
