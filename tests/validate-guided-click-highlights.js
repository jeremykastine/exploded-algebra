const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const moves = require('../moves-codec.js');
const source = fs.readFileSync(path.join(__dirname, '..', 'exploded-algebra-tool.js'), 'utf8');
function extract(name) {
  const match = source.match(new RegExp(`        function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?\\n        \\}`));
  assert(match, `Missing ${name}`);
  return match[0];
}
const node = (type, args, x, y, width = 20, height = 20) => ({
  type, args, layout: {}, left: () => x, top: () => y, right: () => x + width, bottom: () => y + height
});
const values = [node('value', [], 20, 20), node('value', [], 20, 60), node('value', [], 20, 100)];
const root = node('sum', values, 20, 20, 20, 100);
let advances = 0;
const painted = [];
let step = { type: 'select', path: [], firstPart: 0, lastPart: 2, clicks: [
  { path: [2], firstPart: 0, lastPart: 0 }, { path: [0], firstPart: 0, lastPart: 0 }
] };
const scope = {
  expressionRoot: root, demoSelectionClickIndex: 0, ExplodedAlgebraMoves: moves,
  getCurrentDemoStep: () => step,
  findDemoSelectionTarget: () => ({ node: root, firstPart: 0, lastPart: 2 }),
  uiState: { stage: 'idle', previewTimerId: null, postviewTimerId: null },
  isDemoModeActive: () => true,
  captureGuidedUndoPoint: () => null, rememberGuidedUndoPoint() {},
  growSelectionToInclude: () => true,
  updateWorkspaceToolbar() {}, clearInteraction() {}, refreshStatus() {}, drawExpression() {}, renderToolArea() {},
  currentSelectionMatchesDemoStep: () => true,
  advanceDemoStep() { advances++; scope.demoSelectionClickIndex = 0; step = { type: 'tool' }; },
  document: { createElementNS() { return { attributes: {}, setAttribute(k, v) { this.attributes[k] = v; } }; } },
  workspaceSvg: { appendChild(rect) {
    assert.equal(rect.attributes['pointer-events'], 'none');
    assert.equal(rect.attributes['data-guided-click-highlight'], 'true');
    painted.push(['x', 'y', 'width', 'height'].map(k => +rect.attributes[k]));
  } },
  getInverseHeaderBottom: n => n.top() + 12,
  SETTINGS: { operatorThickness: 14 }, nodeHasSeparators: () => false,
  relHLine: () => 50, relVLine: () => 50
};
vm.createContext(scope);
for (const name of ['findPathToNode', 'getDemoSelectionClickTargets', 'sameSelectionClickTarget',
  'getDemoClickHighlightRectangle', 'drawYellowDemoClickHighlight', 'drawDemoSelectionPrompt', 'selectWorkspaceTarget']) {
  vm.runInContext(extract(name), scope);
}
const target = index => ({ node: values[index], firstPart: 0, lastPart: 0 });
scope.drawDemoSelectionPrompt();
assert.equal(painted.at(-1)[1], 97, 'First highlight must be the recorded last value');
assert.equal(scope.selectWorkspaceTarget(target(0)), false, 'Out-of-order clicks must be ignored');
assert.equal(scope.demoSelectionClickIndex, 0);
assert.equal(scope.selectWorkspaceTarget(target(2)), true);
assert.equal(scope.demoSelectionClickIndex, 1);
assert.equal(advances, 0, 'Matching a region cannot skip an outstanding recorded click');
scope.drawDemoSelectionPrompt();
assert.equal(painted.at(-1)[1], 17, 'Next highlight must move to the recorded first value');
assert.equal(scope.selectWorkspaceTarget(target(1)), false);
assert.equal(scope.selectWorkspaceTarget(target(0)), true);
assert.equal(advances, 1);
assert.equal(scope.demoSelectionClickIndex, 0);
const inverse = node('inv', [values[0]], 10, 10, 60, 100);
const header = scope.getDemoClickHighlightRectangle({ node: inverse, firstPart: 0, lastPart: 0 });
assert.equal(header.height, 18, 'Inverse prompts cover only the numerator/header');
assert(header.height < inverse.bottom() - inverse.top());
const separator = scope.getDemoClickHighlightRectangle({ node: root, firstPart: 0, lastPart: 1 });
assert.equal(separator.height, 20, 'Operation-symbol prompts must not shade both selected values');
assert.equal(separator.width, 20);
console.log('Guided clicks highlight exact targets in order, reject wrong clicks, and isolate inverse headers and operation symbols.');
