const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const indexHtml = fs.readFileSync(path.resolve(__dirname, "..", "index.html"), "utf8");
const exercisesHtml = fs.readFileSync(path.resolve(__dirname, "..", "Exercises.html"), "utf8");
const playerHtml = fs.readFileSync(path.resolve(__dirname, "..", "exploded-algebra.html"), "utf8");
const playerJs = fs.readFileSync(path.resolve(__dirname, "..", "exploded-algebra-tool.js"), "utf8");
const introductionHtml = fs.readFileSync(path.resolve(__dirname, "..", "Introduction.html"), "utf8");
const htmlFileNames = fs.readdirSync(path.resolve(__dirname, ".."))
    .filter(fileName => fileName.toLowerCase().endsWith(".html"));
const lastUpdatedCss = fs.readFileSync(path.resolve(__dirname, "..", "last-updated.css"), "utf8");

const lastUpdatedValues = htmlFileNames.map(fileName => {
    const html = fs.readFileSync(path.resolve(__dirname, "..", fileName), "utf8");
    const match = html.match(/<p class="page-last-updated">Last updated: <time datetime="([^"]+)">([^<]+ (?:EDT|EST))<\/time><\/p>/);
    assert(match, `${fileName} must show its tiny top-right Last updated timestamp in Eastern time`);
    assert(html.includes('href="last-updated.css?v='), `${fileName} must load the shared Last updated styling`);
    return `${match[1]}|${match[2]}`;
});
assert(new Set(lastUpdatedValues).size === 1, "Every HTML page must carry the same current Last updated timestamp");
assert(/\.page-last-updated \{[\s\S]*?position: fixed;[\s\S]*?top: max\(3px,[\s\S]*?right: max\(5px,[\s\S]*?font-size: 9px;[\s\S]*?pointer-events: none;/.test(lastUpdatedCss), "The shared Last updated marker must remain tiny, fixed in the top-right, and noninteractive");
const indexChoices = Array.from(indexHtml.matchAll(/<a class="choice" href="([^"]+)">([^<]+)<\/a>/g), match => ({ href: match[1], label: match[2] }));
assert.deepEqual(indexChoices, [
    { href: "exploded-algebra.html", label: "Use Exploded Algebra" },
    { href: "Introduction.html", label: "Learn About Exploded Algebra" }
], "The landing page must offer only the player and introduction");
assert(indexHtml.includes("Welcome to Exploded Algebra") && indexHtml.includes("Introduction.html"), "The landing page must welcome users and provide the introduction");
assert(exercisesHtml.includes('id="customLevelFileInput"') && !exercisesHtml.includes("builtInLevelData"),
    "The exercise launcher must provide file uploads without the old bundled moves");
assert(!exercisesHtml.includes("high, medium, or low assistance"), "The removed assistance levels must not be listed");
assert(!playerHtml.includes("data-assistance-level") && !playerHtml.includes(">High</button>") && !playerHtml.includes(">Medium</button>") && !playerHtml.includes(">Low</button>"), "The old three-level assistance prompt must be removed");
assert(playerJs.includes("const ASSISTANCE_MODES") && !playerJs.includes("ASSISTANCE_LEVELS"), "The player must use the two-mode assistance model");
assert(!playerJs.includes("ASSISTANCE_MODES.unguided"), "The player must offer only Free Play and Guided Replay");
assert(!playerJs.includes("finalOnlyMode") && !playerJs.includes("ASSISTANCE_MODES.low"), "The removed low/final-only behavior must not remain");
assert(playerHtml.includes('grid-template-columns: repeat(6, minmax(0, 1fr));'));
assert(playerHtml.includes('grid-template-rows: repeat(4, minmax(0, 1fr));'));
const workspaceMenu = playerHtml.match(/id="workspaceUtilityMenuItems"[^>]*>([\s\S]*?)<\/div>/)[1];
for (const label of ["Reset", "Free Play / New Expression", "Guided Replay…", "Share / Download Moves…"]) {
    assert(workspaceMenu.includes(">" + label + "</button>"), "Workspace menu must provide " + label);
}
assert.equal((workspaceMenu.match(/role="menuitem"/g) || []).length, 4);
assert(!playerHtml.includes('id="restartProblemDialog"') && !playerHtml.includes('id="settingsPanel"'));
assert(!playerHtml.includes('id="exerciseCompletionPanel"') && !playerHtml.includes('id="modeChoiceBackdrop"'));
assert(playerJs.includes('startLoadedLevel(assistanceModeFromQueryString());'));
assert(
    !playerHtml.includes('id="preSelectionControlsPanel"') && playerHtml.includes('id="bottomControlsPanel"') &&
        playerHtml.includes('class="palette-content"') &&
        !playerHtml.includes('id="bottomPanelResizeHandle"'),
    "The app must provide one integrated floating palette without the old pre-selection panel or bottom divider"
);
assert(
    /The expression workspace fills the screen[\s\S]*?\.app-container,[\s\S]*?grid-template-columns: minmax\(0, 1fr\) !important;[\s\S]*?grid-template-rows: minmax\(0, 1fr\) !important;/.test(playerHtml),
    "The pannable notation group and foreground palette must leave the workspace at full-screen size"
);
assert(/\.main-action-panel \{[\s\S]*?overflow: visible;/.test(playerHtml), "The top Commute button must not be clipped by the action-panel boundary");
assert(
    /The expression workspace fills the screen[\s\S]*?\.bottom-controls-panel \{[\s\S]*?position: fixed;[\s\S]*?inset: auto max\(0\.65rem, env\(safe-area-inset-right\)\) max\(0\.65rem, env\(safe-area-inset-bottom\)\) auto;[\s\S]*?pointer-events: auto;/.test(playerHtml),
    "The controls palette must remain fixed and interactive at the lower-right"
);
assert(
    /\.palette-content > \.quadrant-tools,[\s\S]*?\.palette-content > \.main-action-panel,[\s\S]*?align-self: stretch;[\s\S]*?width: 100%;[\s\S]*?height: 100%;/.test(playerHtml),
    "All control modes must fill the floating palette's shared footprint"
);
assert(
    playerHtml.indexOf('id="bottomControlsPanel"') < playerHtml.indexOf('class="quadrant-tools"') &&
        playerHtml.indexOf('class="quadrant-tools"') < playerHtml.indexOf('id="workspaceToolbar"') &&
        playerHtml.indexOf('id="workspaceToolbar"') < playerHtml.indexOf('id="mainActionPanel"') &&
        playerHtml.indexOf('id="mainActionPanel"') < playerHtml.indexOf('id="builderKeypadPanel"') &&
        playerHtml.indexOf('id="builderKeypadPanel"') < playerHtml.indexOf('data-palette-resize="nw"') &&
        playerHtml.indexOf('data-palette-resize="nw"') < playerHtml.indexOf('id="mainArea"'),
    "The permanent workspace row and action modes must be inside the integrated palette"
);
assert(
    /\.palette-content \{[\s\S]*?grid-template-columns: repeat\(6, minmax\(0, 1fr\)\);[\s\S]*?grid-template-rows: repeat\(5, minmax\(0, 1fr\)\);/.test(playerHtml) &&
        /\.palette-content > \.quadrant-tools,[\s\S]*?\.palette-content > \.main-action-panel,[\s\S]*?\.palette-content > \.builder-keypad-panel \{[\s\S]*?grid-template-columns: subgrid;[\s\S]*?grid-template-rows: subgrid;/.test(playerHtml),
    "The integrated palette must retain one permanent row above the four-by-six mode grid"
);
assert(playerHtml.includes('data-palette-resize="nw"'), "The controls palette must resize from its upper-left corner");
assert(!playerHtml.includes("data-palette-move="), "The fixed controls palette must not have move handles");
for (const corner of ["ne", "se", "sw"]) {
    assert(!playerHtml.includes(`data-palette-resize="${corner}"`), `The controls palette must not retain its ${corner} resize handle`);
}
assert(
    playerHtml.includes('id="workspaceNotationLayer"') && playerHtml.includes('id="workspaceCurrentNotation"') &&
        playerHtml.includes('id="workspaceGoalNotation"') && playerHtml.includes('id="workspaceGoalConnector"') &&
        /\.workspace-conventional-line \{[^}]*white-space: nowrap;/.test(playerHtml),
    "Current and goal notation must each occupy a single line"
);
assert(!playerHtml.includes('id="topPanelResizeHandle"'), "The removed conventional box must not retain a resize handle");
assert(/\.left-panel,[\s\S]*?\.top-panel-resize-handle \{ display: none !important; \}/.test(playerHtml), "The former conventional history box must remain absent");
assert(playerJs.includes('const FLOATING_PALETTE_STORAGE_KEY = "explodedAlgebraFixedPaletteV3"'), "The five-row controls palette must remember its size independently of the former layout");
assert(/function setFloatingPaletteRect\([\s\S]*?const left = bounds\.right - width;[\s\S]*?const top = bounds\.bottom - height;/.test(playerJs), "Palette sizing must preserve its lower-right anchor");

assert(!introductionHtml.includes("intro-levels/") && introductionHtml.includes('creativeLink.href = "exploded-algebra.html"'),
    "The introduction must link to the default player");
assert(introductionHtml.includes('const inverse = argument => ({ type: "inv"'), "The expanded Introduction must render inverse expressions");
assert(introductionHtml.includes('const negativeSection = addSection("Negatives and the negative unit"') && introductionHtml.includes('const exponentSection = addSection("Exponents as repeated multiplication"') && introductionHtml.includes('const inverseSection = addSection("Division and the inverse operator"'), "The three former outlines must be full narrative sections");
assert(playerHtml.includes('id="workspaceUtilityMenuToggle"') && !playerHtml.includes('id="settingsButton"'), "The workspace menu must omit settings");
assert(!playerHtml.includes('data-workspace-setting='), "All settings controls must be removed");
assert(!playerHtml.includes('data-workspace-setting="steps-text-size"'), "The removed conventional history panel must not retain a text-size setting");
assert(!playerHtml.includes('data-workspace-setting="child-alignment"'));
assert(!playerJs.includes('CHILD_ALIGNMENT_STORAGE_KEY'));
assert(!/data-workspace-setting="bar-(shape|shading)"/.test(playerHtml), "Bar appearance must use the renderer defaults");
assert(!/left-handed|handedness-toggle|handedness-choice/i.test(playerHtml) && !playerJs.includes("setLeftHandedLayout"), "The obsolete left-handed layout must be fully removed");
assert(!playerJs.includes("function openSettingsPanel()"), "The removed Settings screen must not have an opener");
for (const [selector, column] of [["zoomIn", 1], ["zoomOut", 2], ["resetZoom", "3 / span 2"], ["undoExpression", "5 / span 2"]]) {
    assert(playerHtml.includes(`.bottom-controls-panel .workspace-toolbar [data-workspace-action="${selector}"] { grid-column: ${column}; grid-row: 1 !important; }`));
}
const workspaceToolbar = playerHtml.match(/id="workspaceToolbar"[^>]*>([\s\S]*?)<\/div>/)[1];
assert.deepEqual(Array.from(workspaceToolbar.matchAll(/<button[^>]*data-workspace-action="([^"]+)"/g), match => match[1]),
    ["zoomIn", "zoomOut", "resetZoom", "undoExpression"]);
assert.equal((workspaceToolbar.match(/<button\b/g) || []).length, 4, "The toolbar must omit the gesture mode buttons");
assert(/\.palette-content > \.quadrant-tools \{[\s\S]*?grid-row: 1 !important;[\s\S]*?display: grid !important;/.test(playerHtml), "The workspace toolbar must remain visible above post-selection and builder controls");
assert(
    /if \(builderActive\) \{\s*renderLevelInfo\(currentLevelIndex\);/.test(playerJs),
    "Every Expression Builder refresh must update the live conventional workspace line"
);
assert(!playerHtml.includes("cancel-selection-button") && !playerJs.includes("data-cancel-selection"), "The action grid must not include a Cancel Selection button");
assert(playerHtml.includes('.main-action-panel .intent-category-actions > [data-contextual-commute="commuteFactors"] { grid-column: 2 / span 2; grid-row: 3; }'));
assert(playerHtml.includes('.main-action-panel .intent-category-actions > [data-contextual-numerical-rewrite] { grid-column: 4 / span 2; grid-row: 3; }'));
assert(playerHtml.includes('.main-action-panel .intent-category-actions > [data-contextual-commute="commuteTerms"] { grid-column: 6; grid-row: 3 / span 2; }'));
const expectedContextualButtonPositions = [
    ["multiplicative-inverse", "1", "1 / span 2"],
    ["double-inverse", "2", "1 / span 2"],
    ["zero-product", "3", "1 / span 2"],
    ["multiplicative-identity", "4", "1 / span 2"],
    ["additive-inverse", "5", "1 / span 2"],
    ["additive-identity", "6", "1 / span 2"],
    ["inverse", "1", "3 / span 2"],
    ["distribute-left", "2 / span 2", "4"],
    ["distribute-right", "4 / span 2", "4"]
];
expectedContextualButtonPositions.forEach(([pair, column, row]) => {
    assert(
        playerHtml.includes(`.main-action-panel .intent-category-actions > [data-contextual-rule-pair="${pair}"] { grid-column: ${column}; grid-row: ${row}; }`),
        `Contextual control ${pair} must occupy column ${column}, row ${row}`
    );
});
assert(/\.quadrant-tools \.workspace-toolbar,[\s\S]*?grid-template-columns: repeat\(6, minmax\(0, 1fr\)\);[\s\S]*?grid-template-rows: repeat\(4, minmax\(0, 1fr\)\);[\s\S]*?width: 100%;[\s\S]*?height: 100%;/.test(playerHtml));
assert(/\.main-action-panel \.intent-category-actions \{[\s\S]*?grid-template-columns: repeat\(6, minmax\(0, 1fr\)\);[\s\S]*?grid-template-rows: repeat\(4, minmax\(0, 1fr\)\);/.test(playerHtml));

assert(playerJs.includes("function isPointInsideCurrentSelection(x, y)"), "Selection presses must use the highlighted selection bounds");
assert(playerJs.includes("function isPointInsideExpression(x, y)"), "Selection presses must distinguish the expression from surrounding workspace");
assert(/function handleWorkspaceTap\(event, start\) \{[\s\S]*?isPointInsideCurrentSelection\(x, y\) \|\| !isPointInsideExpression\(x, y\)[\s\S]*?cancelCurrentWorkspaceSelection\(\)/.test(playerJs), "Pressing inside the current selection or outside the expression must clear it");
assert(!playerHtml.includes("workspaceSelectionDragRect") && !playerJs.includes("findWorkspaceRectangleTarget"),
    "Expression selection must only use taps");
assert(!playerJs.includes('action === "cancelSelection"'), "The old Cancel Selection action must be removed");
const expectedDirectRules = [
    ['distributeLeftToRight', 'Distribute left'],
    ['factorLeft', 'Factor left'],
    ['factorRight', 'Factor right'],
    ['distributeRightToLeft', 'Distribute right'],
    ['distributeInverseOverProduct', 'Separate inverse'],
    ['factorProductOfInverses', 'Combine inverses']
];
expectedDirectRules.forEach(([tool, label]) => {
    assert(
        playerJs.includes(`{ tool: "${tool}", label: "${label}" }`),
        `${label} must be rendered as a direct branching-rule button`
    );
});
assert(playerJs.includes('{ tool: "insertIdentityAddZeroBottom", label: "Add zero", icon: "A+0" }'));
assert(playerJs.includes('{ tool: "insertIdentityMultiplyByOneRight", label: "Multiply by one", icon: "A·1" }'));
assert(playerJs.includes('{ tool: "cancelOpposites", label: "Introduce additive inverses", icon: "A−A", variant: "insert" }'));
assert(playerJs.includes('{ tool: "replaceOneWithInverseProduct", label: "Introduce multiplicative inverses", icon: "A÷A" }'));
assert(playerJs.includes('{ tool: "eliminateIdentities", label: "Remove additive identity", icon: "A", variant: "additive" }'));
assert(playerJs.includes('{ tool: "eliminateIdentities", label: "Remove multiplicative identity", icon: "A", variant: "multiplicative" }'));
assert(playerJs.includes('{ tool: "cancelOpposites", label: "Cancel additive inverses", icon: "0", variant: "delete" }'));
assert(playerJs.includes('{ tool: "cancelProductWithInverse", label: "Cancel multiplicative inverses", icon: "1" }'));
assert(playerJs.includes('{ tool: "insertDoubleInverse", label: "Introduce double inverse", icon: "÷÷A", category: "insert", slot: "double-inverse-insert" }'));
assert(playerJs.includes('{ tool: "eliminateDoubleInverse", label: "Cancel double inverse", icon: "A", category: "delete", slot: "double-inverse-cancel" }'));
assert(playerJs.includes('{ tool: "insertZeroProductRight", label: "Introduce zero product", icon: "A·0", category: "insert", slot: "zero-product-insert" }'));
assert(playerJs.includes('{ tool: "zeroProduct", label: "Cancel zero product", icon: "0", category: "delete", slot: "zero-product-cancel" }'));
assert(!playerJs.includes('data-direct-inverse-number-slot'));
assert(playerJs.includes('function buildContextualCommuteButtonHtml(toolName)'));
assert(playerJs.includes('buildDirectCommuteIconHtml(addition ? "+" : "·")'));
assert(playerJs.includes('class="intent-category-button contextual-numerical-rewrite-button" data-contextual-numerical-rewrite'));
assert(playerJs.includes('aria-label="Numerical Manipulation" title="Numerical Manipulation"'));
assert(playerJs.includes('<span class="contextual-numerical-rewrite-label">123</span>'));
assert(playerJs.includes('buildContextualCommuteButtonHtml("commuteTerms")') && playerJs.includes('buildContextualCommuteButtonHtml("commuteFactors")'));
assert(playerJs.includes('function buildContextualRuleButtonHtml(pairName, orientation, label, firstVisualHtml, secondVisualHtml)'));
assert(playerJs.includes('function buildDirectOptionRulePairHtml(pairName, firstRule, firstCategory, secondRule, secondCategory, label)'));
assert(!playerJs.includes('const categoryIds = ["numericalRewrite", "commute"];'));
assert(playerJs.includes('function isDirectRuleButtonApplicable(button, toolName)'));
assert(playerJs.includes('identityData.kind === "sum"') && playerJs.includes('identityData.kind === "prod"'));
assert(!playerJs.includes('data-remaining-actions-menu') && !playerHtml.includes('remaining-actions-menu-button'));
assert(!playerHtml.includes('direct-rule-icon.crossed-out'));
assert(playerJs.includes('function buildDirectBranchRulePairHtml(pairName, orientation, firstTool, secondTool, options = {})'));
assert(playerJs.includes('function buildBranchPairOverlayHtml(pairName)'));
assert(playerJs.includes('function buildReversePairOverlayHtml(pairName, orientation)'));
['double-inverse', 'zero-product', 'additive-identity', 'multiplicative-identity', 'additive-inverse', 'multiplicative-inverse'].forEach(pair => {
    assert(playerJs.includes(`"${pair}"`), `${pair} must have a two-way relationship arrow`);
});
assert(playerJs.includes('M50 88 V118 M43 96 L50 88 L57 96 M43 110 L50 118 L57 110'));
assert(playerJs.includes('M88 82 H118 M96 75 L88 82 L96 89 M110 75 L118 82 L110 89'));
assert(/\.main-action-panel \.reverse-pair-overlay \{[\s\S]*?pointer-events: none;/.test(playerHtml));
assert(!playerHtml.includes('.main-action-panel .split-rule-frame'));
assert(playerJs.includes('data-contextual-rule-pair="${pairName}"'));
assert(playerJs.includes('class="contextual-rule-side contextual-rule-side-first"'));
assert(playerJs.includes('class="contextual-rule-side contextual-rule-side-second"'));
assert(!/\.main-action-panel \.intent-category-actions > button\.direct-branch-rule-button,[^}]*\bwidth:/.test(playerHtml));
assert(!/\.main-action-panel \.intent-category-actions > button\.direct-branch-rule-button,[^}]*\bheight:/.test(playerHtml));
assert(playerJs.includes('data-branch-pair="left"') && playerJs.includes('data-branch-pair="right"') && playerJs.includes('data-branch-pair="inverse"'));
assert(playerJs.includes('M200 50 H250 C300 50 300 25 350 25 H400 M200 50 H250 C300 50 300 75 350 75 H400'));
assert(playerJs.includes('M200 25 H250 C300 25 300 50 350 50 H400 M200 75 H250 C300 75 300 50 350 50 H400'));
assert(playerJs.includes('M50 200 V250 C50 300 28 300 28 350 V400 M50 200 V250 C50 300 72 300 72 350 V400'));
assert(!playerJs.includes('class="branch-arrowhead"'));
assert(playerHtml.includes('transform: translateY(-16.6667%)') && playerHtml.includes('transform: translateY(16.6667%)'));
assert(playerHtml.includes('transform: translateX(-16.6667%)') && playerHtml.includes('transform: translateX(16.6667%)'));
assert(playerJs.includes('M22 29 H78 M68 19 L78 29 L68 39') && playerJs.includes('M78 71 H22 M32 61 L22 71 L32 81'));
assert(playerJs.includes('M70 78 V22 M60 32 L70 22 L80 32') && playerJs.includes('M30 22 V78 M20 68 L30 78 L40 68'));
assert(!playerJs.includes('buildDirectBranchRulePairHtml("distribute-left", "horizontal", "factorLeft", "distributeLeftToRight", { branch: true, reverse: true'));
assert(!playerJs.includes('buildDirectBranchRulePairHtml("distribute-right", "horizontal", "distributeRightToLeft", "factorRight", { branch: true, reverse: true'));
assert(/\.main-action-panel \.branch-pair-overlay \{[\s\S]*?pointer-events: none;/.test(playerHtml));
assert(playerJs.includes('function resolveContextualRulePair(pairName)'));
assert(playerJs.includes('if (canFactorProductOfInverses())') && playerJs.includes('if (canDistributeInverseOverProduct())'));
assert(playerJs.includes('if (canEliminateDoubleInverse())') && playerJs.includes('return canInsertDoubleInverse()'));
assert(playerJs.includes('if (canZeroProduct())') && playerJs.includes('return canInsertZeroProduct()'));
assert(playerJs.includes('if (getCancelOppositesData())') && playerJs.includes('canReplaceZeroWithOppositeSum()'));
assert(playerJs.includes('if (canCancelProductWithInverse())') && playerJs.includes('canReplaceOneWithInverseProduct()'));
assert(playerJs.includes('button[data-contextual-rule-pair]') && playerJs.includes('activateTool(resolved.toolName)') &&
    playerJs.includes('recordToolForSolution(toolName, beforeExpression)'));
assert(playerJs.includes('function resolveContextualCommuteTool(toolName = "")'));
assert(playerJs.includes('selection.node.type === "sum"') && playerJs.includes('toolName: "commuteTerms"'));
assert(playerJs.includes('selection.node.type === "prod"') && playerJs.includes('toolName: "commuteFactors"'));
assert(!playerJs.includes("getNumericalRewriteProfile") &&
    !playerJs.includes("getNumericalRestrictionsTreeHtml"), "The player must omit the former permission matrix");
assert(playerJs.includes('function resolveContextualNumericalRewriteAction()') &&
    playerJs.includes("getPrescribedNumericalRewriteChoices"),
    "Numerical Manipulation must surface recorded choices in prescribed mode");
assert(!playerJs.includes('installPressHoldDescriptions') && !playerJs.includes('getPressHoldDescriptionHtml') && !playerHtml.includes('data-hold-description='), "Long-hold information handlers and attributes must be removed");
assert(playerJs.includes('resolveContextualCommuteTool(button.dataset.contextualCommute)'));
assert(playerJs.includes('ruleName === "rewriteInvOneToOne"') && playerJs.includes('isInvNode(node) && isValueNode(node.args[0], "1") ? valueNode("1") : null'));
assert(playerHtml.includes('.main-action-panel .branch-rule-symbol-2') && playerHtml.includes('.main-action-panel .direct-commute-icon'));
assert(playerJs.includes('class="post-selection-grid-overlay"') && playerJs.includes('d="M100 0 V400'));
assert(playerJs.includes('M200 0 V200') && playerJs.includes('M400 0 V200') && playerJs.includes('M100 300 H500'));
assert(/\.main-action-panel \.post-selection-grid-overlay \{[\s\S]*?grid-column: 1 \/ -1;[\s\S]*?grid-row: 1 \/ -1;[\s\S]*?pointer-events: none;/.test(playerHtml));
assert(/body\.selection-active:not\(\.expression-builder-active\) \.bottom-controls-panel,[\s\S]*?gap: 0;/.test(playerHtml));
assert(!playerHtml.includes('button.intent-category-button::before'));
assert(playerHtml.includes('class="controls-grid-overlay workspace-toolbar-grid-overlay"'), "The permanent workspace row must draw the same continuous grid treatment as the action rows");
assert(playerHtml.includes('class="controls-grid-overlay builder-grid-overlay"'), "Expression Builder must draw the same continuous grid treatment as post-selection");
assert(playerHtml.includes('d="M0 100 H600 M100 0 V100') && playerHtml.includes('d="M100 0 V400 M200 0 V400'), "Only the toolbar draws the boundary between the two portions of the grid");
assert(!/body\.authoring-session\s+\.quadrant-tools\s*\{[^}]*margin/.test(playerHtml), "The shared toolbar must fill the same six columns as the lower palette");
assert(/\.palette-content \{[\s\S]*?grid-template-columns: repeat\(6, minmax\(0, 1fr\)\);[\s\S]*?grid-template-rows: repeat\(5, minmax\(0, 1fr\)\);[\s\S]*?gap: 0;/.test(playerHtml), "The unified palette must use five gapless shared grid tracks");
assert(/\.bottom-controls-panel \.workspace-toolbar button,[\s\S]*?\.builder-keypad-panel button,[\s\S]*?\.main-action-panel button \{[\s\S]*?border: 0;[\s\S]*?border-radius: 0;[\s\S]*?background: transparent;/.test(playerHtml), "All bottom-panel buttons must share the post-selection square-cell appearance");
assert(/button\.contextual-rule-button,[\s\S]*?button\.contextual-commute-button \{[\s\S]*?border: 0;[\s\S]*?border-radius: 0;[\s\S]*?background: transparent;/.test(playerHtml));
assert(/\.main-action-panel \.intent-category-actions > button\.contextual-rule-button \{[\s\S]*?display: grid;[\s\S]*?padding: 0;/.test(playerHtml));
assert(/src="exploded-algebra-tool\.js\?v=\d{8}-[a-z0-9-]+"/.test(playerHtml));
assert(!playerJs.includes('function cycleQuickSetting(setting)'));
assert(playerJs.includes('SETTINGS.operationStyle = "filled";') && playerJs.includes('SETTINGS.operationSize = "100";'), "The default appearance must be fixed");
assert(playerJs.includes('const STEPS_TEXT_SIZE_OPTIONS = ["large", "medium", "small"];'));
assert(playerJs.includes('function calculateContextualStepsFontSizes'));
assert(playerJs.includes('function fitStepsFontSizeToPanelWidth'));
assert(playerJs.includes('function recalculateResponsiveStepsLayout'));
assert(playerJs.includes('function setStepsTextSizePreference'));
assert(playerJs.includes('scheduleStepsFontSizeRecalculation();'));
assert(playerJs.includes('const STEPS_LINE_HEIGHT_RATIO = 1.2;'));
assert(playerJs.includes('window.matchMedia("(pointer: coarse)").matches'));
assert(playerJs.includes('new ResizeObserver'));
assert(playerJs.includes('new MutationObserver'));
assert(/\.problem-statement,[\s\S]*?\.step-column \{[\s\S]*?line-height: 1\.2;/.test(playerHtml));
assert(/\.solution-column,[\s\S]*?padding: 0 6px;/.test(playerHtml));
assert(/\.solution-step,[\s\S]*?padding: 0;[\s\S]*?line-height: inherit;/.test(playerHtml));
assert(playerJs.includes("function applyResponsiveMainButtonSize()"));
assert(playerJs.includes("function applyResponsivePaletteSize(panel, content)"));
assert(playerJs.includes('const availableWidth = Math.max(1, content.clientWidth || plannedWidth - handleAllowance);'));
assert(playerJs.includes('const availableHeight = Math.max(1, content.clientHeight || plannedHeight - handleAllowance);'));
assert(playerJs.includes("const columns = 6;"));
assert(playerJs.includes("const rows = 5;"));
assert(playerJs.includes("Math.min(widthLimit, heightLimit)"));
assert(!playerJs.includes("mainButtonSize"));
assert(!playerHtml.includes("Button size"));
assert(playerJs.includes("function installFloatingPaletteInteractions()"));
assert(playerJs.includes("function resizeFloatingPaletteFromPoint("));
assert(playerJs.includes("function getFloatingPaletteViewportBounds()"));
assert(playerJs.includes("function rememberFloatingPalettePreference()"));
assert(playerJs.includes('const FLOATING_PALETTE_STORAGE_KEY = "explodedAlgebraFixedPaletteV3";'));
assert(!playerJs.includes('PRESELECTION_PALETTE_STORAGE_KEY'));
assert(playerJs.includes('Math.pow(effectiveSize / comfortableCellSize, 0.45)'), "Palette content must use gentle bounded scaling");
assert(!playerJs.includes("function installBottomPanelResizing()"));
assert(!playerJs.includes("const BOTTOM_PANEL_MAX_VIEWPORT_RATIO"));
assert(!playerJs.includes("LANDSCAPE_SIDEBAR_MIN_VIEWPORT_RATIO"));
assert(!playerJs.includes("LANDSCAPE_SIDEBAR_MAX_VIEWPORT_RATIO"));
assert(playerJs.includes('appContainer.style.setProperty("--steps-two-row-height"'));
assert(playerJs.includes('window.addEventListener("orientationchange", handlePanelOrientationChange)'));
assert(
    /The expression workspace fills the screen[\s\S]*?\.app-container,[\s\S]*?grid-template-columns: minmax\(0, 1fr\) !important;/.test(playerHtml),
    "Every orientation must retain a full-width workspace behind the fixed boxes"
);
assert(
    /\.palette-resize-handle-nw \{[\s\S]*?top: 0;[\s\S]*?left: 0;[\s\S]*?cursor: nwse-resize;/.test(playerHtml),
    "The controls must expose only their diagonally opposite upper-left resize handle"
);
assert(playerJs.includes("function showInactivePostSelectionPalette()") && playerJs.includes('mainActionPanel.inert = true;'), "Post-selection actions must remain visible but inactive before selection");
assert(playerJs.includes("function setWorkspaceUtilityMenuOpen(open)") && !playerHtml.includes('data-workspace-action="openSettings"'), "The hamburger menu must manage its expanded state without Settings");
assert(/document\.body\.classList\.toggle\("selection-active", selectionActive\);[\s\S]{0,500}?applyResponsiveMainButtonSize\(\);/.test(playerJs));

// Each fixed commute control must reject selections from the other operation.
const commuteStart = playerJs.indexOf('        function resolveContextualCommuteTool(');
const commuteEnd = playerJs.indexOf('\n        function ', commuteStart + 1);
const commuteContext = vm.createContext({ selection: { node: null }, canCommuteRotate: () => true });
vm.runInContext(playerJs.slice(commuteStart, commuteEnd), commuteContext);
for (const [type, matchingTool, otherTool] of [
    ["sum", "commuteTerms", "commuteFactors"],
    ["prod", "commuteFactors", "commuteTerms"]
]) {
    commuteContext.selection.node = { type };
    assert.equal(commuteContext.resolveContextualCommuteTool(matchingTool).toolName, matchingTool);
    assert.equal(commuteContext.resolveContextualCommuteTool(otherTool), null);
    assert.equal(commuteContext.resolveContextualCommuteTool().toolName, matchingTool);
}
commuteContext.selection.node = null;
assert.equal(commuteContext.resolveContextualCommuteTool("commuteTerms"), null);
commuteContext.selection.node = { type: "sum" };
commuteContext.canCommuteRotate = () => false;
assert.equal(commuteContext.resolveContextualCommuteTool("commuteTerms"), null);

console.log("Control layout checks passed.");
