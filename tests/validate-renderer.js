const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");
const rendererSource = fs.readFileSync(
    path.join(projectRoot, "exploded-algebra-renderer.js"),
    "utf8"
);
const rendererContext = vm.createContext({ window: {} });
vm.runInContext(rendererSource, rendererContext);

const widePattern = vm.runInContext(
    "getNestedOperatorParenthesisPattern(0, 200, 6, false)",
    rendererContext
);
assert.equal(
    widePattern.operatorCenters.length,
    widePattern.parenthesisCenters.length - 1,
    "Exactly one operator must alternate between every adjacent pair of parentheses"
);
widePattern.operatorCenters.forEach((operatorCenter, index) => {
    const expectedCenter = (
        widePattern.parenthesisCenters[index] + widePattern.parenthesisCenters[index + 1]
    ) / 2;
    assert.ok(
        Math.abs(operatorCenter - expectedCenter) < 1e-9,
        "Each outer operator must sit directly between its adjacent parentheses"
    );
});
assert.ok(
    Math.abs(widePattern.parenthesisCenters.at(-1) - widePattern.depth) < 1e-9,
    "The pattern must end with parentheses at the outside edge"
);

const minimumSpanPattern = vm.runInContext(
    "getNestedOperatorParenthesisPattern(0, getParenthesisMinimumSpan({ operatorThickness: 12 }), 6, false)",
    rendererContext
);
assert.equal(minimumSpanPattern.operatorCenters.length, 0);
assert.ok(
    Math.abs(minimumSpanPattern.parenthesisCenters[0] - minimumSpanPattern.depth) < 1e-9,
    "A compact separator must still end in an outside pair of parentheses"
);

const singlePairPattern = vm.runInContext(
    "getNestedOperatorParenthesisPattern(0, 200, 6, true)",
    rendererContext
);
assert.equal(singlePairPattern.parenthesisCenters.length, 1);
assert.equal(singlePairPattern.operatorCenters.length, 0);

// Check the separator geometry and paint in both orientations. Legacy bar
// preferences cannot change the fixed leading-symbol appearance.
const settings = {
    operatorThickness: 12,
    expressionStrokeFill: "black",
    sumBeamStyle: "nested-parentheses",
    productBeamStyle: "ellipse",
    operationBarShading: "gradient"
};
function recordingContext() {
    const operations = [];
    return {
        operations, svgElements: [],
        save() {}, restore() {}, beginPath() {},
        moveTo(...args) { operations.push(["move", ...args]); },
        lineTo(...args) { operations.push(["line", ...args]); },
        quadraticCurveTo(...args) { operations.push(["curve", ...args]); },
        bezierCurveTo(...args) { operations.push(["cubic", ...args]); },
        arc(...args) { operations.push(["arc", ...args]); },
        ellipse(...args) { operations.push(["ellipse", ...args]); },
        appendSvgElement(element) { this.svgElements.push(element); },
        fillRect(...args) { operations.push(["rect", this.fillStyle, ...args]); },
        stroke() { operations.push(["stroke", this.strokeStyle, this.lineWidth]); },
        fill() { operations.push(["fill", this.fillStyle]); }
    };
}
const sumContext = recordingContext();
rendererContext.drawLeadingSumSeparator(sumContext, 10, 110, 20, settings, "black");
const sumDots = sumContext.operations.filter(operation => operation[0] === "arc");
assert.ok(sumDots.length > 2, "The sum connector must have separate dots");
assert.equal(sumContext.operations.find(operation => operation[0] === "fill")[1], "#d3d3d3");
assert.ok(sumDots.every(operation => operation[2] === 20 && operation[3] === 12 * 0.29 / 2));
assert.ok(Math.abs(sumDots.at(-1)[1] + sumDots.at(-1)[3] - 110) < 1e-9, "Sum dots reach the right edge");
assert.deepEqual(sumContext.operations.filter(operation => operation[0] === "move").map(operation => operation.slice(1)),
    [[11.92, 20], [16, 15.92]]);
assert.equal(sumContext.operations.find(operation => operation[0] === "stroke")[1], "black");

const productContext = recordingContext();
rendererContext.drawLeadingProductSeparator(productContext, 20, 10, 110, settings, "black");
const productDots = productContext.operations.filter(operation => operation[0] === "arc");
assert.ok(productDots.length > 3, "The product connector must have separate dots");
assert.equal(productContext.operations.find(operation => operation[0] === "fill")[1], "#d3d3d3");
assert.ok(productDots.slice(0, -1).every(operation => operation[1] === 20 && operation[3] === 12 * 0.29 / 2));
assert.ok(Math.abs(productDots.at(-2)[2] + productDots.at(-2)[3] - 110) < 1e-9, "Product dots reach the bottom edge");
assert.ok(productContext.operations.some(operation => operation[0] === "arc" && operation[3] === 4.32),
    "The leading multiplication dot is large but fits inside the separator width");

