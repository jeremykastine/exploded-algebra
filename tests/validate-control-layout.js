const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const playerHtml = fs.readFileSync(path.resolve(__dirname, "..", "exploded-algebra.html"), "utf8");
const playerJs = fs.readFileSync(path.resolve(__dirname, "..", "exploded-algebra-tool.js"), "utf8");

assert(playerHtml.includes('grid-template-columns: repeat(6, minmax(0, 1fr));'));
assert(playerHtml.includes('grid-template-rows: repeat(4, minmax(0, 1fr));'));
assert(playerHtml.includes('[data-workspace-action="resetZoom"] { grid-column: 3 / span 2; grid-row: 4; }'));
assert(playerHtml.includes('[data-workspace-mode="select"] { grid-column: 5 / span 2; grid-row: 1; }'));
assert(playerHtml.includes('[data-workspace-action="undoExpression"] { grid-column: 5 / span 2; grid-row: 2; }'));
assert(
    playerHtml.includes('id="bottomControlsPanel"') && playerHtml.includes('id="bottomPanelResizeHandle"'),
    "The app must provide a distinct bottom controls panel and resize handle"
);
assert(
    /grid-template-rows:\s*min\(var\(--top-panel-height\), 25dvh\)\s*var\(--divider-size\)\s*minmax\(0, 1fr\)\s*var\(--divider-size\)\s*min\(var\(--bottom-panel-height\), 33\.333dvh\);/.test(playerHtml),
    "The student view must use separate top, workspace, and bottom control rows"
);
assert(/\.main-action-panel \{[\s\S]*?overflow: visible;/.test(playerHtml), "The top Commute button must not be clipped by the action-panel boundary");
assert(
    /\.bottom-controls-panel \{[\s\S]*?grid-row: 5;[\s\S]*?pointer-events: auto;/.test(playerHtml),
    "The controls panel must own bottom-panel white-space taps"
);
assert(
    /\.quadrant-tools,[\s\S]*?\.main-action-panel,[\s\S]*?align-self: stretch;[\s\S]*?width: 100%;[\s\S]*?height: 100%;/.test(playerHtml),
    "All control modes must fill the shared bottom-panel footprint"
);
assert(
    playerHtml.indexOf('id="bottomControlsPanel"') < playerHtml.indexOf('class="quadrant-tools"') &&
        playerHtml.indexOf('class="quadrant-tools"') < playerHtml.indexOf('id="mainActionPanel"') &&
        playerHtml.indexOf('id="mainActionPanel"') < playerHtml.indexOf('id="builderKeypadPanel"') &&
        playerHtml.indexOf('id="builderKeypadPanel"') < playerHtml.indexOf('id="bottomPanelResizeHandle"') &&
        playerHtml.indexOf('id="bottomPanelResizeHandle"') < playerHtml.indexOf('id="mainArea"'),
    "All three control modes must be children of the shared bottom controls panel"
);
assert(
    /\.bottom-controls-panel \{[\s\S]*?grid-template-columns: repeat\(6, minmax\(0, 1fr\)\);[\s\S]*?grid-template-rows: repeat\(4, minmax\(0, 1fr\)\);/.test(playerHtml) &&
        /\.bottom-controls-panel > \.quadrant-tools,[\s\S]*?\.bottom-controls-panel > \.main-action-panel,[\s\S]*?\.bottom-controls-panel > \.builder-keypad-panel \{[\s\S]*?grid-template-columns: subgrid;[\s\S]*?grid-template-rows: subgrid;/.test(playerHtml),
    "Pre-selection, post-selection, and Expression Builder must use the panel's single four-by-six grid"
);
assert(!playerHtml.includes('id="settingsButton"') && !playerHtml.includes('id="levelMenuPanel"'), "Settings must live directly in the pre-selection toolbar");
["steps-text-size", "bar-style", "bar-shading"].forEach(setting => {
    assert(playerHtml.includes(`data-workspace-setting="${setting}"`), `Missing inline ${setting} setting button`);
});
assert(!playerHtml.includes('data-workspace-setting="handedness"') && !playerJs.includes("setLeftHandedLayout"), "The left-handedness option must be removed");
assert(playerHtml.includes('data-workspace-action="resetExercise"'), "Reset Exercise must remain available as a pre-selection action");
assert(playerHtml.includes('.workspace-toolbar [data-workspace-mode="pan"] { grid-column: 3 / span 2; grid-row: 1; }'));
assert(playerHtml.includes('.workspace-toolbar [data-workspace-mode="select"] { grid-column: 5 / span 2; grid-row: 1; }'));
assert(playerHtml.includes('.workspace-toolbar [data-workspace-setting="steps-text-size"] { grid-column: 1 / span 2; grid-row: 1; }'));
assert(playerHtml.includes('.workspace-toolbar [data-workspace-setting="bar-style"] { grid-column: 1 / span 2; grid-row: 2; }'));
assert(playerHtml.includes('.workspace-toolbar [data-workspace-setting="bar-shading"] { grid-column: 1 / span 2; grid-row: 3; }'));
assert(playerHtml.includes('.workspace-toolbar [data-workspace-action="resetExercise"] { grid-column: 1 / span 2; grid-row: 4; }'));
assert(playerHtml.includes('.workspace-toolbar [data-workspace-action="zoomIn"] { grid-column: 3 / span 2; grid-row: 2; }'));
assert(playerHtml.includes('.workspace-toolbar [data-workspace-action="zoomOut"] { grid-column: 3 / span 2; grid-row: 3; }'));
assert(playerHtml.includes('.workspace-toolbar [data-workspace-action="resetZoom"] { grid-column: 3 / span 2; grid-row: 4; }'));
assert(playerHtml.includes('.workspace-toolbar [data-workspace-action="undoExpression"] { grid-column: 5 / span 2; grid-row: 2; }'));
assert(playerHtml.includes('body.selection-active:not(.expression-builder-active) .quadrant-tools { display: none; }'), "Post-selection must hide all pre-selection settings and tools");
assert(/body\.expression-builder-active \.quadrant-menu,[\s\S]*?body\.expression-builder-active \.quadrant-tools,[\s\S]*?display: none;/.test(playerHtml), "Expression Builder must hide the pre-selection toolbar");
assert(
    !playerHtml.includes('body.expression-builder-active.builder-entry-mode .left-panel {\n            display: none !important;'),
    "Student Expression Builder must not hide the KaTeX steps panel"
);
assert(
    playerHtml.includes('body.authoring-session:not(.expression-builder-active) .left-panel,') &&
        !playerHtml.includes('body.authoring-session.expression-builder-active.builder-entry-mode .left-panel {\n            display: none !important;'),
    "Instructor Expression Builder must show the live conventional panel and hide it only outside entry"
);
assert(
    /body\.expression-builder-active\.builder-review-active \.app-container,[\s\S]*?min\(var\(--top-panel-height\), 25dvh\)[\s\S]*?minmax\(0, 1fr\);/.test(playerHtml),
    "Expression Builder Peek must retain the portrait conventional row"
);
assert(
    /@media \(orientation: landscape\) \{[\s\S]*?body\.expression-builder-active\.builder-review-active \.left-panel,[\s\S]*?grid-row: 1;/.test(playerHtml),
    "Expression Builder Peek must retain the landscape conventional column"
);
assert(
    /if \(builderActive\) \{\s*renderLevelInfo\(currentLevelIndex\);/.test(playerJs),
    "Every Expression Builder refresh must update panel one's live conventional expression"
);
assert(playerHtml.includes('cancel-selection-button'), "The post-selection grid must include a Cancel Selection button");
assert(playerHtml.includes('.main-action-panel .intent-category-actions > [data-contextual-commute] { grid-column: 3 / span 2; grid-row: 3; }'));
assert(playerHtml.includes('.main-action-panel .intent-category-actions > [data-contextual-numerical-rewrite] { grid-column: 5 / span 2; grid-row: 3; }'));
assert(playerHtml.includes('.main-action-panel .intent-category-actions > [data-cancel-selection] { grid-column: 1; grid-row: 3 / span 2; }'));
const expectedContextualButtonPositions = [
    ["multiplicative-inverse", "1", "1 / span 2"],
    ["double-inverse", "2", "1 / span 2"],
    ["zero-product", "3", "1 / span 2"],
    ["multiplicative-identity", "4", "1 / span 2"],
    ["additive-inverse", "5", "1 / span 2"],
    ["additive-identity", "6", "1 / span 2"],
    ["inverse", "2", "3 / span 2"],
    ["distribute-left", "3 / span 2", "4"],
    ["distribute-right", "5 / span 2", "4"]
];
expectedContextualButtonPositions.forEach(([pair, column, row]) => {
    assert(
        playerHtml.includes(`.main-action-panel .intent-category-actions > [data-contextual-rule-pair="${pair}"] { grid-column: ${column}; grid-row: ${row}; }`),
        `Contextual control ${pair} must occupy column ${column}, row ${row}`
    );
});
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-contextual-rule-pair="inverse"] { grid-column: 5; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-contextual-rule-pair="distribute-left"] { grid-column: 3 / span 2; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-contextual-rule-pair="distribute-right"] { grid-column: 1 / span 2; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-contextual-numerical-rewrite] { grid-column: 1 / span 2; }'));
assert(playerHtml.includes('body.left-handed .main-action-panel .intent-category-actions > [data-cancel-selection] { grid-column: 6; }'));
assert(/\.quadrant-tools \.workspace-toolbar,[\s\S]*?grid-template-columns: repeat\(6, minmax\(0, 1fr\)\);[\s\S]*?grid-template-rows: repeat\(4, minmax\(0, 1fr\)\);[\s\S]*?width: 100%;[\s\S]*?height: 100%;/.test(playerHtml));
assert(/\.main-action-panel \.intent-category-actions \{[\s\S]*?grid-template-columns: repeat\(6, minmax\(0, 1fr\)\);[\s\S]*?grid-template-rows: repeat\(4, minmax\(0, 1fr\)\);/.test(playerHtml));

assert(playerJs.includes("function isPointInsideCurrentSelection(x, y)"), "Selection presses must use the highlighted selection bounds");
assert(playerJs.includes("function isPointInsideExpression(x, y)"), "Selection presses must distinguish the expression from surrounding workspace");
assert(/function selectFromWorkspaceTap\(x, y, pointerType, allowSelectionCancel = true\) \{[\s\S]*?isPointInsideCurrentSelection\(x, y\) \|\| !isPointInsideExpression\(x, y\)[\s\S]*?cancelCurrentWorkspaceSelection\(\)/.test(playerJs), "Pressing inside the current selection or outside the expression must clear it");
assert(playerJs.includes("selectFromWorkspaceTap(startPoint.x, startPoint.y, pointerStart.pointerType, false);") && playerJs.includes("selectFromWorkspaceTap(endPoint.x, endPoint.y, pointerStart.pointerType, false);"), "Dragging from the selection must remain a two-endpoint selection gesture rather than a cancel press");
assert(playerJs.includes(': "cancelSelection"') && playerJs.includes('pointerStart.mode === "cancelSelection"'), "Blank workspace taps must clear an existing selection");
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
assert(playerJs.includes('function buildContextualCommuteButtonHtml()'));
assert(playerJs.includes('buildDirectCommuteIconHtml("·")') && playerJs.includes('buildDirectCommuteIconHtml("+")'));
assert(playerJs.includes('class="intent-category-button contextual-numerical-rewrite-button" data-contextual-numerical-rewrite'));
assert(playerJs.includes('aria-label="Numerical Manipulation" title="Numerical Manipulation"'));
assert(playerJs.includes('<span class="contextual-numerical-rewrite-label">123</span>'));
assert(playerJs.includes('class="intent-category-button cancel-selection-button" data-cancel-selection'));
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
assert(!playerJs.includes('isAlwaysAllowedNumericalRewrite'), "The three formerly fixed rules must no longer bypass the exercise permission profile");
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
assert(/body\.left-handed \.main-action-panel \[data-branch-pair="left"\],[\s\S]*?transform: scaleX\(-1\);/.test(playerHtml));
assert(/\.main-action-panel \.branch-pair-overlay \{[\s\S]*?pointer-events: none;/.test(playerHtml));
assert(playerJs.includes('function resolveContextualRulePair(pairName)'));
assert(playerJs.includes('if (canFactorProductOfInverses())') && playerJs.includes('if (canDistributeInverseOverProduct())'));
assert(playerJs.includes('if (canEliminateDoubleInverse())') && playerJs.includes('return canInsertDoubleInverse()'));
assert(playerJs.includes('if (canZeroProduct())') && playerJs.includes('return canInsertZeroProduct()'));
assert(playerJs.includes('if (getCancelOppositesData())') && playerJs.includes('canReplaceZeroWithOppositeSum()'));
assert(playerJs.includes('if (canCancelProductWithInverse())') && playerJs.includes('canReplaceOneWithInverseProduct()'));
assert(playerJs.includes('button[data-contextual-rule-pair]') && playerJs.includes('recordToolForSolution(resolved.toolName, beforeExpression)'));
assert(playerJs.includes('function resolveContextualCommuteTool()'));
assert(playerJs.includes('selection.node.type === "sum"') && playerJs.includes('toolName: "commuteTerms"'));
assert(playerJs.includes('selection.node.type === "prod"') && playerJs.includes('toolName: "commuteFactors"'));
assert(playerJs.includes('function resolveAutomaticNumericalRewriteTool()'));
assert(/function resolveAutomaticNumericalRewriteTool\(\) \{[\s\S]*?getAutomaticNumericalRewriteData\(\)/.test(playerJs), "Automatic numerical manipulation must use the configured rule profile for every numerical category");
assert(/function classifyNumericalRewriteCategory\(node\) \{[\s\S]*?return "inverseOne";[\s\S]*?return "inverseNegativeOne";[\s\S]*?return "doubleNegative";/.test(playerJs), "Inverse-one and double-negative expressions must be classified through their configurable numerical rules");
assert(playerJs.includes('function classifyNumericalRewriteCategory(node)'));
assert(playerJs.includes('"nonnegativeArithmetic"') && playerJs.includes('"signedArithmetic"'));
assert(playerJs.includes('return "nonnegativeArithmetic";') && playerJs.includes('return "signedArithmetic";'));
assert(!playerJs.includes('return isNoCarryWholeNumberNodeAddition(normalized.args)') && !playerJs.includes('factors.every(isOneSignificantFigureBigInt)'));
assert(playerJs.includes('LEGACY_GRANULAR_NUMERICAL_REWRITE_RULE_IDS') && playerJs.includes('function normalizeNumericalRewriteRules(rules)'));
assert(playerJs.includes('SEPARATE_ARITHMETIC_NUMERICAL_REWRITE_RULE_IDS') && playerJs.includes('"signedAddition"') && playerJs.includes('"signedMultiplication"'), "Profiles with the former four arithmetic rows must remain loadable");
assert(playerJs.includes('const mergeRestrictiveRules = sourceRules =>') && playerJs.includes('forwardPriority') && playerJs.includes('reversePriority'), "Separate legacy arithmetic permissions must merge conservatively");
assert(playerJs.includes('normalized.nonnegativeArithmetic.forward === "automatic" ? "automatic" : "manual"') && playerJs.includes('reverse: "manual"'), "Nonnegative arithmetic must normalize to Automatic or Manual forward and Manual reverse");
assert(playerJs.includes('function getNumericalRewriteIntegerData(node)') && playerJs.includes('function getInverseIntegerData(node)') && playerJs.includes('function getFractionSimplificationCategory(node)'), "Fraction simplification must distinguish non-negative and signed integer-over-integer forms");
assert(playerJs.includes('const fractionCategory = getFractionSimplificationCategory(normalized)') && !playerJs.includes('numericalRewriteNodeContainsInverse'), "Fraction simplification must classify only supported numerator and denominator structures");
assert(playerJs.includes('PREVIOUS_NUMERICAL_REWRITE_RULE_IDS') && playerJs.includes('? "nonnegativeFractionSimplification"') && playerJs.includes('? "signedFractionSimplification"'), "Previous single-fraction-rule profiles must migrate into both current fraction categories");
assert(playerJs.includes('numericalRewriteNodesHaveSameStructure(proposed, canonicalOriginal)') && playerJs.includes('numericalRewriteNodesHaveSameStructure(original, canonicalProposed)'), "Manual fraction rewrites must use canonical forward and equivalent reverse validation");
assert(/function makeCanonicalNumericalRewriteNode\(value\)[\s\S]*?value\.denominator === 1n[\s\S]*?return valueNode\(absoluteNumerator\.toString\(\)\)/.test(playerJs), "Canonical fraction simplification must remove the inverse when the result is a whole number");
assert(playerJs.includes('inverseOne: "Inverse of one"') && playerJs.includes('inverseNegativeOne: "Inverse of negative one"') && playerJs.includes('doubleNegative: "Negative one times negative one"'), "The Numerical Manipulation hold description must label all three newly configurable rules");
assert(playerJs.includes('nonnegativeArithmetic: "Nonnegative addition and multiplication"') && playerJs.includes('signedArithmetic: "Signed number addition and multiplication"'), "The Numerical Manipulation summary must use the two combined arithmetic labels");
assert(playerJs.includes('const PRE_FIXED_NUMERICAL_REWRITE_RULE_IDS') && playerJs.includes('applyLegacyFixedNumericalRewriteDefaults'), "Profiles created before the three fixed rules became configurable must preserve their former behavior");
assert(/function getIntentCategoryDescriptionHtml\(categoryId\)[\s\S]*?categoryId === "numericalRewrite"[\s\S]*?getNumericalRewriteProfileSummaryItems\(getNumericalRewriteProfile\(\)\)/.test(playerJs), "Long-holding Numerical Manipulation must display the current exercise's complete permission summary");
assert(playerJs.includes('class="numerical-permission-summary"') && playerHtml.includes('.press-hold-popover .numerical-permission-summary'), "The complete Numerical Manipulation hold summary must remain compact enough for phone screens");
assert(playerJs.includes('function getAutomaticNumericalRewriteData()') && playerJs.includes('function applyAutomaticNumericalRewrite()'));
assert(playerJs.includes('function validateManualNumericalRewriteExchange(originalNode, proposedNode)'));
assert(playerJs.includes('getNumericalRewriteRuleSetting(proposedRuleId).reverse === "manual"'));
assert(playerJs.includes('getNumericalRewriteRuleSetting(originalRuleId).forward === "manual"'), "Manual forward rewrites must respect each configured rule");
assert(playerJs.includes('function resolveContextualNumericalRewriteAction()'));
assert(playerJs.includes('mode: "automatic"') && playerJs.includes('mode: "manual"'));
assert(playerJs.includes('button[data-cancel-selection]') && playerJs.includes('cancelSelectionButton.addEventListener("click"'));
assert(/cancelSelectionButton\.addEventListener\("click", \(\) => \{[\s\S]*?cancelCurrentWorkspaceSelection\(\);/.test(playerJs));
assert(playerJs.includes('ruleName === "rewriteInvOneToOne"') && playerJs.includes('isInvNode(node) && isValueNode(node.args[0], "1") ? valueNode("1") : null'));
assert(playerHtml.includes('.main-action-panel .branch-rule-symbol-2') && playerHtml.includes('.main-action-panel .direct-commute-icon'));
assert(playerJs.includes('class="post-selection-grid-overlay"') && playerJs.includes('M1 1 H599 V399 H1 Z'));
assert(playerJs.includes('M300 1 V200') && playerJs.includes('M500 1 V200') && playerJs.includes('M200 300 H599'));
assert(/\.main-action-panel \.post-selection-grid-overlay \{[\s\S]*?grid-column: 1 \/ -1;[\s\S]*?grid-row: 1 \/ -1;[\s\S]*?pointer-events: none;/.test(playerHtml));
assert(/body\.selection-active:not\(\.expression-builder-active\) \.bottom-controls-panel,[\s\S]*?gap: 0;/.test(playerHtml));
assert(/body\.left-handed \.main-action-panel \.post-selection-grid-overlay \{[\s\S]*?transform: scaleX\(-1\);/.test(playerHtml));
assert(!playerHtml.includes('button.intent-category-button::before'));
assert(playerHtml.includes('class="controls-grid-overlay pre-selection-grid-overlay"'), "Pre-selection must draw the same continuous grid treatment as post-selection");
assert(playerHtml.includes('class="controls-grid-overlay builder-grid-overlay"'), "Expression Builder must draw the same continuous grid treatment as post-selection");
assert(/\.bottom-controls-panel \{[\s\S]*?grid-template-columns: repeat\(6, minmax\(0, 1fr\)\);[\s\S]*?grid-template-rows: repeat\(4, minmax\(0, 1fr\)\);[\s\S]*?gap: 0;/.test(playerHtml), "All bottom-panel modes must use gapless shared grid tracks");
assert(/\.bottom-controls-panel \.workspace-toolbar button,[\s\S]*?\.builder-keypad-panel button,[\s\S]*?\.main-action-panel button \{[\s\S]*?border: 0;[\s\S]*?border-radius: 0;[\s\S]*?background: transparent;/.test(playerHtml), "All bottom-panel buttons must share the post-selection square-cell appearance");
assert(/button\.contextual-rule-button,[\s\S]*?button\.cancel-selection-button \{[\s\S]*?border: 0;[\s\S]*?border-radius: 0;[\s\S]*?background: transparent;/.test(playerHtml));
assert(/\.main-action-panel \.intent-category-actions > button\.contextual-rule-button \{[\s\S]*?display: grid;[\s\S]*?padding: 0;/.test(playerHtml));
assert(playerHtml.includes('exploded-algebra-tool.js?v=20260922-builder-purple-alpha'));
assert(playerJs.includes('function cycleQuickSetting(setting)'));
assert(playerJs.includes('getNextCyclicOption(OPERATION_BAR_STYLE_OPTIONS'));
assert(playerJs.includes('getNextCyclicOption(OPERATION_BAR_SHADING_OPTIONS'));
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
assert(playerJs.includes('const availableWidth = Math.max(1, bottomControlsPanel.clientWidth);'));
assert(playerJs.includes('const availableHeight = Math.max(1, bottomControlsPanel.clientHeight);'));
assert(playerJs.includes("const columns = 6;"));
assert(playerJs.includes("const rows = 4;"));
assert(playerJs.includes("Math.min(widthLimit, heightLimit)"));
assert(!playerJs.includes("mainButtonSize"));
assert(!playerHtml.includes("Button size"));
assert(playerJs.includes("function installBottomPanelResizing()"));
assert(playerJs.includes("const BOTTOM_PANEL_MAX_VIEWPORT_RATIO = 1 / 3;"));
assert(playerJs.includes("const LANDSCAPE_BOTTOM_PANEL_MAX_VIEWPORT_RATIO = 1 / 2;"));
assert(playerJs.includes("const LANDSCAPE_SIDEBAR_MIN_VIEWPORT_RATIO = 1 / 6;"));
assert(playerJs.includes("const LANDSCAPE_SIDEBAR_MAX_VIEWPORT_RATIO = 1 / 3;"));
assert(playerJs.includes('appContainer.style.setProperty("--steps-two-row-height"'));
assert(playerJs.includes('leftPanel.scrollTop = Math.max(0, leftPanel.scrollHeight - leftPanel.clientHeight);'));
assert(playerJs.includes("function setLandscapeSidebarWidth(width, rememberUserChoice = false)"));
assert(playerJs.includes('topPanelResizeHandle.setAttribute("aria-orientation", "vertical")'));
assert(playerJs.includes('window.addEventListener("orientationchange", handlePanelOrientationChange)'));
assert(
    /@media \(orientation: landscape\) \{[\s\S]*?grid-template-columns:\s*clamp\(16\.667vw, var\(--landscape-sidebar-width\), 33\.333vw\)\s*var\(--divider-size\)\s*minmax\(0, 1fr\);/.test(playerHtml),
    "Landscape must use a one-sixth-to-one-third resizable left column and a full-height right workspace"
);
assert(
    /@media \(orientation: landscape\) \{[\s\S]*?grid-template-rows:\s*var\(--steps-two-row-height\)\s*var\(--divider-size\)\s*minmax\(0, 1fr\);/.test(playerHtml),
    "Landscape panel one must snap to the responsive height of exactly two step rows"
);
assert(
    /\.top-panel-resize-handle,[\s\S]*?grid-column: 2;[\s\S]*?grid-row: 1 \/ -1;[\s\S]*?cursor: col-resize;/.test(playerHtml),
    "The former top-panel handle must become the full-height vertical landscape divider"
);
assert(
    /\.bottom-panel-resize-handle,[\s\S]*?grid-column: 1;[\s\S]*?grid-row: 2;[\s\S]*?cursor: default;[\s\S]*?pointer-events: none;/.test(playerHtml),
    "The landscape horizontal divider must remain snapped to the two-row panel height"
);
assert(/document\.body\.classList\.toggle\("selection-active", selectionActive\);[\s\S]{0,500}?applyResponsiveMainButtonSize\(\);/.test(playerJs));

const normalizeRulesMatch = playerJs.match(/function normalizeNumericalRewriteRules\(rules\) \{([\s\S]*?)\n        \}\n\n        function getNumericalRewriteProfile/);
assert(normalizeRulesMatch, "Numerical permission normalization must remain testable");
const normalizationContext = {
    clonePlainData(value) { return JSON.parse(JSON.stringify(value)); },
    NUMERICAL_REWRITE_RULE_IDS: [
        "nonnegativeArithmetic",
        "signedArithmetic",
        "nonnegativeFractionSimplification",
        "signedFractionSimplification",
        "inverseOne",
        "inverseNegativeOne",
        "doubleNegative"
    ]
};
vm.createContext(normalizationContext);
vm.runInContext(`
function makeNumericalRewriteRules(forwardMode = "not-allowed", reverseMode = "not-allowed") {
    return Object.fromEntries(NUMERICAL_REWRITE_RULE_IDS.map(ruleId => [ruleId, { forward: forwardMode, reverse: reverseMode }]));
}
function applyLegacyFixedNumericalRewriteDefaults(rules) {
    for (const ruleId of ["inverseOne", "inverseNegativeOne", "doubleNegative"]) {
        rules[ruleId] = { forward: "automatic", reverse: "manual" };
    }
    return rules;
}
function normalizeNumericalRewriteRules(rules) {${normalizeRulesMatch[1]}
}
this.normalizeNumericalRewriteRules = normalizeNumericalRewriteRules;
`, normalizationContext);
const migratedSeparateRules = normalizationContext.normalizeNumericalRewriteRules({
    positiveAddition: { forward: "automatic", reverse: "manual" },
    positiveMultiplication: { forward: "manual", reverse: "manual" },
    signedAddition: { forward: "automatic", reverse: "manual" },
    signedMultiplication: { forward: "not-allowed", reverse: "not-allowed" },
    nonnegativeFractionSimplification: { forward: "manual", reverse: "manual" },
    signedFractionSimplification: { forward: "manual", reverse: "manual" },
    inverseOne: { forward: "manual", reverse: "manual" },
    inverseNegativeOne: { forward: "automatic", reverse: "manual" },
    doubleNegative: { forward: "manual", reverse: "manual" }
});
assert.deepEqual(
    JSON.parse(JSON.stringify(migratedSeparateRules.nonnegativeArithmetic)),
    { forward: "manual", reverse: "manual" },
    "Differing nonnegative addition/multiplication settings must migrate to the more restrictive combined setting"
);
assert.deepEqual(
    JSON.parse(JSON.stringify(migratedSeparateRules.signedArithmetic)),
    { forward: "not-allowed", reverse: "not-allowed" },
    "Differing signed addition/multiplication settings must migrate to the more restrictive combined setting"
);

const integerFormMatch = playerJs.match(/function getNumericalRewriteIntegerData\(node\) \{([\s\S]*?)\n        \}\n\n        function getInverseIntegerData/);
const inverseIntegerFormMatch = playerJs.match(/function getInverseIntegerData\(node\) \{([\s\S]*?)\n        \}\n\n        function getFractionSimplificationCategory/);
const fractionFormMatch = playerJs.match(/function getFractionSimplificationCategory\(node\) \{([\s\S]*?)\n        \}\n\n        function isFlatSignedIntegerProduct/);
const signedProductMatch = playerJs.match(/function isFlatSignedIntegerProduct\(node\) \{([\s\S]*?)\n        \}\n\n        function isFlatSignedIntegerTerm/);
const signedTermMatch = playerJs.match(/function isFlatSignedIntegerTerm\(node\) \{([\s\S]*?)\n        \}\n\n        function classifyNumericalRewriteCategory/);
assert(integerFormMatch && inverseIntegerFormMatch && fractionFormMatch && signedProductMatch && signedTermMatch, "Numerical category form validators must remain testable");
const fractionContext = {
    getWholeNumberBigIntFromNode(node) {
        return node && node.type === "value" && /^\d+$/.test(String(node.value)) ? BigInt(node.value) : null;
    },
    isExactNumericalRewriteValue(node, value) {
        return !!node && node.type === "value" && String(node.value) === value;
    }
};
vm.createContext(fractionContext);
vm.runInContext(`
function getNumericalRewriteIntegerData(node) {${integerFormMatch[1]}\n}
function getInverseIntegerData(node) {${inverseIntegerFormMatch[1]}\n}
function getFractionSimplificationCategory(node) {${fractionFormMatch[1]}\n}
function isFlatSignedIntegerProduct(node) {${signedProductMatch[1]}\n}
function isFlatSignedIntegerTerm(node) {${signedTermMatch[1]}\n}
this.getFractionSimplificationCategory = getFractionSimplificationCategory;
this.isFlatSignedIntegerProduct = isFlatSignedIntegerProduct;
this.isFlatSignedIntegerTerm = isFlatSignedIntegerTerm;
`, fractionContext);
const valueNode = value => ({ type: "value", value: String(value), args: [] });
const productNode = (...args) => ({ type: "prod", args });
const inverseNode = child => ({ type: "inv", args: [child] });
const sumNode = (...args) => ({ type: "sum", args });
assert.equal(fractionContext.getFractionSimplificationCategory(productNode(valueNode(18), inverseNode(valueNode(24)))), "nonnegativeFractionSimplification", "A non-negative value times an inverse non-negative value must use the non-negative fraction category");
assert.equal(fractionContext.getFractionSimplificationCategory(inverseNode(valueNode(9))), "nonnegativeFractionSimplification", "A reduced unit fraction must remain in the non-negative fraction category");
assert.equal(fractionContext.getFractionSimplificationCategory(productNode(valueNode(-1), valueNode(18), inverseNode(valueNode(24)))), "signedFractionSimplification", "A negative numerator must use the signed fraction category");
assert.equal(fractionContext.getFractionSimplificationCategory(productNode(valueNode(18), inverseNode(productNode(valueNode(-1), valueNode(24))))), "signedFractionSimplification", "A negative denominator must use the signed fraction category");
assert.equal(fractionContext.getFractionSimplificationCategory(productNode(valueNode(-1), valueNode(18), inverseNode(productNode(valueNode(-1), valueNode(24))))), "signedFractionSimplification", "Two explicit negative integer components must still use the signed structural category");
assert.equal(fractionContext.getFractionSimplificationCategory(productNode(valueNode(2), valueNode(3), inverseNode(valueNode(5)))), null, "A fraction category must not accept multiple unconsolidated numerator values");
assert.equal(fractionContext.getFractionSimplificationCategory(productNode(valueNode(2), inverseNode(valueNode(3)), inverseNode(valueNode(5)))), null, "A fraction category must contain exactly one inverse denominator factor");
assert.equal(fractionContext.getFractionSimplificationCategory(inverseNode(sumNode(valueNode(1), valueNode(2)))), null, "Fraction simplification must reject inverses of sums");
assert.equal(fractionContext.getFractionSimplificationCategory(inverseNode(valueNode(0))), null, "Fraction simplification must reject a zero denominator");
assert.equal(fractionContext.getFractionSimplificationCategory(productNode(valueNode(2), valueNode(3))), null, "The fraction categories must require an inverse denominator");
assert.equal(fractionContext.isFlatSignedIntegerTerm(productNode(valueNode(-1), valueNode(7))), true, "A signed-sum term may be negative one times one non-negative value");
assert.equal(fractionContext.isFlatSignedIntegerTerm(productNode(valueNode(-1), valueNode(2), valueNode(3))), false, "A signed-sum term must not contain multiple non-negative factors");
assert.equal(fractionContext.isFlatSignedIntegerProduct(productNode(valueNode(-1), valueNode(2), valueNode(3))), true, "A signed product may contain any number of non-negative and negative-one factors");
assert.equal(fractionContext.isFlatSignedIntegerProduct(productNode(valueNode(-1), valueNode(-1))), true, "A product containing only negative-one factors remains structurally signed");

console.log("Control layout checks passed.");
