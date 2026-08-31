/*
Shared Exploded Algebra SVG renderer.

This file contains only the expression data model, layout code, and SVG drawing code.
It is meant to be shared by the interactive Exploded Algebra tool and by static HTML pages such
as the story page. The interactive tool logic lives separately in exploded-algebra-tool.js.
*/

class ExprNode {
    static nextId = 1;

    constructor(type, args = [], value = null) {
        this.id = ExprNode.nextId++;
        this.type = type;
        this.args = args;
        this.value = value;
        this.layout = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            childBoxes: [],
            vLines: [],
            hLines: []
        };
    }

    isValue() {
        return this.type === "value";
    }

    left() { return this.layout.x; }
    right() { return this.layout.x + this.layout.width; }
    top() { return this.layout.y; }
    bottom() { return this.layout.y + this.layout.height; }
}

const SETTINGS = {
    padding: 15,
    flare: 7,
    marginX: 20,
    marginY: 20,
    textFont: "20px Verdana, Arial, Helvetica, sans-serif",
    expressionStrokeFill: "rgb(95,95,95)",
    selectionBlue: "rgb(80,140,255)",
    overlayAlpha: 0.25,
    previewDurationMs: 500,
    postviewDurationMs: 500,
    inverseBorderColor: "rgb(170,170,170)",
    bufferSize: 16,
    operatorThickness: 12,
    debugComponentBounds: false,
    debugComponentStroke: "rgba(70, 145, 210, 0.28)",
    debugComponentStrokeSecondary: "rgba(70, 145, 210, 0.18)",
    debugComponentLineWidth: 1,
    debugComponentBuffer: 16
};

const SVG_NS = "http://www.w3.org/2000/svg";

function copySvgState(state) {
    return {
        strokeStyle: state.strokeStyle,
        fillStyle: state.fillStyle,
        lineWidth: state.lineWidth,
        globalAlpha: state.globalAlpha,
        font: state.font,
        textAlign: state.textAlign,
        textBaseline: state.textBaseline,
        lineDash: state.lineDash.slice()
    };
}

function parseFontSize(font) {
    const match = String(font || "").match(/(\d+(?:\.\d+)?)px/);
    return match ? Number(match[1]) : 16;
}


function scaleFont(font, scale) {
    const fontSize = parseFontSize(font);
    const scaledFontSize = Math.max(1, fontSize * scale);
    return String(font || "").replace(/(\d+(?:\.\d+)?)px/, `${scaledFontSize}px`);
}

function scaledSettings(baseSettings, scale, overrides = {}) {
    return Object.assign({}, baseSettings, {
        padding: baseSettings.padding * scale,
        flare: baseSettings.flare * scale,
        marginX: baseSettings.marginX * scale,
        marginY: baseSettings.marginY * scale,
        textFont: scaleFont(baseSettings.textFont, scale),
        bufferSize: (baseSettings.bufferSize || baseSettings.debugComponentBuffer || 16) * scale,
        operatorThickness: (baseSettings.operatorThickness || baseSettings.flare * 2 || 12) * scale,
        debugComponentLineWidth: Math.max(0.5, (baseSettings.debugComponentLineWidth || 1) * scale),
        debugComponentBuffer: (baseSettings.bufferSize || baseSettings.debugComponentBuffer || 16) * scale
    }, overrides);
}

function getStructuralStrokeWidth(settings) {
    return Math.max(0.75, getOperatorThickness(settings) / 14);
}

function getOperatorCircleStrokeWidth(settings) {
    return Math.max(0.75, getOperatorThickness(settings) / 14);
}

function getOperatorIconStrokeWidth(settings) {
    return Math.max(1, getOperatorThickness(settings) * (2 / 14));
}

function getOperatorDotRadius(settings) {
    return Math.max(1.1, getOperatorThickness(settings) * (3 / 14));
}

function getOperatorThickness(settings) {
    return Math.max(4, settings.operatorThickness || settings.flare * 2 || 12);
}

function getOperatorHalfSize(settings) {
    return getOperatorThickness(settings) / 2;
}

function getInverseOperatorRadius(settings) {
    return getOperatorHalfSize(settings);
}

function getInverseBorderThickness(settings) {
    return getOperatorThickness(settings);
}

function getInverseInnerGap(settings) {
    return getComponentGap(settings);
}

function getComponentGap(settings) {
    return settings.bufferSize || settings.debugComponentBuffer || 16;
}

function isBorderedNegativeOne(node) {
    return !!node && node.type === "value" && String(node.value) === "-1";
}

function getNegOneBorderPadding(settings) {
    return Math.max(2, getOperatorThickness(settings) * 0.14);
}

function getNegOneBorderLineWidth(settings) {
    return Math.max(1, getStructuralStrokeWidth(settings));
}

function drawDebugComponentBounds(drawingContext, left, top, right, bottom, settings) {
    if (!settings.debugComponentBounds) {
        return;
    }
    const width = Math.max(0, right - left);
    const height = Math.max(0, bottom - top);
    const buffer = settings.bufferSize || settings.debugComponentBuffer || 0;
    drawingContext.save();
    drawingContext.strokeStyle = settings.debugComponentStroke || "rgba(70, 145, 210, 0.28)";
    drawingContext.lineWidth = settings.debugComponentLineWidth || 1;
    drawingContext.strokeRect(left, top, width, height);
    drawingContext.strokeStyle = settings.debugComponentStrokeSecondary || settings.debugComponentStroke || "rgba(70, 145, 210, 0.18)";
    drawingContext.strokeRect(left - buffer, top - buffer, width + buffer * 2, height + buffer * 2);
    drawingContext.restore();
}


function drawOperatorCircle(drawingContext, centerX, centerY, diameter, fillStyle, strokeStyle, lineWidth) {
    const radius = diameter / 2;
    drawingContext.save();
    drawingContext.fillStyle = fillStyle;
    drawingContext.strokeStyle = strokeStyle;
    drawingContext.lineWidth = lineWidth;
    drawingContext.beginPath();
    drawingContext.arc(centerX, centerY, radius, 0, Math.PI * 2);
    drawingContext.fill();
    drawingContext.stroke();
    drawingContext.restore();
}

let svgMeasureTextElement = null;

