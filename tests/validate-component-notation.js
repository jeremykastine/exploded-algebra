const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../exploded-algebra-tool.js'), 'utf8');
const labels = {
    children: [], dataset: {}, hidden: true,
    replaceChildren() { this.children = []; },
    appendChild(label) { this.children.push(label); }
};
const context = vm.createContext({
    window: {}, workspaceComponentNotation: labels,
    workspaceCurrentNotation: { hidden: true }, workspaceGoalNotation: { hidden: true },
    getSelectionMargin: () => 8,
    document: { createElement() {
        return { style: {}, offsetHeight: 25, offsetWidth: 120, setAttribute() {} };
    } }
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../exploded-algebra-renderer.js'), 'utf8'), context);
vm.runInContext('var ExplodedAlgebraRenderer = window.ExplodedAlgebraRenderer;', context);
for (const name of ['renderWorkspaceComponentNotation', 'positionWorkspaceComponentNotation', 'getWorkspaceContentBounds']) {
    const start = source.indexOf(`        function ${name}(`);
    const end = source.indexOf('\n        function ', start + 1);
    vm.runInContext(source.slice(start, end), context);
}
const renderer = context.window.ExplodedAlgebraRenderer;
const node = (type, ...args) => new renderer.ExprNode(type, args);
const value = text => new renderer.ExprNode('value', [], text);
const a = node('prod', value('2'), node('sum', value('x'), value('7')));
const b = node('prod', value('3'), node('sum', value('x'), value('7')), node('sum', value('y'), value('2')));
const drawingContext = { measureText: text => ({ width: String(text).length * 12, actualBoundingBoxAscent: 16, actualBoundingBoxDescent: 4 }) };
function render(root, builder = null) {
    renderer.layoutExpressionWithSettings(root, drawingContext, renderer.SETTINGS, 20, 20);
    const bounds = { left: root.left(), top: root.top(), right: root.right(), bottom: root.bottom() };
    context.getExpressionBounds = () => ({ ...bounds });
    context.renderWorkspaceComponentNotation(root, builder);
    context.positionWorkspaceComponentNotation(bounds, 25);
    return bounds;
}
const sum = node('sum', a, b);
let bounds = render(sum);
assert.equal(labels.children.length, 2, 'Only the two outer terms get labels');
assert.equal(labels.children[0].innerHTML, '2 * (x + 7)');
assert.equal(labels.children[1].innerHTML, '3 * (x + 7) * (y + 2)');
labels.children.forEach((label, index) => {
    assert.equal(parseFloat(label.style.left), bounds.right + 16 + 25);
    assert.equal(parseFloat(label.style.top) + 12.5, (sum.args[index].top() + sum.args[index].bottom()) / 2);
});
assert(context.getWorkspaceContentBounds().right > bounds.right + 120, 'Pan bounds include the right-hand labels');

const product = node('prod', node('sum', value('x'), value('7')), node('inv', node('sum', value('y'), value('3'))), value('-1'));
bounds = render(product);
assert.equal(labels.children.length, 3);
assert.equal(labels.children[1].innerHTML, '1 / (y + 3)', 'Reciprocals remain complete factors');
labels.children.forEach((label, index) => {
    assert.equal(parseFloat(label.style.left) + label.offsetWidth / 2, (product.args[index].left() + product.args[index].right()) / 2);
    assert.equal(parseFloat(label.style.top), bounds.bottom + 16 + 25 + index * 37.5);
});
assert(context.getWorkspaceContentBounds().bottom >= parseFloat(labels.children[2].style.top) + 25);

const preview = node('rewritePreview', value('6'), node('prod', value('2'), value('3')));
preview.isReplacementBuilderPreview = true;
preview.rewriteOriginalOpacity = 0.14;
render(node('sum', value('x'), preview), {});
assert(labels.children[1].innerHTML.includes('workspace-rewrite-preview'), 'Live substitution fading is preserved in component labels');
for (const root of [value('x'), node('inv', product), null]) {
    context.renderWorkspaceComponentNotation(root, null);
    assert.equal(labels.hidden, true);
    assert.equal(labels.children.length, 0, 'Old labels are removed when the outer operation changes');
}
const sequence = node('sum', value('x'), value('2'));
sequence.isBuilderSequence = true;
context.renderWorkspaceComponentNotation(sequence, {});
assert.equal(labels.hidden, true, 'An ungrouped builder sequence has no outermost operation yet');
console.log('Component notation: sum rows, staggered factor columns, pan bounds, live previews, and cleanup passed.');
