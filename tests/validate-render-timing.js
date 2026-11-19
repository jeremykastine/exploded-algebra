const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");
const intro = fs.readFileSync(path.join(projectRoot, "Introduction.html"), "utf8");
const player = fs.readFileSync(path.join(projectRoot, "exploded-algebra-tool.js"), "utf8");
function loadFunction(context, source, name, indent) {
    const start = source.search(new RegExp(`^${" ".repeat(indent)}(?:async )?function ${name}\\(`, "m"));
    assert(start >= 0, `Missing production function ${name}`);
    const tail = source.slice(start + 1);
    const next = tail.search(new RegExp(`^${" ".repeat(indent)}(?:async )?function `, "m"));
    assert(next >= 0);
    vm.runInContext(source.slice(start, start + 1 + next), context);
}

// Visibility keeps the source layout measurable while preventing the initial
// HTML from painting before the current narrative has been constructed.
assert(/body\{visibility:hidden;\}/.test(intro));
assert(/body\.narrative-ready\{visibility:visible;\}/.test(intro));
assert(intro.includes('<noscript><style>body{visibility:visible;}</style></noscript>'));
assert(intro.indexOf('document.body.appendChild(narrative)') < intro.indexOf('document.body.classList.add("narrative-ready")'));

assert(!intro.includes("IntersectionObserver"), "The introduction must not schedule diagram animation on viewport entry");
assert(!intro.includes(".animate("), "Introduction diagrams must remain static");
const staticContext = vm.createContext({});
loadFunction(staticContext, intro, "prepareStaticExamples", 4);
const frames = Array.from({ length: 4 }, () => ({ setAttribute() {} }));
const phases = {
    children: frames,
    replaceChildren(...children) { this.children = children; },
    classList: { add() {} }
};
const example = { children: [{}, phases], querySelector: () => null };
staticContext.prepareStaticExamples({ matches: () => false, querySelectorAll: () => [example] });
assert.equal(phases.children.length, 2, "Static examples must show exactly the before and after states");
assert.equal(phases.children[0], frames[1]);
assert.equal(phases.children[1], frames[2]);

const playerHtml = fs.readFileSync(path.join(projectRoot, "exploded-algebra.html"), "utf8");
function notationElement(id, offsetWidth, offsetHeight) {
    assert(playerHtml.includes(`id="${id}"`));
    return { style: {}, offsetWidth, offsetHeight, replaceChildren() { this.textContent = ""; } };
}
const current = notationElement("workspaceCurrentNotation", 40, 25);
const goal = notationElement("workspaceGoalNotation", 10, 25);
const connector = notationElement("workspaceGoalConnector", 12, 24);
let goalKatex = "5";
const playerContext = vm.createContext({
    window: {},
    SETTINGS: { expressionOutlinePadding: 16 },
    getComputedStyle: () => ({ lineHeight: "25px" }),
    workspaceCurrentNotation: current,
    workspaceGoalNotation: goal,
    workspaceGoalConnector: connector,
    ExplodedAlgebraRenderer: { expressionToCodeMarkup: node => node },
    getCurrentLevel: () => ({}),
    getWorkspaceGoalKatex: () => goalKatex,
    getExpressionBounds: () => ({ left: 20, top: 48, bottom: 120, right: 80 })
});
for (const name of ["renderWorkspaceMath", "renderWorkspaceNotation", "positionWorkspaceNotation"]) {
    loadFunction(playerContext, player, name, 8);
}
playerContext.renderWorkspaceNotation("2+3", null);
playerContext.positionWorkspaceNotation();
assert.equal(current.innerHTML, "2+3");
assert.deepEqual(current.style, { left: "20px", top: "161px" });
assert.equal(goal.textContent, "");
assert.equal(goal.hidden, true);
assert.deepEqual(goal.style, {});
assert.equal(connector.hidden, true);
assert.deepEqual(connector.style, {});

goal.offsetWidth = 100;
playerContext.positionWorkspaceNotation();
assert.deepEqual(goal.style, {}, "A legacy goal must not reserve any workspace below the expression");

goalKatex = "";
playerContext.renderWorkspaceNotation("5", null);
assert.equal(current.innerHTML, "5");
assert.equal(goal.hidden, true);
assert.equal(connector.hidden, true);

goalKatex = "2+3";
playerContext.renderWorkspaceNotation("□", { tool: "studentInitial" });
assert.equal(current.innerHTML, "□");
assert.equal(goal.textContent, "");
assert.equal(goal.hidden, true, "Building must not reveal target notation");
assert.equal(connector.hidden, true);
console.log("Startup visibility, static examples, and current-only workspace notation checks passed.");