function measureSvgText(text, font) {
    if (!svgMeasureTextElement) {
        const measureSvg = document.createElementNS(SVG_NS, "svg");
        measureSvg.setAttribute("aria-hidden", "true");
        measureSvg.style.position = "absolute";
        measureSvg.style.left = "-10000px";
        measureSvg.style.top = "-10000px";
        measureSvg.style.width = "1px";
        measureSvg.style.height = "1px";
        measureSvg.style.overflow = "hidden";
        svgMeasureTextElement = document.createElementNS(SVG_NS, "text");
        measureSvg.appendChild(svgMeasureTextElement);
        document.body.appendChild(measureSvg);
    }

    svgMeasureTextElement.textContent = String(text ?? "");
    svgMeasureTextElement.setAttribute("style", `font: ${font};`);

    try {
        const box = svgMeasureTextElement.getBBox();
        const fontSize = parseFontSize(font);
        return {
            width: box.width || String(text ?? "").length * fontSize * 0.55,
            actualBoundingBoxLeft: Math.max(0, -box.x),
            actualBoundingBoxRight: Math.max(0, box.x + box.width),
            actualBoundingBoxAscent: Math.max(1, -box.y),
            actualBoundingBoxDescent: Math.max(1, box.y + box.height)
        };
    } catch (error) {
        const fontSize = parseFontSize(font);
        const width = String(text ?? "").length * fontSize * 0.58;
        return {
            width,
            actualBoundingBoxLeft: 0,
            actualBoundingBoxRight: width,
            actualBoundingBoxAscent: fontSize * 0.8,
            actualBoundingBoxDescent: fontSize * 0.25
        };
    }
}

function setSvgSize(svgElement, width, height) {
    const w = Math.max(1, Math.ceil(width));
    const h = Math.max(1, Math.ceil(height));
    svgElement.__svgWidth = w;
    svgElement.__svgHeight = h;
    svgElement.setAttribute("width", String(w));
    svgElement.setAttribute("height", String(h));
    svgElement.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svgElement.style.width = w + "px";
    svgElement.style.height = h + "px";
}

function getSvgWidth(svgElement) {
    return svgElement.__svgWidth || Number(svgElement.getAttribute("width")) || 1;
}

function getSvgHeight(svgElement) {
    return svgElement.__svgHeight || Number(svgElement.getAttribute("height")) || 1;
}

class SvgDrawingContext {
    constructor(svgElement) {
        this.svg = svgElement;
        this.stateStack = [];
        this.state = {
            strokeStyle: SETTINGS.expressionStrokeFill,
            fillStyle: SETTINGS.expressionStrokeFill,
            lineWidth: 1,
            globalAlpha: 1,
            font: SETTINGS.textFont,
            textAlign: "center",
            textBaseline: "middle",
            lineDash: []
        };
        this.pathCommands = [];
    }

    get strokeStyle() { return this.state.strokeStyle; }
    set strokeStyle(value) { this.state.strokeStyle = value; }
    get fillStyle() { return this.state.fillStyle; }
    set fillStyle(value) { this.state.fillStyle = value; }
    get lineWidth() { return this.state.lineWidth; }
    set lineWidth(value) { this.state.lineWidth = value; }
    get globalAlpha() { return this.state.globalAlpha; }
    set globalAlpha(value) { this.state.globalAlpha = value; }
    get font() { return this.state.font; }
    set font(value) { this.state.font = value; }
    get textAlign() { return this.state.textAlign; }
    set textAlign(value) { this.state.textAlign = value; }
    get textBaseline() { return this.state.textBaseline; }
    set textBaseline(value) { this.state.textBaseline = value; }

    save() { this.stateStack.push(copySvgState(this.state)); }
    restore() {
        if (this.stateStack.length) {
            this.state = this.stateStack.pop();
        }
    }

    setLineDash(values) {
        this.state.lineDash = Array.isArray(values) ? values.slice() : [];
    }

    setTransform() {
        // SVG draws in CSS pixels through its viewBox, so no device-pixel-ratio transform is needed.
    }

    measureText(text) {
        return measureSvgText(text, this.font);
    }

