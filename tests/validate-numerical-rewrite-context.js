const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const playerSource = fs.readFileSync(path.join(root, "exploded-algebra-tool.js"), "utf8");
// Run the production SVG drawing code with deterministic text measurements.
class SvgElement {
    constructor(name) { this.name = name; this.attributes = {}; this.children = []; this.style = {}; this.textContent = ""; }
    setAttribute(name, value) { this.attributes[name] = String(value); }
    getAttribute(name) { return this.attributes[name]; }
    appendChild(child) { this.children.push(child); return child; }
    removeChild(child) { this.children.splice(this.children.indexOf(child), 1); }
    get firstChild() { return this.children[0]; }
    get outerHTML() {
        const escape = value => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
        const attributes = Object.entries(this.attributes).map(([name, value]) => ` ${name}="${escape(value)}"`).join("");
        return `<${this.name}${attributes}>${escape(this.textContent)}${this.children.map(child => child.outerHTML).join("")}</${this.name}>`;
    }
}
const context = vm.createContext({
    window: {}, document: { createElementNS: (_, name) => new SvgElement(name) },
    builderReviewActive: false, uiState: {},
});
vm.runInContext(fs.readFileSync(path.join(root, "exploded-algebra-renderer.js"), "utf8"), context);
function loadFunction(name) {
    const start = playerSource.indexOf(`        function ${name}(`);
    assert.notEqual(start, -1, `Missing production function ${name}`);
    const end = playerSource.indexOf("\n        function ", start + 1);
    vm.runInContext(playerSource.slice(start, end), context);
}
for (const name of ["cloneNode", "getNodeAtPath", "isNumericalBuilderTool", "isInContextNumericalBuilder", "makeNumericalRewriteDisplayRoot", "isIntegratedExpressionBuilder", "getExplodedBuilderDisplayRoot"]) {
    loadFunction(name);
}
vm.runInContext(`
    this.value = text => new ExprNode("value", [], text);
    this.operation = (type, args) => new ExprNode(type, args, null);
    this.makeDisplay = makeNumericalRewriteDisplayRoot;
    this.inContext = isInContextNumericalBuilder;
    this.displayRoot = getExplodedBuilderDisplayRoot;
    this.settings = { ...SETTINGS, opaqueInverseDenominator: true, operationStyle: "bare", sumBeamStyle: "midline", productBeamStyle: "midline", operationBarShading: "black" };
    this.layout = (node, ctx) => layoutExpressionWithSettings(node, ctx, settings, 20, 20);
    this.paint = (node, ctx) => { ctx.globalAlpha = 0.28; drawNodeRecursiveToContext(node, ctx, settings); };
    this.svgContext = svg => {
        const ctx = new SvgDrawingContext(svg);
        ctx.measureText = text => ({ width: String(text).length * 12, actualBoundingBoxLeft: 0, actualBoundingBoxRight: String(text).length * 12, actualBoundingBoxAscent: 16, actualBoundingBoxDescent: 4 });
        return ctx;
    };
`, context);
const { value, operation } = context;
function findPreview(node) {
    return node.isNumericalRewritePreview ? node : node.args.map(findPreview).find(Boolean);
}
function render(builder) {
    const originalText = JSON.stringify(builder.mainRoot);
    const display = context.makeDisplay(builder);
    const svg = new SvgElement("svg");
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const drawingContext = context.svgContext(svg);
    context.layout(display, drawingContext);
    context.paint(display, drawingContext);
    svg.setAttribute("width", display.layout.width + 40);
    svg.setAttribute("height", display.layout.height + 40);
    assert.equal(JSON.stringify(builder.mainRoot), originalText, "Opening or editing a rewrite must leave the original expression and layout untouched");
    const preview = findPreview(display);
    assert(preview, "The original selected range and replacement must share one reserved display region");
    assert.equal(preview.args[1], builder.root, "Position the live replacement tree so its grouping hit targets share the canvas coordinates");
    for (const child of preview.args) {
        assert.equal((child.left() + child.right()) / 2, (preview.left() + preview.right()) / 2, "Old and new expressions must share the same horizontal center");
        assert.equal((child.top() + child.bottom()) / 2, (preview.top() + preview.bottom()) / 2, "Old and new expressions must share the same vertical center");
        assert(child.left() >= preview.left() && child.right() <= preview.right(), "The edit region must contain both widths");
        assert(child.top() >= preview.top() && child.bottom() <= preview.bottom(), "The edit region must contain both heights");
    }
    assert.equal(preview.layout.width, Math.max(...preview.args.map(child => child.layout.width)) + 16);
    assert.equal(preview.layout.height, Math.max(...preview.args.map(child => child.layout.height)) + 16);
    assert(svg.children.some(child => child.name === "rect" && child.attributes.fill === "rgb(184,184,184)" && child.attributes.stroke === "none"), "The selected region must have a gray fill without an entry outline");
    return { display, preview, svg };
}
function makeBuilder(mainRoot, node, firstPart = 0, lastPart = 0, originalSelectedNode = node) {
    return { tool: "numericalRewrite", flowVersion: 5, mainRoot, originalSelection: { node, firstPart, lastPart }, originalSelectedNode, root: operation("prod", [value("2"), value("3")]), currentPath: [] };
}

