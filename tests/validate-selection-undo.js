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
const scope = {
    window: {}, compilingMoves: false, restoringGuidedUndo: false,
    expressionUndoHistory: [], completedSteps: [], completionExportReadyForRun: false,
    completionExportCompletedAtDate: null, solutionRecorder: { actions: [], demoSteps: [] },
    selection: { status: 'no', node: null, firstPart: -1, lastPart: -1, clicks: [] },
    uiState: { mode: 'edit', stage: 'idle', selectionRecorded: false },
    clonePlainData: value => JSON.parse(JSON.stringify(value)),
    isDemoModeActive: () => false, isDemoUndoAllowed: () => true,
    isDemoSelectionTargetAllowed: () => true, getCurrentDemoStep: () => null,
    captureGuidedUndoPoint: () => null, rememberGuidedUndoPoint() {},
    document: { body: { classList: { remove() {} } } }, inspectExitButton: null,
    clearInteraction() { scope.uiState.stage = 'idle'; scope.uiState.activeTool = null; },
    updateWorkspaceToolbar() {}, layoutExpression() {}, renderLevelInfo() {},
    renderCurrentExpressionDisplay() {}, refreshStatus() {}, drawExpression() {}, renderToolArea() {},
    currentLevelIndex: 0, demoStepIndex: 0, demoSelectionClickIndex: 0,
    recordSolutionAction() { throw new Error('Undo must not record an action'); }
};
vm.createContext(scope);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'exploded-algebra-renderer.js'), 'utf8'), scope);
for (const name of ['cloneNode', 'cloneExpressionTree', 'captureExpressionUndoState', 'captureSelectionUndoState',
    'rememberSelectionChangeForUndo', 'clearSelection', 'findPathToNode', 'getCoveragePathsForSelectionTarget',
    'getCommonPath', 'selectionTargetContainingPaths', 'applySelectionTarget', 'getSelectionTargetExpandedWith',
    'growSelectionToInclude', 'selectWorkspaceTarget', 'undoExpressionStep', 'cancelCurrentWorkspaceSelection']) {
    vm.runInContext(extract(name), scope);
}
const make = text => vm.runInContext(`new ExprNode('value', [], '${text}')`, scope);
const values = ['a', 'b', 'c', 'd'].map(make);
scope.expressionRoot = vm.runInContext("new ExprNode('sum')", scope);
scope.expressionRoot.args = values;
scope.currentExpressionRoot = scope.expressionRoot;
scope.stableExpressionState = scope.captureExpressionUndoState();
const target = index => ({ node: scope.expressionRoot.args[index], firstPart: 0, lastPart: 0 });
assert.equal(scope.selectWorkspaceTarget(null), false);
assert.equal(scope.expressionUndoHistory.length, 0);
for (const index of [0, 1, 3]) assert.equal(scope.selectWorkspaceTarget(target(index)), true);
assert.equal(scope.selection.lastPart, 3);
assert.equal(scope.selection.clicks.length, 3);
assert.equal(scope.expressionUndoHistory.length, 3);
// A transformation belongs after its selection events. Undo restores the selected
// expression, and the next Undo removes only the final selection click.
scope.expressionUndoHistory.push(scope.stableExpressionState);
scope.expressionRoot = make('99');
scope.clearSelection();
scope.solutionRecorder.actions.push({ type: 'select' }, { type: 'tool' });
assert.equal(scope.undoExpressionStep(), true);
assert.equal(scope.selection.node, scope.expressionRoot);
assert.equal(scope.selection.lastPart, 3);
assert.equal(scope.solutionRecorder.actions.length, 0);
for (const expected of [1, 0, -1]) {
    assert.equal(scope.undoExpressionStep(), true);
    if (expected < 0) {
        assert.equal(scope.selection.node, null);
        assert.equal(scope.selection.status, 'no');
        assert.equal(scope.selection.clicks.length, 0);
    } else {
        assert.equal(scope.selection.node, expected === 0 ? scope.expressionRoot.args[0] : scope.expressionRoot);
        assert.equal(scope.selection.lastPart, expected);
        assert.equal(scope.selection.clicks.length, expected + 1);
    }
}
assert.equal(scope.undoExpressionStep(), false);
assert.equal(scope.expressionRoot.args.map(n => n.value).join(''), 'abcd');
assert.equal(scope.selectWorkspaceTarget(target(2)), true);
assert.equal(scope.cancelCurrentWorkspaceSelection(), true);
assert.equal(scope.selection.node, null);
assert.equal(scope.undoExpressionStep(), true);
assert.equal(scope.selection.node, scope.expressionRoot.args[2], 'Undo can restore a cleared selection');
assert.equal(scope.undoExpressionStep(), true);
assert.equal(scope.selection.node, null, 'Undo of a single click deselects');
assert.equal(scope.solutionRecorder.actions.length, 0);
assert.equal(scope.solutionRecorder.demoSteps.length, 0);
console.log('Selection Undo restores each click, cleared selections, and selection paths across expression changes without recording Undo.');