    clearRect() {
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }
    }

    beginPath() { this.pathCommands = []; }
    moveTo(x, y) { this.pathCommands.push(`M ${x} ${y}`); }
    lineTo(x, y) { this.pathCommands.push(`L ${x} ${y}`); }
    quadraticCurveTo(cx, cy, x, y) { this.pathCommands.push(`Q ${cx} ${cy} ${x} ${y}`); }
    rect(x, y, width, height) {
        this.pathCommands.push(`M ${x} ${y} H ${x + width} V ${y + height} H ${x} Z`);
    }
    arc(x, y, radius, startAngle, endAngle, counterclockwise = false) {
        const fullCircle = Math.abs(endAngle - startAngle) >= Math.PI * 2 - 0.0001;
        if (fullCircle) {
            this.pathCommands.push(`M ${x + radius} ${y} A ${radius} ${radius} 0 1 1 ${x - radius} ${y} A ${radius} ${radius} 0 1 1 ${x + radius} ${y}`);
            return;
        }

        const startX = x + radius * Math.cos(startAngle);
        const startY = y + radius * Math.sin(startAngle);
        const endX = x + radius * Math.cos(endAngle);
        const endY = y + radius * Math.sin(endAngle);
        let delta = endAngle - startAngle;
        if (!counterclockwise && delta < 0) {
            delta += Math.PI * 2;
        } else if (counterclockwise && delta > 0) {
            delta -= Math.PI * 2;
        }
        const largeArc = Math.abs(delta) > Math.PI ? 1 : 0;
        const sweep = counterclockwise ? 0 : 1;
        this.pathCommands.push(`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${endX} ${endY}`);
    }

    appendSvgElement(element) {
        this.svg.appendChild(element);
    }

    applyPaintAttributes(element, mode) {
        const opacity = this.state.globalAlpha;
        if (mode === "fill") {
            element.setAttribute("fill", this.state.fillStyle);
            element.setAttribute("stroke", "none");
        } else if (mode === "stroke") {
            element.setAttribute("fill", "none");
            element.setAttribute("stroke", this.state.strokeStyle);
            element.setAttribute("stroke-width", String(this.state.lineWidth));
            element.setAttribute("stroke-linecap", "square");
            element.setAttribute("stroke-linejoin", "round");
            if (this.state.lineDash.length) {
                element.setAttribute("stroke-dasharray", this.state.lineDash.join(" "));
            }
        }
        if (opacity !== 1) {
            element.setAttribute("opacity", String(opacity));
        }
    }

    currentPathElement(mode) {
        if (!this.pathCommands.length) {
            return null;
        }
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("d", this.pathCommands.join(" "));
        this.applyPaintAttributes(path, mode);
        return path;
    }

    fill() {
        const path = this.currentPathElement("fill");
        if (path) {
            this.appendSvgElement(path);
        }
    }

    stroke() {
        const path = this.currentPathElement("stroke");
        if (path) {
            this.appendSvgElement(path);
        }
    }

    fillRect(x, y, width, height) {
        const rect = document.createElementNS(SVG_NS, "rect");
        rect.setAttribute("x", String(x));
        rect.setAttribute("y", String(y));
        rect.setAttribute("width", String(width));
        rect.setAttribute("height", String(height));
        this.applyPaintAttributes(rect, "fill");
        this.appendSvgElement(rect);
    }

    strokeRect(x, y, width, height) {
        const rect = document.createElementNS(SVG_NS, "rect");
        rect.setAttribute("x", String(x));
        rect.setAttribute("y", String(y));
        rect.setAttribute("width", String(width));
        rect.setAttribute("height", String(height));
        this.applyPaintAttributes(rect, "stroke");
        this.appendSvgElement(rect);
    }

    fillText(text, x, y) {
        const el = document.createElementNS(SVG_NS, "text");
        el.textContent = String(text ?? "");
        el.setAttribute("x", String(x));
        el.setAttribute("y", String(y));
        el.setAttribute("fill", this.state.fillStyle);
        el.setAttribute("font", this.state.font);
        el.setAttribute("font-family", "Verdana, Arial, Helvetica, sans-serif");

        const fontSize = parseFontSize(this.state.font);
        el.setAttribute("font-size", String(fontSize));
        if (/bold/i.test(this.state.font)) {
            el.setAttribute("font-weight", "bold");
        }

        if (this.state.textAlign === "center") {
            el.setAttribute("text-anchor", "middle");
        } else if (this.state.textAlign === "right" || this.state.textAlign === "end") {
            el.setAttribute("text-anchor", "end");
        } else {
            el.setAttribute("text-anchor", "start");
        }

        if (this.state.textBaseline === "middle") {
            el.setAttribute("dominant-baseline", "central");
        } else if (this.state.textBaseline === "alphabetic") {
            el.setAttribute("dominant-baseline", "alphabetic");
        } else {
            el.setAttribute("dominant-baseline", "auto");
        }

        if (this.state.globalAlpha !== 1) {
            el.setAttribute("opacity", String(this.state.globalAlpha));
        }

        this.appendSvgElement(el);
    }
}

function createSvgContext(svgElement) {
    return new SvgDrawingContext(svgElement);
}

function miniValue(text) {
    return { type: "value", text: String(text) };
}

function miniSum(...args) {
    return { type: "sum", args };
}

function miniProd(...args) {
    return { type: "prod", args };
}

function miniExp(base, exponent) {
    return { type: "exp", base, exponent };
}

function miniInv(arg) {
    return { type: "inv", arg };
}

// The button diagrams use the same shared SVG renderer as the main workspace.
// The miniValue/miniSum/miniProd/miniExp/miniInv helpers above are only small data builders;
// they are converted to ExprNode trees and passed through renderExpressionSvgMarkup.

function layoutExpressionWithSettings(root, drawingContext, settings, x, y) {
    measureNodeWithContext(root, drawingContext, settings);
    placeNodeWithSettings(root, x, y, settings);
}

function measureNode(node) {
    measureNodeWithContext(node, ctx, SETTINGS);
}

function measureNodeWithContext(node, drawingContext, settings) {
    const p = settings.padding;
    const gap = getComponentGap(settings);
    const operatorHalf = getOperatorHalfSize(settings);

    if (node.type === "value") {
        const metrics = drawingContext.measureText(node.value);
        const textWidth = Math.abs(metrics.actualBoundingBoxLeft || 0) + Math.abs(metrics.actualBoundingBoxRight || 0);
        const textHeight = Math.abs(metrics.actualBoundingBoxAscent || 0) + Math.abs(metrics.actualBoundingBoxDescent || 0);
        node.layout.textWidth = Math.max(1, textWidth || metrics.width || 0);
        node.layout.textHeight = Math.max(1, textHeight);
        if (isBorderedNegativeOne(node)) {
            const pad = getNegOneBorderPadding(settings);
            const lineWidth = getNegOneBorderLineWidth(settings);
            node.layout.negOneBorderPad = pad;
            node.layout.negOneBorderLineWidth = lineWidth;
            node.layout.width = node.layout.textWidth + pad * 2 + lineWidth;
            node.layout.height = node.layout.textHeight + pad * 2 + lineWidth;
        } else {
            node.layout.width = node.layout.textWidth;
            node.layout.height = node.layout.textHeight;
        }
        node.layout.childBoxes = [];
        node.layout.vLines = [0, node.layout.width];
        node.layout.hLines = [0, node.layout.height];
        return;
    }

    for (const child of node.args) {
        measureNodeWithContext(child, drawingContext, settings);
    }

    if (node.type === "prod") {
        const widths = node.args.map(child => child.layout.width);
        const heights = node.args.map(child => child.layout.height);
        const separatorWidth = getOperatorThickness(settings);
        node.layout.width = widths.reduce((a, b) => a + b, 0) + (node.args.length - 1) * (separatorWidth + 2 * gap);
        node.layout.height = Math.max(...heights);

        const vLines = [0];
        let cursor = 0;
        for (let i = 0; i < node.args.length - 1; i++) {
            cursor += node.args[i].layout.width;
            vLines.push(cursor + gap + operatorHalf);
            cursor += separatorWidth + 2 * gap;
        }
        vLines.push(node.layout.width);
        node.layout.vLines = vLines;
        node.layout.hLines = [0, node.layout.height];
    } else if (node.type === "sum") {
        const widths = node.args.map(child => child.layout.width);
        const heights = node.args.map(child => child.layout.height);
        const separatorHeight = getOperatorThickness(settings);
        node.layout.width = Math.max(...widths);
        node.layout.height = heights.reduce((a, b) => a + b, 0) + (node.args.length - 1) * (separatorHeight + 2 * gap);

        const hLines = [0];
        let cursor = 0;
        for (let i = 0; i < node.args.length - 1; i++) {
            cursor += node.args[i].layout.height;
            hLines.push(cursor + gap + operatorHalf);
            cursor += separatorHeight + 2 * gap;
        }
        hLines.push(node.layout.height);
        node.layout.hLines = hLines;
        node.layout.vLines = [0, node.layout.width];
    } else if (node.type === "exp") {
        const [base, exponent] = node.args;
        node.layout.width = base.layout.width + p * 2 + exponent.layout.width;
        node.layout.height = exponent.layout.height + p * 2 + base.layout.height;
        node.layout.vLines = [0, base.layout.width + p, node.layout.width + 2 * p];
        node.layout.hLines = [0, exponent.layout.height + p, node.layout.height + 2 * p];
    } else if (node.type === "inv") {
        const [arg] = node.args;
        const operatorRadius = getInverseOperatorRadius(settings);
        const borderThickness = getInverseBorderThickness(settings);
        const innerGap = getInverseInnerGap(settings);
        const contentOffset = borderThickness + innerGap;
        node.layout.inverseOperatorRadius = operatorRadius;
        node.layout.inverseBorderThickness = borderThickness;
        node.layout.inverseInnerGap = innerGap;
        node.layout.inverseContentOffset = contentOffset;
        node.layout.width = arg.layout.width + borderThickness * 2 + innerGap * 2;
        node.layout.height = arg.layout.height + borderThickness * 2 + innerGap * 2;
        node.layout.vLines = [0, operatorRadius, contentOffset, node.layout.width];
        node.layout.hLines = [0, operatorRadius, contentOffset, node.layout.height];
    }
}