const changedSettings = { ...settings, sumBeamStyle: "midline", productBeamStyle: "flared", operationBarShading: "black" };
const secondSum = recordingContext();
const secondProduct = recordingContext();
rendererContext.drawLeadingSumSeparator(secondSum, 10, 110, 20, changedSettings, "black");
rendererContext.drawLeadingProductSeparator(secondProduct, 20, 10, 110, changedSettings, "black");
assert.deepEqual(secondSum.operations, sumContext.operations);
assert.deepEqual(secondProduct.operations, productContext.operations);

const sumNode = {
    type: "sum", args: [{ type: "prod" }, { type: "value" }],
    layout: { x: 10, y: 0, width: 100, height: 40, hLines: [0, 20, 40] },
    left() { return 10; }, right() { return 110; }, top() { return 0; }, bottom() { return 40; }
};
const leadingContext = recordingContext();
rendererContext.drawNodeToContext(sumNode, leadingContext,
    { ...changedSettings, operationStyle: "leading" });
assert.ok(leadingContext.operations.some(operation => operation[0] === "fill" && operation[1] === "#d3d3d3"));
const classicContext = recordingContext();
rendererContext.drawNodeToContext(sumNode, classicContext,
    { ...changedSettings, operationStyle: "classic", sumBeamStyle: "midline" });
assert.ok(!classicContext.operations.some(operation => operation[0] === "fill" && operation[1] === "#d3d3d3"),
    "The classic style must not use the leading dotted connector");
assert.ok(classicContext.operations.some(operation => operation[0] === "move" && operation[1] === 10),
    "The classic midline must reach the left edge");

const dottedSum = recordingContext();
rendererContext.drawNodeToContext(sumNode, dottedSum,
    { ...changedSettings, operationStyle: "dotted-parentheses" });
assert.equal(dottedSum.operations.filter(operation => operation[0] === "curve").length, 2,
    "The sum gets exactly one pair of endpoint parentheses");
const sumCurves = dottedSum.operations.filter(operation => operation[0] === "curve");
assert.ok(sumCurves[0][1] < 12 && sumCurves[1][1] > 108,
    "The parentheses must sit at the left and right endpoints");
assert.equal(dottedSum.operations.filter(operation => operation[0] === "fill" && operation[1] === "#e5e5e5").length, 2,
    "A pale dotted segment must appear on each side of the plus");
assert.ok(dottedSum.operations.some(operation => operation[0] === "move" && Math.abs(operation[1] - 60) < 5),
    "The plus must sit in the middle of the sum");

const productNode = {
    type: "prod", args: [{ type: "value" }, { type: "value" }],
    layout: { x: 0, y: 10, width: 40, height: 100, vLines: [0, 20, 40] },
    left() { return 0; }, right() { return 40; }, top() { return 10; }, bottom() { return 110; }
};
rendererContext.document = {
    createElementNS(namespace, name) {
        return {
            name, attributes: {}, children: [],
            setAttribute(key, value) { this.attributes[key] = value; },
            appendChild(child) { this.children.push(child); }
        };
    }
};
for (const [shading, edgeColor] of [
    ["gradient", "black"],
    ["gradient-gray", "#666666"],
    ["gradient-light-gray", "#bdbdbd"]
]) {
    for (const [node, beamStyle] of [[sumNode, "sumBeamStyle"], [productNode, "productBeamStyle"]]) {
        const drawing = recordingContext();
        rendererContext.drawNodeToContext(node, drawing, {
            ...settings, operationStyle: "classic", [beamStyle]: "ellipse", operationBarShading: shading
        });
        const gradient = drawing.svgElements[0]?.children[0];
        assert.ok(gradient, `${shading} must create a gradient for ${node.type}`);
        assert.deepEqual(gradient.children.map(stop => stop.attributes["stop-color"]),
            [edgeColor, "white", edgeColor], `${shading} must stay white in the middle`);
    }
}
const dottedProduct = recordingContext();
rendererContext.drawNodeToContext(productNode, dottedProduct,
    { ...changedSettings, operationStyle: "dotted-parentheses" });
assert.equal(dottedProduct.operations.filter(operation => operation[0] === "curve").length, 2,
    "The product gets exactly one rotated pair of endpoint parentheses");
const productCurves = dottedProduct.operations.filter(operation => operation[0] === "curve");
assert.ok(productCurves[0][2] < 12 && productCurves[1][2] > 108,
    "The rotated parentheses must sit at the top and bottom endpoints");
assert.equal(dottedProduct.operations.filter(operation => operation[0] === "fill" && operation[1] === "#e5e5e5").length, 2);
assert.ok(dottedProduct.operations.some(operation => operation[0] === "arc" && operation[1] === 20 && operation[2] === 60),
    "The multiplication dot must sit in the middle of the product");
