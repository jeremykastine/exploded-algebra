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
for (const name of ["cloneNode", "getNodeAtPath", "isNumericalBuilderTool", "isInContextNumericalBuilder", "countNumericalRewriteSymbols", "makeNumericalRewriteDisplayRoot", "isIntegratedExpressionBuilder", "getExplodedBuilderDisplayRoot"]) {
    loadFunction(name);
}
vm.runInContext(`
    this.value = text => new ExprNode("value", [], text);
    this.operation = (type, args) => new ExprNode(type, args, null);
    this.makeDisplay = makeNumericalRewriteDisplayRoot;
    this.inContext = isInContextNumericalBuilder;
    this.displayRoot = getExplodedBuilderDisplayRoot;
    this.settings = { ...SETTINGS, expressionStrokeFill: "black", opaqueInverseDenominator: true, operationStyle: "bare", sumBeamStyle: "midline", productBeamStyle: "midline", operationBarShading: "black" };
    this.layout = (node, ctx) => layoutExpressionWithSettings(node, ctx, settings, 20, 20);
    this.paint = (node, ctx) => { drawNodeRecursiveToContext(node, ctx, settings); };
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
    const shading = svg.children.find(child => child.name === "rect" && child.attributes.fill === context.settings.selectionBlue);
    assert(shading && shading.attributes.opacity === "0.25" && shading.attributes.stroke === "none", "The usual blue selection shading must remain without an entry outline");
    assert.equal(Number(shading.attributes.width), preview.layout.width);
    assert.equal(Number(shading.attributes.height), preview.layout.height);
    assert(!svg.children.some(child => child.attributes.fill === "rgb(184,184,184)"), "The old gray selection fill must be gone");
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
    const label = labels.find(label => label.textContent === text);
    assert.equal(label.attributes.opacity, undefined, "Unselected values must remain at full intensity");
    assert.equal(label.attributes.fill, "black", "The surrounding numbers and variables must stay black");
}
const originalLabel = labels.find(label => label.textContent === "6");
assert(originalLabel && originalLabel.attributes.opacity === "0.035", "Three inserted symbols must halve the old selection opacity three times");
assert.equal(originalLabel.attributes.fill, labels.find(label => label.textContent === "x").attributes.fill, "The selection fades through opacity while surrounding values retain full ink");
assert(single.svg.children.indexOf(originalLabel) < single.svg.children.findIndex(child => child.name === "rect" && child.attributes.fill === context.settings.selectionBlue), "Retained blue shading must cover the entire old selection, including inverse backgrounds");
assert(single.svg.children.indexOf(originalLabel) < single.svg.children.indexOf(labels.find(label => label.textContent === "2")), "The new expression must be drawn on top of the old expression");
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
assert(insideInverse.svg.children.some(child => child.name === "rect" && child.attributes.fill === "black" && child.attributes.opacity === undefined), "Unselected inverse and negative-unit backgrounds must remain at full intensity");
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
assert(oldLabel && oldLabel.attributes.fill !== "white" && oldLabel.attributes.opacity === "0.28", "Before typing, only the old selection must be faded");
assert(!empty.svg.children.some(child => child.name === "text" && child.textContent === "?"), "The empty entry must not obscure the old expression with a placeholder");

// Small replacements cannot shrink the region below the original footprint.
const wideOld = operation("sum", [operation("prod", [value("123"), value("456")]), value("789")]);
const wideBuilder = makeBuilder(wideOld, wideOld, 0, 1, wideOld);
wideBuilder.root = value("9");
const wide = render(wideBuilder);
assert(wide.preview.layout.width >= wide.preview.args[0].layout.width + 16);
assert(wide.preview.layout.height >= wide.preview.args[0].layout.height + 16);

// Original symbols, grouping beams, negative values and inverse containers
// keep their usual appearance while the selected original alone is faded.
const oldComplex = operation("sum", [operation("prod", [value("-1"), value("x")]), operation("inv", [value("6")])]);
const layeredBuilder = makeBuilder(oldComplex, oldComplex, 0, 1, oldComplex);
layeredBuilder.root = placeholder;
for (const operationStyle of ["bare", "outlined", "filled"]) {
    context.settings.operationStyle = operationStyle;
    const layered = render(layeredBuilder);
    const ink = layered.svg.children.filter(child => child.name === "text");
    assert(ink.length >= 4);
    assert(ink.every(child => child.attributes.opacity === "0.28"), "All original values, variables and inverse numerators must be faded equally");
    assert(layered.svg.children.some(child => child.attributes.stroke === "black" && child.attributes.opacity === "0.28"), "The old grouping and operation marks must be gray rather than inverted white");
}
context.settings.operationStyle = "bare";

// Entering an inverse and undoing back to empty must both retain the old value.
builder.root = operation("inv", [placeholder]);
assert(render(builder).svg.children.some(child => child.name === "text" && child.textContent === "6" && child.attributes.opacity === "0.14"));
builder.root = placeholder;
assert(render(builder).svg.children.some(child => child.name === "text" && child.textContent === "6" && child.attributes.opacity === "0.28"));
// Fade by inserted symbols rather than input events. Pending operations and
// every digit count, while grouping changes and repeated redraws do not.
function originalOpacity(entry) {
    builder.root = entry;
    const image = render(builder);
    return Number(image.svg.children.find(child => child.name === "text" && child.textContent === "6").attributes.opacity);
}
assert.equal(originalOpacity(placeholder), 0.28);
assert.equal(originalOpacity(value("2")), 0.14);
assert.equal(originalOpacity(value("23")), 0.07, "A second digit must halve opacity again");
assert.equal(originalOpacity(operation("prod", [value("23"), placeholder])), 0.035, "A pending operation already counts as a new symbol");
const entered = operation("prod", [value("23"), value("x")]);
assert.equal(originalOpacity(entered), 0.0175, "A variable counts as one entry symbol");
assert.equal(originalOpacity(entered), 0.0175, "Redrawing the same entry must not fade the original further");
assert.equal(originalOpacity(operation("sum", [value("23"), value("x")])), 0.0175, "Changing grouping or operation type without adding a symbol must keep fading steady");
assert.equal(originalOpacity(value("23")), 0.07, "Undoing symbols must restore their previous opacity");
assert.equal(originalOpacity(operation("inv", [placeholder])), 0.14, "An inverse counts as one symbol");
assert.equal(originalOpacity(value("-1")), 0.14, "The dedicated negative-one entry counts once");
const sequence = operation("sum", [value("23")]);
sequence.isBuilderSequence = true;
sequence.builderOperators = ["prod"];
assert.equal(originalOpacity(sequence), 0.035, "Archived builder sequences must count trailing pending operations");
const regrouped = operation("prod", [value("2"), operation("prod", [value("3"), value("4")])]);
const flattened = operation("prod", [value("2"), value("3"), value("4")]);
assert.equal(originalOpacity(regrouped), originalOpacity(flattened), "Cycling an operation's level must not count as another insertion");
builder.root = placeholder;
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