function placeNode(node, x, y) {
    placeNodeWithSettings(node, x, y, SETTINGS);
}

function placeNodeWithSettings(node, x, y, settings) {
    const p = settings.padding;
    const gap = getComponentGap(settings);
    const operatorThickness = getOperatorThickness(settings);
    node.layout.x = x;
    node.layout.y = y;
    node.layout.childBoxes = [];

    if (node.type === "value") {
        return;
    }

    if (node.type === "prod") {
        let cursorX = x;
        for (let i = 0; i < node.args.length; i++) {
            const child = node.args[i];
            const childY = y + (node.layout.height - child.layout.height) / 2;
            placeNodeWithSettings(child, cursorX, childY, settings);
            node.layout.childBoxes.push(childBox(child));
            cursorX += child.layout.width;
            if (i < node.args.length - 1) {
                cursorX += operatorThickness + 2 * gap;
            }
        }
    } else if (node.type === "sum") {
        let cursorY = y;
        for (let i = 0; i < node.args.length; i++) {
            const child = node.args[i];
            const childX = x + (node.layout.width - child.layout.width) / 2;
            placeNodeWithSettings(child, childX, cursorY, settings);
            node.layout.childBoxes.push(childBox(child));
            cursorY += child.layout.height;
            if (i < node.args.length - 1) {
                cursorY += operatorThickness + 2 * gap;
            }
        }
    } else if (node.type === "exp") {
        const [base, exponent] = node.args;
        placeNodeWithSettings(base, x + p / 2, y + node.layout.hLines[1] + p / 2, settings);
        placeNodeWithSettings(exponent, x + node.layout.vLines[1] + p / 2, y + p / 2, settings);
        node.layout.childBoxes.push(childBox(base), childBox(exponent));
    } else if (node.type === "inv") {
        const [arg] = node.args;
        const contentOffset = node.layout.inverseContentOffset || (getInverseBorderThickness(settings) + getInverseInnerGap(settings));
        placeNodeWithSettings(arg, x + contentOffset, y + contentOffset, settings);
        node.layout.childBoxes.push(childBox(arg));
    }
}

function childBox(node) {
    return [node.left(), node.top(), node.right(), node.bottom()];
}

function relVLine(node, index) {
    return node.left() + node.layout.vLines[index];
}

function relHLine(node, index) {
    return node.top() + node.layout.hLines[index];
}

function drawNodeRecursiveToContext(
    node,
    drawingContext,
    settings,
    separatorHidden = () => false,
    separatorFill = () => null,
    nodeForeground = () => null,
    separatorForeground = () => null
) {
    for (const child of node.args) {
        drawNodeRecursiveToContext(
            child,
            drawingContext,
            settings,
            separatorHidden,
            separatorFill,
            nodeForeground,
            separatorForeground
        );
    }
    drawNodeToContext(
        node,
        drawingContext,
        settings,
        separatorHidden,
        separatorFill,
        nodeForeground,
        separatorForeground
    );
}

function nodeNeedsSeparatorFlares(node) {
    if (!node || (node.type !== "sum" && node.type !== "prod") || !Array.isArray(node.args)) {
        return false;
    }
    return node.args.some(child => child && child.type !== "value");
}

