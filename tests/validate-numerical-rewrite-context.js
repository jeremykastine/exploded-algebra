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
    removeAttribute(name) { delete this.attributes[name]; }
    appendChild(child) {
        if (this.children.includes(child)) this.removeChild(child);
        this.children.push(child);
        return child;
    }
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
for (const name of ["cloneNode", "cloneBuilderNodeForHistory", "valueNode", "makeInverseNode", "getNodeAtPath", "isNumericalBuilderTool", "isInContextReplacementTool", "isInContextReplacementBuilder", "countReplacementEntrySymbols", "makeReplacementBuilderDisplayRoot", "isIntegratedExpressionBuilder", "getExplodedBuilderDisplayRoot"]) {
    loadFunction(name);
}
vm.runInContext(`
    this.value = text => new ExprNode("value", [], text);
    this.operation = (type, args) => new ExprNode(type, args, null);
    this.makeDisplay = makeReplacementBuilderDisplayRoot;
    this.inContext = isInContextReplacementBuilder;
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
    return node.isReplacementBuilderPreview ? node : node.args.map(findPreview).find(Boolean);
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
    const containsReference = node => node === builder.root || node.args.some(containsReference);
    assert(containsReference(preview.args[1]), "Position the live entry tree so its grouping hit targets share the canvas coordinates");
    for (const child of preview.args) {
        assert.equal((child.left() + child.right()) / 2, (preview.left() + preview.right()) / 2, "Old and new expressions must share the same horizontal center");
        assert.equal((child.top() + child.bottom()) / 2, (preview.top() + preview.bottom()) / 2, "Old and new expressions must share the same vertical center");
        if (!preview.preserveOriginalLayoutWhenEmpty || child === preview.args[0]) {
            assert(child.left() >= preview.left() && child.right() <= preview.right(), "The edit region must contain both widths");
            assert(child.top() >= preview.top() && child.bottom() <= preview.bottom(), "The edit region must contain both heights");
        }
    }
    assert.equal(preview.layout.width, preview.preserveOriginalLayoutWhenEmpty ? preview.args[0].layout.width : Math.max(...preview.args.map(child => child.layout.width)) + 16);
    assert.equal(preview.layout.height, preview.preserveOriginalLayoutWhenEmpty ? preview.args[0].layout.height : Math.max(...preview.args.map(child => child.layout.height)) + 16);
    const overlay = svg.children.at(-1);
    assert.equal(overlay.attributes["data-selection-overlay"], "true", "Blue shading must be above all old and new expression content");
    assert.equal(overlay.attributes.opacity, "0.25", "The entire blue layer must use one low global alpha");
    assert.equal(overlay.attributes["pointer-events"], "none", "Foreground shading must allow selection and grouping through it");
    const shading = overlay.children.find(child => child.name === "rect" && child.attributes.fill === context.settings.selectionBlue);
    assert(shading && shading.attributes.opacity === undefined && shading.attributes.stroke === "none", "The blue region must inherit the layer alpha without an entry outline");
    assert.equal(Number(shading.attributes.width), preview.layout.width + (preview.preserveOriginalLayoutWhenEmpty ? 16 : 0));
    assert.equal(Number(shading.attributes.height), preview.layout.height + (preview.preserveOriginalLayoutWhenEmpty ? 16 : 0));
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
assert(single.svg.children.indexOf(originalLabel) < single.svg.children.length - 1, "Retained blue shading must cover the entire old selection, including inverse backgrounds");
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
assert(render(wholeBuilder).display.isReplacementBuilderPreview, "A whole-expression selection must use the same overlaid edit region");

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
for (const tool of ["authorInitial", "insertZeroProduct"]) {
    assert.equal(context.inContext({ ...builder, tool }), false, "Other expression-building modes must retain their current display");
}
context.builderReviewActive = true;
assert.equal(context.inContext(builder), false);
assert.equal(context.displayRoot(builder), mainRoot, "Peek must show the original expression without the temporary rewrite area");
context.builderReviewActive = false;

// Both generated pairs use the same selected-site overlay. Nothing new is
// visible and no sibling moves before entry; after entry both copies update.
const pairPreviews = {};
function data(node) {
    return { type: node.type, value: node.value, args: Array.from(node.args, data), builderOperators: Array.from(node.builderOperators || []) };
}
for (const [tool, originalValue] of [["replaceOneWithInverseProduct", "1"], ["cancelOpposites", "0"]]) {
    const token = value(originalValue);
    const expression = operation("sum", [operation("prod", [value("x"), token]), value("7")]);
    const pairBuilder = { ...makeBuilder(expression, token), tool, root: placeholder };
    assert(context.inContext(pairBuilder));
    const initial = render(pairBuilder);
    const baseline = context.cloneNode(expression);
    context.layout(baseline, context.svgContext(new SvgElement("svg")));
    assert.equal(initial.display.layout.width, baseline.layout.width, "Opening a pair rule must not change the original width");
    assert.equal(initial.display.layout.height, baseline.layout.height, "Opening a pair rule must not change the original height");
    assert.equal(initial.preview.args[0].left(), baseline.args[0].args[1].left(), "Opening a pair rule must leave the selected value in the same position");
    assert.equal(initial.preview.args[0].top(), baseline.args[0].args[1].top());
    const initialLabels = initial.svg.children.filter(child => child.name === "text");
    assert.equal(initialLabels.length, 3, "No inverse, negative factor or duplicate may appear before entering A");
    assert(initialLabels.some(child => child.textContent === originalValue && child.attributes.opacity === "0.28"));
    pairPreviews[tool + "-empty"] = initial;

    pairBuilder.root = value("2");
    const first = render(pairBuilder);
    assert.equal(first.preview.rewriteOriginalOpacity, 0.14, "Generated symbols and the second copy must not accelerate the fade");
    const pair = first.preview.args[1];
    assert.equal(pair.type, tool === "replaceOneWithInverseProduct" ? "prod" : "sum");
    assert.equal(pair.args[0], pairBuilder.root, "The first A remains live for entry and grouping hit targets");
    const copy = tool === "replaceOneWithInverseProduct" ? pair.args[1].args[0] : pair.args[1].args[1];
    assert.deepEqual(data(copy), data(pairBuilder.root), "The inverse or negative copy must match A immediately");
    assert.notEqual(copy, pairBuilder.root, "Copies must have independent layout positions");
    assert.equal(first.svg.children.filter(child => child.name === "text" && child.textContent === "2" && child.attributes.fill === "black" && !child.attributes.opacity).length, 2, "The first digit must appear in both halves simultaneously");
    pairPreviews[tool] = first;

    pairBuilder.root = operation("sum", [value("23"), value("y")]);
    const expanded = render(pairBuilder);
    const expandedPair = expanded.preview.args[1];
    const expandedCopy = tool === "replaceOneWithInverseProduct" ? expandedPair.args[1].args[0] : expandedPair.args[1].args[1];
    assert.deepEqual(data(expandedCopy), data(pairBuilder.root), "Both copies must update together for compound A");
    assert.equal(expanded.preview.rewriteOriginalOpacity, 0.0175);
    assert(expanded.display.args[1].top() > expanded.preview.bottom(), "The complete generated pair must fit before the next sibling");
    pairBuilder.root.isBuilderSequence = true;
    pairBuilder.root.builderOperators = ["sum"];
    const sequencePair = render(pairBuilder).preview.args[1];
    const sequenceCopy = tool === "replaceOneWithInverseProduct" ? sequencePair.args[1].args[0] : sequencePair.args[1].args[1];
    assert(sequenceCopy.isBuilderSequence && sequenceCopy.builderOperators[0] === "sum", "Archived entry sequences must retain their pending operations in both copies");

    pairBuilder.root = placeholder;
    const undone = render(pairBuilder);
    assert.equal(undone.display.layout.width, initial.display.layout.width, "Undoing all entry must restore the original layout");
    assert.equal(undone.preview.rewriteOriginalOpacity, 0.28);
    context.builderReviewActive = true;
    assert.equal(context.displayRoot(pairBuilder), expression, "Peek must show the original whole expression for pair rules too");
    context.builderReviewActive = false;
}

// Every drawing path shares a foreground blue layer, including ordinary
// selections and static teaching diagrams with legacy blue shading colors.
const diagram = operation("prod", [value("x"), operation("inv", [value("2")])]);
const diagramSvg = new SvgElement("svg");
const diagramContext = context.svgContext(diagramSvg);
context.layout(diagram, diagramContext);
const shading = context.compileShading(diagram, [
    { path: [], color: "#DDEFFF" },
    { path: [1], color: context.settings.selectionBlue, convexHull: true },
    { path: [0], color: "#FFF3BF" }
]);
context.drawShadingToContext(shading, diagramContext);
context.paint(diagram, diagramContext);
diagramContext.strokeStyle = "black";
diagramContext.strokeRect(diagram.left(), diagram.top(), diagram.layout.width, diagram.layout.height);
const blueLayer = diagramSvg.children.at(-1);
assert.equal(blueLayer.attributes["data-selection-overlay"], "true", "Static highlights must stay above inverse backgrounds, symbols and later outlines");
assert.equal(blueLayer.attributes.opacity, "0.25");
assert(blueLayer.children.some(child => child.name === "path"), "Convex hull highlights must share the foreground layer");
assert(blueLayer.children.some(child => child.name === "rect"), "Rectangular highlights must share the foreground layer");
assert(blueLayer.children.every(child => child.attributes.fill === context.settings.selectionBlue && child.attributes.opacity === undefined), "Overlapping blue regions must share alpha once rather than darkening their overlap");
assert(diagramSvg.children.some(child => child.attributes.fill === "#FFF3BF"), "Other diagram colors must retain their existing paint behavior");
assert(diagramSvg.children.some(child => child.attributes.fill === "white"), "The test must include opaque inverse interiors under the tint");
assert(diagramSvg.children.filter(child => child === blueLayer).length === 1, "Reordering must move the existing layer rather than duplicate it");
diagramContext.clearRect();
assert.equal(diagramSvg.children.length, 0);
diagramContext.fillStyle = context.settings.selectionBlue;
diagramContext.globalAlpha = 0.25;
diagramContext.fillRect(0, 0, 10, 10);
assert.notEqual(diagramSvg.children[0], blueLayer, "Redrawing must discard the previous selection layer");
assert.equal(diagramSvg.children[0].children.length, 1);

if (process.env.REWRITE_PREVIEW_PATH) {
    fs.writeFileSync(process.env.REWRITE_PREVIEW_PATH, single.svg.outerHTML);
    for (const [name, result] of Object.entries(pairPreviews)) {
        fs.writeFileSync(process.env.REWRITE_PREVIEW_PATH.replace(/\.svg$/, `-${name}.svg`), result.svg.outerHTML);
    }
    fs.writeFileSync(process.env.REWRITE_PREVIEW_PATH.replace(/\.svg$/, "-empty.svg"), empty.svg.outerHTML);
    fs.writeFileSync(process.env.REWRITE_PREVIEW_PATH.replace(/\.svg$/, "-inverse.svg"), insideInverse.svg.outerHTML);
}
console.log("Numerical and pair rewrite context, layout, ink and foreground overlay checks passed.");