const selected = value("6");
const mainRoot = operation("sum", [operation("prod", [value("x"), selected]), value("7")]);
const builder = makeBuilder(mainRoot, selected);
const single = render(builder);
const labels = single.svg.children.filter(child => child.name === "text");
for (const text of ["x", "7"]) {
    assert.equal(labels.find(label => label.textContent === text).attributes.opacity, "0.28", "Unselected values must stay visible in light gray");
}
assert(!labels.some(label => label.textContent === "6"), "Typing must completely cover the old selected value");
for (const text of ["2", "3"]) {
    const label = labels.find(label => label.textContent === text);
    assert(label, `Missing original or replacement number ${text}`);
    assert.equal(label.attributes.fill, "black");
    assert.equal(label.attributes.opacity, undefined, "The replacement must retain full ink");
}
assert(single.display.args[1].top() > single.preview.bottom(), "A following sum term must move below the reserved edit region");

for (const type of ["sum", "prod"]) {
    const numbers = [value("x"), value("2"), value("4"), value("y")];
    const expression = operation(type, numbers);
    const multiple = makeBuilder(expression, expression, 1, 2, operation(type, numbers.slice(1, 3)));
    const result = render(multiple);
    assert.equal(result.display.args.length, 3, "A contiguous numerical range must reserve a single edit region");
    assert.deepEqual(result.preview.args[0].args.map(node => node.value), ["2", "4"]);
    if (type === "prod") {
        assert(result.display.args[2].left() > result.preview.right(), "A following factor must move right of the reserved edit region");
    } else {
        assert(result.display.args[2].top() > result.preview.bottom(), "A following term must move below the reserved edit region");
    }
    multiple.root = operation("sum", [operation("prod", [value("123"), value("456")]), value("789")]);
    const grown = render(multiple);
    assert(grown.preview.layout.height > result.preview.layout.height || grown.preview.layout.width > result.preview.layout.width, "Space must grow with a larger replacement");
}

const denominator = value("6");
const inverse = operation("inv", [denominator]);
const inverseBuilder = makeBuilder(operation("prod", [value("-1"), inverse, value("z")]), denominator);
const insideInverse = render(inverseBuilder);
assert(insideInverse.svg.children.some(child => child.name === "rect" && child.attributes.fill === "black" && child.attributes.opacity === "0.28"), "Unselected inverse and negative-unit backgrounds must fade too");
assert(insideInverse.svg.children.some(child => child.name === "rect" && child.attributes.fill === "white" && child.attributes.opacity === undefined), "The inverse denominator interior must remain white rather than accumulating translucent gray backgrounds");
assert(insideInverse.preview.right() < insideInverse.display.args[1].right(), "A denominator's rewrite region must fit inside its reflowed inverse container");