function drawNodeToContext(
    node,
    drawingContext,
    settings,
    separatorHidden = () => false,
    separatorFill = () => null,
    nodeForeground = () => null,
    separatorForeground = () => null
) {
    const flare = getOperatorHalfSize(settings);
    const nodeColor = nodeForeground(node) || settings.expressionStrokeFill;

    if (node.type === "value") {
        drawValueNodeToContext(node, drawingContext, settings, nodeColor);
        return;
    }

    drawingContext.strokeStyle = nodeColor;
    drawingContext.fillStyle = nodeColor;
    drawingContext.lineWidth = getStructuralStrokeWidth(settings);

    if (node.type === "prod") {
        for (let j = 1; j < node.layout.vLines.length - 1; j++) {
            if (separatorHidden(node, j)) {
                continue;
            }
            const x = relVLine(node, j);
            const y1 = node.top();
            const y2 = node.bottom();
            const centerY = (y1 + y2) / 2;
            const operatorDiameter = flare * 2;
            const circleTop = centerY - flare;
            const circleBottom = centerY + flare;
            const operatorColor = separatorForeground(node, j - 1) || nodeColor;
            drawingContext.strokeStyle = operatorColor;
            drawingContext.fillStyle = operatorColor;

            if (nodeNeedsSeparatorFlares(node)) {
                drawingContext.beginPath();
                drawingContext.moveTo(x, circleTop);
                drawingContext.quadraticCurveTo(x, y1, x + flare, y1);
                drawingContext.lineTo(x - flare, y1);
                drawingContext.quadraticCurveTo(x, y1, x, circleTop);
                drawingContext.fill();
                drawingContext.stroke();

                drawingContext.beginPath();
                drawingContext.moveTo(x, circleBottom);
                drawingContext.quadraticCurveTo(x, y2, x + flare, y2);
                drawingContext.lineTo(x - flare, y2);
                drawingContext.quadraticCurveTo(x, y2, x, circleBottom);
                drawingContext.fill();
                drawingContext.stroke();
            }

            drawOperatorCircle(
                drawingContext,
                x,
                centerY,
                operatorDiameter,
                separatorFill(node, j - 1) || "white",
                operatorColor,
                getOperatorCircleStrokeWidth(settings)
            );

            if (nodeNeedsSeparatorFlares(node)) {
                drawDebugComponentBounds(drawingContext, x - flare, y1, x + flare, y2, settings);
            }

            drawingContext.beginPath();
            drawingContext.arc(x, centerY, getOperatorDotRadius(settings), 0, Math.PI * 2);
            drawingContext.fill();
        }
    } else if (node.type === "sum") {
        for (let j = 1; j < node.layout.hLines.length - 1; j++) {
            if (separatorHidden(node, j)) {
                continue;
            }
            const x1 = node.left();
            const x2 = node.right();
            const y = relHLine(node, j);
            const centerX = (x1 + x2) / 2;
            const operatorDiameter = flare * 2;
            const circleLeft = centerX - flare;
            const circleRight = centerX + flare;
            const operatorColor = separatorForeground(node, j - 1) || nodeColor;
            drawingContext.strokeStyle = operatorColor;
            drawingContext.fillStyle = operatorColor;
            if (nodeNeedsSeparatorFlares(node)) {
                drawingContext.beginPath();
                drawingContext.moveTo(circleLeft, y);
                drawingContext.quadraticCurveTo(x1, y, x1, y + flare);
                drawingContext.lineTo(x1, y - flare);
                drawingContext.quadraticCurveTo(x1, y, circleLeft, y);
                drawingContext.fill();
                drawingContext.stroke();

                drawingContext.beginPath();
                drawingContext.moveTo(circleRight, y);
                drawingContext.quadraticCurveTo(x2, y, x2, y + flare);
                drawingContext.lineTo(x2, y - flare);
                drawingContext.quadraticCurveTo(x2, y, circleRight, y);
                drawingContext.fill();
                drawingContext.stroke();
            }

            drawOperatorCircle(
                drawingContext,
                centerX,
                y,
                operatorDiameter,
                separatorFill(node, j - 1) || "white",
                operatorColor,
                getOperatorCircleStrokeWidth(settings)
            );

            drawingContext.beginPath();
            drawingContext.moveTo(centerX - flare / 2, y);
            drawingContext.lineTo(centerX + flare / 2, y);
            drawingContext.moveTo(centerX, y - flare / 2);
            drawingContext.lineTo(centerX, y + flare / 2);
            drawingContext.lineWidth = getOperatorIconStrokeWidth(settings);
            drawingContext.stroke();
            drawingContext.lineWidth = getStructuralStrokeWidth(settings);
            if (nodeNeedsSeparatorFlares(node)) {
                drawDebugComponentBounds(drawingContext, x1, y - flare, x2, y + flare, settings);
            }
        }
    } else if (node.type === "exp") {
        const xLeft = node.left();
        const xMid = relVLine(node, 1);
        const xRight = node.right();
        const yTop = node.top();
        const yMid = relHLine(node, 1);
        const yBottom = node.bottom();

        drawingContext.beginPath();
        drawingContext.moveTo(xLeft, yMid);
        drawingContext.quadraticCurveTo(xMid, yMid, xMid, yTop);
        drawingContext.lineTo(xMid, yMid);
        drawingContext.fill();
        drawingContext.stroke();

        drawingContext.beginPath();
        drawingContext.moveTo(xRight, yMid);
        drawingContext.quadraticCurveTo(xMid, yMid, xMid, yBottom);
        drawingContext.lineTo(xMid, yMid);
        drawingContext.fill();
        drawingContext.stroke();

        drawingContext.beginPath();
        drawingContext.moveTo(xRight, yMid);
        drawingContext.lineTo(xRight, yTop);
        drawingContext.lineTo(xMid, yTop);
        drawingContext.stroke();

        drawingContext.beginPath();
        drawingContext.moveTo(xLeft, yMid);
        drawingContext.lineTo(xLeft, yMid + flare);
        drawingContext.moveTo(xMid, yBottom);
        drawingContext.lineTo(xMid - flare, yBottom);
        drawingContext.stroke();
        drawDebugComponentBounds(drawingContext, xLeft, yTop, xRight, yBottom, settings);
    } else if (node.type === "inv") {
        const borderThickness = node.layout.inverseBorderThickness || getInverseBorderThickness(settings);
        const borderHalf = borderThickness / 2;
        const left = node.left() + borderHalf;
        const top = node.top() + borderHalf;
        const right = node.right() - borderHalf;
        const bottom = node.bottom() - borderHalf;

        drawingContext.save();
        drawingContext.strokeStyle = settings.inverseBorderColor || "rgb(170,170,170)";
        drawingContext.lineWidth = borderThickness;
        drawingContext.beginPath();
        drawingContext.rect(left, top, Math.max(0, right - left), Math.max(0, bottom - top));
        drawingContext.stroke();
        drawingContext.restore();
        drawDebugComponentBounds(drawingContext, node.left(), node.top(), node.right(), node.bottom(), settings);
    }
}

function nodeAtPath(root, path = []) {
    let node = root;
    for (const rawIndex of path) {
        const index = Number(rawIndex);
        if (!node || !Array.isArray(node.args) || !Number.isInteger(index) || index < 0 || index >= node.args.length) {
            return null;
        }
        node = node.args[index];
    }
    return node;
}

function shadingEntries(shading) {
    if (Array.isArray(shading)) {
        return shading;
    }
    if (shading && Array.isArray(shading.regions)) {
        return shading.regions;
    }
    return [];
}

