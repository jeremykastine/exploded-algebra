const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const builderHtml = read("exercise-builder.html");
const builderJs = read("exercise-builder.js");
const playerJs = read("exploded-algebra-tool.js");

const htmlIds = new Set(Array.from(builderHtml.matchAll(/\bid="([^"]+)"/g), match => match[1]));
const requestedIds = new Set(Array.from(builderJs.matchAll(/\bbyId\("([^"]+)"\)/g), match => match[1]));
for (const id of requestedIds) {
  assert(htmlIds.has(id), `exercise-builder.js references missing HTML id: ${id}`);
}
for (const phase of ["1", "2", "3", "4"]) {
  assert(builderHtml.includes(`data-phase="${phase}"`), `Missing builder phase ${phase}`);
}

assert(builderHtml.includes("exploded-algebra.html?authoring=builder"), "Builder must embed the real player in authoring mode");
assert(builderJs.includes('formatVersion: FORMAT_VERSION'), "Export must include a format version");
assert(playerJs.includes('navigationSource === "builder"'), "Player must accept temporary builder test levels");
assert(playerJs.includes("solutionRecorder.includeUndoActions === false"), "Undo-exclusion recording path is missing");
assert(!/recordSolutionAction\s*\(\s*\{[^}]*type:\s*["']view["']/s.test(playerJs), "View/zoom actions must not be recorded");

const rendererContext = { window: {}, console };
vm.createContext(rendererContext);
vm.runInContext(read("exploded-algebra-renderer.js"), rendererContext);
const renderer = rendererContext.window.ExplodedAlgebraRenderer;
const value = text => new renderer.ExprNode("value", [], text);
const cases = [
  [new renderer.ExprNode("sum", [value("x"), value("1")]), "x + 1"],
  [new renderer.ExprNode("prod", [value("3"), value("x")]), "3x"],
  [new renderer.ExprNode("inv", [new renderer.ExprNode("sum", [value("x"), value("4")])]), "\\frac{1}{x + 4}"],
  [new renderer.ExprNode("sum", [value("x"), new renderer.ExprNode("prod", [value("-1"), value("3")])]), "x - 3"]
];
for (const [expression, expected] of cases) {
  assert(renderer.expressionToKatex(expression) === expected, `Unexpected KaTeX generation for ${expected}`);
}

for (const file of fs.readdirSync(path.join(root, "levels")).filter(name => name.endsWith(".json"))) {
  const level = JSON.parse(read(path.join("levels", file)));
  assert(level.id && level.title && level.startExpression, `${file} is missing required metadata`);
  assert(Array.isArray(level.steps) && level.steps.length > 0, `${file} has no steps`);
}

console.log("Exercise Builder static integration checks passed.");
