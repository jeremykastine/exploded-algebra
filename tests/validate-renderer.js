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
        operations,
        save() {}, restore() {}, beginPath() {},
        moveTo(...args) { operations.push(["move", ...args]); },
        lineTo(...args) { operations.push(["line", ...args]); },
        arc(...args) { operations.push(["arc", ...args]); },
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

console.log("Exploded Algebra renderer checks passed.");