// Optional static shading is supplied through render options as an array of regions.
// Paths are child-index paths from the expression root. Supported region kinds are:
//   { kind: "node", path, color }                    entire subexpression
//   { kind: "range", path, first, last, color }      adjacent terms/factors and their separators
//   { kind: "separator", path, index, color }        one + or multiplication separator
// Set convexHull to shade the convex hull of selected descendant value boxes, grouped by color.
// Each region may also include foregroundColor to recolor the affected mathematical objects.
// The same array can be supplied declaratively with data-oops-shading.
function addDescendantSeparatorFills(node, color, separatorFills) {
    if (!node) {
        return;
    }
    if (node.type === "sum" || node.type === "prod") {
        for (let index = 0; index < Math.max(0, node.args.length - 1); index++) {
            separatorFills.set(`${node.id}:${index}`, color);
        }
    }
    for (const child of node.args || []) {
        addDescendantSeparatorFills(child, color, separatorFills);
    }
}

function collectDescendantValueNodes(node, values) {
    if (!node) {
        return;
    }
    if (node.type === "value") {
        values.push(node);
        return;
    }
    for (const child of node.args || []) {
        collectDescendantValueNodes(child, values);
    }
}

function convexHull(points) {
    const uniquePoints = [...new Map(points.map(point => [`${point.x}:${point.y}`, point])).values()]
        .sort((a, b) => a.x - b.x || a.y - b.y);
    if (uniquePoints.length <= 2) {
        return uniquePoints;
    }

    const cross = (origin, a, b) =>
        (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);
    const lower = [];
    for (const point of uniquePoints) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
            lower.pop();
        }
        lower.push(point);
    }
    const upper = [];
    for (let index = uniquePoints.length - 1; index >= 0; index--) {
        const point = uniquePoints[index];
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
            upper.pop();
        }
        upper.push(point);
    }
    lower.pop();
    upper.pop();
    return lower.concat(upper);
}

function pointOnSegment(point, a, b) {
    const cross = (point.x - a.x) * (b.y - a.y) - (point.y - a.y) * (b.x - a.x);
    if (Math.abs(cross) > 0.0001) {
        return false;
    }
    return point.x >= Math.min(a.x, b.x) - 0.0001 &&
        point.x <= Math.max(a.x, b.x) + 0.0001 &&
        point.y >= Math.min(a.y, b.y) - 0.0001 &&
        point.y <= Math.max(a.y, b.y) + 0.0001;
}

function pointInPolygon(point, polygon) {
    let inside = false;
    for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
        const a = polygon[previous];
        const b = polygon[index];
        if (pointOnSegment(point, a, b)) {
            return true;
        }
        const crossesRay = (a.y > point.y) !== (b.y > point.y) &&
            point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x;
        if (crossesRay) {
            inside = !inside;
        }
    }
    return inside;
}

function addSeparatorFillsInsidePolygons(node, polygons, separatorFills) {
    if (!node) {
        return;
    }
    if (node.type === "prod") {
        for (let lineIndex = 1; lineIndex < node.layout.vLines.length - 1; lineIndex++) {
            const center = {
                x: relVLine(node, lineIndex),
                y: (node.top() + node.bottom()) / 2
            };
            for (const polygon of polygons) {
                if (pointInPolygon(center, polygon.points)) {
                    separatorFills.set(`${node.id}:${lineIndex - 1}`, polygon.color);
                }
            }
        }
    } else if (node.type === "sum") {
        for (let lineIndex = 1; lineIndex < node.layout.hLines.length - 1; lineIndex++) {
            const center = {
                x: (node.left() + node.right()) / 2,
                y: relHLine(node, lineIndex)
            };
            for (const polygon of polygons) {
                if (pointInPolygon(center, polygon.points)) {
                    separatorFills.set(`${node.id}:${lineIndex - 1}`, polygon.color);
                }
            }
        }
    }
    for (const child of node.args || []) {
        addSeparatorFillsInsidePolygons(child, polygons, separatorFills);
    }
}

function addDescendantForegrounds(node, color, nodeForegrounds, separatorForegrounds) {
    if (!node || !color) {
        return;
    }
    nodeForegrounds.set(node.id, color);
    if (node.type === "sum" || node.type === "prod") {
        for (let index = 0; index < Math.max(0, node.args.length - 1); index++) {
            separatorForegrounds.set(`${node.id}:${index}`, color);
        }
    }
    for (const child of node.args || []) {
        addDescendantForegrounds(child, color, nodeForegrounds, separatorForegrounds);
    }
}

