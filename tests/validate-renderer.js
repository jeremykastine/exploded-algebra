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

// Each axis can be chosen independently in either orientation.
const settings = {
    operatorThickness: 12, expressionStrokeFill: "black", bufferSize: 16,
    sumBeamStyle: "thick", productBeamStyle: "thick",
    operationBarShading: "gradient", operationStyle: "bare", operationSize: "100"
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
        rect(...args) { operations.push(["pathRect", ...args]); },
        ellipse(...args) { operations.push(["ellipse", ...args]); },
        appendSvgElement(element) { this.svgElements.push(element); },
        fillRect(...args) { operations.push(["rect", this.fillStyle, ...args]); },
        stroke() { operations.push(["stroke", this.strokeStyle, this.lineWidth]); },
        fill() { operations.push(["fill", this.fillStyle]); }
    };
}
function parent(type, complex) {
    const args = complex ? [{ type: "prod" }, { type: "value" }] : [{ type: "value" }, { type: "value" }];
    return {
        type, args,
        layout: { x: 10, y: 10, width: 100, height: 100, hLines: [0, 50, 100], vLines: [0, 50, 100] },
        left() { return 10; }, right() { return 110; }, top() { return 10; }, bottom() { return 110; }
    };
}
rendererContext.document = {
    createElementNS(namespace, name) {
        return {
            name, attributes: {}, children: [],
            setAttribute(key, value) { this.attributes[key] = value; },
            appendChild(child) { this.children.push(child); }
        };
    }
};
const shapes = ["thick", "endpoint-operators", "ellipse", "flared", "midline",
    "nested-parentheses", "nested-operator-parentheses", "outward-parentheses"];
const shadings = ["black", "gray", "light-gray", "gradient", "gradient-gray", "gradient-light-gray"];
for (const type of ["sum", "prod"]) {
    const complex = parent(type, true);
    const simple = parent(type, false);
    for (const shape of shapes) {
        for (const shading of shadings) {
            const drawing = recordingContext();
            rendererContext.drawNodeToContext(complex, drawing, {
                ...settings, [type === "sum" ? "sumBeamStyle" : "productBeamStyle"]: shape,
                operationBarShading: shading
            });
            assert.ok(drawing.operations.length > 0, `${type}/${shape}/${shading} must draw`);
            assert.ok(drawing.operations.some(op => op[0] === "rect" && op[1] === "white"),
                "The bar must leave a white reserved area for the black operation");
            if (shading.startsWith("gradient")) {
                const gradient = drawing.svgElements[0]?.children[0];
                assert.ok(gradient, `${type}/${shape}/${shading} must use the chosen gradient`);
                const edge = shading === "gradient-gray" ? "#666666" :
                    shading === "gradient-light-gray" ? "#bdbdbd" : "black";
                assert.deepEqual(gradient.children.map(stop => stop.attributes["stop-color"]),
                    [edge, "white", "white", edge]);
                assert.deepEqual(gradient.children.map(stop => stop.attributes.offset),
                    ["0%", "33.333333%", "66.666667%", "100%"],
                    "The middle third of each gradient stays white");
            }
        }
        const simpleDraw = recordingContext();
        rendererContext.drawNodeToContext(simple, simpleDraw, {
            ...settings, [type === "sum" ? "sumBeamStyle" : "productBeamStyle"]: shape,
            operationBarShading: "black"
        });
        assert.equal(simpleDraw.svgElements.length, 0);
        assert.ok(!simpleDraw.operations.some(op => op[0] === "rect"),
            `A simple ${type} must omit the ${shape} bar`);
    }
    for (const operationStyle of ["bare", "outlined", "filled"]) {
        for (const operationSize of ["100", "75", "50"]) {
            const drawing = recordingContext();
            rendererContext.drawNodeToContext(simple, drawing, {
                ...settings, operationStyle, operationSize, operationBarShading: "light-gray"
            });
            const circles = drawing.operations.filter(op => op[0] === "arc");
            assert.equal(circles.length, operationStyle === "bare" && type === "sum" ? 0 :
                operationStyle === "bare" ? 1 : type === "prod" ? 2 : 1);
            if (operationStyle !== "bare") {
                assert.ok(Math.abs(circles[0][3] - 6 * Number(operationSize) / 100) < 1e-9);
            }
            assert.ok(drawing.operations.some(op => (op[0] === "stroke" || op[0] === "fill") &&
                op[1] === (operationStyle === "filled" ? "white" : "black")),
                `The ${operationStyle} operation must have the right ink`);
        }
    }
}
const ExprNode = vm.runInContext("ExprNode", rendererContext);
const compact = new ExprNode("sum", [new ExprNode("value", [], "1"), new ExprNode("value", [], "1")]);
rendererContext.measureNodeWithContext(compact, {
    measureText() { return { width: 7, actualBoundingBoxAscent: 9, actualBoundingBoxDescent: 2 }; }
}, { ...settings, textFont: "20px Arial" });
assert.ok(compact.layout.width >= 12, "Simple sums reserve space for the chosen operation");

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

console.log("Exploded Algebra renderer checks passed.");