const whole = operation("sum", [value("2"), value("4")]);
const wholeBuilder = makeBuilder(whole, whole, 0, 1, whole);
assert(render(wholeBuilder).display.isNumericalRewritePreview, "A whole-expression selection must use the same overlaid edit region");

const placeholder = value("?");
placeholder.isBuilderPlaceholder = true;
builder.root = placeholder;
const empty = render(builder);
assert.equal(empty.preview.args[1].layout.width, 24, "Empty entry still participates in sizing");
const oldLabel = empty.svg.children.find(child => child.name === "text" && child.textContent === "6");
assert(oldLabel && oldLabel.attributes.fill === "white" && !oldLabel.attributes.opacity, "Before typing, the old selection must appear in white on gray");
assert(!empty.svg.children.some(child => child.name === "text" && child.textContent === "?"), "The empty entry must not obscure the old expression with a placeholder");

// Small replacements cannot shrink the region below the original footprint.
const wideOld = operation("sum", [operation("prod", [value("123"), value("456")]), value("789")]);
const wideBuilder = makeBuilder(wideOld, wideOld, 0, 1, wideOld);
wideBuilder.root = value("9");
const wide = render(wideBuilder);
assert(wide.preview.layout.width >= wide.preview.args[0].layout.width + 16);
assert(wide.preview.layout.height >= wide.preview.args[0].layout.height + 16);

// Every original operator style must invert its ink, including grouped beams,
// negative values and inverse numerators/denominators.
const oldComplex = operation("sum", [operation("prod", [value("-1"), value("x")]), operation("inv", [value("6")])]);
const invertedBuilder = makeBuilder(oldComplex, oldComplex, 0, 1, oldComplex);
invertedBuilder.root = placeholder;
for (const operationStyle of ["bare", "outlined", "filled"]) {
    context.settings.operationStyle = operationStyle;
    const inverted = render(invertedBuilder);
    const ink = inverted.svg.children.filter(child => child.name === "text");
    assert(ink.length >= 4);
    assert(ink.every(child => child.attributes.fill === "white" && !child.attributes.opacity), "All original values, variables and inverse numerators must have opaque white ink");
    assert(!inverted.svg.children.some(child => child.attributes.stroke === "black" || child.attributes.fill === "black"), "The inverted selection must have no black operator marks, grouping beams or inverse backgrounds");
}
context.settings.operationStyle = "bare";

// Entering an inverse already counts as replacement content; returning to the
// empty entry (Undo) reveals the original again.
builder.root = operation("inv", [placeholder]);
assert(!render(builder).svg.children.some(child => child.name === "text" && child.textContent === "6"));
builder.root = placeholder;
assert(render(builder).svg.children.some(child => child.name === "text" && child.textContent === "6" && child.attributes.fill === "white"));
assert(context.inContext(builder));
for (const tool of ["authorInitial", "replaceOneWithInverseProduct", "cancelOpposites", "insertZeroProduct"]) {
    assert.equal(context.inContext({ ...builder, tool }), false, "Other expression-building modes must retain their current display");
}
context.builderReviewActive = true;
assert.equal(context.inContext(builder), false);
assert.equal(context.displayRoot(builder), mainRoot, "Peek must show the original expression without the temporary rewrite area");
context.builderReviewActive = false;

if (process.env.REWRITE_PREVIEW_PATH) {
    fs.writeFileSync(process.env.REWRITE_PREVIEW_PATH, single.svg.outerHTML);
    fs.writeFileSync(process.env.REWRITE_PREVIEW_PATH.replace(/\.svg$/, "-empty.svg"), empty.svg.outerHTML);
    fs.writeFileSync(process.env.REWRITE_PREVIEW_PATH.replace(/\.svg$/, "-inverse.svg"), insideInverse.svg.outerHTML);
}
console.log("Numerical rewrite context, layout, ink and isolation checks passed.");