function compileShading(root, shading) {
    const rectangles = [];
    const polygons = [];
    const separatorFills = new Map();
    const nodeForegrounds = new Map();
    const separatorForegrounds = new Map();
    const hullGroups = new Map();

    for (const entry of shadingEntries(shading)) {
        if (!entry || !entry.color) {
            continue;
        }

        const kind = entry.kind || entry.target || "node";
        const node = nodeAtPath(root, Array.isArray(entry.path) ? entry.path : []);
        if (!node) {
            continue;
        }

        if (entry.convexHull) {
            if (kind === "separator") {
                continue;
            }

            const selectedValues = [];
            if (kind === "range" && (node.type === "sum" || node.type === "prod")) {
                const first = Math.max(0, Number(entry.first));
                const last = Math.min(node.args.length - 1, Number(entry.last));
                if (!Number.isInteger(first) || !Number.isInteger(last) || first > last) {
                    continue;
                }
                for (let index = first; index <= last; index++) {
                    collectDescendantValueNodes(node.args[index], selectedValues);
                }
            } else {
                collectDescendantValueNodes(node, selectedValues);
            }

            const groupKey = entry.hullGroup || entry.color;
            if (!hullGroups.has(groupKey)) {
                hullGroups.set(groupKey, {
                    color: entry.color,
                    opacity: entry.opacity === undefined ? 1 : Math.max(0, Math.min(1, Number(entry.opacity))),
                    points: []
                });
            }
            const group = hullGroups.get(groupKey);
            const padding = Number(entry.padding) || 0;
            for (const valueNode of selectedValues) {
                const left = valueNode.left() - padding;
                const top = valueNode.top() - padding;
                const right = valueNode.right() + padding;
                const bottom = valueNode.bottom() + padding;
                group.points.push(
                    { x: left, y: top },
                    { x: right, y: top },
                    { x: right, y: bottom },
                    { x: left, y: bottom }
                );
            }
            continue;
        }

        if (kind === "separator") {
            const index = Number(entry.index);
            if ((node.type === "sum" || node.type === "prod") && Number.isInteger(index) && index >= 0 && index < node.args.length - 1) {
                separatorFills.set(`${node.id}:${index}`, entry.color);
                if (entry.foregroundColor) {
                    separatorForegrounds.set(`${node.id}:${index}`, entry.foregroundColor);
                }
            }
            continue;
        }

        let left;
        let top;
        let right;
        let bottom;

        if (kind === "range" && (node.type === "sum" || node.type === "prod")) {
            const first = Math.max(0, Number(entry.first));
            const last = Math.min(node.args.length - 1, Number(entry.last));
            if (!Number.isInteger(first) || !Number.isInteger(last) || first > last) {
                continue;
            }

            if (node.type === "sum") {
                left = node.left();
                right = node.right();
                top = node.args[first].top();
                bottom = node.args[last].bottom();
            } else {
                left = node.args[first].left();
                right = node.args[last].right();
                top = node.top();
                bottom = node.bottom();
            }

            for (let index = first; index < last; index++) {
                separatorFills.set(`${node.id}:${index}`, entry.color);
                if (entry.foregroundColor) {
                    separatorForegrounds.set(`${node.id}:${index}`, entry.foregroundColor);
                }
            }
            for (let index = first; index <= last; index++) {
                addDescendantSeparatorFills(node.args[index], entry.color, separatorFills);
                addDescendantForegrounds(
                    node.args[index],
                    entry.foregroundColor,
                    nodeForegrounds,
                    separatorForegrounds
                );
            }
        } else {
            left = node.left();
            top = node.top();
            right = node.right();
            bottom = node.bottom();
            addDescendantSeparatorFills(node, entry.color, separatorFills);
            addDescendantForegrounds(node, entry.foregroundColor, nodeForegrounds, separatorForegrounds);
        }

        const padding = Number(entry.padding) || 0;
        rectangles.push({
            left: left - padding,
            top: top - padding,
            right: right + padding,
            bottom: bottom + padding,
            color: entry.color,
            opacity: entry.opacity === undefined ? 1 : Math.max(0, Math.min(1, Number(entry.opacity)))
        });
    }

    for (const group of hullGroups.values()) {
        const points = convexHull(group.points);
        if (points.length >= 3) {
            polygons.push({
                points,
                color: group.color,
                opacity: group.opacity
            });
        }
    }

    addSeparatorFillsInsidePolygons(root, polygons, separatorFills);

    return { rectangles, polygons, separatorFills, nodeForegrounds, separatorForegrounds };
}

function drawShadingToContext(compiledShading, drawingContext) {
    for (const polygon of compiledShading.polygons || []) {
        drawingContext.save();
        drawingContext.fillStyle = polygon.color;
        drawingContext.globalAlpha = Number.isFinite(polygon.opacity) ? polygon.opacity : 1;
        drawingContext.beginPath();
        drawingContext.moveTo(polygon.points[0].x, polygon.points[0].y);
        for (let index = 1; index < polygon.points.length; index++) {
            drawingContext.lineTo(polygon.points[index].x, polygon.points[index].y);
        }
        drawingContext.lineTo(polygon.points[0].x, polygon.points[0].y);
        drawingContext.fill();
        drawingContext.restore();
    }
    for (const rectangle of compiledShading.rectangles) {
        drawingContext.save();
        drawingContext.fillStyle = rectangle.color;
        drawingContext.globalAlpha = Number.isFinite(rectangle.opacity) ? rectangle.opacity : 1;
        drawingContext.fillRect(
            rectangle.left,
            rectangle.top,
            Math.max(0, rectangle.right - rectangle.left),
            Math.max(0, rectangle.bottom - rectangle.top)
        );
        drawingContext.restore();
    }
}

function drawValueNodeToContext(node, drawingContext, settings, foregroundColor = settings.expressionStrokeFill) {
    const cx = (node.left() + node.right()) / 2;
    const cy = (node.top() + node.bottom()) / 2;
    const metrics = drawingContext.measureText(node.value);
    const tightWidth = Math.max(1, Math.abs(metrics.actualBoundingBoxLeft || 0) + Math.abs(metrics.actualBoundingBoxRight || 0) || metrics.width || 0);
    const tightHeight = Math.max(1, Math.abs(metrics.actualBoundingBoxAscent || 0) + Math.abs(metrics.actualBoundingBoxDescent || 0));
    let tightLeft = cx - tightWidth / 2;
    let tightRight = cx + tightWidth / 2;
    let tightTop = cy - tightHeight / 2;
    let tightBottom = cy + tightHeight / 2;

    if (isBorderedNegativeOne(node)) {
        const lineWidth = node.layout.negOneBorderLineWidth || getNegOneBorderLineWidth(settings);
        const borderHalf = lineWidth / 2;
        const borderLeft = node.left() + borderHalf;
        const borderTop = node.top() + borderHalf;
        const borderWidth = Math.max(0, node.layout.width - lineWidth);
        const borderHeight = Math.max(0, node.layout.height - lineWidth);
        drawingContext.save();
        drawingContext.strokeStyle = foregroundColor;
        drawingContext.lineWidth = lineWidth;
        drawingContext.beginPath();
        drawingContext.rect(borderLeft, borderTop, borderWidth, borderHeight);
        drawingContext.stroke();
        drawingContext.restore();
        tightLeft = node.left();
        tightRight = node.right();
        tightTop = node.top();
        tightBottom = node.bottom();
    }

    drawDebugComponentBounds(drawingContext, tightLeft, tightTop, tightRight, tightBottom, settings);
    drawingContext.fillStyle = foregroundColor;
    drawingContext.fillText(node.value, cx, cy);
}

function miniOopsToExprNode(node) {
    if (!node) {
        return new ExprNode("value", [], "");
    }
    if (node.type === "value") {
        return new ExprNode("value", [], String(node.text || ""));
    }
    if (node.type === "exp") {
        return new ExprNode("exp", [
            miniOopsToExprNode(node.base || miniValue("")),
            miniOopsToExprNode(node.exponent || miniValue(""))
        ], null);
    }
    if (node.type === "inv") {
        return new ExprNode("inv", [miniOopsToExprNode(node.arg || miniValue(""))], null);
    }
    if (node.type === "sum" || node.type === "prod") {
        return new ExprNode(node.type, (node.args || []).map(miniOopsToExprNode), null);
    }
    return new ExprNode("value", [], "?");
}

