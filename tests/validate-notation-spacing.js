const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const source = fs.readFileSync(path.join(__dirname, "../exploded-algebra-tool.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "../exploded-algebra.html"), "utf8");
const elements = Object.fromEntries(["plusSpacingInput", "timesSpacingInput", "plusSpacingValue", "timesSpacingValue", "notationSpacingPreview"]
    .map(id => [id, {}]));
let stored = JSON.stringify({ plus: 20, times: 7 });
const listeners = {};
let redraws = 0;
const scope = vm.createContext({
    NOTATION_SPACING_STORAGE_KEY: "testSpacing",
    notationSpacingPreference: { plus: 1, times: 0 },
    window: { localStorage: { getItem: () => stored, setItem: (key, value) => { stored = value; } } },
    document: { getElementById: id => elements[id] },
    notationSpacingDialog: { addEventListener: (type, fn) => { listeners[type] = fn; } },
    workspaceUtilityMenuToggle: { focus() {} },
    drawExpression: () => { redraws++; },
    setWorkspacePan() {}, workspacePanX: 5, workspacePanY: 8
});
for (const name of ["loadNotationSpacingPreference", "updateNotationSpacingControls", "initializeNotationSpacing"]) {
    const start = source.indexOf(`        function ${name}(`);
    const end = source.indexOf("\n        function ", start + 1);
    vm.runInContext(source.slice(start, end), scope);
}
scope.initializeNotationSpacing();
assert.equal(elements.plusSpacingInput.value, "20");
assert.equal(elements.timesSpacingInput.value, "7");
assert.equal(elements.plusSpacingValue.textContent, "20 spaces per side");
assert.equal(elements.notationSpacingPreview.textContent, "a" + " ".repeat(20) + "+" + " ".repeat(20) + "b" + " ".repeat(7) + "*" + " ".repeat(7) + "c");
listeners.input({ target: { dataset: { notationSpacing: "times" }, value: "0" } });
assert.equal(redraws, 1);
assert.equal(JSON.parse(stored).times, 0);
scope.notationSpacingPreference.times = 9;
scope.loadNotationSpacingPreference();
assert.equal(scope.notationSpacingPreference.times, 0, "A saved zero must survive reload");
listeners.input({ target: { dataset: { notationSpacing: "plus" }, value: "99" } });
assert.equal(redraws, 1, "Out-of-range preferences must be ignored");
scope.window.localStorage.getItem = () => { throw Error("storage disabled"); };
scope.window.localStorage.setItem = () => { throw Error("storage disabled"); };
scope.loadNotationSpacingPreference();
listeners.input({ target: { dataset: { notationSpacing: "plus" }, value: "4" } });
assert.equal(scope.notationSpacingPreference.plus, 4);
assert.equal(redraws, 2, "Settings still apply without local storage");
assert(html.includes('data-workspace-action="notationSpacing"'));
assert(/\.workspace-conventional-line\s*\{[^}]*color: #777;/.test(html));
assert(!html.includes(".workspace-code-group {"), "Workspace expressions have no group highlight styling");
console.log("Notation spacing updates immediately, persists including zero, and works without storage.");
