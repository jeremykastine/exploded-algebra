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

function verifyPanelTiming() {
    let nextId = 0;
    const queued = new Map();
    const log = [];
    let frame = 0;
    let scrollTop = 13;
    const context = vm.createContext({
        stepsFontRecalculationFrame: null, stepPanelScrollPending: false,
        stepPanelScrollAnimationFrame: null, stepsTextSizePreference: "medium",
        appContainer: { style: { setProperty() { log.push([frame, "font"]); } } },
        leftPanel: {
            hidden: false,
            get scrollTop() { return scrollTop; },
            set scrollTop(value) { scrollTop = value; log.push([frame, "scroll", value]); }
        },
        document: { body: { classList: { contains: () => false } } },
        calculateContextualStepsFontSizes: () => ({ medium: 20 }),
        fitStepsFontSizeToPanelWidth: size => size,
        getTwoRowPanelHeight: () => 48,
        isLandscapePanelLayout: () => false,
        isStudentPortraitPanelLayout: () => true,
        getMaximumTopPanelHeight: () => 200,
        setTopPanelHeight(height) { log.push([frame, "height", height]); },
        updateStepPanelScrollSpace() { log.push([frame, "space"]); },
        getStepPanelScrollTarget: () => 120,
        applyResponsiveMainButtonSize() { log.push([frame, "buttons"]); },
        getCurrentLevel: () => ({}),
        updateTopPanelHeight() { log.push([frame, "other-height"]); },
        requestAnimationFrame(callback) { const id = ++nextId; queued.set(id, callback); return id; },
        cancelAnimationFrame(id) { queued.delete(id); },
        STEP_PANEL_SCROLL_DURATION_MS: 2000,
        window: { matchMedia: () => ({ matches: false }) }
    });
    for (const name of ["recalculateResponsiveStepsLayout", "scheduleStepsFontSizeRecalculation", "scheduleTopPanelHeightUpdate", "animateStepPanelScroll"]) {
        loadFunction(context, player, name, 8);
    }
    function tick(timestamp = 0) {
        frame++;
        const callbacks = [...queued.values()];
        queued.clear();
        callbacks.forEach(callback => callback(timestamp));
    }
    context.scheduleTopPanelHeightUpdate();
    context.scheduleTopPanelHeightUpdate();
    context.scheduleStepsFontSizeRecalculation();
    assert.equal(queued.size, 1, "Content and resize notifications must coalesce into one layout pass");
    tick();
    assert(log.some(item => item[1] === "height") && log.some(item => item[1] === "scroll"));
    assert(log.every(item => item[0] === 1), "Font, height, padding and scroll must settle before the same paint");
    assert.equal(queued.size, 0, "Scroll correction must not leave an intermediate frame");
    assert(!log.some(item => item[1] === "other-height"), "A second height writer must not override the fitted student panel");

    for (const [pending, animation] of [[true, null], [false, 99]]) {
        context.stepPanelScrollPending = pending;
        context.stepPanelScrollAnimationFrame = animation;
        scrollTop = 0;
        context.scheduleTopPanelHeightUpdate();
        tick();
        assert.equal(scrollTop, 0, "Layout must not bypass the intentional new-step scroll animation");
    }
    context.stepPanelScrollPending = false;
    context.stepPanelScrollAnimationFrame = null;
    scrollTop = 0;
    context.animateStepPanelScroll();
    tick(0);
    assert.equal(scrollTop, 0);
    tick(1000);
    assert.equal(scrollTop, 60, "The deliberate scroll must still progress slowly over two seconds");
    tick(2000);
    assert.equal(scrollTop, 120);
    assert.equal(queued.size, 0);
    assert(player.includes("leftPanel.scrollTop = 0;\n                    stepPanelScrollPending = false;\n                    animateStepPanelScroll();"), "The purposeful scroll-to-top must remain");
}

verifyPanelTiming();
console.log("Startup visibility, static examples and panel timing checks passed.");