function renderExpressionSvgMarkup(root, options = {}) {
    const settings = Object.assign({}, SETTINGS, options.settings || {});
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("xmlns", SVG_NS);
    if (options.className) {
        svg.setAttribute("class", options.className);
    }
    if (options.role) {
        svg.setAttribute("role", options.role);
    }
    if (options.ariaHidden !== undefined) {
        svg.setAttribute("aria-hidden", String(options.ariaHidden));
    }
    if (options.focusable !== undefined) {
        svg.setAttribute("focusable", String(options.focusable));
    }

    const drawingContext = createSvgContext(svg);
    drawingContext.font = settings.textFont;
    drawingContext.textAlign = "center";
    drawingContext.textBaseline = "middle";
    layoutExpressionWithSettings(root, drawingContext, settings, settings.marginX || 0, settings.marginY || 0);
    const width = Math.ceil(root.right() + (settings.marginX || 0));
    const height = Math.ceil(root.bottom() + (settings.marginY || 0));
    setSvgSize(svg, width, height);
    drawingContext.clearRect(0, 0, width, height);
    const compiledShading = compileShading(root, options.shading);
    drawShadingToContext(compiledShading, drawingContext);
    drawNodeRecursiveToContext(
        root,
        drawingContext,
        settings,
        () => false,
        (node, separatorIndex) => compiledShading.separatorFills.get(`${node.id}:${separatorIndex}`) || null,
        node => compiledShading.nodeForegrounds.get(node.id) || null,
        (node, separatorIndex) => compiledShading.separatorForegrounds.get(`${node.id}:${separatorIndex}`) || null
    );
    return svg.outerHTML;
}

function renderMiniOopsSvg(node) {
    const expr = miniOopsToExprNode(node);
    return renderExpressionSvgMarkup(expr, {
        className: "mini-oops-svg",
        role: "img",
        ariaHidden: true,
        focusable: false,
        settings: scaledSettings(SETTINGS, 0.55, {
            expressionStrokeFill: "currentColor"
        })
    });
}


function exprFromData(data) {
    if (data instanceof ExprNode) {
        return data;
    }
    if (!data) {
        return new ExprNode("value", [], "");
    }

    const type = data.type || "value";
    if (type === "value") {
        const text = data.value ?? data.text ?? "";
        return new ExprNode("value", [], String(text));
    }

    if (type === "exp") {
        const args = Array.isArray(data.args) && data.args.length >= 2
            ? data.args
            : [data.base || { type: "value", value: "" }, data.exponent || { type: "value", value: "" }];
        return new ExprNode("exp", [exprFromData(args[0]), exprFromData(args[1])], null);
    }

    if (type === "inv") {
        const arg = Array.isArray(data.args) && data.args.length
            ? data.args[0]
            : (data.arg || { type: "value", value: "" });
        return new ExprNode("inv", [exprFromData(arg)], null);
    }

    if (type === "sum" || type === "prod") {
        const args = Array.isArray(data.args) ? data.args.map(exprFromData) : [];
        return new ExprNode(type, args, null);
    }

    return new ExprNode("value", [], "?");
}

function renderExpressionInto(target, rootOrData, options = {}) {
    const targetElement = typeof target === "string" ? document.querySelector(target) : target;
    if (!targetElement) {
        return null;
    }

    const expr = exprFromData(rootOrData);
    const markup = renderExpressionSvgMarkup(expr, options);
    targetElement.innerHTML = markup;
    const svg = targetElement.querySelector("svg");
    if (svg && options.ariaLabel) {
        svg.setAttribute("aria-label", options.ariaLabel);
    }
    return svg;
}

function renderAllInDocument(root = document) {
    const elements = root.querySelectorAll("[data-oops]");
    elements.forEach(element => {
        try {
            const data = JSON.parse(element.getAttribute("data-oops"));
            const shadingAttribute = element.getAttribute("data-oops-shading");
            renderExpressionInto(element, data, {
                className: element.getAttribute("data-oops-class") || "oops-rendered-svg",
                role: "img",
                ariaLabel: element.getAttribute("aria-label") || element.getAttribute("data-aria-label") || "Exploded Algebra expression",
                shading: shadingAttribute ? JSON.parse(shadingAttribute) : undefined,
                settings: {
                    padding: Number(element.getAttribute("data-oops-padding")) || 12,
                    flare: Number(element.getAttribute("data-oops-flare")) || 6,
                    marginX: Number(element.getAttribute("data-oops-margin-x")) || 12,
                    marginY: Number(element.getAttribute("data-oops-margin-y")) || 12,
                    textFont: element.getAttribute("data-oops-font") || "18px Verdana, Arial, Helvetica, sans-serif",
                    expressionStrokeFill: element.getAttribute("data-oops-color") || "rgb(95,95,95)"
                }
            });
        } catch (error) {
            element.textContent = "[Could not render Exploded Algebra expression.]";
            // Keep this visible in the console for debugging malformed data-oops JSON.
            console.error("ExplodedAlgebraRenderer data-oops render error", error, element);
        }
    });
}

window.ExplodedAlgebraRenderer = {
    ExprNode,
    SETTINGS,
    SVG_NS,
    createSvgContext,
    setSvgSize,
    getSvgWidth,
    getSvgHeight,
    miniValue,
    miniSum,
    miniProd,
    miniExp,
    miniInv,
    miniOopsToExprNode,
    exprFromData,
    layoutExpressionWithSettings,
    measureNodeWithContext,
    placeNodeWithSettings,
    relVLine,
    relHLine,
    nodeAtPath,
    compileShading,
    drawShadingToContext,
    drawNodeRecursiveToContext,
    drawNodeToContext,
    drawValueNodeToContext,
    renderExpressionSvgMarkup,
    renderExpressionInto,
    renderMiniOopsSvg,
    renderAllInDocument
};

// Short alias for hand-written examples in story-style pages.
window.ExplodedAlgebra = window.ExplodedAlgebraRenderer;