const dottedOtherBarSettings = recordingContext();
rendererContext.drawNodeToContext(sumNode, dottedOtherBarSettings,
    { ...settings, operationStyle: "dotted-parentheses", sumBeamStyle: "ellipse" });
assert.deepEqual(dottedOtherBarSettings.operations, dottedSum.operations,
    "Bar appearance settings must not alter the independent dotted style");

const ExprNode = vm.runInContext("ExprNode", rendererContext);
const compact = new ExprNode("sum", [new ExprNode("value", [], "1"), new ExprNode("value", [], "1")]);
rendererContext.measureNodeWithContext(compact, {
    measureText() { return { width: 7, actualBoundingBoxAscent: 9, actualBoundingBoxDescent: 2 }; }
}, { ...settings, textFont: "20px Arial", bufferSize: 16, operationStyle: "dotted-parentheses" });
assert.ok(compact.layout.width >= rendererContext.getParenthesisMinimumSpan(settings) + 12,
    "Small sums must leave room for both endpoint parentheses and the central operator");

assert.equal(vm.runInContext("SETTINGS.childAlignment", rendererContext), "center");
function positionedParent(type, alignment) {
    const narrow = new ExprNode("value", [], "a");
    narrow.layout.width = 10;
    narrow.layout.height = 10;
    const wide = new ExprNode("value", [], "b");
    wide.layout.width = 60;
    wide.layout.height = 40;
    const parent = new ExprNode(type, [narrow, wide]);
    parent.layout.width = type === "sum" ? 60 : 114;
    parent.layout.height = type === "prod" ? 40 : 94;
    parent.layout.hLines = type === "sum" ? [0, 32, 94] : [0, 40];
    parent.layout.vLines = type === "prod" ? [0, 32, 114] : [0, 60];
    rendererContext.placeNodeWithSettings(parent, 5, 7,
        { operatorThickness: 12, bufferSize: 16, childAlignment: alignment });
    return { parent, narrow, wide };
}
assert.equal(positionedParent("sum", "center").narrow.left(), 30);
assert.equal(positionedParent("sum", "right").narrow.right(), 65,
    "Center / Right must align the narrower term with the right edge of its sum");
assert.equal(positionedParent("sum", "end").narrow.right(), 65,
    "Bottom / Right must align the narrower term with the right edge of its sum");
assert.equal(positionedParent("prod", "center").narrow.top(), 22);
assert.equal(positionedParent("prod", "right").narrow.top(), 22,
    "Center / Right must keep the shorter factor vertically centered");
assert.equal(positionedParent("prod", "end").narrow.bottom(), 47,
    "Bottom / Right must align the shorter factor with the bottom edge of its product");

for (const alignment of ["center", "right", "end"]) {
    for (const type of ["sum", "prod"]) {
        const { parent, narrow, wide } = positionedParent(type, alignment);
        const drawn = recordingContext();
        rendererContext.drawNodeToContext(parent, drawn, { ...settings, operationStyle: "odd-curve" });
        const cubics = drawn.operations.filter(operation => operation[0] === "cubic");
        assert.equal(cubics.length, 4, `The ${type} curve must pass through all four intervals`);
        const center = type === "sum"
            ? [(parent.left() + parent.right()) / 2, rendererContext.relHLine(parent, 1)]
            : [rendererContext.relVLine(parent, 1), (parent.top() + parent.bottom()) / 2];
        const expected = type === "sum" ? [
            [narrow.left(), (narrow.top() + narrow.bottom()) / 2],
            [narrow.left(), narrow.bottom()], center,
            [wide.right(), wide.top()],
            [wide.right(), (wide.top() + wide.bottom()) / 2]
        ] : [
            [(narrow.left() + narrow.right()) / 2, narrow.top()],
            [narrow.right(), narrow.top()], center,
            [wide.left(), wide.bottom()],
            [(wide.left() + wide.right()) / 2, wide.bottom()]
        ];
        assert.deepEqual(drawn.operations.find(operation => operation[0] === "move").slice(1), expected[0]);
        cubics.forEach((segment, index) => {
            assert.deepEqual(segment.slice(-2), expected[index + 1],
                `${type} must pass through each child corner and the central operator`);
        });
        assert.ok(Math.abs(cubics[1][3] + cubics[2][1] - 2 * center[0]) < 1e-9 &&
            Math.abs(cubics[1][4] + cubics[2][2] - 2 * center[1]) < 1e-9,
            "The curve must turn smoothly and symmetrically through its center");
        if (type === "prod") {
            assert.ok(drawn.operations.some(operation => operation[0] === "arc" &&
                operation[1] === center[0] && operation[2] === center[1]));
        } else {
            assert.equal(drawn.operations.filter(operation => operation[0] === "stroke").length, 2,
                "The centered plus must remain distinct from the curve");
        }
    }
}

console.log("Exploded Algebra renderer checks passed.");
