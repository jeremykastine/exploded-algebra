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

assert(player.includes("function renderWorkspaceConventionalLine()"));
assert(player.includes('appendWorkspaceConventionalText("Target expression:")'));
assert(player.includes("function positionWorkspaceConventionalLine()"));
console.log("Startup visibility, static examples, and workspace target-line checks passed.");
