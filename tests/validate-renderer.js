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

const playerHtml = fs.readFileSync(path.join(projectRoot, "exploded-algebra.html"), "utf8");
const playerJs = fs.readFileSync(path.join(projectRoot, "exploded-algebra-tool.js"), "utf8");
assert(playerHtml.includes('value="nested-operator-parentheses"'));
assert(playerHtml.includes('id="operationBarStyleSelect"'));
assert(!playerHtml.includes('id="sumBarStyleSelect"'));
assert(!playerHtml.includes('id="productBarStyleSelect"'));
assert(playerHtml.includes('value="endpoint-operators"'));
assert(playerHtml.includes('value="ellipse"'));
assert(playerHtml.includes('id="operationBarShadingSelect"'));
["black", "gray", "light-gray", "gradient"].forEach(shading => {
    assert(playerHtml.includes(`value="${shading}"`), `Missing ${shading} bar shading option`);
});
assert(playerJs.includes('"nested-operator-parentheses"'));
assert(playerJs.includes('"endpoint-operators"'));
assert(playerJs.includes('"ellipse"'));
assert(playerJs.includes("SETTINGS.sumBeamStyle = normalizedStyle"));
assert(playerJs.includes("SETTINGS.productBeamStyle = normalizedStyle"));
assert(!playerJs.includes("operationBarGradientCheckbox"));
assert(
    /const operatorIconColor = useNestedOperatorParenthesesBeam\s*\? "black"/.test(rendererSource),
    "The central operator must remain black"
);
assert(
    /drawNestedOperatorParenthesesSumBeam\([\s\S]*?beamPaint,\s*beamPaint,/.test(rendererSource),
    "The optional gradient must apply to both the outer parentheses and outer operators"
);
assert.equal(vm.runInContext('getOperationBarSolidColor("black")', rendererContext), "black");
assert.equal(vm.runInContext('getOperationBarSolidColor("gray")', rendererContext), "#666666");
assert.equal(vm.runInContext('getOperationBarSolidColor("light-gray")', rendererContext), "#bdbdbd");
assert.deepEqual(
    Array.from(vm.runInContext("getEndpointOperatorCenters(0, 100, 6)", rendererContext)),
    [6, 94],
    "Endpoint operators should be inset just enough to remain visible inside the bar"
);
assert(
    /drawEndpointProductOperators\(drawingContext, x, y1, y2, flare, "white"\)/.test(rendererSource),
    "The endpoint multiplication symbols must be white"
);
assert(
    /drawEndpointSumOperators\(drawingContext, x1, x2, y, flare, "white"\)/.test(rendererSource),
    "The endpoint addition symbols must be white"
);
assert(
    /useEndpointOperatorsBeam[\s\S]*?createProductBeamGradient/.test(rendererSource) &&
        /useEndpointOperatorsBeam[\s\S]*?createSumBeamGradient/.test(rendererSource),
    "The endpoint-operator style must support gradient shading"
);
assert(
    /drawFilledEllipse\(drawingContext, x, centerY, flare, Math\.max\(0, y2 - y1\) \/ 2, beamPaint\)/.test(rendererSource),
    "The product ellipse must be tangent to every side of its separator container"
);
assert(
    /drawFilledEllipse\(drawingContext, centerX, y, Math\.max\(0, x2 - x1\) \/ 2, flare, beamPaint\)/.test(rendererSource),
    "The sum ellipse must be tangent to every side of its separator container"
);
assert(
    /const centeredOperatorIconColor = useEllipseBeam \? "white" : operatorIconColor/.test(rendererSource),
    "The ellipse style must keep its centered operation white"
);
assert(
    /useEllipseBeam[\s\S]*?createProductBeamGradient/.test(rendererSource) &&
        /useEllipseBeam[\s\S]*?createSumBeamGradient/.test(rendererSource),
    "The ellipse style must support gradient shading"
);

console.log("Exploded Algebra renderer checks passed.");
