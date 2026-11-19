const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const context = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(__dirname, "../exploded-algebra-renderer.js"), "utf8"), context);
const renderer = context.window.ExplodedAlgebraRenderer;
const node = (type, ...args) => new renderer.ExprNode(type, args);
const value = text => new renderer.ExprNode("value", [], text);
const compact = renderer.expressionToCompactText;
const flat = (expr, builder = false) => renderer.expressionToCodeMarkup(expr, builder).replace(/<[^>]*>/g, "");
const tokens = text => text.replace(/\s/g, "");
const widest = text => Math.max(...text.split("\n").map(line => line.length));

const expression = node("sum", value("5"), node("prod", value("2"), node("sum",
    node("prod", value("3"), value("x"), node("sum", value("x"), value("1"))),
    node("prod", value("4"), value("y"), value("y")), node("prod", value("7"), value("z")), value("8"))),
    node("prod", value("-1"), value("6")));
assert.equal(compact(expression), [
    "5 + 2*(3*x*(x + 1)",
    "       + 4*y*y",
    "       + 7*z",
    "       + 8",
    "                  ) - 6"
].join("\n"));
assert.equal(widest(compact(expression)), 23);

assert.equal(compact(node("sum", value("a"), value("b"), value("c"))), "a\n+ b\n+ c");
assert.equal(compact(node("prod", value("a"), value("b"), value("c"))), "a\n*b\n*c");
assert.equal(compact(node("sum", value("1"), value("234"))), "1\n+ 234");
assert.equal(compact(value("123")), "123");
assert.equal(compact(value("<unsafe>")), "<unsafe>", "UI must insert plain text through textContent");

const sequence = node("sum", value("2"), value("x"), value("3"));
sequence.isBuilderSequence = true;
sequence.builderOperators = ["prod", "sum", "prod"];
assert.equal(tokens(compact(sequence, true)), tokens(flat(sequence, true)));
const placeholder = value("");
placeholder.isBuilderPlaceholder = true;
assert.equal(compact(placeholder, true), "□");
const preview = node("rewritePreview", value("6"), node("prod", value("2"), value("3")));
preview.isReplacementBuilderPreview = true;
assert.equal(tokens(compact(preview, true)), "2*3");
preview.preserveOriginalLayoutWhenEmpty = true;
assert.equal(compact(preview, true), "6");

// Exercise repeated subexpressions, reciprocals, negative factors, and nested
// contexts: layout must preserve the serializer's complete token sequence.
let seed = 841;
function random(n) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % n; }
function tree(depth) {
    if (!depth || random(3) === 0) return value(["x", "y", "2", "-1", "0", "-3"][random(6)]);
    const type = ["sum", "prod", "inv"][random(3)];
    return node(type, ...Array.from({ length: type === "inv" ? 1 : 2 + random(3) }, () => tree(depth - 1)));
}
for (let i = 0; i < 500; i++) {
    const expr = tree(4);
    const result = compact(expr);
    assert.equal(tokens(result), tokens(flat(expr)), "Expanding an operation must preserve all tokens and grouping");
    assert(widest(result) <= flat(expr).length, "Compaction must never increase width");
    assert.equal(compact(expr), result, "Tied layouts must remain stable across redraws");
}
console.log("Compact notation chooses the narrowest layout, clears the widest row, and preserves live expression tokens.");
