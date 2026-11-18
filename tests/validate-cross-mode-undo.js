const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'exploded-algebra-tool.js'), 'utf8');
function extract(name) {
  const match = source.match(new RegExp(`        function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?\\n        \\}`));
  assert(match, `Missing ${name}`);
  return match[0];
}
class ExprNode {
  constructor(type, args = [], value = null) { this.type = type; this.args = args; this.value = value; }
}
const value = n => new ExprNode('value', [], String(n));
const original = value(0);
const builder = {
  tool: 'studentInitial', flowVersion: 5, root: value(6), currentPath: [],
  mainRoot: original, originalRoot: original, originalSelectedNode: original,
  lastOperation: null, moveCycle: null,
  initialActions: [{ type: 'builder', action: 'digit', value: '6' }],
  history: [{ root: value(''), currentPath: [], lastOperation: null, moveCycle: null,
    recorderActionCount: 0, recorderDemoStepCount: 0 }]
};
let renders = 0;
const scope = {
  demoStepIndex: 0,
  ExprNode, expressionRoot: builder.root, currentExpressionRoot: builder.root,
  completedSteps: [], completionExportReadyForRun: false, completionExportCompletedAtDate: null,
  solutionRecorder: { actions: [], demoSteps: [] },
  LEVELS: [{ id: 'free', title: 'Free Play', creative: true, startExpression: '(0)', steps: [] }], currentLevelIndex: 0,
  getCurrentLevel: () => scope.LEVELS[scope.currentLevelIndex],
  isIntegratedExpressionBuilder: b => b?.flowVersion >= 3,
  clonePlainData: data => JSON.parse(JSON.stringify(data)),
  uiState: { stage: 'builder', expressionBuilder: builder },
  isDemoUndoAllowed: () => true, isDemoModeActive: () => false, inspectExitButton: null,
  document: { body: { classList: { remove() {} } } },
  clearSelection() {},
  clearInteraction() { scope.uiState.stage = 'idle'; scope.uiState.expressionBuilder = null; },
  isInteractiveLevel: () => true,
  refreshDemoBodyClass() {}, refreshExpressionBuilderPreview() { renders++; }, updateExerciseMenu() {}, updateWorkspaceToolbar() {},
  recordSolutionAction() { throw new Error('Undo must not record an action'); }
};
vm.createContext(scope);
for (const name of ['cloneNode', 'cloneExpressionTree', 'cloneBuilderNodeForHistory', 'cloneBuilderMoveCycle',
  'getBuilderUndoSnapshot', 'captureExpressionUndoState', 'captureInitialBuilderUndoState',
  'resetSolutionRecorderForCurrentLevel', 'undoExpressionStep']) {
  vm.runInContext(extract(name), scope);
}
const saved = scope.captureInitialBuilderUndoState(builder);
// Entry history must be independent of subsequent edits and the submitted level.
builder.root.value = '9';
builder.initialActions[0].value = '9';
builder.history[0].root.value = '9';
scope.LEVELS[0].startExpression = '(9)';
assert.equal(saved.initialBuilder.root.value, '6');
assert.equal(saved.initialBuilder.initialActions[0].value, '6');
assert.equal(saved.initialBuilder.history[0].root.value, '');
assert.equal(saved.level.startExpression, '(0)');
scope.expressionUndoHistory = [saved];
scope.solutionRecorder.actions.push({ type: 'tool', tool: 'numericalRewrite' });
scope.solutionRecorder.demoSteps.push({ type: 'tool', tool: 'numericalRewrite' });
scope.uiState.stage = 'idle';
assert.equal(scope.undoExpressionStep(), true);
assert.equal(scope.uiState.stage, 'builder');
assert.equal(scope.uiState.activeTool, 'studentInitial');
assert.equal(scope.buildingStartingExpression, true);
assert.equal(scope.expressionRoot.value, '6');
assert.equal(scope.currentExpressionRoot, scope.expressionRoot);
assert.equal(scope.uiState.expressionBuilder.history.length, 1);
assert.equal(scope.uiState.expressionBuilder.initialActions.length, 1);
assert.equal(scope.LEVELS[0].startExpression, '(0)');
assert.equal(scope.solutionRecorder.actions.length, 0);
assert.equal(scope.solutionRecorder.demoSteps.length, 0);
assert.equal(scope.stableExpressionState, null);
assert.equal(scope.expressionUndoHistory.length, 0);
assert.equal(renders, 1);
console.log('Cross-mode Undo restores independent builder history and clears discarded recording actions.');
