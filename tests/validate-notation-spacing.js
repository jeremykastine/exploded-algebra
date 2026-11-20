const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../exploded-algebra-tool.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "../exploded-algebra.html"), "utf8");
const elements = Object.fromEntries(["plusSpacingInput", "timesSpacingInput", "plusSpacingValue", "timesSpacingValue", "notationSpacingPreview"]
    .map(id => [id, {}]));
let stored = JSON.stringify({ plus: 100, times: 7 });
const listeners = {};
let redraws = 0;
let preview;
const scope = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(__dirname, "../exploded-algebra-renderer.js"), "utf8"), scope);
const settings = scope.window.ExplodedAlgebraRenderer.SETTINGS;
Object.assign(scope, {
    NOTATION_SPACING_STORAGE_KEY: "testSpacing",
    notationSpacingPreference: { plus: 16, times: 16 },
    document: { getElementById: id => elements[id] },
    ExplodedAlgebraRenderer: { renderExpressionInto: (target, root) => { preview = root; } },
    notationSpacingDialog: { addEventListener: (type, fn) => { listeners[type] = fn; } },
    workspaceUtilityMenuToggle: { focus() {} },
    drawExpression: () => { redraws++; },
    setWorkspacePan() {}, workspacePanX: 5, workspacePanY: 8
});
scope.window.localStorage = { getItem: () => stored, setItem: (key, value) => { stored = value; } };
for (const name of ["loadNotationSpacingPreference", "updateNotationSpacingControls", "initializeNotationSpacing"]) {
    const start = source.indexOf(`        function ${name}(`);
    const end = source.indexOf("\n        function ", start + 1);
    vm.runInContext(source.slice(start, end), scope);
}
const measuring = { measureText: text => ({ width: String(text).length * 10,
    actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 3 }) };
function geometry() {
    scope.layoutExpressionWithSettings(preview, measuring, settings, 20, 20);
    const product = preview.args[0];
    return { width: preview.layout.width, height: preview.layout.height,
        timesGap: product.args[1].left() - product.args[0].right(),
        plusGap: preview.args[1].top() - product.bottom() };
}
scope.initializeNotationSpacing();
assert.equal(elements.plusSpacingInput.value, "100");
assert.equal(elements.timesSpacingInput.value, "7");
assert.equal(elements.plusSpacingValue.textContent, "100 px per side");
assert.equal(settings.sumGap, 100);
assert.equal(settings.productGap, 7);
const before = geometry();
assert.equal(before.timesGap, 12 + 2 * 7);
assert.equal(before.plusGap, 12 + 2 * 100);
const codeBefore = scope.expressionToCodeMarkup(preview);
const compactBefore = scope.expressionToCompactText(preview);
listeners.input({ target: { dataset: { notationSpacing: "times" }, value: "0" } });
const after = geometry();
assert.equal(after.width, before.width - 14);
assert.equal(after.height, before.height, "Times spacing changes horizontal gaps only");
assert.equal(after.timesGap, 12, "Zero retains only the operator itself");
assert.equal(settings.productGap, 0);
assert.equal(redraws, 1);
assert.equal(JSON.parse(stored).times, 0);
scope.notationSpacingPreference.times = 9;
scope.loadNotationSpacingPreference();
assert.equal(scope.notationSpacingPreference.times, 0, "A saved zero must survive reload");
listeners.input({ target: { dataset: { notationSpacing: "plus" }, value: "101" } });
assert.equal(redraws, 1, "Out-of-range preferences must be ignored");
scope.window.localStorage.getItem = () => { throw Error("storage disabled"); };
scope.window.localStorage.setItem = () => { throw Error("storage disabled"); };
scope.loadNotationSpacingPreference();
listeners.input({ target: { dataset: { notationSpacing: "plus" }, value: "0" } });
const tight = geometry();
assert.equal(tight.height, after.height - 200);
assert.equal(tight.width, after.width, "Plus spacing changes vertical gaps only");
assert.equal(tight.plusGap, 12);
assert.equal(redraws, 2, "Settings still apply without local storage");
assert.equal(scope.expressionToCodeMarkup(preview), codeBefore);
assert.equal(scope.expressionToCompactText(preview), compactBefore);
assert(!/expressionTo(?:CodeMarkup|CompactText)\([^;]*notationSpacingPreference/.test(source),
    "Workspace conventional notation uses fixed spacing");
assert(source.includes('"explodedAlgebraOperationSpacingV1"'), "Ignore old conventional spacing preferences");
assert(html.includes('data-workspace-action="notationSpacing"'));
assert(html.includes('Exploded Operation Spacing'));
assert(/\.workspace-conventional-line\s*\{[^}]*color: #777;/.test(html));
assert(!html.includes(".workspace-code-group {"), "Workspace expressions have no group highlight styling");
console.log("Exploded plus/times spacing changes independent axes, preserves conventional notation, and persists including zero.");
