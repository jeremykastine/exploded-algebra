const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '..', 'exploded-algebra-tool.js'), 'utf8');
const callbacks = new Map();
let nextId = 0, starts = 0, stops = 0;
const scope = {
  guidedCompletionCelebrated: false, guidedCelebrationFrame: null, stopGuidedConfetti: null,
  compilingMoves: false, restoringGuidedUndo: false, buildingStartingExpression: false,
  uiState: { stage: 'idle', activeTool: null },
  isDemoModeActive: () => true, getCurrentDemoSteps: () => [{}], getCurrentDemoStep: () => null,
  getCurrentLevel: () => ({ initialBuilderActions: [{}] }),
  requestAnimationFrame: cb => { callbacks.set(++nextId, cb); return nextId; },
  cancelAnimationFrame: id => callbacks.delete(id),
  window: { ExplodedAlgebraConfetti: { start() { starts++; return () => { stops++; }; } } }
};
vm.createContext(scope);
for (const name of ['resetGuidedCelebration', 'maybeCelebrateGuidedCompletion']) {
  const match = source.match(new RegExp(`        function ${name}\\([^\\n]*\\) \\{[\\s\\S]*?\\n        \\}`));
  assert(match); vm.runInContext(match[0], scope);
}
function flush() { for (const [id, cb] of [...callbacks]) { callbacks.delete(id); cb(); } }
scope.maybeCelebrateGuidedCompletion();
scope.uiState.stage = 'preview'; scope.uiState.activeTool = 'distributeLeftToRight';
flush();
assert.equal(starts, 0, 'Advancing before a final transformation must not celebrate early');
scope.uiState.stage = 'postview'; scope.maybeCelebrateGuidedCompletion(); flush();
assert.equal(starts, 0);
scope.uiState.stage = 'idle'; scope.uiState.activeTool = null;
scope.maybeCelebrateGuidedCompletion(); scope.maybeCelebrateGuidedCompletion(); flush();
assert.equal(starts, 1);
scope.maybeCelebrateGuidedCompletion(); flush();
assert.equal(starts, 1, 'Redraws do not repeat the celebration');
scope.resetGuidedCelebration();
assert.equal(stops, 1, 'Reset/Undo stops an active celebration');
scope.compilingMoves = true; scope.maybeCelebrateGuidedCompletion(); flush();
assert.equal(starts, 1, 'Import compilation never celebrates');
scope.compilingMoves = false; scope.restoringGuidedUndo = true; scope.maybeCelebrateGuidedCompletion(); flush();
assert.equal(starts, 1, 'Undo reconstruction never celebrates');
scope.restoringGuidedUndo = false; scope.isDemoModeActive = () => false;
scope.maybeCelebrateGuidedCompletion(); flush(); assert.equal(starts, 1, 'Free Play never celebrates');
scope.isDemoModeActive = () => true; scope.getCurrentDemoSteps = () => [];
scope.maybeCelebrateGuidedCompletion(); flush(); assert.equal(starts, 2, 'A completed build-only guide celebrates');
scope.resetGuidedCelebration(); scope.maybeCelebrateGuidedCompletion(); scope.resetGuidedCelebration(); flush();
assert.equal(starts, 2, 'Reset cancels a pending celebration');

// Drive the real canvas animation through its full lifetime in both motion modes.
const animationSource = fs.readFileSync(path.join(__dirname, '..', 'guided-confetti.js'), 'utf8');
for (const reduced of [false, true]) {
  const frames = new Map(), listeners = new Map(), canvases = new Set();
  let id = 0, fills = 0;
  const context = new Proxy({}, { get: (_target, key) => () => { if (key === 'fillRect' || key === 'fill') fills++; }, set: () => true });
  const env = {
    window: { innerWidth: 390, innerHeight: 844, devicePixelRatio: 3,
      matchMedia: () => ({ matches: reduced }),
      addEventListener: (key, cb) => listeners.set(key, cb), removeEventListener: key => listeners.delete(key) },
    document: { hidden: false, createElement: () => ({ dataset: {}, style: {}, setAttribute() {},
      getContext: () => context, remove() { canvases.delete(this); } }),
      body: { appendChild: canvas => canvases.add(canvas) },
      addEventListener: (key, cb) => listeners.set(key, cb), removeEventListener: key => listeners.delete(key) },
    requestAnimationFrame: cb => { frames.set(++id, cb); return id; },
    cancelAnimationFrame: key => frames.delete(key)
  };
  vm.runInNewContext(animationSource, env);
  const stop = env.window.ExplodedAlgebraConfetti.start();
  assert.equal(canvases.size, 1);
  assert.equal([...canvases][0].width, 780, 'Canvas density is capped for mobile');
  assert([...canvases][0].style.cssText.includes('pointer-events:none'));
  for (let time = 0; time <= 6000 && frames.size; time += 16) {
    const batch = [...frames.values()]; frames.clear(); batch.forEach(cb => cb(time));
  }
  assert(fills > 0, 'Both motion preferences produce visible confetti');
  assert.equal(canvases.size, 0); assert.equal(frames.size, 0); assert.equal(listeners.size, 0);
  stop(); // cleanup is safe more than once
  env.window.ExplodedAlgebraConfetti.start(); env.window.ExplodedAlgebraConfetti.start();
  assert.equal(canvases.size, 1, 'New celebrations replace old canvases');
  env.document.hidden = true; listeners.get('visibilitychange')();
  assert.equal(canvases.size, 0); assert.equal(frames.size, 0);
}
console.log('Completion waits for the final action, celebrates once, supports build-only runs, and cleans up normal/reduced-motion confetti.');
