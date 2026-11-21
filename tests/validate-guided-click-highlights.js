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
let advances = 0;
const painted = [], points = [];
const scope = {
  window: {}, demoSelectionClickIndex: 0, compilingMoves: false, restoringGuidedUndo: false,
  buildingStartingExpression: false, demoStepIndex: 0,
  clonePlainData: v => JSON.parse(JSON.stringify(v)),
  getCurrentDemoStep: () => scope.step,
  uiState: { stage: 'idle', previewTimerId: null, postviewTimerId: null },
  selection: { node: null, clicks: [] }, isDemoModeActive: () => true,
  rememberGuidedUndoPoint: point => points.push(point),
  updateWorkspaceToolbar() {}, clearInteraction() {}, refreshStatus() {}, drawExpression() {}, renderToolArea() {},
  advanceDemoStep() { advances++; scope.demoSelectionClickIndex = 0; scope.step = { type: 'tool' }; },
  document: { createElementNS() { return { attributes: {}, setAttribute(k, v) { this.attributes[k] = v; } }; } },
  workspaceSvg: { appendChild(rect) { painted.push(rect.attributes); } }
};
vm.createContext(scope);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'exploded-algebra-renderer.js'), 'utf8'), scope);
for (const name of [
  'findMatchingCloseParen', 'isWrappedBySingleOuterPair', 'splitTopLevelByOperator', 'findTopLevelOperatorIndex',
  'parseParenthesizedExpressionStrict', 'makeInverseNode', 'cloneNode', 'sameExpression', 'normalizeCloneForMatching',
  'sameExpressionForMatching', 'normalizeExpressionTree', 'isValueNode', 'isInvNode',
  'getSelectionBufferWidth', 'getSelectionMargin', 'findPathToNode', 'makeSumFromTerms', 'makeProductFromFactors',
  'getDemoTargetNode', 'makeCandidateNodeForDemoRange', 'selectionRangeMatchesDemoTarget', 'getDemoSelectionArea',
  'findDemoSelectionTargetByPath', 'findDemoSelectionTarget', 'currentSelectionMatchesDemoStep',
  'getCoveragePathsForSelectionTarget', 'getCommonPath', 'selectionTargetContainingPaths', 'applySelectionTarget',
  'getSelectionTargetExpandedWith', 'isCoveragePathInsideSelectionTarget', 'isSelectionTargetInside',
  'isDemoSelectionTargetAllowed', 'growSelectionToInclude', 'captureGuidedUndoPoint',
  'getSelectionRectangleForNodeRange', 'drawYellowDemoSelectionOutline', 'drawDemoSelectionPrompt', 'selectWorkspaceTarget'
]) vm.runInContext(extract(name), scope);
function setup() {
  scope.expressionRoot = scope.normalizeExpressionTree(scope.parseParenthesizedExpressionStrict('((x+y+z)*w)'));
  scope.selection = { node: null, clicks: [] };
  scope.demoSelectionClickIndex = 0;
  scope.step = { type: 'select', expression: '(x+y+z)', path: [0], firstPart: 0, lastPart: 2,
    clicks: [{ path: [0, 2], firstPart: 0, lastPart: 0 }, { path: [0, 0], firstPart: 0, lastPart: 0 }] };
  const measure = { measureText: t => ({ width: t.length * 10, actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 3 }) };
  scope.measure = measure;
  vm.runInContext('layoutExpressionWithSettings(expressionRoot, measure, SETTINGS, 20, 20)', scope);
  return scope.expressionRoot.args[0];
}
const leaf = n => ({ node: n, firstPart: 0, lastPart: 0 });
let region = setup();
scope.drawDemoSelectionPrompt();
const outline = painted.at(-1);
assert.equal(outline.fill, 'none');
assert.equal(outline.stroke, '#e6b800');
assert.equal(outline['pointer-events'], 'none');
assert.equal(outline['data-guided-selection-outline'], 'true');
assert(+outline.height > region.bottom() - region.top(), 'Outline covers the full target');
assert.equal(scope.selectWorkspaceTarget(leaf(scope.expressionRoot.args[1])), false, 'Outside taps are ignored');
assert.equal(scope.selectWorkspaceTarget(leaf(region.args[0])), true, 'First tap can differ from the recording');
assert.equal(advances, 0, 'A partial selection does not advance');
scope.drawDemoSelectionPrompt();
assert.deepEqual(painted.at(-1), outline, 'The full outline remains during partial selection');
assert.equal(scope.selectWorkspaceTarget(leaf(region.args[1])), true, 'Extra interior taps are accepted');
assert.equal(advances, 0);
assert.equal(scope.selectWorkspaceTarget({ node: scope.expressionRoot, firstPart: 0, lastPart: 1 }), false,
  'An operation spanning outside the target is ignored');
assert.equal(scope.selectWorkspaceTarget(leaf(region.args[2])), true);
assert.equal(advances, 1);
assert.deepEqual(JSON.parse(JSON.stringify(points.at(-1).selectionClicks)).map(c => c.path), [[0, 0], [0, 1]],
  'Undo stores the learner route, including extra taps');
region = setup();
assert.equal(scope.selectWorkspaceTarget({ node: region, firstPart: 1, lastPart: 2 }), true,
  'A different operation within the target is accepted');
assert.equal(scope.selectWorkspaceTarget(leaf(region.args[0])), true);
assert.equal(advances, 2);
region = setup();
assert.equal(scope.selectWorkspaceTarget(leaf(region.args[2])), true);
assert.equal(scope.selectWorkspaceTarget(leaf(region.args[0])), true);
assert.equal(advances, 3, 'Original recordings still work');
console.log('Guided selection outlines accept alternate tap orders and operation taps, reject outside ranges, and retain learner taps for Undo.');
