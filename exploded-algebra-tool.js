Warning: truncated output (original token count: 93205)
Total output lines: 8773

Promise.resolve().then(() => {
        // Change this to true if you want the faded gray parenthesis/operator/value
        // characters to become visible again in the top expression SVG.
        const SHOW_FADED_EXPRESSION_SYMBOLS = false;
        const FADED_EXPRESSION_SYMBOL_COLOR = "#d0d0d0";

        // Disabled for now: step-card preview comparison.
        // Leave this code in place so the preview comparison can be restored later
        // by changing this value to false.
        const STEP_PREVIEW_COMPARISON_DISABLED_FOR_NOW = true;

        function getSelectionMargin() {
            return ((SETTINGS && SETTINGS.bufferSize) || (SETTINGS && SETTINGS.debugComponentBuffer) || SETTINGS.padding || 16) / 2;
        }


        const TOOL_INFO = {
            replaceOneWithInverseProduct: `<span class="rule-name">Insert Inverse Product</span><span class="rule-notation">1 = A · inverse(A)</span>`,
            cancelProductWithInverse: `<span class="rule-name">Cancel Inverse Product</span><span class="rule-notation">A · inverse(A) = 1</span>`,
            eliminateDoubleInverse: `<span class="rule-name">Remove Double Inverse</span><span class="rule-notation">inverse(inverse(A)) = A</span>`,
            insertDoubleInverse: `<span class="rule-name">Insert Double Inverse</span><span class="rule-notation">A = inverse(inverse(A))</span>`,
            distributeInverseOverProduct: `<span class="rule-name">Inverse of a Product</span><span class="rule-notation">inverse(A · B) = inverse(A) · inverse(B)</span>`,
            factorProductOfInverses: `<span class="rule-name">Product of Inverses</span><span class="rule-notation">inverse(A) · inverse(B) = inverse(A · B)</span>`,
            rewriteInvNegOneToNegOne: `<span class="rule-name">Inverse of Negative One</span><span class="rule-notation">inverse(-1) = -1</span>`,
            rewriteNegOneToInvNegOne: `<span class="rule-name">Inverse of Negative One</span><span class="rule-notation">-1 = inverse(-1)</span>`,
            eliminateExponentOne: `<span class="rule-name">Remove First Power</span><span class="rule-notation">A<sup>1</sup> = A</span>`,
            eliminateExponentZero: `<span class="rule-name">Remove Zero Power</span><span class="rule-notation">A<sup>0</sup> = 1</span>`,
            rewriteNegativeOneExponentAsInverse: `<span class="rule-name">Negative Power to Inverse Operator</span><span class="rule-notation">A<sup>-1</sup> = inverse(A)</span>`,
            rewriteInverseAsNegativeOneExponent: `<span class="rule-name">Inverse Operator to Negative Power</span><span class="rule-notation">inverse(A) = A<sup>-1</sup></span>`,
            eliminateInverseToNegativeOnePower: `<span class="rule-name">Cancel Double Inverse Power</span><span class="rule-notation">(A<sup>-1</sup>)<sup>-1</sup> = A</span>`,
            distributePowerOverInverse: `<span class="rule-name">Power of a Power</span><span class="rule-notation">(A<sup>-1</sup>)<sup>n</sup> = (A<sup>n</sup>)<sup>-1</sup></span>`,
            factorPowerOutOfInverse: `<span class="rule-name">Power of a Power</span><span class="rule-notation">(A<sup>n</sup>)<sup>-1</sup> = (A<sup>-1</sup>)<sup>n</sup></span>`,
            powerOfPower: `<span class="rule-name">Power of a Power</span><span class="rule-notation">(A<sup>m</sup>)<sup>n</sup> = A<sup>m·n</sup></span>`,
            combineSameBasePowers: `<span class="rule-name">Combine Same-Base Powers</span><span class="rule-notation">A<sup>m</sup> · A<sup>n</sup> = A<sup>m+n</sup></span>`,
            expandPowerOfSum: `<span class="rule-name">Split Power over Sum</span><span class="rule-notation">A<sup>m+n</sup> = A<sup>m</sup> · A<sup>n</sup></span>`,
            divideSameBasePowers: `<span class="rule-name">Subtract Same-Base Powers</span><span class="rule-notation">A<sup>m</sup> · (A<sup>n</sup>)<sup>-1</sup> = A<sup>m-n</sup></span>`,
            distributeExponentOverProduct: `<span class="rule-name">Power of a Product</span><span class="rule-notation">(A · B)<sup>n</sup> = A<sup>n</sup> · B<sup>n</sup></span>`,
            factorCommonExponent: `<span class="rule-name">Factor Common Power</span><span class="rule-notation">A<sup>n</sup> · B<sup>n</sup> = (A · B)<sup>n</sup></span>`,
            oneToAnyPower: `<span class="rule-name">Power of One</span><span class="rule-notation">1<sup>n</sup> = 1</span>`,
            insertExponentOne: `<span class="rule-name">Insert First Power</span><span class="rule-notation">A = A<sup>1</sup></span>`,
            insertExponentZero: `<span class="rule-name">Insert Zero Power</span><span class="rule-notation">1 = A<sup>0</sup></span>`,
            insertPowerOfOne: `<span class="rule-name">Insert Power of One</span><span class="rule-notation">1 = 1<sup>n</sup></span>`,
            expandPowerOfPower: `<span class="rule-name">Split Power of a Power</span><span class="rule-notation">A<sup>m·n</sup> = (A<sup>m</sup>)<sup>n</sup></span>`,
            negativeOneSquared: `<span class="rule-name">Power of Negative One</span><span class="rule-notation">(-1)<sup>2</sup> = 1</span>`,
            negativeOneEvenPower: `<span class="rule-name">Power of Negative One</span><span class="rule-notation">(-1)<sup>2n</sup> = 1</span>`,
            negativeOneOddPower: `<span class="rule-name">Power of Negative One</span><span class="rule-notation">(-1)<sup>2n+1</sup> = -1</span>`,
            repeatedProductToPower: `<span class="rule-name">Combine Repeated Factors</span><span class="rule-notation">A · A · … · A = A<sup>n</sup></span>`,
            powerToRepeatedProduct: `<span class="rule-name">Expand Power</span><span class="rule-notation">A<sup>n</sup> = A · A · … · A</span>`,
            inverseOne: `<span class="rule-name">Power of One</span><span class="rule-notation">1<sup>-1</sup> = 1</span>`,
            factorProductOfTwoInverses: `<span class="rule-name">Factor Common Power</span><span class="rule-notation">A<sup>-1</sup> · B<sup>-1</sup> = (A · B)<sup>-1</sup></span>`,
            distributeInverseOverTwoProduct: `<span class="rule-name">Power of a Product</span><span class="rule-notation">(A · B)<sup>-1</sup> = A<sup>-1</sup> · B<sup>-1</sup></span>`,
            inverseFactorAsNegativeExponent: `<span class="rule-name">Negative Power Notation</span><span class="rule-notation">A · B<sup>-1</sup> = A · B<sup>-1</sup></span>`,
            cancelOpposites: `<span class="rule-name">Cancel Additive Inverses</span><span class="rule-notation">A + (-A) = 0</span>`,
            doubleNegative: `<span class="rule-name">Double Negative</span><span class="rule-notation">(-1) · (-1) = 1</span>`,
            zeroProduct: `<span class="rule-name">Zero Product</span><span class="rule-notation">0 · A = 0</span>`,
            insertZeroProduct: `<span class="rule-name">Insert Zero Product</span><span class="rule-notation">0 = 0 · A</span>`,
            eliminateIdentities: `<span class="rule-name">Remove Identity</span><span class="rule-notation">A + 0 = A; A · 1 = A</span>`,
            evaluateSum: `<span class="rule-name">Evaluate Sum</span><span class="rule-notation">a + b = c</span>`,
            evaluateProduct: `<span class="rule-name">Evaluate Product</span><span class="rule-notation">a · b = c</span>`,
            evaluateSumContainingProducts: `<span class="rule-name">Evaluate Product-Sum</span><span class="rule-notation">ab + cd = e</span>`,
            evaluate: `<span class="rule-name">Evaluate</span>`,
            numericalEquivalence: `<span class="rule-name">Numerical equivalence</span>`,
            arithmeticLevel0: `<span class="rule-name">Arithmetic level zero</span>`,
            arithmeticLevel1: `<span class="rule-name">Arithmetic level one</span>`,
            arithmeticLevel2: `<span class="rule-name">Arithmetic level two</span>`,
            arithmeticLevel3: `<span class="rule-name">Arithmetic level three</span>`,
            numEvaluatePositiveSum: `<span class="rule-name">Evaluate sum of positive numbers</span>`,
            numEvaluatePositiveProduct: `<span class="rule-name">Evaluate product of positive numbers</span>`,
            numWritePositiveNumberAsProduct: `<span class="rule-name">Write positive number as product</span>`,
            numWritePositiveNumberAsSum: `<span class="rule-name">Write positive number as sum</span>`,
            numEvaluateSignedSum: `<span class="rule-name">Evaluate sum in parentheses including negatives</span>`,
            numEvaluateSignedProduct: `<span class="rule-name">Evaluate product in parentheses including negatives</span>`,
            numExpressNumberAsDifference: `<span class="rule-name">Express number as difference</span>`,
            numSumPositive: `<span class="rule-name">Positive Sum ⇔ Number</span><span class="rule-notation"># + # ⇔ #</span>`,
            numProductPositive: `<span class="rule-name">Positive Product ⇔ Number</span><span class="rule-notation"># · # ⇔ #</span>`,
            numProductWithNegatives: `<span class="rule-name">Product with Negatives ⇔ Number</span><span class="rule-notation"># · ((-1) · #) ⇔ #</span>`,
            numSumWithNegativeProducts: `<span class="rule-name">Sum with Negative Products ⇔ Number</span><span class="rule-notation"># + ((-1) · #) ⇔ #</span>`,
            factorNumber: `<span class="rule-name">Factor Number</span><span class="rule-notation">n = a · b</span>`,
            writeNumberAsSum: `<span class="rule-name">Split Number as Sum</span><span class="rule-notation">n = a + b</span>`,
            distributeLeftToRight: `<span class="rule-name">Distribute Left to Right</span><span class="rule-notation">A(B + C) = AB + AC</span>`,
            distributeRightToLeft: `<span class="rule-name">Distribute Right to Left</span><span class="rule-notation">(A + B)C = AC + BC</span>`,
            factorLeft: `<span class="rule-name">Factor From Left</span><span class="rule-notation">AB + AC = A(B + C)</span>`,
            factorRight: `<span class="rule-name">Factor From Right</span><span class="rule-notation">BA + CA = (B + C)A</span>`,
            commute: `<span class="rule-name">Commute</span>`,
            commuteFirstToLast: `<span class="rule-name">Commute first to end</span>`,
            commuteLastToFirst: `<span class="rule-name">Commute last to beginning</span>`,
            commuteTerms: `<span class="rule-name">Commute Terms</span><span class="rule-notation">A + B = B + A</span>`,
            commuteFactors: `<span class="rule-name">Commute Product</span><span class="rule-notation">A · B = B · A</span>`,
            insertIdentity: `<span class="rule-name">Insert Identity</span><span class="rule-notation">A = A + 0; A = A · 1</span>`,
            insertIdentityAddZeroTop: `<span class="rule-name">Insert Additive Identity Above</span>`,
            insertIdentityAddZeroBottom: `<span class="rule-name">Insert Additive Identity Below</span>`,
            insertIdentityMultiplyByOneLeft: `<span class="rule-name">Insert Multiplicative Identity Left</span>`,
            insertIdentityMultiplyByOneRight: `<span class="rule-name">Insert Multiplicative Identity Right</span>`,
            insertZeroProductLeft: `<span class="rule-name">Insert Zero Product Left</span>`,
            insertZeroProductRight: `<span class="rule-name">Insert Zero Product Right</span>`,
            reduceToZero: `<span class="rule-name">Reduce to Zero</span>`,
            reduceToOne: `<span class="rule-name">Reduce to One</span>`
        };

        const AVAILABLE_BY_DEFAULT_TOOLS = [
            "cancelOpposites",
            "cancelProductWithInverse",
            "eliminateDoubleInverse",
            "insertDoubleInverse",
            "distributeInverseOverProduct",
            "factorProductOfInverses",
            "rewriteInvNegOneToNegOne",
            "rewriteNegOneToInvNegOne",
            "rewriteNegativeOneExponentAsInverse",
            "rewriteInverseAsNegativeOneExponent",
            "combineSameBasePowers",
            "commute",
            "commuteFirstToLast",
            "commuteLastToFirst",
            "commuteFactors",
            "commuteTerms",
            "distributeExponentOverProduct",
            "distributeLeftToRight",
            "distributeRightToLeft",
            "doubleNegative",
            "eliminateExponentOne",
            "eliminateExponentZero",
            "eliminateIdentities",
            "evaluate",
            "numericalEquivalence",
            "arithmeticLevel0",
            "arithmeticLevel1",
            "arithmeticLevel2",
            "arithmeticLevel3",
            "numSumPositive",
            "numProductPositive",
            "numProductWithNegatives",
            "numSumWithNegativeProducts",
            "expandPowerOfSum",
            "factorCommonExponent",
            "factorLeft",
            "factorNumber",
            "factorRight",
            "insertIdentity",
            "insertIdentityAddZeroTop",
            "insertIdentityAddZeroBottom",
            "insertIdentityMultiplyByOneLeft",
            "insertIdentityMultiplyByOneRight",
            "insertZeroProduct",
            "oneToAnyPower",
            "insertExponentOne",
            "insertExponentZero",
            "insertPowerOfOne",
            "expandPowerOfPower",
            "powerOfPower",
            "powerToRepeatedProduct",
            "replaceOneWithInverseProduct",
            "repeatedProductToPower",
            "writeNumberAsSum",
            "zeroProduct"
        ];

        const UNAVAILABLE_BY_DEFAULT_TOOLS = [
        ];


        const POWER_INVERSE_REWRITE_TOOLS = [
            "rewriteInvNegOneToNegOne",
            "rewriteNegOneToInvNegOne",
            "rewriteNegativeOneExponentAsInverse",
            "rewriteInverseAsNegativeOneExponent",
            "eliminateExponentOne",
            "eliminateExponentZero",
            "insertExponentOne",
            "powerOfPower",
            "expandPowerOfPower",
            "combineSameBasePowers",
            "expandPowerOfSum",
            "distributeExponentOverProduct",
            "factorCommonExponent",
            "oneToAnyPower",
            "repeatedProductToPower",
            "powerToRepeatedProduct"
        ];

        function isPowerInverseRewriteTool(toolName) {
            return POWER_INVERSE_REWRITE_TOOLS.includes(toolName);
        }

        // Type-level menu filtering: these lists are intentionally broader than
        // exact applicability. If a user chooses a rule from the right type but
        // it does not apply to the specific expression, the button is marked red.
        const TOOL_KEYS_BY_SELECTED_TYPE = {
            any: [
                "insertIdentity",
                ],
            value: [
                "numericalEquivalence",
                "numSumPositive",
                "numProductPositive",
                "numProductWithNegatives",
                "numSumWithNegativeProducts",
                "replaceOneWithInverseProduct",
                "rewriteNegOneToInvNegOne",
                "factorNumber",
                "writeNumberAsSum",
                "insertZeroProduct"
            ],
            sum: [
                "commuteFirstToLast",
                "commuteLastToFirst",
                "numericalEquivalence",
                "numSumPositive",
                "numSumWithNegativeProducts",
                "commuteTerms",
                "factorLeft",
                "factorRight",
                "cancelOpposites",
                "eliminateIdentities",
                "evaluate"
            ],
            prod: [
                "commuteFirstToLast",
                "commuteLastToFirst",
                "numericalEquivalence",
                "numProductPositive",
                "numProductWithNegatives",
                "commuteFactors",
                "distributeLeftToRight",
                "distributeRightToLeft",
                "cancelProductWithInverse",
                "factorProductOfInverses",
                "combineSameBasePowers",
                "factorCommonExponent",
                "repeatedProductToPower",
                "doubleNegative",
                "zeroProduct",
                "eliminateIdentities",
                "evaluate"
            ],
            inv: [
                "eliminateDoubleInverse",
                "insertDoubleInverse",
                "distributeInverseOverProduct",
                "rewriteInvNegOneToNegOne",
                "rewriteInverseAsNegativeOneExponent"
            ],
            exp: [
                "evaluate",
                "numericalEquivalence",
                "eliminateExponentOne",
                "eliminateExponentZero",
                "insertExponentOne",
                "insertExponentZero",
                "insertPowerOfOne",
                "powerOfPower",
                "expandPowerOfPower",
                "expandPowerOfSum",
                "distributeExponentOverProduct",
                "oneToAnyPower",
                "powerToRepeatedProduct",
                "rewriteNegativeOneExponentAsInverse"
            ]
        };

        const TOOL_EXPONENT_MODES = {
            plain: "plain",
            numeric: "numeric",
            exponent: "exponent",
            inverse: "inverse"
        };

        const QUICK_TOOL_ROWS_BY_EXPONENT_MODE = {
            plain: [
                ["evaluate"],
                ["commuteTerms", "commuteFactors"],
                ["distributeLeftToRight", "distributeRightToLeft"],
                ["factorLeft", "factorRight"]
            ],
            exponent: [
                ["evaluate"],
                ["combineSameBasePowers", "expandPowerOfSum"],
                ["distributeExponentOverProduct", "factorCommonExponent"],
                ["powerOfPower"]
            ],
            inverse: []
        };

        const QUICK_TOOL_KEYS = uniqueToolKeys(
            Object.values(QUICK_TOOL_ROWS_BY_EXPONENT_MODE).flatMap(rows => rows.flat())
        );

        // Frequently used rearranging tools live above these categories as quick tools.
        // The radio buttons choose whether the quick tools and drill-down categories
        // should show non-exponent tools or exponent tools.
        const TOOL_MENU_CATEGORIES = [
            {
                id: "collapsePlain",
                family: "compression",
                mode: "plain",
                label: "Compression tools",
                keys: [
                    "cancelOpposites",
                    "doubleNegative",
                    "eliminateIdentities",
                    "zeroProduct"
                ]
            },
            {
                id: "collapseExponent",
                family: "compression",
                mode: "exponent",
                label: "Compression tools",
                keys: [
                    "cancelProductWithInverse",
                    "repeatedProductToPower",
                    "eliminateExponentOne",
                    "eliminateExponentZero",
                    "oneToAnyPower"
                ]
            },
            {
                id: "explodePlain",
                family: "expansion",
                mode: "plain",
                label: "Expansion tools",
                keys: [
                    "factorNumber",
                    "insertIdentity",
                    "insertZeroProduct",
                    "writeNumberAsSum"
                ]
            },
            {
                id: "explodeExponent",
                family: "expansion",
                mode: "exponent",
                label: "Expansion tools",
                keys: [
                    "powerToRepeatedProduct",
                    "replaceOneWithInverseProduct"
                ]
            },
            {
                id: "other",
                family: "other",
                mode: "both",
                label: "Other",
                keys: []
            }
        ];

        // The fixed rule-category menu presents the user's intention rather
        // than the individual algebraic rule. Exact applicability is still
        // decided by the existing rule checks below.
        const INTENT_RULE_CATEGORIES = [
            { id: "numericalRewrite", label: "Numerical Rewrite" },
            { id: "commute", label: "Commute" },
            { id: "insert", label: "Insert" },
            { id: "delete", label: "Delete" },
            { id: "separate", label: "Separate" },
            { id: "consolidate", label: "Consolidate" },
            { id: "translateNotation", label: "Translate Notation" }
        ];

        function getToolCategoryKey(category) {
            return category.family || category.id;
        }

        function getToolCategoryById(categoryId) {
            const mode = getCurrentToolExponentMode();
            const matchingCurrentMode = TOOL_MENU_CATEGORIES.find(category =>
                getToolCategoryKey(category) === categoryId &&
                (category.mode === mode || category.mode === "both")
            );
            if (matchingCurrentMode) {
                return matchingCurrentMode;
            }

            return TOOL_MENU_CATEGORIES.find(category => category.id === categoryId) || null;
        }

        function getCurrentToolExponentMode() {
            if (uiState.toolExponentMode === TOOL_EXPONENT_MODES.exponent) {
                return TOOL_EXPONENT_MODES.exponent;
            }
            if (uiState.toolExponentMode === TOOL_EXPONENT_MODES.inverse) {
                return TOOL_EXPONENT_MODES.inverse;
            }
            return TOOL_EXPONENT_MODES.plain;
        }

        function getDefaultToolExponentModeForSelection() {
            if (!selection || !selection.node) {
                return TOOL_EXPONENT_MODES.plain;
            }

            const selectedExpression = cloneSelectedRangeNode();
            const containsInverse = node => !!node && (
                node.type === "inv" ||
                (Array.isArray(node.args) && node.args.some(containsInverse))
            );
            if (containsInverse(selectedExpression)) {
                return TOOL_EXPONENT_MODES.inverse;
            }
            return selectedExpression && selectedExpression.type === "exp"
                ? TOOL_EXPONENT_MODES.exponent
                : TOOL_EXPONENT_MODES.plain;
        }

        function getToolCategoriesForCurrentExponentMode() {
            const mode = getCurrentToolExponentMode();
            return TOOL_MENU_CATEGORIES.filter(category => category.mode === mode || category.mode === "both");
        }

        function getQuickToolRowsForCurrentExponentMode() {
            return QUICK_TOOL_ROWS_BY_EXPONENT_MODE[getCurrentToolExponentMode()] || QUICK_TOOL_ROWS_BY_EXPONENT_MODE.plain;
        }

        function getSelectionTypeCandidateSet() {
            const selected = getSelectedExpressionForToolMenu();
            if (!selected) {
                return new Set();
            }
            const selectedType = selected.type;
            return new Set([
                ...(TOOL_KEYS_BY_SELECTED_TYPE[selectedType] || []),
                ...(TOOL_KEYS_BY_SELECTED_TYPE.any || [])
            ]);
        }

        function getSelectedExpressionForToolMenu() {
            return cloneSelectedRangeNode();
        }

        function uniqueToolKeys(keys) {
            const seen = new Set();
            const out = [];
            for (const key of keys) {
                if (!seen.has(key)) {
                    seen.add(key);
                    out.push(key);
                }
            }
            return out;
        }

        function getCandidateToolKeysForSelectionType(categoryId = null) {
            // Show every rule in the chosen category even when it is not exactly
            // applicable to the current selection. Non-applicable rule buttons
            // are marked red only after the user clicks them.
            if (!selection.node) {
                return [];
            }

            if (categoryId) {
                const category = getToolCategoryById(categoryId);
                return category ? category.keys.slice() : [];
            }

            return uniqueToolKeys([
                ...getQuickToolRowsForCurrentExponentMode().flat(),
                ...getToolCategoriesForCurrentExponentMode().flatMap(category => category.keys)
            ]);
        }

        function filterVisibleToolKeys(keys, allowedKeys) {
            return uniqueToolKeys(keys).filter(key =>
                TOOL_INFO[key] &&
                isToolAllowedInCurrentLevel(key) &&
                allowedKeys.has(key)
            );
        }

        function buildToolButtonHtml(key) {
            return `<button data-tool="${key}">${TOOL_INFO[key]}</button>`;
        }

        function getSelectedCommutePartCountForMenu() {
            if (!selection.node || (selection.node.type !== "sum" && selection.node.type !== "prod")) {
                return 0;
            }
            return getSelectedSliceLength();
        }

        function shouldShowSingleCommuteButtonForSelection() {
            return getSelectedCommutePartCountForMenu() === 2;
        }

        function shouldShowDirectionalCommuteButtonsForSelection() {
            return getSelectedCommutePartCountForMenu() >= 3;
        }

        const TOOL_FORM_MENU_ROWS_BY_EXPONENT_MODE = {
            plain: [
                { full: { tool: "arithmeticLevel0", html: "Arithmetic level zero" } },
                { full: { tool: "arithmeticLevel1", html: "Arithmetic level one" } },
                { full: { tool: "arithmeticLevel2", html: "Arithmetic level two" } },
                { full: { tool: "arithmeticLevel3", html: "Arithmetic level three" } },
                {
                    commutePair: true,
                    left: { tool: "commuteFirstToLast", html: "Commute first to end" },
                    right: { tool: "commuteLastToFirst", html: "Commute last to beginning" }
                },
                {
                    distributionPair: true,
                    leftFactored: {
                        tool: "factorLeft",
                        mini: miniProd(miniValue("A"), miniSum(miniValue("B"), miniValue("C")))
                    },
                    topDistributed: {
                        tool: "distributeLeftToRight",
                        mini: miniSum(
                            miniProd(miniValue("A"), miniValue("B")),
                            miniProd(miniValue("A"), miniValue("C"))
                        )
                    },
                    bottomDistributed: {
                        tool: "distributeRightToLeft",
                        mini: miniSum(
                            miniProd(miniValue("B"), miniValue("A")),
                            miniProd(miniValue("C"), miniValue("A"))
                        )
                    },
                    rightFactored: {
                        tool: "factorRight",
                        mini: miniProd(miniSum(miniValue("B"), miniValue("C")), miniValue("A"))
                    }
                },
                {
                    triplet: true,
                    left: { tool: "insertIdentityAddZeroBottom", mini: miniSum(miniValue("A"), miniValue("0")) },
                    center: { tool: "eliminateIdentities", mini: miniValue("A") },
                    right: { tool: "insertIdentityMultiplyByOneRight", mini: miniProd(miniValue("A"), miniValue("1")) }
                },
                {
                    triplet: true,
                    left: { tool: "insertZeroProductRight", mini: miniProd(miniValue("A"), miniValue("0")) },
                    center: { tool: "reduceToZero", mini: miniValue("0") },
                    right: { tool: "cancelOpposites", mini: miniSum(miniValue("A"), miniProd(miniValue("-1"), miniValue("A"))) }
                },
                {
                    left: { tool: "doubleNegative", mini: miniProd(miniValue("-1"), miniValue("-1")) },
                    arrow: "⇔",
                    right: { tool: "reduceToOne", mini: miniValue("1") }
                },
            ],
            numeric: [
                { full: { tool: "numEvaluatePositiveSum", html: "Evaluate sum of positive numbers" } },
                { full: { tool: "numEvaluatePositiveProduct", html: "Evaluate product of positive numbers" } },
                { full: { tool: "numWritePositiveNumberAsProduct", html: "Write positive number as product" } },
                { full: { tool: "numWritePositiveNumberAsSum", html: "Write positive number as sum" } },
                { full: { tool: "numEvaluateSignedSum", html: "Evaluate sum in parentheses including negatives" } },
                { full: { tool: "numEvaluateSignedProduct", html: "Evaluate product in parentheses including negatives" } },
                { full: { tool: "numExpressNumberAsDifference", html: "Express number as difference" } },
                { customNumericalEquivalences: true },
            ],
            exponent: [
                {
                    left: { tool: "combineSameBasePowers", mini: miniExp(miniValue("A"), miniSum(miniValue("m"), miniValue("n"))) },
                    arrow: "⇔",
                    right: { tool: "expandPowerOfSum", mini: miniProd(miniExp(miniValue("A"), miniValue("m")), miniExp(miniValue("A"), miniValue("n"))) }
                },
                {
                    left: { tool: "factorCommonExponent", mini: miniExp(miniProd(miniValue("A"), miniValue("B")), miniValue("n")) },
                    arrow: "⇔",
                    right: { tool: "distributeExponentOverProduct", mini: miniProd(miniExp(miniValue("A"), miniValue("n")), miniExp(miniValue("B"), miniValue("n"))) }
                },
                {
                    left: { tool: "expandPowerOfPower", mini: miniExp(miniExp(miniValue("A"), miniValue("m")), miniValue("n")) },
                    arrow: "⇔",
                    right: { tool: "powerOfPower", mini: miniExp(miniValue("A"), miniProd(miniValue("m"), miniValue("n"))) }
                },
                {
                    left: { tool: "repeatedProductToPower", mini: miniExp(miniValue("A"), miniValue("n")) },
                    arrow: "⇔",
                    right: { tool: "powerToRepeatedProduct", mini: miniProd(miniValue("A"), miniValue("A"), miniValue("…"), miniValue("A")) }
                },
                {
                    triplet: true,
                    left: { tool: "insertExponentZero", mini: miniExp(miniValue("A"), miniValue("0")) },
                    center: { tool: "reduceToOne", mini: miniValue("1") },
                    right: { tool: "insertPowerOfOne", mini: miniExp(miniValue("1"), miniValue("n")) }
                },
            ],
            inverse: [
                {
                    left: { tool: "insertDoubleInverse", mini: miniInv(miniInv(miniValue("A"))) },
                    arrow: "⇔",
                    right: { tool: "eliminateDoubleInverse", mini: miniValue("A") }
                },
                {
                    left: { tool: "factorProductOfInverses", mini: miniInv(miniProd(miniValue("A"), miniValue("B"))) },
                    arrow: "⇔",
                    right: { tool: "distributeInverseOverProduct", mini: miniProd(miniInv(miniValue("A")), miniInv(miniValue("B"))) }
                },
                {
                    left: { tool: "replaceOneWithInverseProduct", mini: miniProd(miniValue("A"), miniInv(miniValue("A"))) },
                    arrow: "⇔",
                    right: { tool: "cancelProductWithInverse", mini: miniValue("1") }
                },
                {
                    left: { tool: "rewriteNegOneToInvNegOne", mini: miniInv(miniValue("-1")) },
                    arrow: "⇔",
                    right: { tool: "rewriteInvNegOneToNegOne", mini: miniValue("-1") }
                },
                {
                    left: { tool: "rewriteNegativeOneExponentAsInverse", mini: miniInv(miniValue("A")) },
                    arrow: "⇔",
                    right: { tool: "rewriteInverseAsNegativeOneExponent", mini: miniExp(miniValue("A"), miniValue("-1")) }
                }
            ]
        };

        function getToolFormRowsForCurrentExponentMode() {
            return TOOL_FORM_MENU_ROWS_BY_EXPONENT_MODE[getCurrentToolExponentMode()] || TOOL_FORM_MENU_ROWS_BY_EXPONENT_MODE.plain;
        }

        function isApplicableOnlyToolNotationMode() {
            return uiState.toolNotationMode === "applicable";
        }

        function isIntentCategoryToolNotationMode() {
            return uiState.toolNotationMode === "categories";
        }

        function getIntentCategoryCandidateTools(categoryId) {
            const selectedNode = cloneSelectedRangeNode();
            const selectedIsZero = !!selectedNode && selectedNode.type === "value" && selectedNode.value === "0";
            const selectedIsOne = !!selectedNode && selectedNode.type === "value" && selectedNode.value === "1";
            const selectedIsNegativeOne = !!selectedNode && selectedNode.type === "value" && selectedNode.value === "-1";

            if (categoryId === "commute") {
                return ["commute"];
            }
            if (categoryId === "separate") {
                return [
                    "distributeLeftToRight",
                    "distributeRightToLeft",
                    "distributeInverseOverProduct",
                    "expandPowerOfSum",
                    "distributeExponentOverProduct",
                    "expandPowerOfPower"
                ];
            }
            if (categoryId === "consolidate") {
                return [
                    "factorLeft",
                    "factorRight",
                    "factorProductOfInverses",
                    "combineSameBasePowers",
                    "factorCommonExponent",
                    "powerOfPower"
                ];
            }
            if (categoryId === "delete") {
                return [
                    "eliminateIdentities",
                    ...(getCancelOppositesData() ? ["cancelOpposites"] : []),
                    "cancelProductWithInverse",
                    "eliminateDoubleInverse",
                    ...(getDoubleNegativeData() ? ["doubleNegative"] : []),
                    "zeroProduct",
                    "eliminateExponentOne",
                    "eliminateExponentZero",
                    "oneToAnyPower",
                    "rewriteInvNegOneToNegOne"
                ];
            }
            if (categoryId === "insert") {
                return [
                    "insertIdentityAddZeroTop",
                    "insertIdentityAddZeroBottom",
                    "insertIdentityMultiplyByOneLeft",
                    "insertIdentityMultiplyByOneRight",
                    ...(selectedIsZero ? ["cancelOpposites", "insertZeroProductLeft", "insertZeroProductRight"] : []),
                    ...(selectedIsOne ? [
                        "replaceOneWithInverseProduct",
                        "doubleNegative",
                        "insertExponentZero",
                        "insertPowerOfOne"
                    ] : []),
                    "insertDoubleInverse",
                    "insertExponentOne",
                    ...(selectedIsNegativeOne ? ["rewriteNegOneToInvNegOne"] : [])
                ];
            }
            if (categoryId === "translateNotation") {
                return [
                    "powerToRepeatedProduct",
                    "repeatedProductToPower",
                    "rewriteNegativeOneExponentAsInverse",
                    "rewriteInverseAsNegativeOneExponent"
                ];
            }
            if (categoryId === "numericalRewrite") {
                return [`arithmeticLevel${getArithmeticLevelForCurrentLevel()}`];
            }
            return [];
        }

        function getApplicableIntentCategoryTools(categoryId) {
            const applicability = getApplicableTools();
            return uniqueToolKeys(getIntentCategoryCandidateTools(categoryId)).filter(toolName =>
                !!TOOL_INFO[toolName] &&
                isToolAllowedInCurrentLevel(toolName) &&
                !!applicability[toolName]
            );
        }

        function getIntentCategoryIdForTool(toolName) {
            if (
                toolName === "numericalEquivalence" ||
                toolName === "evaluate" ||
                toolName === "factorNumber" ||
                toolName === "writeNumberAsSum" ||
                isArithmeticEquivalenceTool(toolName) ||
                isStructuredNumericalTool(toolName)
            ) {
                return "numericalRewrite";
            }
            const ids = INTENT_RULE_CATEGORIES.map(category => category.id);
            return ids.find(categoryId => getIntentCategoryCandidateTools(categoryId).includes(toolName)) || null;
        }

        function getIntentCategoryIconHtml(categoryId) {
            if (categoryId === "numericalRewrite") {
                return `<span class="intent-category-math" aria-hidden="true">
                    <span>1 + 2</span><span class="math-arrow">↔</span><span>3</span>
                </span>`;
            }
            if (categoryId === "commute") {
                return `<svg class="intent-category-icon" viewBox="0 0 100 68" aria-hidden="true" focusable="false">
                    <g transform="translate(18 2)">
                        <path class="icon-stroke" d="M32 7 A25 25 0 0 1 57 32"/><path class="icon-fill" d="M57 39 L51 29 L63 29 Z"/>
                        <path class="icon-stroke" d="M57 32 A25 25 0 0 1 32 57"/><path class="icon-fill" d="M25 57 L35 51 L35 63 Z"/>
                        <path class="icon-stroke" d="M32 57 A25 25 0 0 1 7 32"/><path class="icon-fill" d="M7 25 L13 35 L1 35 Z"/>
                        <path class="icon-stroke" d="M7 32 A25 25 0 0 1 32 7"/><path class="icon-fill" d="M39 7 L29 13 L29 1 Z"/>
                    </g>
                </svg>`;
            }
            if (categoryId === "insert") {
                return `<svg class="intent-category-icon" viewBox="0 0 100 68" aria-hidden="true" focusable="false">
                    <g transform="rotate(-43 50 34)">
                        <path class="icon-stroke" d="M23 24 H78 Q82 24 82 28 V40 Q82 44 78 44 H23 Z"/>
                        <path class="icon-stroke" d="M23 24 L8 34 L23 44 Z M68 24 V44"/>
                        <path class="icon-fill" d="M8 34 L17 30 L17 38 Z"/>
                    </g>
                </svg>`;
            }
            if (categoryId === "delete") {
                return `<svg class="intent-category-icon" viewBox="0 0 100 68" aria-hidden="true" focusable="false">
                    <g transform="rotate(-43 50 34)">
                        <rect class="icon-stroke" x="19" y="22" width="64" height="24" rx="6"/>
                        <path class="icon-stroke" d="M42 22 V46"/>
                    </g>
                </svg>`;
            }
            if (categoryId === "separate") {
                return `<svg class="intent-category-icon" viewBox="0 0 100 68" aria-hidden="true" focusable="false">
                    <path class="icon-stroke" d="M8 34 H33 C49 34 48 15 68 15 H84 M33 34 C49 34 48 53 68 53 H84"/>
                    <path class="icon-fill" d="M94 15 L80 7 V23 Z M94 53 L80 45 V61 Z"/>
                </svg>`;
            }
            if (categoryId === "consolidate") {
                return `<svg class="intent-category-icon" viewBox="0 0 100 68" aria-hidden="true" focusable="false">
                    <path class="icon-stroke" d="M8 15 H29 C49 15 48 34 64 34 H84 M8 53 H29 C49 53 48 34 64 34"/>
                    <path class="icon-fill" d="M94 34 L80 26 V42 Z"/>
                </svg>`;
            }
            if (categoryId === "translateNotation") {
                return `<span class="intent-category-math translate-notation-math" aria-hidden="true">
                    <span>(x<sup>2</sup>)<sup>−1</sup></span>
                    <span class="math-arrow">↔</span>
                    <span class="math-fraction">
                        <span class="math-numerator">1</span>
                        <span class="math-denominator">x · x</span>
                    </span>
                </span>`;
            }
            return "";
        }

        function buildIntentCategoryButtonHtml(categoryId) {
            const category = INTENT_RULE_CATEGORIES.find(item => item.id === categoryId);
            const label = category ? category.label : categoryId;
            return `<button class="intent-category-button" data-rule-category="${categoryId}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">${getIntentCategoryIconHtml(categoryId)}</button>`;
        }

        function buildIntentCategoryMenuHtml() {
            return `<div class="panel-menu-title">Choose an action</div>
                <div class="intent-category-list">
                    <div class="intent-category-row single">${buildIntentCategoryButtonHtml("numericalRewrite")}</div>
                    <div class="intent-category-row single">${buildIntentCategoryButtonHtml("commute")}</div>
                    <div class="intent-category-row">
                        ${buildIntentCategoryButtonHtml("insert")}
                        ${buildIntentCategoryButtonHtml("delete")}
                    </div>
                    <div class="intent-category-row">
                        ${buildIntentCategoryButtonHtml("separate")}
                        ${buildIntentCategoryButtonHtml("consolidate")}
                    </div>
                    <div class="intent-category-row single">${buildIntentCategoryButtonHtml("translateNotation")}</div>
                </div>`;
        }

        function getIntentCategoryExplodedChoiceEntry(toolName, categoryId) {
            const A = () => miniValue("A");
            const zero = () => miniValue("0");
            const one = () => miniValue("1");
            const negativeOne = () => miniValue("-1");

            // A few reversible rules share one internal tool name. Choose the
            // direction represented by the selected rule category.
            if (categoryId === "insert" && toolName === "cancelOpposites") {
                return {
                    tool: toolName,
                    fromMini: zero(),
                    toMini: miniSum(A(), miniProd(negativeOne(), A()))
                };
            }
            if (categoryId === "delete" && toolName === "doubleNegative") {
                return {
                    tool: toolName,
                    fromMini: miniProd(negativeOne(), negativeOne()),
                    toMini: one()
                };
            }

            const existing = collectApplicableTransformationEntries()
                .find(entry => entry.tool === toolName);
            if (existing) {
                return existing;
            }

            const fallbackPairs = {
                insertIdentity: { fromMini: A(), toMini: miniSum(A(), zero()) },
                insertIdentityAddZeroTop: { fromMini: A(), toMini: miniSum(zero(), A()) },
                insertIdentityAddZeroBottom: { fromMini: A(), toMini: miniSum(A(), zero()) },
                insertIdentityMultiplyByOneLeft: { fromMini: A(), toMini: miniProd(one(), A()) },
                insertIdentityMultiplyByOneRight: { fromMini: A(), toMini: miniProd(A(), one()) },
                eliminateIdentities: { fromMini: miniSum(A(), zero()), toMini: A() },
                insertZeroProductLeft: { fromMini: zero(), toMini: miniProd(zero(), A()) },
                insertZeroProductRight: { fromMini: zero(), toMini: miniProd(A(), zero()) },
                zeroProduct: { fromMini: miniProd(A(), zero()), toMini: zero() },
                insertExponentOne: { fromMini: A(), toMini: miniExp(A(), one()) },
                eliminateExponentOne: { fromMini: miniExp(A(), one()), toMini: A() },
                eliminateExponentZero: { fromMini: miniExp(A(), zero()), toMini: one() },
                oneToAnyPower: { fromMini: miniExp(one(), A()), toMini: one() }
            };
            const pair = fallbackPairs[toolName];
            return pair ? { tool: toolName, ...pair } : null;
        }

        function buildIntentCategoryChoicesHtml(categoryId) {
            const category = INTENT_RULE_CATEGORIES.find(item => item.id === categoryId);
            const tools = getApplicableIntentCategoryTools(categoryId);
            let html = `<button class="panel-menu-back-button" data-action="backToIntentCategories">← Back to categories</button>`;
            html += `<div class="panel-menu-title">${escapeHtml(category ? category.label : "Choose a rule")}</div>`;
            html += `<div class="small-note">More than one rule applies. Choose the one you intend.</div>`;
            html += `<div class="tool-form-grid applicable-tool-list intent-category-choices">`;
            tools.forEach(toolName => {
                const entry = getIntentCategoryExplodedChoiceEntry(toolName, categoryId);
                if (entry) {
                    html += `<div class="tool-form-row single applicable-tool-row">${buildApplicableTransformationButtonHtml(entry)}</div>`;
                }
            });
            html += `</div>`;
            return html;
        }

        function buildIntentCategoryToolListHtml() {
            return uiState.activeToolCategory
                ? buildIntentCategoryChoicesHtml(uiState.activeToolCategory)
                : buildIntentCategoryMenuHtml();
        }

        function isToolFormSideAvailable(side) {
            if (!side) {
                return false;
            }
            if (!side.tool) {
                return true;
            }

            // Keep most rules visible even when not exactly applicable.
            // Arithmetic-level buttons are the exception: a level should show
            // only the arithmetic level specified by the current game level.
            if (isArithmeticEquivalenceTool(side.tool)) {
                return !!TOOL_INFO[side.tool] && isArithmeticToolAllowedInCurrentLevel(side.tool);
            }
            return !!TOOL_INFO[side.tool];
        }

        function isToolFormRowAvailable(row) {
            if (row.customNumericalEquivalences) {
                return true;
            }
            if (row.full) {
                return isToolFormSideAvailable(row.full);
            }
            if (row.commutePair) {
                return getSelectedCommutePartCountForMenu() >= 2;
            }
            if (row.distributionPair) {
                return [row.leftFactored, row.topDistributed, row.bottomDistributed, row.rightFactored]
                    .some(isToolFormSideAvailable);
            }
            if (row.triplet) {
                return [row.left, row.center, row.right].some(isToolFormSideAvailable);
            }
            const leftAvailable = row.leftGroup
                ? row.leftGroup.some(isToolFormSideAvailable)
                : isToolFormSideAvailable(row.left);
            const rightAvailable = row.rightGroup
                ? row.rightGroup.some(isToolFormSideAvailable)
                : isToolFormSideAvailable(row.right);
            return leftAvailable || rightAvailable;
        }

        function buildCustomNumericalEquivalencesHtml() {
            const level = getCurrentLevel();
            const custom = level && Array.isArray(level.customNumericalEquivalences)
                ? level.customNumericalEquivalences
                : [];
            let html = `<div class="tool-form-section-title">Custom numerical equivalences</div>`;
            if (!custom.length) {
                html += `<div class="small-note">No custom numerical equivalences have been added to this level yet.</div>`;
                return html;
            }
            html += `<div class="tool-grid">`;
            custom.forEach((item, index) => {
                const label = item && item.label
                    ? item.label
                    : `Custom equivalence ${index + 1}`;
                html += `<button data-tool="customNumericalEquivalence${index}">${escapeHtml(label)}</button>`;
            });
            html += `</div>`;
            return html;
        }

        function miniExpressionToConventionalText(node) {
            if (!node) {
                return "";
            }

            const isNegativeValue = item => item && item.type === "value" && /^-/.test(String(item.text ?? item.value ?? ""));
            const render = item => {
                if (!item) {
                    return "";
                }
                if (item.type === "value") {
                    return String(item.text ?? item.value ?? "");
                }
                if (item.type === "sum") {
                    return (item.args || []).map(render).join("+");
                }
                if (item.type === "prod") {
                    return (item.args || []).map(factor => {
                        if (!factor) {
                            return "";
                        }
                        if (factor.type === "sum" || isNegativeValue(factor)) {
                            return `(${render(factor)})`;
                        }
                        return render(factor);
                    }).join("·");
                }
                if (item.type === "exp") {
                    const base = item.base || (Array.isArray(item.args) ? item.args[0] : null);
                    const exponent = item.exponent || (Array.isArray(item.args) ? item.args[1] : null);
                    const baseText = base && base.type === "value" && !isNegativeValue(base)
                        ? render(base)
                        : `(${render(base)})`;
                    const exponentText = exponent && exponent.type === "value"
                        ? render(exponent)
                        : `(${render(exponent)})`;
                    return `${baseText}^${exponentText}`;
                }
                if (item.type === "inv") {
                    const arg = item.arg || (Array.isArray(item.args) ? item.args[0] : null);
                    const argText = arg && arg.type === "value" && !isNegativeValue(arg)
                        ? render(arg)
                        : `(${render(arg)})`;
                    return `${argText}^-1`;
                }
                return "";
            };

            return render(node);
        }

        function getToolFormNotationLabel(side) {
            if (!side || !side.mini) {
                return side && side.html ? side.html : "";
            }
            if (uiState.toolNotationMode === "conventional") {
                return `<span class="tool-form-conventional-label">${escapeHtml(miniExpressionToConventionalText(side.mini))}</span>`;
            }
            return renderMiniOopsSvg(side.mini);
        }

        function stripHtmlTags(html) {
            return String(html || "")
                .replace(/<[^>]*>/g, " ")
                .replace(/\s+/g, " ")
                .trim();
        }

        function getToolFormActionName(side) {
            if (!side || !side.tool) {
                return "";
            }
            const info = TOOL_INFO[side.tool] || "";
            const match = info.match(/<span class="rule-name">([\s\S]*?)<\/span>/i);
            if (match) {
                return stripHtmlTags(match[1]);
            }
            return stripHtmlTags(side.html);
        }

        function buildToolFormSideHtml(side) {
            if (!side || !isToolFormSideAvailable(side)) {
                return `<span class="tool-form-static"></span>`;
            }

            const labelContent = getToolFormNotationLabel(side);
            const labelClass = side.mini && uiState.toolNotationMode !== "conventional"
                ? "tool-form-label tool-form-mini-label"
                : "tool-form-label";
            const actionName = uiState.toolNotationMode === "conventional" && side.mini && side.tool
                ? getToolFormActionName(side)
                : "";
            const labelInner = actionName
                ? `${labelContent}<span class="tool-form-conventional-action">${escapeHtml(actionName)}</span>`
                : labelContent;
            const label = `<span class="${labelClass}">${labelInner}</span>`;
            if (!side.tool) {
                return `<span class="tool-form-static">${label}</span>`;
            }

            const title = side.title ? ` title="${escapeHtml(side.title)}"` : "";
            return `<button class="tool-form-button" data-tool="${side.tool}"${title}>${label}</button>`;
        }

        function buildToolFormSideOrGroupHtml(side, sideGroup) {
            if (Array.isArray(sideGroup) && sideGroup.length) {
                const pieces = [];
                sideGroup.forEach((groupSide, index) => {
                    if (index > 0) {
                        pieces.push(`<span class="tool-form-or">or</span>`);
                    }
                    pieces.push(buildToolFormSideHtml(groupSide));
                });
                return `<div class="tool-form-inline-group">${pieces.join("")}</div>`;
            }
            return buildToolFormSideHtml(side);
        }

        function buildToolFormCommutePairHtml(row) {
            if (getSelectedCommutePartCountForMenu() < 2) {
                return "";
            }
            return `<div class="tool-form-row single">${buildToolFormSideHtml({ tool: "commute", html: "Commute" })}</div>`;
        }

        function buildToolFormDistributionPairHtml(row) {
            const arrow = `<div class="tool-form-arrow">⇔</div>`;
            const empty = `<div class="tool-form-distribution-empty" aria-hidden="true"></div>`;
            return `<div class="tool-form-distribution-pair">
                ${buildToolFormSideHtml(row.leftFactored)}
                ${arrow}
                ${buildToolFormSideHtml(row.topDistributed)}
                ${empty}
                ${empty}
                ${empty}
                ${empty}
                ${buildToolFormSideHtml(row.bottomDistributed)}
                ${arrow}
                ${buildToolFormSideHtml(row.rightFactored)}
            </div>`;
        }

        function buildToolFormPairHtml(row) {
            return `<div class="tool-form-pair">
                ${buildToolFormSideOrGroupHtml(row.left, row.leftGroup)}
                <div class="tool-form-arrow">${escapeHtml(row.arrow || "⇔")}</div>
                ${buildToolFormSideOrGroupHtml(row.right, row.rightGroup)}
            </div>`;
        }

        function buildToolFormTripletHtml(row) {
            return `<div class="tool-form-triplet">
                ${buildToolFormSideHtml(row.left)}
                <div class="tool-form-arrow">⇔</div>
                ${buildToolFormSideHtml(row.center)}
                <div class="tool-form-arrow">⇔</div>
                ${buildToolFormSideHtml(row.right)}
            </div>`;
        }

        function buildToolFormRowHtml(row) {
            if (row.customNumericalEquivalences) {
                return buildCustomNumericalEquivalencesHtml();
            }

            if (row.full) {
                return `<div class="tool-form-row single">${buildToolFormSideHtml(row.full)}</div>`;
            }

            if (row.commutePair) {
                return buildToolFormCommutePairHtml(row);
            }

            if (row.distributionPair) {
                return buildToolFormDistributionPairHtml(row);
            }

            if (row.triplet) {
                return buildToolFormTripletHtml(row);
            }

            return buildToolFormPairHtml(row);
        }

        function getApplicableNotationCommuteMiniPair(toolName) {
            const isProduct = !!selection.node && selection.node.type === "prod";
            const combine = (...args) => isProduct ? miniProd(...args) : miniSum(...args);
            if (toolName === "commute") {
                return {
                    from: combine(miniValue("A"), miniValue("B")),
                    to: combine(miniValue("B"), miniValue("A"))
                };
            }
            if (toolName === "commuteFirstToLast") {
                return {
                    from: combine(miniValue("A"), miniValue("B"), miniValue("C")),
                    to: combine(miniValue("B"), miniValue("C"), miniValue("A"))
                };
            }
            if (toolName === "commuteLastToFirst") {
                return {
                    from: combine(miniValue("A"), miniValue("B"), miniValue("C")),
                    to: combine(miniValue("C"), miniValue("A"), miniValue("B"))
                };
            }
            return null;
        }

        function pushApplicableTransformationEntry(out, tool, fromMini, toMini) {
            if (!tool || !fromMini || !toMini) {
                return;
            }
            if (!TOOL_INFO[tool] || !isToolAllowedInCurrentLevel(tool) || !isToolActuallyApplicable(tool)) {
                return;
            }
            out.push({ tool, fromMini, toMini });
        }

        function collectApplicableTransformationEntries() {
            const entries = [];
            const modes = ["plain", "exponent", "inverse"];

            for (const mode of modes) {
                (TOOL_FORM_MENU_ROWS_BY_EXPONENT_MODE[mode] || []).forEach(row => {
                    if (!row) {
                        return;
                    }
                    if (row.commutePair) {
                        if (shouldShowSingleCommuteButtonForSelection()) {
                            const pair = getApplicableNotationCommuteMiniPair("commute");
                            if (pair) {
                                pushApplicableTransformationEntry(entries, "commute", pair.from, pair.to);
                            }
                        } else if (shouldShowDirectionalCommuteButtonsForSelection()) {
                            const firstPair = getApplicableNotationCommuteMiniPair("commuteFirstToLast");
                            const lastPair = getApplicableNotationCommuteMiniPair("commuteLastToFirst");
                            if (firstPair) {
                                pushApplicableTransformationEntry(entries, "commuteFirstToLast", firstPair.from, firstPair.to);
                            }
                            if (lastPair) {
                                pushApplicableTransformationEntry(entries, "commuteLastToFirst", lastPair.from, lastPair.to);
                            }
                        }
                        return;
                    }
                    if (row.distributionPair) {
                        pushApplicableTransformationEntry(entries, row.leftFactored && row.leftFactored.tool, row.topDistributed && row.topDistributed.mini, row.leftFactored && row.leftFactored.mini);
                        pushApplicableTransformationEntry(entries, row.topDistributed && row.topDistributed.tool, row.leftFactored && row.leftFactored.mini, row.topDistributed && row.topDistributed.mini);
                        pushApplicableTransformationEntry(entries, row.rightFactored && row.rightFactored.tool, row.bottomDistributed && row.bottomDistributed.mini, row.rightFactored && row.rightFactored.mini);
                        pushApplicableTransformationEntry(entries, row.bottomDistributed && row.bottomDistributed.tool, row.rightFactored && row.rightFactored.mini, row.bottomDistributed && row.bottomDistributed.mini);
                        return;
                    }
                    if (row.triplet) {
                        pushApplicableTransformationEntry(entries, row.left && row.left.tool, row.center && row.center.mini, row.left && row.left.mini);
                        pushApplicableTransformationEntry(entries, row.center && row.center.tool, row.left && row.left.mini, row.center && row.center.mini);
                        pushApplicableTransformationEntry(entries, row.right && row.right.tool, row.center && row.center.mini, row.right && row.right.mini);
                        pushApplicableTransformationEntry(entries, row.center && row.center.tool, row.right && row.right.mini, row.center && row.center.mini);
                        return;
                    }
                    if (row.left && row.right) {
                        pushApplicableTransformationEntry(entries, row.left.tool, row.right.mini, row.left.mini);
                        pushApplicableTransformationEntry(entries, row.right.tool, row.left.mini, row.right.mini);
                    }
                });
            }

            return entries;
        }

        function buildApplicableTransformationButtonHtml(entry) {
            return `<button class="tool-form-button applicable-tool-button" data-tool="${entry.tool}">
                <span class="applicable-tool-flow">
                    <span class="applicable-tool-side">${renderMiniOopsSvg(entry.fromMini)}</span>
                    <span class="applicable-tool-arrow">→</span>
                    <span class="applicable-tool-side">${renderMiniOopsSvg(entry.toMini)}</span>
                </span>
            </button>`;
        }

        function buildApplicableToolListHtml() {
            const entries = collectApplicableTransformationEntries();
            let html = `<div class="tool-form-grid applicable-tool-list">`;
            if (!entries.length) {
                html += `<div class="small-note">No applicable transformation rules are available for the current selection.</div>`;
                html += `</div>`;
                return html;
            }
            entries.forEach(entry => {
                html += `<div class="tool-form-row single applicable-tool-row">${buildApplicableTransformationButtonHtml(entry)}</div>`;
            });
            html += `</div>`;
            return html;
        }

        function isLeftPanelShowingToolMenu() {
            return levelContent && !!levelContent.querySelector(".panel-tool-menu");
        }

        function isToolActuallyApplicable(toolName) {
            const applicable = getApplicableTools();
            return !!applicable[toolName];
        }

        const workspaceSvg = document.getElementById("expressionWorkspaceSvg");
        const ctx = createSvgContext(workspaceSvg);
        const floatingToolMenu = document.getElementById("floatingToolMenu");
        const divider = document.getElementById("divider");
        const leftPanel = document.getElementById("leftPanel");
        const svgContainer = document.getElementById("svgContainer");
        const targetExpressionSvg = document.getElementById("targetExpressionSvg");
        const targetExpressionCtx = targetExpressionSvg ? createSvgContext(targetExpressionSvg) : null;
        const currentExpressionSvg = document.getElementById("currentExpressionSvg");
        const currentExpressionCtx = currentExpressionSvg ? createSvgContext(currentExpressionSvg) : null;
        const inspectExitButton = document.getElementById("inspectExitButton");

        const LEVELS = [];

        function inferVariablesFromExpressionTextForLevel(text) {
            const matches = String(text || "").match(/[a-zA-Z]/g) || [];
            return Array.from(new Set(matches)).sort();
        }

        LEVELS.forEach(level => {
            if (!Array.isArray(level.variables) || !level.variables.length) {
                level.variables = inferVariablesFromExpressionTextForLevel(level.startExpression);
            }
        });



        const levelFileInput = document.getElementById("levelFileInput");
        const loadedLevelFileName = document.getElementById("loadedLevelFileName");
        const levelContent = document.getElementById("levelContent");
        const moveHistoryControls = document.getElementById("moveHistoryControls");
        const regularModeRadio = document.getElementById("regularModeRadio");
        const demoModeRadio = document.getElementById("demoModeRadio");

        const PLAY_MODES = {
            regular: "regular",
            demo: "demo"
        };

        let playMode = PLAY_MODES.regular;
        let demoStepIndex = 0;

        let currentLevelIndex = 0;
        let completedSteps = [];
        let currentExpressionRoot = null;
        let inspectSavedExpressionRoot = null;
        let solutionRecorder = null;
        let completionExportReadyForRun = false;
        let completionExportCompletedAtDate = null;

        let internalClipboardText = "";
        let isDraggingDivider = false;

        divider.addEventListener("mousedown", () => {
            isDraggingDivider = true;
            document.body.style.cursor = "col-resize";
        });

        document.addEventListener("mousemove", e => {
            if (!isDraggingDivider) {
                return;
            }

            let percent = (e.clientX / window.innerWidth) * 100;
            percent = Math.max(10, Math.min(50, percent));
            leftPanel.style.width = percent + "%";
            drawExpression();
        });

        document.addEventListener("mouseup", () => {
            if (!isDraggingDivider) {
                return;
            }
            isDraggingDivider = false;
            document.body.style.cursor = "default";
        });



        function cloneExpressionTree(node) {
            return node ? cloneNode(node) : null;
        }

        const BUILDER_HISTORY_LIMIT = 100;

        function cloneBuilderNodeForHistory(node) {
            if (!node) {
                return null;
            }
            const cloned = new ExprNode(
                node.type,
                node.args.map(cloneBuilderNodeForHistory),
                node.value
            );
            cloned.isBuilderPlaceholder = !!node.isBuilderPlaceholder;
            cloned.isBuilderOuter = !!node.isBuilderOuter;
            cloned.isBuilderActive = !!node.isBuilderActive;
            return cloned;
        }

        function getBuilderUndoSnapshot(builder) {
            return {
                root: cloneBuilderNodeForHistory(builder.root),
                currentPath: builder.currentPath.slice()
            };
        }

        function pushExpressionBuilderUndoState() {
            const builder = uiState.expressionBuilder;
            if (!builder) {
                return;
            }
            if (!Array.isArray(builder.history)) {
                builder.history = [];
            }
            builder.history.push(getBuilderUndoSnapshot(builder));
            if (builder.history.length > BUILDER_HISTORY_LIMIT) {
                builder.history.shift();
            }
        }

        function undoExpressionBuilderStep() {
            const builder = uiState.expressionBuilder;
            if (!builder || !Array.isArray(builder.history) || !builder.history.length) {
                uiState.message = "There is nothing to undo yet.";
                renderToolArea();
                return false;
            }
            const snapshot = builder.history.pop();
            builder.root = snapshot.root;
            builder.currentPath = snapshot.currentPath;
            uiState.message = "";
            refreshExpressionBuilderPreview();
            return true;
        }

        function syncCurrentExpressionRoot() {
            if (uiState.mode === "edit") {
                currentExpressionRoot = expressionRoot;
            }
        }

        function renderCurrentExpressionDisplay() {
            if (uiState && uiState.mode === "inspect") {
                const level = getCurrentLevel();
                const targetText = level && level.steps && level.steps[uiState.inspectStepIndex]
                    ? level.steps[uiState.inspectStepIndex].expression
                    : "";
                const currentText = currentExpressionRoot
                    ? expressionToFullyParenthesizedText(currentExpressionRoot)
                    : (expressionRoot ? expressionToFullyParenthesizedText(expressionRoot) : "");

                drawParenthesizedExpressionSvg(targetText, targetExpressionSvg, targetExpressionCtx);
                drawParenthesizedExpressionSvg(currentText, currentExpressionSvg, currentExpressionCtx);
                return;
            }

            clearParenthesizedExpressionSvg(targetExpressionSvg, targetExpressionCtx);
            clearParenthesizedExpressionSvg(currentExpressionSvg, currentExpressionCtx);
        }

        function getMatchingParenthesisPairs(text) {
            const stack = [];
            const pairs = [];

            for (let i = 0; i < text.length; i++) {
                const ch = text[i];
                if (ch === "(") {
                    stack.push(i);
                } else if (ch === ")") {
                    const openIndex = stack.pop();
                    if (openIndex !== undefined) {
                        pairs.push({ openIndex, closeIndex: i });
                    }
                }
            }

            return pairs;
        }

        function isCompressedPreviewCharacter(ch) {
            return ch !== "(" && ch !== ")";
        }

        function buildCompressedExpressionLayout(ctx, text, startX, baselineY) {
            const visibleChars = [];
            const originalToVisible = new Map();
            let visibleText = "";
            let cursorX = startX;

            for (let i = 0; i < text.length; i++) {
                const ch = text[i];
                if (!isCompressedPreviewCharacter(ch)) {
                    continue;
                }

                const metrics = ctx.measureText(ch);
                const width = metrics.width;
                const ascent = Math.abs(metrics.actualBoundingBoxAscent || 10);
                const descent = Math.abs(metrics.actualBoundingBoxDescent || 4);
                const info = {
                    originalIndex: i,
                    ch,
                    x: cursorX,
                    width,
                    centerX: cursorX + width / 2,
                    centerY: baselineY - ascent + (ascent + descent) / 2
                };

                visibleChars.push(info);
                originalToVisible.set(i, info);
                visibleText += ch;
                cursorX += width;
            }

            return {
                visibleText,
                visibleChars,
                originalToVisible,
                width: cursorX - startX
            };
        }

        function findFirstVisibleCharInsidePair(visibleChars, pair) {
            for (const info of visibleChars) {
                if (info.originalIndex > pair.openIndex && info.originalIndex < pair.closeIndex) {
                    return info;
                }
            }
            return null;
        }

        function findLastVisibleCharInsidePair(visibleChars, pair) {
            for (let i = visibleChars.length - 1; i >= 0; i--) {
                const info = visibleChars[i];
                if (info.originalIndex > pair.openIndex && info.originalIndex < pair.closeIndex) {
                    return info;
                }
            }
            return null;
        }

        function getCompressedParenthesisArcDescriptors(text, compressedLayout, arcBaselineY) {
            const arcs = [];
            const pairs = getMatchingParenthesisPairs(text);

            for (const pair of pairs) {
                const firstVisible = findFirstVisibleCharInsidePair(compressedLayout.visibleChars, pair);
                const lastVisible = findLastVisibleCharInsidePair(compressedLayout.visibleChars, pair);
                if (!firstVisible || !lastVisible) {
                    continue;
                }

                // The literal parenthesis marks are gone, so the grouping arc spans
                // the visible substring that used to be inside that parenthesis pair.
                const startX = firstVisible.x;
                const endX = lastVisible.x + lastVisible.width;
                const radius = (endX - startX) / 2;
                if (!(radius > 0)) {
                    continue;
                }

                arcs.push({
                    startX,
                    endX,
                    centerX: (startX + endX) / 2,
                    centerY: arcBaselineY,
                    radius,
                    openIndex: pair.openIndex,
                    closeIndex: pair.closeIndex
                });
            }

            return arcs;
        }

        function drawCompressedParenthesisSemicircles(ctx, arcs) {
            if (!arcs.length) {
                return;
            }

            ctx.save();
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.2;

            // Draw larger grouping arcs first so smaller local groupings remain readable on top.
            const sortedArcs = arcs.slice().sort((a, b) => b.radius - a.radius);
            for (const arc of sortedArcs) {
                ctx.beginPath();
                // Draw the lower half of the circle so the connector opens upward.
                ctx.arc(arc.centerX, arc.centerY, arc.radius, 0, Math.PI, false);
                ctx.stroke();
            }

            ctx.restore();
        }

        function clearParenthesizedExpressionSvg(svgElement, svgContext) {
            if (!svgElement || !svgContext) {
                return;
            }

            setSvgSize(svgElement, 1, 1);
            svgContext.clearRect(0, 0, 1, 1);
        }

        function drawParenthesizedExpressionSvg(text, svgElement, svgContext) {
            if (!svgElement || !svgContext) {
                return;
            }

            const font = "16px Verdana, Arial, Helvetica, sans-serif";
            const paddingX = 10;
            const paddingY = 8;
            const expressionBaseline = paddingY + 16;
            const arcBaseline = expressionBaseline + 12;
            const parentWidth = svgElement.parentElement
                ? svgElement.parentElement.clientWidth
                : 0;

            svgContext.font = font;
            svgContext.textAlign = "left";
            svgContext.textBaseline = "alphabetic";

            const compressedLayout = buildCompressedExpressionLayout(
                svgContext,
                text,
                paddingX,
                expressionBaseline
            );
            const arcs = getCompressedParenthesisArcDescriptors(text, compressedLayout, arcBaseline);

            let maxArcBottom = arcBaseline + paddingY;
            for (const arc of arcs) {
                maxArcBottom = Math.max(maxArcBottom, arc.centerY + arc.radius + paddingY);
            }

            const cssWidth = Math.max(1, Math.ceil(Math.max(compressedLayout.width + paddingX * 2, parentWidth)));
            const cssHeight = Math.max(1, Math.ceil(maxArcBottom + 2));

            setSvgSize(svgElement, cssWidth, cssHeight);
            svgContext.clearRect(0, 0, cssWidth, cssHeight);
            svgContext.font = font;
            svgContext.textAlign = "left";
            svgContext.textBaseline = "alphabetic";

            const redrawnCompressedLayout = buildCompressedExpressionLayout(
                svgContext,
                text,
                paddingX,
                expressionBaseline
            );
            const redrawnArcs = getCompressedParenthesisArcDescriptors(text, redrawnCompressedLayout, arcBaseline);

            svgContext.fillStyle = "#000000";
            svgContext.fillText(redrawnCompressedLayout.visibleText, paddingX, expressionBaseline);
            drawCompressedParenthesisSemicircles(svgContext, redrawnArcs);
        }

        function enterInspectMode(stepIndex) {
            if (STEP_PREVIEW_COMPARISON_DISABLED_FOR_NOW) {
                return;
            }

            const level = getCurrentLevel();
            if (!level || !level.steps || !level.steps[stepIndex]) {
                return;
            }

            currentExpressionRoot = cloneExpressionTree(currentExpressionRoot || expressionRoot);
            expressionRoot = currentExpressionRoot;

            uiState.mode = "inspect";
            uiState.inspectStepIndex = stepIndex;
            document.body.classList.add("inspect-mode");

            clearSelection();
            clearInteraction();
            hideFloatingMenu();

            if (inspectExitButton) {
                inspectExitButton.classList.add("hidden");
            }

            layoutExpression(expressionRoot);
            renderCurrentExpressionDisplay();
            renderLevelInfo(currentLevelIndex);
            drawExpression();
        }

        function exitInspectMode() {
            if (uiState.mode !== "inspect") {
                return;
            }

            expressionRoot = currentExpressionRoot || expressionRoot;
            expressionRoot = normalizeExpressionTree(expressionRoot);
            currentExpressionRoot = expressionRoot;
            inspectSavedExpressionRoot = null;

            uiState.mode = "edit";
            uiState.inspectStepIndex = -1;
            document.body.classList.remove("inspect-mode");

            clearSelection();
            clearInteraction();
            hideFloatingMenu();

            if (inspectExitButton) {
                inspectExitButton.classList.add("hidden");
            }

            layoutExpression(expressionRoot);
            renderCurrentExpressionDisplay();
            renderLevelInfo(currentLevelIndex);
            refreshStatus();
            drawExpression();
        }

        function renderLeftPanelMath() {
            const placeholders = leftPanel.querySelectorAll(".katex-placeholder");
            if (!window.katex) {
                placeholders.forEach(node => {
                    const expr = node.getAttribute("data-expr") || "";
                    node.textContent = expr;
                });
                return;
            }

            placeholders.forEach(node => {
                const expr = node.getAttribute("data-expr") || "";
                node.innerHTML = "";
                katex.render(expr, node, {
                    throwOnError: false,
                    displayMode: false
                });
            });
        }

        function isDemoOnlyLevel(level) {
            if (!level) {
                return false;
            }
            return level.kind === "demoOnly" || level.type === "demoOnly" || level.mode === "demoOnly";
        }

        function isInteractiveLevel(level) {
            return !!level && !isDemoOnlyLevel(level);
        }

        function clonePlainData(value) {
            return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
        }

        function getExpressionTextForTrace() {
            return expressionRoot ? expressionToFullyParenthesizedText(expressionRoot) : "";
        }

        function makeLevelDefinitionForExport(level) {
            const copy = clonePlainData(level || {});
            if (!copy) {
                return {};
            }
            delete copy.demo;
            delete copy.sourceLevel;
            delete copy.recordedActions;
            delete copy.completedAt;
            delete copy.createdAt;
            copy.kind = "interactive";
            return copy;
        }

        function formatCompletionIdStamp(date) {
            return date.toISOString()
                .replace(/\.\d{3}Z$/, "Z")
                .replace(/[^0-9A-Za-z]+/g, "-")
                .replace(/^-+|-+$/g, "")
                .toLowerCase();
        }

        function formatCompletionTitleStamp(date) {
            try {
                return date.toLocaleString();
            } catch (err) {
                return date.toISOString();
            }
        }

        function resetSolutionRecorderForCurrentLevel() {
            const level = getCurrentLevel();
            completionExportReadyForRun = false;
            completionExportCompletedAtDate = null;
            if (!isInteractiveLevel(level)) {
                solutionRecorder = null;
                return;
            }
            solutionRecorder = {
                format: "exploded-algebra-solution-trace-v3",
                createdAt: new Date().toISOString(),
                levelId: level.id || "",
                levelTitle: level.title || "",
                startExpression: level.startExpression || "",
                actions: [],
                demoSteps: []
            };
        }

        function recordSolutionAction(action, demoStep) {
            const level = getCurrentLevel();
            if (!solutionRecorder || !isInteractiveLevel(level) || isDemoModeActive()) {
                return;
            }
            const actionCopy = clonePlainData(action || {});
            if (actionCopy) {
                actionCopy.index = solutionRecorder.actions.length;
                solutionRecorder.actions.push(actionCopy);
            }
            if (demoStep) {
                solutionRecorder.demoSteps.push(clonePlainData(demoStep));
            }
        }

        function recordCurrentSelectionForSolution() {
            const selectedExpression = cloneSelectedRangeNode();
            if (!selectedExpression || !selection.node || selection.status !== "yes") {
                return;
            }
            const expression = expressionToFullyParenthesizedText(selectedExpression);
            recordSolutionAction({
                type: "select",
                expression,
                selectedType: selectedExpression.type,
                firstPart: selection.firstPart,
                lastPart: selection.lastPart,
                beforeExpression: getExpressionTextForTrace()
            }, {
                type: "select",
                expression
            });
        }

        function recordToolForSolution(toolName, beforeExpression) {
            recordSolutionAction({
                type: "tool",
                tool: toolName,
                beforeExpression: beforeExpression || getExpressionTextForTrace(),
                afterExpression: getExpressionTextForTrace()
            }, {
                type: "tool",
                tool: toolName
            });
        }

        function recordActionForSolution(action, value, beforeExpression) {
            const step = { type: "action", action };
            if (value !== undefined && value !== null && value !== "") {
                step.value = String(value);
            }
            recordSolutionAction({
                ...step,
                beforeExpression: beforeExpression || getExpressionTextForTrace(),
                afterExpression: getExpressionTextForTrace()
            }, step);
        }

        function recordBuilderForSolution(action, value, beforeExpression) {
            const step = { type: "builder", action };
            if (value !== undefined && value !== null && value !== "") {
                step.value = String(value);
            }
            recordSolutionAction({
                ...step,
                beforeExpression: beforeExpression || getExpressionTextForTrace(),
                afterExpression: getExpressionTextForTrace()
            }, step);
        }

        function recordCommuteChoiceForSolution(clickedIndex, beforeExpression) {
            if (!selection.node || clickedIndex < selection.firstPart || clickedIndex > selection.lastPart) {
                return;
            }
            const relativeIndex = clickedIndex - selection.firstPart;
            const expression = expressionToFullyParenthesizedText(selection.node.args[clickedIndex]);
            const step = {
                type: "commuteChoice",
                relativeIndex,
                expression
            };
            recordSolutionAction({
                ...step,
                beforeExpression: beforeExpression || getExpressionTextForTrace(),
                afterExpression: getExpressionTextForTrace()
            }, step);
        }

        function makeDemoOnlyLevelFromCurrentRun(completedAtDate) {
            const level = getCurrentLevel();
            const completedAt = completedAtDate.toISOString();
            const sourceLevel = makeLevelDefinitionForExport(level);
            const idBase = String(level && level.id ? level.id : "level").replace(/[^0-9A-Za-z_-]+/g, "-");
            const id = `${idBase}-demo-${formatCompletionIdStamp(completedAtDate)}`;
            const title = `Demo: ${level && level.title ? level.title : "Untitled Level"} (${formatCompletionTitleStamp(completedAtDate)})`;
            return {
                ...clonePlainData(sourceLevel),
                kind: "demoOnly",
                id,
                title,
                sourceLevelId: sourceLevel.id || "",
                sourceLevelTitle: sourceLevel.title || "",
                createdAt: solutionRecorder ? solutionRecorder.createdAt : completedAt,
                completedAt,
                startExpression: sourceLevel.startExpression || "",
                evaluationLevel: sourceLevel.evaluationLevel,
                variables: clonePlainData(sourceLevel.variables || []),
                steps: clonePlainData(sourceLevel.steps || []),
                sourceLevel,
                demo: {
                    steps: clonePlainData(solutionRecorder ? solutionRecorder.demoSteps : [])
                },
                recordedActions: clonePlainData(solutionRecorder ? solutionRecorder.actions : [])
            };
        }

        function downloadMoveHistoryJson(demoOnlyLevel) {
            const json = `${JSON.stringify(demoOnlyLevel, null, 2)}\n`;
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const safeId = String(demoOnlyLevel && demoOnlyLevel.id ? demoOnlyLevel.id : "move-history")
                .replace(/[^0-9A-Za-z_-]+/g, "-")
                .replace(/^-+|-+$/g, "") || "move-history";
            const link = document.createElement("a");
            link.href = url;
            link.download = `${safeId}.json`;
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }

        function maybePrepareCompletedLevelExport(level) {
            if (!solutionRecorder || completionExportReadyForRun || !isInteractiveLevel(level)) {
                return;
            }
            if (!level || !Array.isArray(level.steps) || !level.steps.length) {
                return;
            }
            const finalIndex = level.steps.length - 1;
            if (!completedSteps[finalIndex]) {
                return;
            }
            completionExportReadyForRun = true;
            completionExportCompletedAtDate = new Date();
            solutionRecorder.completedAt = completionExportCompletedAtDate.toISOString();
            solutionRecorder.finalExpression = getExpressionTextForTrace();
        }

        function isMultiTermCommuteToolName(toolName) {
            return toolName === "commute" || toolName === "commuteTerms" || toolName === "commuteFactors";
        }

        function matchPermutationOrder(sourceArgs, candidateArgs) {
            if (!Array.isArray(sourceArgs) || !Array.isArray(candidateArgs) || sourceArgs.length !== candidateArgs.length) {
                return null;
            }
            const used = new Set();
            const order = [];
            for (const candidate of candidateArgs) {
                let matchIndex = -1;
                for (let index = 0; index < sourceArgs.length; index++) {
                    if (!used.has(index) && sameExpressionForMatching(sourceArgs[index], candidate)) {
                        matchIndex = index;
                        break;
                    }
                }
                if (matchIndex < 0) {
                    return null;
                }
                used.add(matchIndex);
                order.push(matchIndex);
            }
            return order;
        }

        function inferLegacyCommuteOrder(selectedExpressionText, afterExpressionText) {
            if (!selectedExpressionText || !afterExpressionText) {
                return null;
            }
            try {
                const selectedNode = normalizeExpressionTree(textToExpression(selectedExpressionText));
                const afterRoot = normalizeExpressionTree(textToExpression(afterExpressionText));
                if (!selectedNode || (selectedNode.type !== "sum" && selectedNode.type !== "prod") || selectedNode.args.length < 3) {
                    return null;
                }

                const candidates = [];
                traversePreOrder(afterRoot, node => {
                    if (!node || node.type !== selectedNode.type || node.args.length < selectedNode.args.length) {
                        return;
                    }
                    const length = selectedNode.args.length;
                    for (let first = 0; first <= node.args.length - length; first++) {
                        const order = matchPermutationOrder(selectedNode.args, node.args.slice(first, first + length));
                        if (!order || order.every((sourceIndex, targetIndex) => sourceIndex === targetIndex)) {
                            continue;
                        }
                        candidates.push({
                            order,
                            exactNode: node.args.length === length
                        });
                    }
                });
                candidates.sort((a, b) => Number(b.exactNode) - Number(a.exactNode));
                return candidates.length ? candidates[0].order : null;
            } catch (error) {
                return null;
            }
        }

        function upgradeLegacyCommuteDemoSteps(level) {
            if (
                !isDemoOnlyLevel(level) ||
                !level.demo ||
                !Array.isArray(level.demo.steps) ||
                !Array.isArray(level.recordedActions)
            ) {
                return;
            }

            const originalSteps = level.demo.steps;
            const actions = level.recordedActions;
            const upgradedSteps = [];

            originalSteps.forEach((step, index) => {
                upgradedSteps.push(step);
                if (
                    !step ||
                    step.type !== "tool" ||
                    !isMultiTermCommuteToolName(step.tool) ||
                    (originalSteps[index + 1] && originalSteps[index + 1].type === "commuteChoice")
                ) {
                    return;
                }

                const selectionAction = actions[index - 1];
                const followingAction = actions[index + 1];
                if (
                    !selectionAction ||
                    selectionAction.type !== "select" ||
                    selectionAction.lastPart - selectionAction.firstPart + 1 < 3 ||
                    !followingAction ||
                    typeof followingAction.beforeExpression !== "string"
                ) {
                    return;
                }

                const order = inferLegacyCommuteOrder(selectionAction.expression, followingAction.beforeExpression);
                if (!order) {
                    return;
                }

                let selectedNode = null;
                try {
                    selectedNode = normalizeExpressionTree(textToExpression(selectionAction.expression));
                } catch (error) {
                    return;
                }
                order.forEach(relativeIndex => {
                    upgradedSteps.push({
                        type: "commuteChoice",
                        relativeIndex,
                        expression: expressionToFullyParenthesizedText(selectedNode.args[relativeIndex])
                    });
                });
            });

            level.demo.steps = upgradedSteps;
        }

        function validateChosenLevel(level, fileName) {
            const sourceName = fileName || "The selected file";
            if (!level || typeof level !== "object" || Array.isArray(level)) {
                throw new Error(`${sourceName} must contain one JSON level object.`);
            }
            if (typeof level.id !== "string" || !level.id.trim()) {
                throw new Error(`${sourceName} is missing a valid id.`);
            }
            if (typeof level.title !== "string" || !level.title.trim()) {
                throw new Error(`${sourceName} is missing a valid title.`);
            }
            if (typeof level.startExpression !== "string" || !level.startExpression.trim()) {
                throw new Error(`${sourceName} is missing a valid startExpression.`);
            }
            if (!Array.isArray(level.steps) || level.steps.length === 0) {
                throw new Error(`${sourceName} must contain at least one step.`);
            }

            textToExpression(level.startExpression);
            level.steps.forEach((step, index) => {
                if (!step || typeof step.expression !== "string" || !step.expression.trim()) {
                    throw new Error(`${sourceName} has an invalid expression in step ${index + 1}.`);
                }
                textToExpression(step.expression);
            });

            const levelCopy = clonePlainData(level);
            const copy = isDemoOnlyLevel(levelCopy) && levelCopy.sourceLevel && typeof levelCopy.sourceLevel === "object"
                ? { ...clonePlainData(levelCopy.sourceLevel), ...levelCopy }
                : levelCopy;
            if (!Array.isArray(copy.variables) || !copy.variables.length) {
                copy.variables = inferVariablesFromExpressionTextForLevel(copy.startExpression);
            }
            upgradeLegacyCommuteDemoSteps(copy);
            return copy;
        }

        function setLevelFileStatus(message, isError = false) {
            if (!loadedLevelFileName) {
                return;
            }
            loadedLevelFileName.textContent = message;
            loadedLevelFileName.classList.toggle("file-error", isError);
        }

        function showNoLevelSelectedState(message = "Choose a JSON level file to begin.") {
            document.body.classList.add("no-level-loaded");
            levelContent.innerHTML = `
                <div class="level-intro">
                    <div class="level-title">No level selected</div>
                    <p>${escapeHtml(message)}</p>
                </div>
            `;
            renderMoveHistoryControls(null);
            clearParenthesizedExpressionSvg(targetExpressionSvg, targetExpressionCtx);
            clearParenthesizedExpressionSvg(currentExpressionSvg, currentExpressionCtx);
            workspaceSvg.replaceChildren();
            floatingToolMenu.classList.add("hidden");
        }

        async function loadChosenLevelFile(file) {
            if (!file) {
                return;
            }
            let loadSucceeded = false;
            try {
                const parsed = JSON.parse(await file.text());
                const level = validateChosenLevel(parsed, file.name);
                LEVELS.splice(0, LEVELS.length, level);
                currentLevelIndex = 0;
                setLevelFileStatus(`${file.name} — ${level.title}`);
                document.body.classList.remove("no-level-loaded");
                loadLevel(0);
                loadSucceeded = true;
            } catch (error) {
                console.error("The selected level file could not be loaded.", error);
                setLevelFileStatus(error && error.message ? error.message : "The selected file could not be loaded.", true);
                if (!getCurrentLevel()) {
                    showNoLevelSelectedState("That file could not be loaded. Choose a valid Exploded Algebra level JSON file.");
                }
            } finally {
                if (!loadSucceeded && levelFileInput) {
                    levelFileInput.value = "";
                }
            }
        }


        const CUSTOM_LEVEL_STORAGE_KEY = "explodedAlgebra.currentCustomLevel";
        const CUSTOM_LEVEL_WINDOW_NAME_PREFIX = "__EXPLODED_ALGEBRA_LEVEL__:";

        function readCustomLevelTransferPayload() {
            let payloadText = null;

            try {
                payloadText = window.sessionStorage.getItem(CUSTOM_LEVEL_STORAGE_KEY);
            } catch (error) {
                // file:// pages can have browser-specific storage behavior.
            }

            if (!payloadText && typeof window.name === "string" && window.name.startsWith(CUSTOM_LEVEL_WINDOW_NAME_PREFIX)) {
                payloadText = window.name.slice(CUSTOM_LEVEL_WINDOW_NAME_PREFIX.length);
            }

            if (!payloadText) {
                throw new Error("The custom level data is no longer available in this tab. Return to the home page and choose the file again.");
            }

            let payload;
            try {
                payload = JSON.parse(payloadText);
            } catch (error) {
                throw new Error("The saved custom level transfer data could not be read.");
            }

            if (!payload || typeof payload.text !== "string") {
                throw new Error("The saved custom level transfer data is incomplete.");
            }

            return payload;
        }

        function installLevelFromParsedJson(parsed, sourceName) {
            const level = validateChosenLevel(parsed, sourceName);
            LEVELS.splice(0, LEVELS.length, level);
            currentLevelIndex = 0;
            document.body.classList.remove("no-level-loaded");
            loadLevel(0);
            return true;
        }

        function loadBundledLevelFile(levelFile) {
            showNoLevelSelectedState(`Loading ${levelFile}…`);

            const levelUrl = new URL(levelFile, window.location.href);
            return fetch(levelUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Could not load ${levelFile} (${response.status} ${response.statusText}).`);
                    }
                    return response.text();
                })
                .then(text => {
                    let parsed;
                    try {
                        parsed = JSON.parse(text);
                    } catch (error) {
                        throw new Error(`${levelFile} does not contain valid JSON.`);
                    }
                    return installLevelFromParsedJson(parsed, levelFile);
                })
                .catch(error => {
                    console.error("The bundled level could not be loaded.", error);
                    const localFileNote = window.location.protocol === "file:"
                        ? " Browsers normally block JavaScript from fetching neighboring JSON files when a site is opened with file://. Use the custom file chooser on the home page, or serve this folder with a local web server / GitHub Pages."
                        : "";
                    showNoLevelSelectedState((error && error.message
                        ? error.message
                        : "The bundled level could not be loaded.") + localFileNote);
                    return false;
                });
        }

        function loadInitialLevelFromNavigation() {
            const params = new URLSearchParams(window.location.search);
            const requestedLevelFile = String(params.get("level") || "").trim();
            const navigationSource = String(params.get("source") || "").toLowerCase();

            if (requestedLevelFile) {
                // Levels launched from the home page carry their JSON in this tab so
                // file:// works, while the URL still identifies the selected file.
                if (navigationSource === "builtin" || navigationSource === "custom") {
                    try {
                        const payload = readCustomLevelTransferPayload();
                        if (payload.fileName && payload.fileName !== requestedLevelFile) {
                            if (navigationSource === "custom") {
                                throw new Error("The saved custom level does not match the level named in this URL. Return to the home page and choose the file again.");
                            }
                        } else {
                            const parsed = JSON.parse(payload.text);
                            return installLevelFromParsedJson(parsed, payload.fileName || requestedLevelFile);
                        }
                    } catch (error) {
                        if (navigationSource === "custom") {
                            console.error("The selected custom level could not be loaded.", error);
                            showNoLevelSelectedState(error && error.message
                                ? error.message
                                : "The selected custom level could not be loaded. Return to the home page and choose it again.");
                            return false;
                        }
                        // A direct hosted built-in link may have no transfer payload.
                        // In that case the normal JSON fetch below is the correct fallback.
                    }
                }

                if (navigationSource !== "custom") {
                    loadBundledLevelFile(requestedLevelFile);
                    return true;
                }
            }

            if (navigationSource === "custom" || navigationSource === "builtin") {
                try {
                    const payload = readCustomLevelTransferPayload();
                    const parsed = JSON.parse(payload.text);
                    const sourceName = payload.fileName || (navigationSource === "builtin"
                        ? "The selected built-in level"
                        : "The selected custom level file");
                    return installLevelFromParsedJson(parsed, sourceName);
                } catch (error) {
                    console.error("The selected level could not be loaded.", error);
                    showNoLevelSelectedState(error && error.message
                        ? error.message
                        : "The selected level could not be loaded. Return to the home page and choose it again.");
                    return false;
                }
            }

            showNoLevelSelectedState("Choose a built-in level or a custom level file from the home page to begin.");
            return false;
        }

        function getCurrentLevel() {
            return LEVELS[currentLevelIndex] || null;
        }

        function getAllowedToolsForLevel(level) {
            if (!level) {
                return AVAILABLE_BY_DEFAULT_TOOLS.slice();
            }

            const excludedDefaultTools = new Set(level.excludedDefaultTools || []);
            const allowedUnavailableTools = level.allowedUnavailableTools || [];

            return [
                ...AVAILABLE_BY_DEFAULT_TOOLS.filter(tool => !excludedDefaultTools.has(tool)),
                ...allowedUnavailableTools.filter(tool => UNAVAILABLE_BY_DEFAULT_TOOLS.includes(tool))
            ];
        }

        function isToolAllowedInCurrentLevel(toolName) {
            return getAllowedToolsForLevel(getCurrentLevel()).includes(toolName);
        }

        function getCurrentDemoSteps() {
            const level = getCurrentLevel();
            return level && level.demo && Array.isArray(level.demo.steps)
                ? level.demo.steps
                : [];
        }

        function isDemoModeActive() {
            return isDemoOnlyLevel(getCurrentLevel()) && getCurrentDemoSteps().length > 0;
        }

        function getCurrentDemoStep() {
            const steps = getCurrentDemoSteps();
            return isDemoModeActive() && demoStepIndex >= 0 && demoStepIndex < steps.length
                ? steps[demoStepIndex]
                : null;
        }

        function getDemoCommuteChoiceAbsoluteIndex(step = getCurrentDemoStep()) {
            if (!step || step.type !== "commuteChoice" || !selection.node) {
                return -1;
            }
            const relativeIndex = Number(step.relativeIndex);
            if (!Number.isInteger(relativeIndex)) {
                return -1;
            }
            const absoluteIndex = selection.firstPart + relativeIndex;
            return absoluteIndex >= selection.firstPart && absoluteIndex <= selection.lastPart
                ? absoluteIndex
                : -1;
        }

        function isDemoCommuteChoiceAllowed(clickedIndex) {
            if (!isDemoModeActive()) {
                return true;
            }
            const step = getCurrentDemoStep();
            if (step && step.type === "commuteChoice") {
                return clickedIndex === getDemoCommuteChoiceAbsoluteIndex(step);
            }
            // Older move histories did not store permutation clicks. If their
            // order could not be inferred during file loading, allow the user to
            // choose the order manually instead of trapping the demo in preview.
            return !!step && step.type !== "tool" && uiState.stage === "preview";
        }

        function refreshDemoBodyClass() {
            document.body.classList.toggle("demo-mode-active", isDemoModeActive());
        }

        function updateModeControls() {
            playMode = isDemoOnlyLevel(getCurrentLevel()) ? PLAY_MODES.demo : PLAY_MODES.regular;
            refreshDemoBodyClass();
        }

        function resetDemoStateForCurrentLevel() {
            demoStepIndex = 0;
            updateModeControls();
        }

        function setPlayMode(mode, options = {}) {
            const nextMode = mode === PLAY_MODES.demo ? PLAY_MODES.demo : PLAY_MODES.regular;
            const changed = playMode !== nextMode;
            playMode = nextMode;
            updateModeControls();
            if (options.reload && changed) {
                loadLevel(currentLevelIndex);
            } else {
                renderToolArea();
                drawExpression();
            }
        }

        function updateModeQueryString(mode) {
            if (!window.history || !window.history.replaceState) {
                return;
            }
            const url = new URL(window.location.href);
            if (mode === PLAY_MODES.demo) {
                url.searchParams.set("mode", "demo");
            } else {
                url.searchParams.delete("mode");
            }
            window.history.replaceState(null, "", url.toString());
        }

        function playModeFromQueryString() {
            const params = new URLSearchParams(window.location.search);
            return String(params.get("mode") || "").toLowerCase() === "demo"
                ? PLAY_MODES.demo
                : PLAY_MODES.regular;
        }

        function getDemoTargetNode(step) {
            if (!step || !step.expression) {
                return null;
            }
            if (step._targetNode) {
                return step._targetNode;
            }
            try {
                step._targetNode = normalizeExpressionTree(parseParenthesizedExpressionStrict(step.expression));
            } catch (err) {
                step._targetNode = null;
            }
            return step._targetNode;
        }

        function makeCandidateNodeForDemoRange(node, firstPart, lastPart) {
            if (!node) {
                return null;
            }
            if (node.type === "sum") {
                return makeSumFromTerms(node.args.slice(firstPart, lastPart + 1).map(cloneNode));
            }
            if (node.type === "prod") {
                return makeProductFromFactors(node.args.slice(firstPart, lastPart + 1).map(cloneNode));
            }
            return cloneNode(node);
        }

        function selectionRangeMatchesDemoTarget(node, firstPart, lastPart, targetNode) {
            const candidate = makeCandidateNodeForDemoRange(node, firstPart, lastPart);
            return !!candidate && !!targetNode && sameExpressionForMatching(candidate, targetNode);
        }

        function getDemoSelectionArea(candidate) {
            if (!candidate || !candidate.node) {
                return Number.POSITIVE_INFINITY;
            }
            const node = candidate.node;
            let width;
            let height;
            if (node.type === "prod") {
                const x1 = node.args[candidate.firstPart].left() - getSelectionMargin();
                const x2 = node.args[candidate.lastPart].right() + getSelectionMargin();
                width = x2 - x1;
                height = node.bottom() - node.top();
            } else if (node.type === "sum") {
                const y1 = node.args[candidate.firstPart].top() - getSelectionMargin();
                const y2 = node.args[candidate.lastPart].bottom() + getSelectionMargin();
                width = node.right() - node.left();
                height = y2 - y1;
            } else {
                width = node.right() - node.left();
                height = node.bottom() - node.top();
            }
            return Math.max(1, width) * Math.max(1, height);
        }

        function findDemoSelectionTarget(step) {
            const targetNode = getDemoTargetNode(step);
            if (!targetNode || !expressionRoot) {
                return null;
            }

            const candidates = [];
            traversePreOrder(expressionRoot, node => {
                if (sameExpressionForMatching(node, targetNode)) {
                    candidates.push({ node, firstPart: 0, lastPart: Math.max(0, (node.args || []).length - 1) });
                }

                if (node.type === "sum" || node.type === "prod") {
                    for (let first = 0; first < node.args.length; first++) {
                        for (let last = first; last < node.args.length; last++) {
                            if (selectionRangeMatchesDemoTarget(node, first, last, targetNode)) {
                                candidates.push({ node, firstPart: first, lastPart: last });
                            }
                        }
                    }
                }
            });

            candidates.sort((a, b) => getDemoSelectionArea(a) - getDemoSelectionArea(b));
            return candidates[0] || null;
        }

        function currentSelectionMatchesDemoStep() {
            const step = getCurrentDemoStep();
            if (!step || step.type !== "select" || !selection.node) {
                return false;
            }
            const targetNode = getDemoTargetNode(step);
            return selectionRangeMatchesDemoTarget(selection.node, selection.firstPart, selection.lastPart, targetNode);
        }

        function refreshDemoPromptAfterAdvance() {
            renderToolArea();
            refreshStatus();
            drawExpression();
        }

        function advanceDemoStep() {
            if (!isDemoModeActive()) {
                return;
            }
            const steps = getCurrentDemoSteps();
            demoStepIndex = Math.min(demoStepIndex + 1, steps.length);
            refreshDemoBodyClass();
            refreshDemoPromptAfterAdvance();
        }

        function validateDemoSelectionAfterMouseUp() {
            if (!isDemoModeActive()) {
                return true;
            }
            const step = getCurrentDemoStep();
            if (!step || step.type !== "select") {
                clearSelection();
                clearInteraction();
                drawExpression();
                return false;
            }
            if (currentSelectionMatchesDemoStep()) {
                advanceDemoStep();
                return true;
            }
            clearSelection();
            clearInteraction();
            refreshStatus();
            drawExpression();
            renderToolArea();
            return false;
        }

        function getDemoTargetToolCandidates(toolName) {
            if (toolName === "numericalEquivalence" || isArithmeticEquivalenceTool(toolName)) {
                return uniqueToolKeys([
                    toolName,
                    "numericalEquivalence",
                    `arithmeticLevel${getArithmeticLevelForCurrentLevel()}`
                ]);
            }
            if (toolName === "commute") {
                return ["commute", "commuteFirstToLast"];
            }
            if (toolName === "commuteFirstToLast" || toolName === "commuteLastToFirst") {
                return [toolName, "commute"];
            }
            return [toolName];
        }

        function isDemoToolAllowed(toolName) {
            const step = getCurrentDemoStep();
            if (!isDemoModeActive()) {
                return true;
            }
            if (!step || step.type !== "tool") {
                return false;
            }
            return getDemoTargetToolCandidates(step.tool).includes(toolName);
        }

        function isDemoActionAllowed(action, value) {
            const step = getCurrentDemoStep();
            if (!isDemoModeActive()) {
                return true;
            }
            if (!step || step.type !== "action" || step.action !== action) {
                return false;
            }
            if (step.value !== undefined && String(step.value) !== String(value ?? "")) {
                return false;
            }
            return true;
        }

        function isDemoBuilderActionAllowed(action, value) {
            const step = getCurrentDemoStep();
            if (!isDemoModeActive()) {
                return true;
            }
            if (!step || step.type !== "builder" || step.action !== action) {
                return false;
            }
            if (step.value !== undefined && String(step.value) !== String(value ?? "")) {
                return false;
            }
            return true;
        }

        function applyDemoInputForCurrentStep() {
            const step = getCurrentDemoStep();
            if (!step || step.type !== "action" || step.input === undefined) {
                return;
            }
            uiState.inputText = String(step.input);
        }

        function escapeCssSelectorValue(value) {
            const text = String(value ?? "");
            if (window.CSS && typeof window.CSS.escape === "function") {
                return window.CSS.escape(text);
            }
            return text.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
        }

        function applyDemoButtonHighlights(container) {
            if (!isDemoModeActive() || !container) {
                return;
            }
            container.querySelectorAll(".demo-target-button,.demo-blocked-button").forEach(button => {
                button.classList.remove("demo-target-button", "demo-blocked-button");
            });
            const step = getCurrentDemoStep();
            if (!step) {
                return;
            }

            let targetButton = null;
            if (step.type === "tool") {
                for (const targetTool of getDemoTargetToolCandidates(step.tool)) {
                    targetButton = container.querySelector(`button[data-tool="${escapeCssSelectorValue(targetTool)}"]`);
                    if (targetButton) {
                        break;
                    }
                }
                if (!targetButton && isIntentCategoryToolNotationMode()) {
                    const categoryId = getIntentCategoryIdForTool(step.tool);
                    if (categoryId) {
                        targetButton = container.querySelector(`button[data-rule-category="${escapeCssSelectorValue(categoryId)}"]`);
                    }
                }
            } else if (step.type === "action") {
                const actionSelector = `button[data-action="${escapeCssSelectorValue(step.action)}"]`;
                const actionButtons = Array.from(container.querySelectorAll(actionSelector));
                targetButton = step.value === undefined
                    ? actionButtons[0]
                    : actionButtons.find(button => String(button.dataset.value || "") === String(step.value));
            } else if (step.type === "builder") {
                const builderSelector = `button[data-builder-action="${escapeCssSelectorValue(step.action)}"]`;
                const builderButtons = Array.from(container.querySelectorAll(builderSelector));
                targetButton = step.value === undefined
                    ? builderButtons[0]
                    : builderButtons.find(button => String(button.dataset.value || "") === String(step.value));
            }

            container.querySelectorAll("button[data-tool], button[data-action], button[data-builder-action], button[data-tool-category], button[data-rule-category]").forEach(button => {
                if (button === targetButton) {
                    button.classList.add("demo-target-button");
                } else {
                    button.classList.add("demo-blocked-button");
                }
            });
        }

        function getSelectionRectangleForNodeRange(node, firstPart, lastPart) {
            if (!node) {
                return null;
            }

            const margin = getSelectionMargin();
            let x;
            let y;
            let width;
            let height;

            if (node.type === "prod") {
                x = node.args[firstPart].left() - margin;
                y = node.top() - margin;
                width = node.args[lastPart].right() + margin - x;
                height = node.bottom() + margin - y;
            } else if (node.type === "sum") {
                x = node.left() - margin;
                y = node.args[firstPart].top() - margin;
                width = node.right() + margin - x;
                height = node.args[lastPart].bottom() + margin - y;
            } else {
                x = node.left() - margin;
                y = node.top() - margin;
                width = node.right() + margin - x;
                height = node.bottom() + margin - y;
            }

            return {
                x,
                y,
                width: Math.max(1, width),
                height: Math.max(1, height)
            };
        }

        function drawDashedDemoSelectionRectangle(node, firstPart, lastPart) {
            const rect = getSelectionRectangleForNodeRange(node, firstPart, lastPart);
            if (!rect) {
                return;
            }

            ctx.save();
            ctx.globalAlpha = 1;
            ctx.lineWidth = 3;
            ctx.strokeStyle = "rgb(226, 176, 0)";
            ctx.setLineDash([3, 5]);
            ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
            ctx.restore();
        }

        function drawDemoSelectionPrompt() {
            if (
                !isDemoModeActive() ||
                uiState.stage === "postview" ||
                uiState.previewTimerId !== null ||
                uiState.postviewTimerId !== null
            ) {
                return;
            }
            const step = getCurrentDemoStep();
            if (!step) {
                return;
            }
            if (step.type === "commuteCho…33205 tokens truncated…   selection.node.args = [...before, factoredNode, ...after];

            beginPostview(getFactoringPostviewDataFromNode(factoredNode, "right", data.commonCount, termCount, colors));
            return true;
        }

        function applyIdentityInsertion(identityKind, positionKind) {
            if (!selection.node) {
                return false;
            }

            if (identityKind === "addZero") {
                const first = positionKind === "top" ? new ExprNode("value", [], "0") : cloneSelectedRangeNode();
                const second = positionKind === "top" ? cloneSelectedRangeNode() : new ExprNode("value", [], "0");
                replaceSelectedRange(makeSumFromTerms([first, second]));
                finishOperation();
                return true;
            }

            if (identityKind === "multiplyByOne") {
                const first = positionKind === "left" ? new ExprNode("value", [], "1") : cloneSelectedRangeNode();
                const second = positionKind === "left" ? cloneSelectedRangeNode() : new ExprNode("value", [], "1");
                replaceSelectedRange(makeProductFromFactors([first, second]));
                finishOperation();
                return true;
            }

            if (identityKind === "doubleNegative") {
                const negatives = [new ExprNode("value", [], "-1"), new ExprNode("value", [], "-1")];
                const selected = cloneSelectedRangeNode();
                if (positionKind === "left") {
                    replaceSelectedRange(makeProductFromFactors([...negatives, selected]));
                } else {
                    replaceSelectedRange(makeProductFromFactors([selected, ...negatives]));
                }
                finishOperation();
                return true;
            }

            if (identityKind === "doubleInverse") {
                const selected = cloneSelectedRangeNode();
                replaceSelectedRange(makeInverseNode(makeInverseNode(selected)));
                finishOperation();
                return true;
            }

            return false;
        }

        function getDoubleInverseData() {
            const selectedNode = cloneSelectedRangeNode();
            if (!isInvNode(selectedNode)) {
                return null;
            }
            const innerInverse = selectedNode.args[0];
            if (!isInvNode(innerInverse)) {
                return null;
            }
            return {
                outerInverse: selectedNode,
                innerExpression: innerInverse.args[0]
            };
        }

        function canEliminateDoubleInverse() {
            return !!getDoubleInverseData();
        }

        function canInsertDoubleInverse() {
            const selectedNode = cloneSelectedRangeNode();
            return !!selectedNode && !isAlwaysZeroExpression(selectedNode);
        }

        function applyInsertDoubleInverse() {
            const selectedNode = cloneSelectedRangeNode();
            if (!selectedNode || isAlwaysZeroExpression(selectedNode)) {
                return false;
            }
            replaceSelectedRange(makeInverseNode(makeInverseNode(selectedNode)));
            finishOperation();
            return true;
        }

        function applyEliminateDoubleInverse() {
            const data = getDoubleInverseData();
            if (!data) {
                return false;
            }
            replaceSelectedRange(cloneNode(data.innerExpression));
            finishOperation();
            return true;
        }

        function applyDistributeInverseOverProduct() {
            const selectedNode = cloneSelectedRangeNode();
            if (!isInvNode(selectedNode)) {
                return false;
            }

            const productNode = selectedNode.args[0];
            if (!productNode || productNode.type !== "prod" || productNode.args.length < 2) {
                return false;
            }

            const replacement = makeProductFromFactors(
                productNode.args.map(factor => makeInverseNode(factor))
            );
            replaceSelectedRange(replacement);
            finishOperation();
            return true;
        }

        function applyFactorProductOfInverses() {
            const selectedNode = cloneSelectedRangeNode();
            if (!selectedNode || selectedNode.type !== "prod" || selectedNode.args.length < 2) {
                return false;
            }

            const inverseNodes = selectedNode.args.filter(child => isInvNode(child));
            if (inverseNodes.length !== selectedNode.args.length) {
                return false;
            }

            const innerProduct = makeProductFromFactors(
                selectedNode.args.map(child => cloneNode(child.args[0]))
            );
            const replacement = makeInverseNode(innerProduct);
            replaceSelectedRange(replacement);
            finishOperation();
            return true;
        }


        function isStructuredNumericalTool(toolName) {
            return [
                "numEvaluatePositiveSum",
                "numEvaluatePositiveProduct",
                "numWritePositiveNumberAsProduct",
                "numWritePositiveNumberAsSum",
                "numEvaluateSignedSum",
                "numEvaluateSignedProduct",
                "numExpressNumberAsDifference",
                "numSumPositive",
                "numProductPositive",
                "numProductWithNegatives",
                "numSumWithNegativeProducts"
            ].includes(toolName);
        }

        function isExpressionBuilderTool(toolName) {
            return [
                "replaceOneWithInverseProduct",
                "insertZeroProduct",
                "insertExponentZero",
                "insertPowerOfOne",
                "cancelOpposites",
                "numericalEquivalence",
                "arithmeticLevel0",
                "arithmeticLevel1",
                "arithmeticLevel2",
                "arithmeticLevel3",
                "factorNumber",
                "writeNumberAsSum",
                "evaluate",
                "numEvaluatePositiveSum",
                "numEvaluatePositiveProduct",
                "numWritePositiveNumberAsProduct",
                "numWritePositiveNumberAsSum",
                "numEvaluateSignedSum",
                "numEvaluateSignedProduct",
                "numExpressNumberAsDifference",
                "numSumPositive",
                "numProductPositive",
                "numProductWithNegatives",
                "numSumWithNegativeProducts"
            ].includes(toolName);
        }

        function isNumericalBuilderTool(toolName) {
            return [
                "numericalEquivalence",
                "arithmeticLevel0",
                "arithmeticLevel1",
                "arithmeticLevel2",
                "arithmeticLevel3",
                "factorNumber",
                "writeNumberAsSum",
                "evaluate",
                "numEvaluatePositiveSum",
                "numEvaluatePositiveProduct",
                "numWritePositiveNumberAsProduct",
                "numWritePositiveNumberAsSum",
                "numEvaluateSignedSum",
                "numEvaluateSignedProduct",
                "numExpressNumberAsDifference",
                "numSumPositive",
                "numProductPositive",
                "numProductWithNegatives",
                "numSumWithNegativeProducts"
            ].includes(toolName);
        }

        function builderAllowsVariables(toolName) {
            return !isNumericalBuilderTool(toolName);
        }

        function builderAllowsNegativeOne(toolName) {
            if (isArithmeticEquivalenceTool(toolName)) {
                return getArithmeticLevelFromToolName(toolName) >= 2;
            }
            return !isNumericalBuilderTool(toolName) ||
                toolName === "numEvaluateSignedProduct" ||
                toolName === "numEvaluateSignedSum" ||
                toolName === "numExpressNumberAsDifference" ||
                toolName === "numProductWithNegatives" ||
                toolName === "numSumWithNegativeProducts";
        }

        function getBuilderOperationTypes(toolName) {
            if (toolName === "evaluate") {
                return [];
            }
            if (isArithmeticEquivalenceTool(toolName)) {
                const level = getArithmeticLevelFromToolName(toolName);
                return level >= 2 ? ["sum", "prod", "exp"] : ["sum", "prod"];
            }
            if (toolName === "factorNumber" || toolName === "numWritePositiveNumberAsProduct" || toolName === "numProductPositive" || toolName === "numProductWithNegatives") {
                return ["prod"];
            }
            if (toolName === "writeNumberAsSum" || toolName === "numWritePositiveNumberAsSum" || toolName === "numSumPositive") {
                return ["sum"];
            }
            if (toolName === "numExpressNumberAsDifference" || toolName === "numSumWithNegativeProducts") {
                return ["sum", "prod"];
            }
            return ["sum", "prod", "exp"];
        }

        function makePlaceholderNode() {
            const node = valueNode("?");
            node.isBuilderPlaceholder = true;
            return node;
        }

        function isBuilderPlaceholder(node) {
            return !!node && node.type === "value" && node.value === "?" && !!node.isBuilderPlaceholder;
        }

        function getBuilderVariableNames() {
            const level = getCurrentLevel();
            if (level && Array.isArray(level.variables) && level.variables.length) {
                return level.variables.slice();
            }
            const names = new Set();
            const collect = node => {
                if (node && node.type === "value" && /^[a-zA-Z]$/.test(node.value)) {
                    names.add(node.value);
                }
                if (node && node.args) {
                    node.args.forEach(collect);
                }
            };
            if (level && level.startExpression) {
                try { collect(textToExpression(level.startExpression)); } catch (e) {}
            }
            return Array.from(names).sort();
        }

        function cloneBuilderRootForDisplay(node, activePath = null, currentPath = []) {
            const cloned = new ExprNode(node.type, [], node.value);
            cloned.isBuilderPlaceholder = !!node.isBuilderPlaceholder;
            cloned.isBuilderOuter = !!node.isBuilderOuter;
            cloned.isBuilderActive = !!activePath && pathsEqual(activePath, currentPath);
            cloned.args = node.args.map((child, index) => cloneBuilderRootForDisplay(child, activePath, currentPath.concat(index)));
            return cloned;
        }

        function pathsEqual(a, b) {
            return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, index) => value === b[index]);
        }

        function getNodeAtPath(root, path) {
            let node = root;
            for (const index of path) {
                if (!node || !node.args || !node.args[index]) {
                    return null;
                }
                node = node.args[index];
            }
            return node;
        }

        function setNodeAtPath(root, path, replacement) {
            if (!path.length) {
                return replacement;
            }
            const parent = getNodeAtPath(root, path.slice(0, -1));
            if (!parent) {
                return root;
            }
            parent.args[path[path.length - 1]] = replacement;
            return root;
        }

        function findPlaceholderPaths(root, path = [], out = []) {
            if (isBuilderPlaceholder(root)) {
                out.push(path.slice());
            }
            if (root && root.args) {
                root.args.forEach((child, index) => findPlaceholderPaths(child, path.concat(index), out));
            }
            return out;
        }

        function findNextPlaceholderPath(root, currentPath) {
            const paths = findPlaceholderPaths(root);
            if (!paths.length) {
                return null;
            }
            const currentKey = currentPath.join(".");
            const index = paths.findIndex(path => path.join(".") === currentKey);
            if (index >= 0 && index + 1 < paths.length) {
                return paths[index + 1];
            }
            if (index < 0) {
                return paths[0];
            }
            return null;
        }

        function makeBuilderInsertionRoot(builder) {
            const expressionDisplay = cloneBuilderRootForDisplay(builder.root, builder.currentPath);
            if (builder.tool === "replaceOneWithInverseProduct") {
                const root = new ExprNode("prod", [
                    expressionDisplay,
                    makeInverseNode(cloneBuilderRootForDisplay(builder.root, builder.currentPath))
                ], null);
                root.isBuilderOuter = true;
                return root;
            }
            if (builder.tool === "insertZeroProduct") {
                const root = builder.zeroProductOrientation === "right"
                    ? new ExprNode("prod", [expressionDisplay, valueNode("0")], null)
                    : new ExprNode("prod", [valueNode("0"), expressionDisplay], null);
                root.isBuilderOuter = true;
                return root;
            }
            if (builder.tool === "insertExponentZero") {
                const root = new ExprNode("exp", [expressionDisplay, valueNode("0")], null);
                root.isBuilderOuter = true;
                return root;
            }
            if (builder.tool === "insertPowerOfOne") {
                const root = new ExprNode("exp", [valueNode("1"), expressionDisplay], null);
                root.isBuilderOuter = true;
                return root;
            }
            if (builder.tool === "cancelOpposites") {
                const negCopy = new ExprNode("prod", [valueNode("-1"), cloneBuilderRootForDisplay(builder.root, builder.currentPath)], null);
                const root = new ExprNode("sum", [expressionDisplay, negCopy], null);
                root.isBuilderOuter = true;
                return root;
            }
            if (builder.tool === "numericalEquivalence" ||
                isArithmeticEquivalenceTool(builder.tool) ||
                builder.tool === "factorNumber" ||
                builder.tool === "writeNumberAsSum" ||
                builder.tool === "evaluate" ||
                isStructuredNumericalTool(builder.tool)) {
                expressionDisplay.isBuilderOuter = true;
                return expressionDisplay;
            }
            return expressionDisplay;
        }

        function renderBuilderProposalSvg(node) {
            return renderExpressionSvgMarkup(node, {
                className: "builder-proposed-oops-svg",
                role: "img",
                ariaHidden: true,
                focusable: false,
                settings: {
                    padding: 10,
                    flare: 6,
                    marginX: 12,
                    marginY: 12,
                    textFont: "18px Verdana, Arial, Helvetica, sans-serif",
                    expressionStrokeFill: "rgb(95,95,95)"
                }
            });
        }

        function getBuilderProposalHtml() {
            const builder = uiState.expressionBuilder;
            if (!builder) {
                return "";
            }
            const proposal = makeBuilderInsertionRoot(builder);
            const preview = renderBuilderProposalSvg(proposal);
            return `<div class="proposal-preview-panel">
                <div class="proposal-preview-title">Proposed entry</div>
                <div class="proposal-preview-oops">${preview}</div>
                ${uiState.message ? `<div class="builder-message small-note">${escapeHtml(uiState.message)}</div>` : ""}
            </div>`;
        }

        function refreshExpressionBuilderPreview() {
            const builder = uiState.expressionBuilder;
            if (!builder) {
                return;
            }
            // The expression builder is now a left-panel proposal builder.
            // The right-side/current expression is not edited until Submit passes validation.
            layoutExpression(expressionRoot);
            if (uiState.stage === "builder" && uiState.expressionBuilder) {
                renderToolArea();
            } else {
                renderLevelInfo(currentLevelIndex);
            }
            refreshStatus();
            drawExpression();
        }

        function beginExpressionBuilder(toolName) {
            const selectedNode = cloneSelectedRangeNode();
            if (!selectedNode) {
                return false;
            }
            const originalRoot = cloneExpressionTree(expressionRoot);
            const placeholder = makePlaceholderNode();
            uiState.expressionBuilder = {
                tool: toolName,
                root: placeholder,
                currentPath: [],
                insertionId: selection.node ? selection.node.id : -1,
                originalRoot,
                originalSelectedNode: selectedNode,
                originalSelection: {
                    node: selection.node,
                    firstPart: selection.firstPart,
                    lastPart: selection.lastPart
                },
                zeroProductOrientation: uiState.zeroProductOrientation || "left",
                history: []
            };
            refreshExpressionBuilderPreview();
            return true;
        }

        function cancelExpressionBuilder() {
            if (uiState.expressionBuilder && uiState.expressionBuilder.originalRoot) {
                expressionRoot = uiState.expressionBuilder.originalRoot;
                syncCurrentExpressionRoot();
            }
            uiState.expressionBuilder = null;
            finishOperation();
        }

        function replaceBuilderCurrentNode(replacement, autoAdvance = false) {
            const builder = uiState.expressionBuilder;
            if (!builder) {
                return false;
            }
            pushExpressionBuilderUndoState();
            builder.root = setNodeAtPath(builder.root, builder.currentPath, replacement);
            if (autoAdvance) {
                const next = findNextPlaceholderPath(builder.root, builder.currentPath);
                if (next) {
                    builder.currentPath = next;
                }
            }
            refreshExpressionBuilderPreview();
            return true;
        }

        function appendBuilderDigit(digit) {
            const builder = uiState.expressionBuilder;
            const node = builder ? getNodeAtPath(builder.root, builder.currentPath) : null;
            if (!node || node.type !== "value") {
                uiState.message = "Digits can only be entered after you have drilled down to a value box.";
                renderToolArea();
                return false;
            }
            if (isBuilderPlaceholder(node)) {
                pushExpressionBuilderUndoState();
                node.value = String(digit);
                node.isBuilderPlaceholder = false;
            } else if (/^\d+$/.test(node.value)) {
                pushExpressionBuilderUndoState();
                node.value += String(digit);
            } else {
                uiState.message = "Use Move On before entering a different value.";
                renderToolArea();
                return false;
            }
            refreshExpressionBuilderPreview();
            return true;
        }

        function enterBuilderValue(value, autoAdvance = true) {
            replaceBuilderCurrentNode(valueNode(value), autoAdvance);
        }

        function insertBuilderOperation(type) {
            const builder = uiState.expressionBuilder;
            const node = builder ? getNodeAtPath(builder.root, builder.currentPath) : null;
            if (!builder || !node) {
                return false;
            }

            const currentIsPlaceholder = isBuilderPlaceholder(node);
            const firstArgument = currentIsPlaceholder ? makePlaceholderNode() : cloneNode(node);
            const secondArgument = makePlaceholderNode();

            // When the user inserts a sum into a sum, or a product into a product,
            // flatten immediately. This works both for an empty question-mark box
            // and for a filled value/expression that the user now wants to turn
            // into the first argument of a larger sum/product.
            if ((type === "sum" || type === "prod") && builder.currentPath.length > 0) {
                const parentPath = builder.currentPath.slice(0, -1);
                const childIndex = builder.currentPath[builder.currentPath.length - 1];
                const parent = getNodeAtPath(builder.root, parentPath);
                if (parent && parent.type === type && Array.isArray(parent.args)) {
                    pushExpressionBuilderUndoState();
                    parent.args.splice(childIndex, 1, firstArgument, secondArgument);
                    builder.currentPath = currentIsPlaceholder
                        ? parentPath.concat(childIndex)
                        : parentPath.concat(childIndex + 1);
                    refreshExpressionBuilderPreview();
                    return true;
                }
            }

            const replacement = type === "exp"
                ? new ExprNode("exp", [firstArgument, secondArgument], null)
                : new ExprNode(type, [firstArgument, secondArgument], null);
            pushExpressionBuilderUndoState();
            builder.root = setNodeAtPath(builder.root, builder.currentPath, replacement);
            builder.currentPath = currentIsPlaceholder
                ? builder.currentPath.concat(0)
                : builder.currentPath.concat(1);
            refreshExpressionBuilderPreview();
            return true;
        }

        function moveBuilderNext() {
            const builder = uiState.expressionBuilder;
            if (!builder) {
                return false;
            }
            const next = findNextPlaceholderPath(builder.root, builder.currentPath);
            if (next) {
                pushExpressionBuilderUndoState();
                builder.currentPath = next;
                refreshExpressionBuilderPreview();
            } else {
                uiState.message = "There is no next empty part. You can submit or add more structure before filling the last value.";
                renderToolArea();
            }
            return true;
        }

        function getPlaceholderFillValue(parentType, toolName) {
            if (parentType === "sum") {
                return "0";
            }
            if (parentType === "prod" || parentType === "exp") {
                return "1";
            }
            return toolName === "cancelOpposites" ? "0" : "1";
        }

        function fillBuilderPlaceholders(node, parentType, toolName) {
            if (isBuilderPlaceholder(node)) {
                return valueNode(getPlaceholderFillValue(parentType, toolName));
            }
            if (!node || node.type === "value") {
                return cloneNode(node);
            }
            return new ExprNode(
                node.type,
                node.args.map(child => fillBuilderPlaceholders(child, node.type, toolName)),
                node.value
            );
        }

        function isAlwaysZeroExpression(node) {
            if (!node) {
                return false;
            }
            if (isValueNode(node, "0")) {
                return true;
            }
            if (node.type === "prod") {
                return node.args.some(isAlwaysZeroExpression);
            }
            if (node.type === "sum") {
                return node.args.length > 0 && node.args.every(isAlwaysZeroExpression);
            }
            return false;
        }

        function evaluateBuilderWholeNumberExpression(node) {
            if (!node) {
                return null;
            }
            const normalized = normalizeExpressionTree(cloneNode(node));
            if (normalized.type === "value") {
                return parseNonNegativeInteger(normalized.value);
            }
            return evaluateLevelOneNode(normalized);
        }

        function builderValidationFailed(message) {
            uiState.message = message;
            renderToolArea();
            refreshExpressionBuilderPreview();
            return false;
        }

        function getOriginalBuilderTargetValue(builder) {
            return evaluateBuilderWholeNumberExpression(builder.originalSelectedNode);
        }

        function submitExpressionBuilder() {
            const builder = uiState.expressionBuilder;
            if (!builder) {
                return false;
            }
            const completed = normalizeExpressionTree(fillBuilderPlaceholders(builder.root, null, builder.tool));
            if (builder.tool === "replaceOneWithInverseProduct" && isAlwaysZeroExpression(completed)) {
                uiState.message = "That expression is always 0, so its inverse would be undefined. Choose a nonzero expression.";
                renderToolArea();
                refreshExpressionBuilderPreview();
                return false;
            }
            let replacement;
            if (builder.tool === "replaceOneWithInverseProduct") {
                replacement = new ExprNode("prod", [cloneNode(completed), makeInverseNode(cloneNode(completed))], null);
            } else if (builder.tool === "insertZeroProduct") {
                replacement = builder.zeroProductOrientation === "right"
                    ? new ExprNode("prod", [cloneNode(completed), valueNode("0")], null)
                    : new ExprNode("prod", [valueNode("0"), cloneNode(completed)], null);
            } else if (builder.tool === "insertExponentZero") {
                replacement = makeExponentNode(completed, valueNode("0"));
            } else if (builder.tool === "insertPowerOfOne") {
                replacement = makeExponentNode(valueNode("1"), completed);
            } else if (builder.tool === "cancelOpposites") {
                replacement = makeSumFromTerms([cloneNode(completed), makeProductFromFactors([valueNode("-1"), cloneNode(completed)])]);
            } else if (isArithmeticEquivalenceTool(builder.tool)) {
                const allowed = getArithmeticAllowedLevelsForTool(builder.tool);
                const originalCheck = validateArithmeticExpressionForLevel(builder.originalSelectedNode, allowed.inputLevel, "selected");
                if (!originalCheck.ok) {
                    return builderValidationFailed(originalCheck.error);
                }
                const replacementCheck = validateArithmeticExpressionForLevel(completed, allowed.outputLevel, "replacement");
                if (!replacementCheck.ok) {
                    return builderValidationFailed(replacementCheck.error);
                }
                if (!numbersAreEqualForEvaluation(replacementCheck.value, originalCheck.value)) {
                    return builderValidationFailed(`That expression evaluates to ${formatEvaluationResultForExpression(replacementCheck.value)}, not ${formatEvaluationResultForExpression(originalCheck.value)}.`);
                }
                replacement = completed;
            } else if (builder.tool === "numericalEquivalence") {
                const target = getOriginalBuilderTargetValue(builder);
                const computed = evaluateBuilderWholeNumberExpression(completed);
                if (target === null || computed === null) {
                    return builderValidationFailed("Build a whole number, a sum of whole numbers, a product of whole numbers, or one whole-number exponent.");
                }
                if (computed !== target) {
                    return builderValidationFailed(`That expression evaluates to ${computed}, not ${target}.`);
                }
                replacement = completed;
            } else if (builder.tool === "factorNumber") {
                const target = getOriginalBuilderTargetValue(builder);
                const computed = evaluateBuilderWholeNumberExpression(completed);
                if (!completed || completed.type !== "prod" || completed.args.length < 2) {
                    return builderValidationFailed("Build a product with at least two whole-number factors.");
                }
                if (target === null || computed === null) {
                    return builderValidationFailed("Build a product of whole numbers.");
                }
                if (computed !== target) {
                    return builderValidationFailed(`Those factors multiply to ${computed}, not ${target}.`);
                }
                replacement = completed;
            } else if (builder.tool === "writeNumberAsSum") {
                const target = getOriginalBuilderTargetValue(builder);
                const computed = evaluateBuilderWholeNumberExpression(completed);
                if (!completed || completed.type !== "sum" || completed.args.length < 2) {
                    return builderValidationFailed("Build a sum with at least two whole-number addends.");
                }
                if (target === null || computed === null) {
                    return builderValidationFailed("Build a sum of whole numbers.");
                }
                if (computed !== target) {
                    return builderValidationFailed(`Those addends sum to ${computed}, not ${target}.`);
                }
                replacement = completed;
            } else if (isStructuredNumericalTool(builder.tool)) {
                const target = getSingleSignedIntegerValue(builder.originalSelectedNode);
                if (target === null) {
                    return builderValidationFailed("Select a single number before using this rule in the expansion direction.");
                }
                const validation = validateStructuredNumericalExpansion(builder.tool, completed, target);
                if (!validation.ok) {
                    return builderValidationFailed(validation.error);
                }
                replacement = completed;
            } else if (builder.tool === "evaluate") {
                const target = evaluateNodeForCurrentLevel(builder.originalSelectedNode);
                const computed = evaluateBuilderWholeNumberExpression(completed);
                if (target === null || computed === null || completed.type !== "value") {
                    return builderValidationFailed("Enter the evaluated whole number.");
                }
                if (!numbersAreEqualForEvaluation(computed, target)) {
                    return builderValidationFailed("That is not correct. Try again.");
                }
                replacement = valueNode(String(target));
            } else {
                replacement = completed;
            }
            replacement = normalizeExpressionTree(replacement);
            if (builder.originalSelection) {
                selection.status = "yes";
                selection.node = builder.originalSelection.node;
                selection.firstPart = builder.originalSelection.firstPart;
                selection.lastPart = builder.originalSelection.lastPart;
            }
            replaceSelectedRange(replacement);
            syncCurrentExpressionRoot();
            uiState.expressionBuilder = null;
            finishOperation();
            return true;
        }

        function applyReplaceOneWithInverseProduct() {
            if (uiState.expressionBuilder) {
                return submitExpressionBuilder();
            }
            return beginExpressionBuilder("replaceOneWithInverseProduct");
        }

        function applyInsertZeroProduct() {
            if (uiState.expressionBuilder) {
                return submitExpressionBuilder();
            }
            return beginExpressionBuilder("insertZeroProduct");
        }

        function applyInsertExponentZero() {
            if (uiState.expressionBuilder) {
                return submitExpressionBuilder();
            }
            return beginExpressionBuilder("insertExponentZero");
        }

        function applyInsertPowerOfOne() {
            if (uiState.expressionBuilder) {
                return submitExpressionBuilder();
            }
            return beginExpressionBuilder("insertPowerOfOne");
        }

        function applyCancelProductWithInverse() {
            const data = getProductInverseCancellationData();
            if (!data) {
                return false;
            }

            const removeSet = new Set([data.inverseIndex]);
            data.expressionIndices.forEach(index => removeSet.add(index));

            const kept = [];
            for (let i = 0; i < data.productNode.args.length; i++) {
                if (!removeSet.has(i)) {
                    kept.push(cloneNode(data.productNode.args[i]));
                }
            }

            const replacement = kept.length
                ? makeProductFromFactors([new ExprNode("value", [], "1"), ...kept])
                : new ExprNode("value", [], "1");
            replaceSelectedRange(replacement);
            finishOperation();
            return true;
        }

        function applyIdentityElimination() {
            const data = getIdentityEliminationData();
            if (!data) {
                return false;
            }

            if (selection.node.type === "sum") {
                const kept = [];
                for (let i = 0; i < selection.node.args.length; i++) {
                    const inRange = i >= selection.firstPart && i <= selection.lastPart;
                    const child = selection.node.args[i];
                    if (inRange && child.type === "value" && child.value === "0") {
                        continue;
                    }
                    kept.push(child);
                }
                selection.node.args = kept;
                finishOperation();
                return true;
            }

            if (selection.node.type === "prod") {
                const kept = [];
                for (let i = 0; i < selection.node.args.length; i++) {
                    const inRange = i >= selection.firstPart && i <= selection.lastPart;
                    const child = selection.node.args[i];
                    if (inRange && child.type === "value" && child.value === "1") {
                        continue;
                    }
                    kept.push(child);
                }
                selection.node.args = kept;
                finishOperation();
                return true;
            }

            return false;
        }

        function parseNumberList(text, mode) {
            const raw = text.trim();
            if (!raw) {
                return { ok: false, error: "Enter one or more numbers." };
            }

            let normalized = raw;
            if (mode === "product") {
                normalized = normalized.replace(/[xX*]/g, " ");
                if (/[+]/.test(normalized)) {
                    return { ok: false, error: "Use spaces, commas, x, or * for factoring. Do not use +." };
                }
            } else {
                normalized = normalized.replace(/[+]/g, " ");
                if (/[xX*]/.test(normalized)) {
                    return { ok: false, error: "Use spaces, commas, or + for writing a sum. Do not use x or *." };
                }
            }

            normalized = normalized.replace(/[;,]/g, " ");
            const pieces = normalized.split(/\s+/).filter(Boolean);
            if (pieces.length === 0) {
                return { ok: false, error: "Enter one or more numbers." };
            }

            const nums = [];
            for (const piece of pieces) {
                if (!/^\d+$/.test(piece)) {
                    return { ok: false, error: `Could not read "${piece}" as a nonnegative integer.` };
                }
                nums.push(Number(piece));
            }
            return { ok: true, nums };
        }

        function parseNumericalEquivalenceExpansionInput(text) {
            const raw = String(text || "").trim();
            if (!raw) {
                return { ok: false, error: "Enter an equivalent sum, product, or exponent." };
            }

            const hasPlus = /[+]/.test(raw);
            const hasProduct = /[xX*]/.test(raw);
            const hasExponent = /\^/.test(raw);
            const formCount = [hasPlus, hasProduct, hasExponent].filter(Boolean).length;
            if (formCount > 1) {
                return { ok: false, error: "Level 1 numerical equivalence uses one sum, one product, or one exponent, not a mixed expression." };
            }
            if (formCount === 0) {
                return { ok: false, error: "Use + for a sum, * for a product, or ^ for an exponent, such as 2+3+4, 2*3*4, or 2^3." };
            }

            if (hasExponent) {
                const pieces = raw.split("^").map(piece => piece.trim()).filter(piece => piece.length > 0);
                if (pieces.length !== 2) {
                    return { ok: false, error: "Use one binary exponent, such as 2^3." };
                }
                const base = parseNonNegativeInteger(pieces[0]);
                const exponent = parseNonNegativeInteger(pieces[1]);
                if (base === null || exponent === null) {
                    return { ok: false, error: "Level 1 exponents use whole-number base and exponent values." };
                }
                return { ok: true, mode: "exponent", nums: [base, exponent] };
            }

            const mode = hasProduct ? "product" : "sum";
            const parsed = parseNumberList(raw, mode);
            if (!parsed.ok) {
                return parsed;
            }
            if (parsed.nums.length < 2) {
                return { ok: false, error: "Use at least two whole numbers." };
            }
            return { ok: true, mode, nums: parsed.nums };
        }

        function getNumericalEquivalenceModeForSelection() {
            const selectedNode = cloneSelectedRangeNode();
            if (!selectedNode) {
                return null;
            }
            if (selectedNode.type === "value" && parseNonNegativeInteger(selectedNode.value) !== null) {
                return "expand";
            }
            if (evaluateLevelOneNode(selectedNode) !== null) {
                return "collapse";
            }
            return null;
        }

        function canNumericalEquivalence() {
            return getNumericalEquivalenceModeForSelection() !== null;
        }

        function validateArithmeticExpressionForLevel(node, allowedLevel, roleLabel) {
            if (!node) {
                return { ok: false, error: `There is no ${roleLabel} expression to check.` };
            }
            if (!isEntirelyNumericalNode(node)) {
                return { ok: false, error: `The ${roleLabel} expression must be entirely numerical.` };
            }
            const actualLevel = classifyArithmeticExpressionLevel(node);
            const clampedAllowedLevel = clampArithmeticLevel(allowedLevel, 0);
            if (actualLevel === null) {
                return { ok: false, error: `The ${roleLabel} expression could not be classified as arithmetic.` };
            }
            if (actualLevel > clampedAllowedLevel) {
                return {
                    ok: false,
                    error: `The ${roleLabel} expression is arithmetic level ${actualLevel}, but this button allows only level ${clampedAllowedLevel}. ${getArithmeticLevelDescription(clampedAllowedLevel)}`
                };
            }
            const value = evaluateArithmeticNode(node);
            if (value === null) {
                return { ok: false, error: `The ${roleLabel} expression could not be evaluated as a finite number.` };
            }
            return { ok: true, level: actualLevel, value };
        }

        function canArithmeticEquivalence(allowedLevel) {
            const selectedNode = cloneSelectedRangeNode();
            return validateArithmeticExpressionForLevel(selectedNode, allowedLevel, "selected").ok;
        }

        function applyFactorNumber() {
            const selectedNode = cloneSelectedRangeNode();
            if (!selectedNode || selectedNode.type !== "value") {
                return false;
            }
            const target = parseNonNegativeInteger(selectedNode.value);
            if (target === null) {
                return false;
            }

            const parsed = parseNumberList(uiState.inputText, "product");
            if (!parsed.ok) {
                uiState.message = parsed.error;
                renderToolArea();
                refreshStatus();
                return false;
            }

            const product = parsed.nums.reduce((a, b) => a * b, 1);
            if (product !== target) {
                uiState.message = `Those factors multiply to ${product}, not ${target}.`;
                renderToolArea();
                refreshStatus();
                return false;
            }

            const replacement = makeProductFromFactors(parsed.nums.map(n => new ExprNode("value", [], String(n))));
            replaceSelectedRange(replacement);
            finishOperation();
            return true;
        }

        function applyWriteNumberAsSum() {
            const selectedNode = cloneSelectedRangeNode();
            if (!selectedNode || selectedNode.type !== "value") {
                return false;
            }
            const target = parseNonNegativeInteger(selectedNode.value);
            if (target === null) {
                return false;
            }

            const parsed = parseNumberList(uiState.inputText, "sum");
            if (!parsed.ok) {
                uiState.message = parsed.error;
                renderToolArea();
                refreshStatus();
                return false;
            }

            const sum = parsed.nums.reduce((a, b) => a + b, 0);
            if (sum !== target) {
                uiState.message = `Those addends sum to ${sum}, not ${target}.`;
                renderToolArea();
                refreshStatus();
                return false;
            }

            const replacement = makeSumFromTerms(parsed.nums.map(n => new ExprNode("value", [], String(n))));
            replaceSelectedRange(replacement);
            finishOperation();
            return true;
        }

        function applyEvaluate() {
            const selectedNode = cloneSelectedRangeNode();
            const target = evaluateNodeForCurrentLevel(selectedNode);
            if (target === null) {
                return false;
            }

            const enteredValue = parseNumericValue(uiState.inputText);
            if (enteredValue === null || Number.isNaN(enteredValue) || !Number.isFinite(enteredValue)) {
                uiState.message = "Enter a number for the evaluated result.";
                renderToolArea();
                refreshStatus();
                return false;
            }

            if (!numbersAreEqualForEvaluation(enteredValue, target)) {
                uiState.message = "That is not correct. Try again.";
                renderToolArea();
                refreshStatus();
                return false;
            }

            replaceSelectedRange(new ExprNode("value", [], formatEvaluationResultForExpression(target)));
            finishOperation();
            return true;
        }

        function applyNumericalEquivalence() {
            const selectedNode = cloneSelectedRangeNode();
            if (!selectedNode) {
                return false;
            }

            if (selectedNode.type === "value") {
                const target = parseNonNegativeInteger(selectedNode.value);
                if (target === null) {
                    return false;
                }

                const parsed = parseNumericalEquivalenceExpansionInput(uiState.inputText);
                if (!parsed.ok) {
                    uiState.message = parsed.error;
                    renderToolArea();
                    refreshStatus();
                    return false;
                }

                const computed = parsed.mode === "sum"
                    ? parsed.nums.reduce((a, b) => a + b, 0)
                    : parsed.mode === "product"
                        ? parsed.nums.reduce((a, b) => a * b, 1)
                        : Math.pow(parsed.nums[0], parsed.nums[1]);

                if (computed !== target) {
                    uiState.message = parsed.mode === "sum"
                        ? `Those addends sum to ${computed}, not ${target}.`
                        : parsed.mode === "product"
                            ? `Those factors multiply to ${computed}, not ${target}.`
                            : `That exponent evaluates to ${computed}, not ${target}.`;
                    renderToolArea();
                    refreshStatus();
                    return false;
                }

                const replacement = parsed.mode === "sum"
                    ? makeSumFromTerms(parsed.nums.map(n => new ExprNode("value", [], String(n))))
                    : parsed.mode === "product"
                        ? makeProductFromFactors(parsed.nums.map(n => new ExprNode("value", [], String(n))))
                        : makeExponentNode(valueNode(parsed.nums[0]), valueNode(parsed.nums[1]));
                replaceSelectedRange(replacement);
                finishOperation();
                return true;
            }

            const target = evaluateLevelOneNode(selectedNode);
            if (target === null) {
                return false;
            }

            const enteredValue = parseNonNegativeInteger(uiState.inputText);
            if (enteredValue === null) {
                uiState.message = "Enter the equivalent whole number.";
                renderToolArea();
                refreshStatus();
                return false;
            }

            if (enteredValue !== target) {
                uiState.message = "That is not correct. Try again.";
                renderToolArea();
                refreshStatus();
                return false;
            }

            replaceSelectedRange(new ExprNode("value", [], String(target)));
            finishOperation();
            return true;
        }

        function applyEvaluateSumOrProduct(expectedType) {
            const selectedNode = cloneSelectedRangeNode();
            if (!selectedNode || selectedNode.type !== expectedType) {
                return false;
            }

            const target = evaluateSumOrProductNode(selectedNode);
            if (target === null) {
                return false;
            }

            const enteredValue = parseNumericValue(uiState.inputText);
            if (enteredValue === null || Number.isNaN(enteredValue)) {
                uiState.message = "Enter a number for the evaluated result.";
                renderToolArea();
                refreshStatus();
                return false;
            }

            if (!numbersAreEqualForEvaluation(enteredValue, target)) {
                uiState.message = `That is not correct. Try again.`;
                renderToolArea();
                refreshStatus();
                return false;
            }

            replaceSelectedRange(new ExprNode("value", [], String(target)));
            finishOperation();
            return true;
        }

        function applyEvaluateSum() {
            return applyEvaluateSumOrProduct("sum");
        }

        function applyEvaluateProduct() {
            return applyEvaluateSumOrProduct("prod");
        }

        function applyEvaluateSumContainingProducts() {
            const selectedNode = cloneSelectedRangeNode();
            const target = evaluateSumContainingProductsNode(selectedNode);
            if (target === null) {
                return false;
            }

            const enteredValue = parseNumericValue(uiState.inputText);
            if (enteredValue === null || Number.isNaN(enteredValue)) {
                uiState.message = "Enter a number for the evaluated result.";
                renderToolArea();
                refreshStatus();
                return false;
            }

            if (!numbersAreEqualForEvaluation(enteredValue, target)) {
                uiState.message = "That is not correct. Try again.";
                renderToolArea();
                refreshStatus();
                return false;
            }

            if (target < 0) {
                const positiveValue = Math.abs(target);
                replaceSelectedRange(
                    makeProductFromFactors([
                        new ExprNode("value", [], "-1"),
                        new ExprNode("value", [], String(positiveValue))
                    ])
                );
            } else {
                replaceSelectedRange(new ExprNode("value", [], String(target)));
            }
            finishOperation();
            return true;
        }

        function applyDoubleNegative() {
            const selectedNode = cloneSelectedRangeNode();
            if (selectedNode && selectedNode.type === "value" && selectedNode.value === "1") {
                replaceSelectedRange(makeProductFromFactors([valueNode("-1"), valueNode("-1")]));
                finishOperation();
                return true;
            }

            const data = getDoubleNegativeData();
            if (!data) {
                return false;
            }

            let toRemove = 2;
            const kept = [];
            for (const child of data.wrapper.args) {
                if (toRemove > 0 && child.type === "value" && child.value === "-1") {
                    toRemove -= 1;
                } else {
                    kept.push(cloneNode(child));
                }
            }
            const replacement = makeProductFromFactors([new ExprNode("value", [], "1"), ...kept]);
            replaceSelectedRange(replacement);
            finishOperation();
            return true;
        }

        function applyZeroProduct() {
            const data = getZeroProductData();
            if (!data) {
                return false;
            }
            replaceSelectedRange(new ExprNode("value", [], "0"));
            finishOperation();
            return true;
        }

        function applyCancelOpposites() {
            const selectedNode = cloneSelectedRangeNode();
            if (selectedNode && selectedNode.type === "value" && selectedNode.value === "0") {
                if (uiState.expressionBuilder) {
                    return submitExpressionBuilder();
                }
                return beginExpressionBuilder("cancelOpposites");
            }

            const data = getCancelOppositesData();
            if (!data) {
                return false;
            }

            const removeSet = new Set();
            for (const pair of data.pairs) {
                const posIndices = Array.isArray(pair.posIndices) ? pair.posIndices : [pair.posIndex];
                posIndices.forEach(index => removeSet.add(index));
                removeSet.add(pair.negIndex);
            }

            const kept = [];
            for (let i = 0; i < data.wrapper.args.length; i++) {
                if (!removeSet.has(i)) {
                    kept.push(cloneNode(data.wrapper.args[i]));
                }
            }
            const replacement = makeSumFromTerms([new ExprNode("value", [], "0"), ...kept]);
            replaceSelectedRange(replacement);
            finishOperation();
            return true;
        }

        function applyCommuteRotationWithPostview(direction) {
            if (!selection.node || !canCommuteRotate()) {
                return false;
            }

            const firstIndex = selection.firstPart;
            const lastIndex = selection.lastPart;
            const selectedLength = getSelectedSliceLength();
            const colors = Array.isArray(uiState.previewColors) && uiState.previewColors.length >= selectedLength
                ? uiState.previewColors.slice(0, selectedLength)
                : getDistinctRandomColors(selectedLength);
            const singleMoverDirectionalCommute = selectedLength >= 3 &&
                (direction === "firstToLast" || direction === "lastToFirst");
            const movedColor = direction === "lastToFirst"
                ? (colors[colors.length - 1] || SETTINGS.selectionBlue)
                : (colors[0] || SETTINGS.selectionBlue);

            const before = selection.node.args.slice(0, firstIndex);
            const selected = selection.node.args.slice(firstIndex, lastIndex + 1);
            const after = selection.node.args.slice(lastIndex + 1);
            const rotated = direction === "lastToFirst"
                ? [selected[selected.length - 1], ...selected.slice(0, -1)]
                : [...selected.slice(1), selected[0]];

            selection.node.args = [...before, ...rotated, ...after];

            if (singleMoverDirectionalCommute) {
                beginPostview({
                    type: "commuteRotate",
                    node: selection.node,
                    firstIndex,
                    lastIndex,
                    movedOnly: true,
                    movedIndex: direction === "lastToFirst" ? firstIndex : lastIndex,
                    color: movedColor
                });
                return true;
            }

            beginPostview({
                type: "commuteRotate",
                node: selection.node,
                firstIndex,
                lastIndex,
                colors: direction === "lastToFirst"
                    ? [colors[colors.length - 1], ...colors.slice(0, -1)]
                    : [...colors.slice(1), colors[0]]
            });
            return true;
        }

        function applyCommuteFirstToLastWithPostview() {
            return applyCommuteRotationWithPostview("firstToLast");
        }

        function applyCommuteLastToFirstWithPostview() {
            return applyCommuteRotationWithPostview("lastToFirst");
        }

        function applyTwoItemCommuteWithPostview() {
            return applyCommuteFirstToLastWithPostview();
        }

        function selectCommuteItem(clickedIndex) {
            if (!selection.node || !canCommuteRotate()) {
                return false;
            }
            if (clickedIndex < selection.firstPart || clickedIndex > selection.lastPart) {
                return false;
            }
            uiState.commuteSelectedIndex = clickedIndex;
            refreshStatus();
            renderToolArea();
            drawExpression();
            return true;
        }

        function applyCommutePermutationWithPostview() {
            if (!selection.node || !canCommuteRotate()) {
                return false;
            }
            const firstIndex = selection.firstPart;
            const lastIndex = selection.lastPart;
            const selectedLength = lastIndex - firstIndex + 1;
            if (!Array.isArray(uiState.commuteOrder) || uiState.commuteOrder.length !== selectedLength) {
                return false;
            }

            const before = selection.node.args.slice(0, firstIndex);
            const selected = selection.node.args.slice(firstIndex, lastIndex + 1);
            const after = selection.node.args.slice(lastIndex + 1);
            const order = uiState.commuteOrder.slice();
            const permuted = order.map(index => selected[index - firstIndex]);
            const colors = Array.isArray(uiState.previewColors) && uiState.previewColors.length >= selectedLength
                ? uiState.previewColors.slice(0, selectedLength)
                : getDistinctRandomColors(selectedLength);
            const permutedColors = order.map(index => colors[index - firstIndex]);

            selection.node.args = [...before, ...permuted, ...after];
            beginPostview({
                type: "commuteRotate",
                node: selection.node,
                firstIndex,
                lastIndex,
                colors: permutedColors
            });
            return true;
        }

        function recordCommutePermutationChoice(clickedIndex) {
            if (!selection.node || !canCommuteRotate()) {
                return false;
            }
            if (clickedIndex < selection.firstPart || clickedIndex > selection.lastPart) {
                return false;
            }
            if (!Array.isArray(uiState.commuteOrder)) {
                uiState.commuteOrder = [];
            }
            if (uiState.commuteOrder.includes(clickedIndex)) {
                return false;
            }
            if (!isDemoCommuteChoiceAllowed(clickedIndex)) {
                drawExpression();
                return false;
            }

            const shouldAdvanceDemo = isDemoModeActive() && getCurrentDemoStep() && getCurrentDemoStep().type === "commuteChoice";
            recordCommuteChoiceForSolution(clickedIndex, getExpressionTextForTrace());
            uiState.commuteOrder.push(clickedIndex);
            const selectedLength = getSelectedSliceLength();
            if (uiState.commuteOrder.length >= selectedLength) {
                drawExpression();
                const applied = applyCommutePermutationWithPostview();
                if (applied && shouldAdvanceDemo) {
                    advanceDemoStep();
                }
                return applied;
            }

            if (shouldAdvanceDemo) {
                advanceDemoStep();
            } else {
                refreshStatus();
                renderToolArea();
                drawExpression();
            }
            return true;
        }

        function copySelectionToInternalClipboard() {
            const selectedNode = cloneSelectedRangeNode();
            if (!selectedNode) {
                return false;
            }

            internalClipboardText = expressionToText(selectedNode);
            uiState.inputText = internalClipboardText;
            uiState.message = "Copied to internal clipboard.";
            return true;
        }

        function applySubstituteFromText() {
            const parsed = tryParseParenthesizedExpression(uiState.inputText);

            if (!parsed.ok) {
                uiState.message = parsed.error;
                renderToolArea();
                refreshStatus();
                return false;
            }

            replaceSelectedRange(parsed.node);
            finishOperation();
            return true;
        }



        function getExpressionBuilderNote() {
            const toolName = uiState.activeTool;
            if (toolName === "numericalEquivalence") {
                return "Build an equivalent whole-number expression using the buttons. Level 1 allows a whole number, a sum of whole numbers, a product of whole numbers, or one binary exponent.";
            }
            if (isArithmeticEquivalenceTool(toolName)) {
                const allowed = getArithmeticAllowedLevelsForTool(toolName);
                return `Build an equivalent arithmetic expression in the left panel. The selected expression must be at or below arithmetic level ${allowed.inputLevel}, and the proposed entry must be at or below arithmetic level ${allowed.outputLevel}. ${getArithmeticLevelDescription(allowed.outputLevel)} The right-side expression stays unchanged until Submit checks both level and value.`;
            }
            if (toolName === "factorNumber" || toolName === "numWritePositiveNumberAsProduct") {
                return "Build a product in the left panel. The right-side expression stays unchanged until Submit checks the product.";
            }
            if (toolName === "writeNumberAsSum" || toolName === "numWritePositiveNumberAsSum") {
                return "Build a sum in the left panel. The right-side expression stays unchanged until Submit checks the sum.";
            }
            if (toolName === "numExpressNumberAsDifference") {
                return "Build a difference in the left panel as a sum with a negative product. The right-side expression stays unchanged until Submit checks it.";
            }
            if (toolName === "evaluate") {
                return "Enter the evaluated whole number using the digit buttons. Keep trying until correct, or cancel to exit.";
            }

            let note = "Use Sum, Product, or Exponent to make structure first, or enter a value first and then use those buttons to wrap it. Remaining question marks are filled on Submit.";
            if (toolName === "replaceOneWithInverseProduct") {
                note += " For inverse products, the completed expression may not be always equal to 0.";
            }
            return note;
        }

        function buildExpressionBuilderHtml() {
            const toolName = uiState.activeTool;
            const variables = builderAllowsVariables(toolName) ? getBuilderVariableNames().slice(0, 4) : [];
            const variableButtons = variables.length
                ? `<div class="builder-variable-row">${variables.map(v => `<button data-builder-action="value" data-value="${escapeHtml(v)}" title="Keyboard shortcut: ${escapeHtml(v)}">${escapeHtml(v)}</button>`).join("")}</div>`
                : "";
            const operationTypes = getBuilderOperationTypes(toolName);
            const operationShortcuts = { sum: "+", prod: "*", exp: "^" };
            const operationSymbols = { exp: "^", prod: "·", sum: "+" };
            const buildOperationButton = type => {
                const enabled = operationTypes.includes(type);
                const title = enabled ? ` title="Keyboard shortcut: ${operationShortcuts[type] || ""}"` : "";
                const actionAttrs = enabled ? ` data-builder-action="operation" data-value="${type}"` : " disabled";
                return `<button class="builder-operator-button"${actionAttrs}${title}>${operationSymbols[type]}</button>`;
            };
            const negativeOneButton = builderAllowsNegativeOne(toolName)
                ? `<button class="builder-negative-one-button" data-builder-action="negativeOne" title="Keyboard shortcut: -">-1</button>`
                : `<button class="builder-negative-one-button" disabled>-1</button>`;
            const moveNextButton = toolName === "evaluate"
                ? `<button class="builder-next-button" disabled>→</button>`
                : `<button class="builder-next-button" data-builder-action="next" title="Keyboard shortcut: Right Arrow or Tab">→</button>`;
            return `<div class="expression-builder-panel">
                ${getBuilderProposalHtml()}
                <div class="builder-controls">
                    <div class="builder-keypad" aria-label="Expression builder keypad">
                        ${["7","8","9"].map(d => `<button data-builder-action="digit" data-value="${d}">${d}</button>`).join("")}
                        ${buildOperationButton("exp")}
                        ${["4","5","6"].map(d => `<button data-builder-action="digit" data-value="${d}">${d}</button>`).join("")}
                        ${buildOperationButton("prod")}
                        ${["1","2","3"].map(d => `<button data-builder-action="digit" data-value="${d}">${d}</button>`).join("")}
                        ${buildOperationButton("sum")}
                        <button class="builder-zero-button" data-builder-action="digit" data-value="0">0</button>
                        ${negativeOneButton}
                    </div>
                    ${variableButtons}
                    <div class="builder-navigation-row">
                        <button class="builder-undo-button" data-builder-action="undoBackspace" title="Backspace / Undo: Backspace or Delete">←</button>
                        ${moveNextButton}
                    </div>
                    <div class="builder-action-row">
                        <button data-builder-action="submit" title="Keyboard shortcut: Enter">Submit</button>
                        <button data-builder-action="cancel">Cancel</button>
                    </div>
                </div>
            </div>`;
        }

        function buildToolExponentModeHtml() {
            const mode = getCurrentToolExponentMode();
            return `<div class="tool-exponent-mode" role="radiogroup" aria-label="Tool list">
                <span class="panel-menu-title">Tool list</span>
                <label class="tool-exponent-radio-label" title="Basic algebra tools">
                    <input type="radio" name="toolExponentMode" value="plain"${mode === TOOL_EXPONENT_MODES.plain ? " checked" : ""}>
                    <span>1</span>
                </label>
                <label class="tool-exponent-radio-label" title="Multiplicative inverse tools">
                    <input type="radio" name="toolExponentMode" value="inverse"${mode === TOOL_EXPONENT_MODES.inverse ? " checked" : ""}>
                    <span>2</span>
                </label>
                <label class="tool-exponent-radio-label" title="Exponent tools">
                    <input type="radio" name="toolExponentMode" value="exponent"${mode === TOOL_EXPONENT_MODES.exponent ? " checked" : ""}>
                    <span>3</span>
                </label>
            </div>`;
        }

        function buildQuickToolRowsHtml() {
            let html = `<div class="tool-form-grid">`;
            for (const row of getToolFormRowsForCurrentExponentMode()) {
                if (!isToolFormRowAvailable(row)) {
                    continue;
                }
                html += buildToolFormRowHtml(row);
            }
            html += `</div>`;
            return html;
        }

        function buildToolCategoryMenuHtml() {
            uiState.activeToolCategory = null;
            return buildToolExponentModeHtml() + buildQuickToolRowsHtml();
        }

        function collectToolFormToolsFromSide(side, out) {
            if (side && side.tool) {
                out.add(side.tool);
            }
        }

        function collectToolFormToolsFromRow(row, out) {
            if (!row) {
                return;
            }
            if (row.full) {
                collectToolFormToolsFromSide(row.full, out);
            }
            if (row.distributionPair) {
                [row.leftFactored, row.topDistributed, row.bottomDistributed, row.rightFactored]
                    .forEach(side => collectToolFormToolsFromSide(side, out));
            }
            if (row.triplet) {
                [row.left, row.center, row.right].forEach(side => collectToolFormToolsFromSide(side, out));
            }
            collectToolFormToolsFromSide(row.left, out);
            collectToolFormToolsFromSide(row.right, out);
            if (Array.isArray(row.leftGroup)) {
                row.leftGroup.forEach(side => collectToolFormToolsFromSide(side, out));
            }
            if (Array.isArray(row.rightGroup)) {
                row.rightGroup.forEach(side => collectToolFormToolsFromSide(side, out));
            }
        }

        function getToolFormModeForTool(toolName) {
            const normalizedToolName = toolName === "commute" ? "commuteFirstToLast" : toolName;
            for (const mode of Object.keys(TOOL_FORM_MENU_ROWS_BY_EXPONENT_MODE)) {
                const tools = new Set();
                (TOOL_FORM_MENU_ROWS_BY_EXPONENT_MODE[mode] || []).forEach(row => {
                    collectToolFormToolsFromRow(row, tools);
                });
                if (tools.has(normalizedToolName)) {
                    return mode;
                }
            }
            return null;
        }

        function syncToolListToDemoStep() {
            const step = getCurrentDemoStep();
            if (!step || step.type !== "tool") {
                return;
            }
            const mode = getToolFormModeForTool(step.tool);
            if (mode === TOOL_EXPONENT_MODES.plain || mode === TOOL_EXPONENT_MODES.exponent || mode === TOOL_EXPONENT_MODES.inverse) {
                uiState.toolExponentMode = mode;
            }
        }

        function buildSelectedToolCategoryHtml(category, visibleKeys) {
            let html = buildToolExponentModeHtml();
            html += `<button class="panel-menu-back-button" data-action="backToToolCategories">← Back to tool categories</button>`;
            html += `<div class="panel-menu-title">${escapeHtml(category.label)}</div>`;

            if (visibleKeys.length === 0) {
                html += `<div class="small-note">No rules in this category are available in the current level.</div>`;
                return html;
            }

            html += `<div class="tool-grid">`;
            for (const key of visibleKeys) {
                html += buildToolButtonHtml(key);
            }
            html += `</div>`;
            return html;
        }

        function buildToolAreaHtml() {
            let html = "";

            if (!selection.node || uiState.stage === "postview") {
                return "";
            }

            if (!uiState.activeTool) {
                if (isApplicableOnlyToolNotationMode()) {
                    return buildApplicableToolListHtml();
                }
                if (isIntentCategoryToolNotationMode()) {
                    return buildIntentCategoryToolListHtml();
                }
                return buildToolCategoryMenuHtml();
            }

            if (
                getAutoExecuteFunctionForTool(uiState.activeTool) &&
                uiState.stage === "preview"
            ) {
                return "";
            } else if (uiState.activeTool === "insertIdentity" && uiState.stage === "choosePosition") {
                html += `<div class="small-note">Choose what identity to insert.</div>`;
                html += `<div class="tool-grid">
                    <button data-action="insertIdentityOption" data-value="addZero:top">An additive identity may be inserted above the selected expression.</button>
                    <button data-action="insertIdentityOption" data-value="addZero:bottom">An additive identity may be inserted below the selected expression.</button>
                    <button data-action="insertIdentityOption" data-value="multiplyByOne:left">A multiplicative identity may be inserted on the left.</button>
                    <button data-action="insertIdentityOption" data-value="multiplyByOne:right">A multiplicative identity may be inserted on the right.</button>
                    ${canEliminateIdentities() && !isIntentCategoryToolNotationMode() ? '<button data-action="previewEliminateIdentities">An additive, multiplicative, or first-power identity may be removed.</button>' : ''}
                </div>`;
            } else if (
                uiState.activeTool === "numericalEquivalence" &&
                uiState.stage === "input"
            ) {
                const numericalMode = getNumericalEquivalenceModeForSelection();
                const label = numericalMode === "expand"
                    ? "Enter an equivalent sum, product, or exponent of whole numbers, such as 2+3+4, 2*3*4, or 2^3."
                    : "Enter the equivalent whole number for the selected sum, product, or exponent. Level 1 uses n-ary sums/products and binary exponents of whole numbers.";
                html += `<div class="small-note">${label}</div>`;
                html += `<input class="number-input input-box" value="${escapeHtml(uiState.inputText)}">`;
                html += `<div class="tool-row"><button data-action="execute">Execute</button><button data-action="done">Exit</button></div>`;
                if (uiState.message) {
                    html += `<div class="small-note">${escapeHtml(uiState.message)}</div>`;
                }
            } else if (
                isStructuredNumericalTool(uiState.activeTool) &&
                uiState.stage === "input"
            ) {
                html += `<div class="small-note">${escapeHtml(getStructuredNumericalToolInputLabel(uiState.activeTool))}</div>`;
                html += `<input class="number-input input-box" value="${escapeHtml(uiState.inputText)}">`;
                html += `<div class="tool-row"><button data-action="execute">Execute</button><button data-action="done">Exit</button></div>`;
                if (uiState.message) {
                    html += `<div class="small-note">${escapeHtml(uiState.message)}</div>`;
                }
            } else if (
                (uiState.activeTool === "factorNumber" || uiState.activeTool === "writeNumberAsSum") &&
                uiState.stage === "input"
            ) {
                const label = uiState.activeTool === "factorNumber"
                    ? "Enter factors separated by spaces, commas, x, or *"
                    : "Enter addends separated by spaces, commas, or +";
                html += `<div class="small-note">${label}</div>`;
                html += `<input class="number-input input-box" value="${escapeHtml(uiState.inputText)}">`;
                html += `<div class="tool-row"><button data-action="execute">Execute</button></div>`;
                if (uiState.message) {
                    html += `<div class="small-note">${escapeHtml(uiState.message)}</div>`;
                }
            } else if (
                uiState.activeTool === "evaluate" &&
                uiState.stage === "input"
            ) {
                const label = "Enter the value of the selected sum or product. Evaluation level 1 allows only addition or multiplication of non-negative whole numbers, not mixed product-sum expressions. Keep trying until correct, or exit.";
                html += `<div class="small-note">${label}</div>`;
                html += `<input class="number-input input-box" value="${escapeHtml(uiState.inputText)}">`;
                html += `<div class="tool-row"><button data-action="execute">Execute</button><button data-action="done">Exit</button></div>`;
                if (uiState.message) {
                    html += `<div class="small-note">${escapeHtml(uiState.message)}</div>`;
                }
            } else if (
                uiState.activeTool === "cancelOpposites" &&
                uiState.stage === "input"
            ) {
                html += `<div class="small-note">Enter an expression in fully parenthesized form. The selected 0 will become that expression plus its additive inverse, for example ((x)+((-1)*(x))).</div>`;
                html += `<textarea class="number-input input-box" rows="3">${escapeHtml(uiState.inputText)}</textarea>`;
                html += `<div class="tool-row"><button data-action="execute">Execute</button><button data-action="done">Exit</button></div>`;
                if (uiState.message) {
                    html += `<div class="small-note">${escapeHtml(uiState.message)}</div>`;
                }

            } else if (
                isExpressionBuilderTool(uiState.activeTool) &&
                uiState.stage === "builder"
            ) {
                html += buildExpressionBuilderHtml();
            } else if (
                uiState.activeTool === "insertExponentZero" &&
                uiState.stage === "input"
            ) {
                html += `<div class="small-note">Enter a base expression in fully parenthesized form. The selected 1 will become that expression raised to the 0 power, for example ((x)^(0)).</div>`;
                html += `<textarea class="number-input input-box" rows="3">${escapeHtml(uiState.inputText)}</textarea>`;
                html += `<div class="tool-row"><button data-action="execute">Execute</button><button data-action="done">Exit</button></div>`;
                if (uiState.message) {
                    html += `<div class="small-note">${escapeHtml(uiState.message)}</div>`;
                }
            } else if (
                uiState.activeTool === "insertPowerOfOne" &&
                uiState.stage === "input"
            ) {
                html += `<div class="small-note">Enter an exponent expression in fully parenthesized form. The selected 1 will become 1 raised to that power, for example ((1)^(5)).</div>`;
                html += `<textarea class="number-input input-box" rows="3">${escapeHtml(uiState.inputText)}</textarea>`;
                html += `<div class="tool-row"><button data-action="execute">Execute</button><button data-action="done">Exit</button></div>`;
                if (uiState.message) {
                    html += `<div class="small-note">${escapeHtml(uiState.message)}</div>`;
                }
            } else if (
                uiState.activeTool === "replaceOneWithInverseProduct" &&
                uiState.stage === "input"
            ) {
                html += `<div class="small-note">Enter an integer or fully parenthesized expression. The selected 1 will become that expression times the same expression raised to -1, for example ((5)*((5)^(-1))) or (((x)+(2))*(((x)+(2))^(-1))).</div>`;
                html += `<textarea class="number-input input-box" rows="3">${escapeHtml(uiState.inputText)}</textarea>`;
                html += `<div class="tool-row"><button data-action="execute">Execute</button><button data-action="done">Exit</button></div>`;
                if (uiState.message) {
                    html += `<div class="small-note">${escapeHtml(uiState.message)}</div>`;
                }
            } else if (
                uiState.activeTool === "insertZeroProduct" &&
                uiState.stage === "input"
            ) {
                const orientationLabel = uiState.zeroProductOrientation === "right"
                    ? "The selected 0 will become that expression times 0, for example ((x)*(0)) or (((x)+(2))*(0))."
                    : "The selected 0 will become 0 times that expression, for example ((0)*(x)) or ((0)*((x)+(2))).";
                html += `<div class="small-note">Enter the expression to multiply by zero. ${orientationLabel}</div>`;
                html += `<textarea class="number-input input-box" rows="3">${escapeHtml(uiState.inputText)}</textarea>`;
                html += `<div class="tool-row"><button data-action="execute">Execute</button><button data-action="done">Exit</button></div>`;
                if (uiState.message) {
                    html += `<div class="small-note">${escapeHtml(uiState.message)}</div>`;
                }
            } else if (
                (uiState.activeTool === "commute" || uiState.activeTool === "commuteTerms" || uiState.activeTool === "commuteFactors") &&
                uiState.stage === "preview"
            ) {
                const chosenCount = Array.isArray(uiState.commuteOrder) ? uiState.commuteOrder.length : 0;
                const totalCount = getSelectedSliceLength();
                const demoStep = getCurrentDemoStep();
                const instruction = isDemoModeActive() && demoStep && demoStep.type === "commuteChoice"
                    ? `Click the yellow-outlined ${selection.node && selection.node.type === "sum" ? "term" : "factor"} next.`
                    : "Click the colored terms or factors in the order you want them to appear.";
                html += `<div class="small-note">${instruction} ${chosenCount} of ${totalCount} chosen.</div>`;
                html += `<div class="tool-row"><button data-action="done">Exit</button></div>`;
            } else if (
                (uiState.activeTool === "commuteFirstToLast" || uiState.activeTool === "commuteLastToFirst") &&
                uiState.stage === "preview"
            ) {
                html += `<div class="tool-row"><button data-action="done">Exit</button></div>`;
            }

            return html;
        }

        function markToolButtonNotApplicable(button) {
            button.classList.add("tool-not-applicable");
            button.setAttribute("title", "This rule does not apply to the selected expression.");
        }

        function performBuilderAction(action, value = "") {
            if (!uiState.expressionBuilder || uiState.stage !== "builder") {
                return false;
            }
            if (!isDemoBuilderActionAllowed(action, value)) {
                return false;
            }

            const beforeExpression = getExpressionTextForTrace();
            uiState.message = "";
            let result = true;
            if (action === "digit") {
                result = appendBuilderDigit(value);
            } else if (action === "negativeOne") {
                result = enterBuilderValue("-1", true);
            } else if (action === "value") {
                result = enterBuilderValue(value, true);
            } else if (action === "operation") {
                result = insertBuilderOperation(value);
            } else if (action === "next") {
                result = moveBuilderNext();
            } else if (action === "undoBackspace") {
                result = undoExpressionBuilderStep();
            } else if (action === "submit") {
                result = submitExpressionBuilder();
            } else if (action === "cancel") {
                result = cancelExpressionBuilder();
            } else {
                return false;
            }

            if (result !== false) {
                recordBuilderForSolution(action, value, beforeExpression);
                advanceDemoStep();
            }
            return result !== false;
        }

        function handleExpressionBuilderKeydown(event) {
            if (!uiState.expressionBuilder || uiState.stage !== "builder") {
                return false;
            }
            const panel = document.querySelector(".expression-builder-panel");
            if (!panel) {
                return false;
            }
            const target = event.target;
            if (target && typeof target.matches === "function" && (target.matches("input, textarea, select") || target.isContentEditable)) {
                return false;
            }

            let action = "";
            let value = "";
            if (/^[0-9]$/.test(event.key)) {
                action = "digit";
                value = event.key;
            } else if (event.key === "+") {
                action = "operation";
                value = "sum";
            } else if (event.key === "*") {
                action = "operation";
                value = "prod";
            } else if (event.key === "^") {
                action = "operation";
                value = "exp";
            } else if (event.key === "-") {
                action = "negativeOne";
            } else if (event.key === "Enter") {
                action = "submit";
            } else if (event.key === "ArrowRight") {
                action = "next";
            } else if (event.key === "Backspace" || event.key === "Delete") {
                action = "undoBackspace";
            } else if (event.key === "Escape") {
                action = "cancel";
            } else if (/^[a-zA-Z]$/.test(event.key)) {
                action = "value";
                value = event.key.toLowerCase();
            } else {
                return false;
            }

            const selector = value
                ? `[data-builder-action="${action}"][data-value="${value}"]`
                : `[data-builder-action="${action}"]`;
            const matchingButton = panel.querySelector(selector);
            if (!matchingButton || matchingButton.disabled) {
                return false;
            }

            event.preventDefault();
            performBuilderAction(action, value);
            return true;
        }

        function attachToolListeners(container) {
            container.querySelectorAll("button[data-rule-category]").forEach(btn => {
                btn.addEventListener("click", () => {
                    const categoryId = btn.dataset.ruleCategory;
                    let applicableTools = getApplicableIntentCategoryTools(categoryId);
                    if (isDemoModeActive()) {
                        applicableTools = applicableTools.filter(isDemoToolAllowed);
                    }
                    if (applicableTools.length === 0) {
                        markToolButtonNotApplicable(btn);
                        return;
                    }
                    if (applicableTools.length === 1) {
                        const toolName = applicableTools[0];
                        const beforeExpression = getExpressionTextForTrace();
                        recordToolForSolution(toolName, beforeExpression);
                        advanceDemoStep();
                        beginTool(toolName);
                        return;
                    }
                    uiState.activeToolCategory = categoryId;
                    renderToolArea();
                    refreshStatus();
                    drawExpression();
                });
            });

            container.querySelectorAll("[data-builder-action]").forEach(button => {
                button.addEventListener("click", () => {
                    const action = button.dataset.builderAction;
                    const value = button.dataset.value || "";
                    performBuilderAction(action, value);
                });
            });

            container.querySelectorAll("input[name='toolExponentMode']").forEach(input => {
                input.addEventListener("change", () => {
                    if (!input.checked) {
                        return;
                    }
                    if (isDemoModeActive()) {
                        renderToolArea();
                        return;
                    }
                    uiState.toolExponentMode = input.value === TOOL_EXPONENT_MODES.exponent
                        ? TOOL_EXPONENT_MODES.exponent
                        : input.value === TOOL_EXPONENT_MODES.inverse
                            ? TOOL_EXPONENT_MODES.inverse
                            : TOOL_EXPONENT_MODES.plain;
                    renderToolArea();
                    refreshStatus();
                    drawExpression();
                });
            });

            container.querySelectorAll("button[data-tool-category]").forEach(btn => {
                btn.addEventListener("click", () => {
                    if (isDemoModeActive()) {
                        return;
                    }
                    uiState.activeToolCategory = btn.dataset.toolCategory;
                    renderToolArea();
                    refreshStatus();
                    drawExpression();
                });
            });

            container.querySelectorAll("button[data-tool]").forEach(btn => {
                btn.addEventListener("click", () => {
                    const toolName = btn.dataset.tool;
                    if (!isDemoToolAllowed(toolName)) {
                        return;
                    }
                    if (!isToolActuallyApplicable(toolName)) {
                        if (!isDemoModeActive() && !isApplicableOnlyToolNotationMode()) {
                            markToolButtonNotApplicable(btn);
                        }
                        return;
                    }
                    const beforeExpression = getExpressionTextForTrace();
                    recordToolForSolution(toolName, beforeExpression);
                    advanceDemoStep();
                    beginTool(toolName);
                });
            });

            container.querySelectorAll("button[data-action]").forEach(btn => {
                btn.addEventListener("click", () => {
                    const action = btn.dataset.action;
                    const value = btn.dataset.value || null;
                    if (!isDemoActionAllowed(action, value)) {
                        return;
                    }
                    const beforeExpression = getExpressionTextForTrace();
                    recordActionForSolution(action, value, beforeExpression);
                    advanceDemoStep();
                    handleToolAction(action, value);
                });
            });
        }

        function attachInputListeners() {
            document.querySelectorAll(".number-input").forEach(input => {
                input.addEventListener("input", () => {
                    uiState.inputText = input.value;
                });

                input.addEventListener("keydown", e => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        handleToolAction("execute", null);
                    }
                });
            });

            const visibleInput = levelContent.querySelector(".number-input");
            if (visibleInput) {
                visibleInput.focus();
                visibleInput.setSelectionRange(visibleInput.value.length, visibleInput.value.length);
            }

            const copyTextBox = levelContent.querySelector(".copy-text-box");
            if (copyTextBox) {
                copyTextBox.focus();
                copyTextBox.setSelectionRange(0, copyTextBox.value.length);
            }
        }


        function selectionContainsProductTerm() {
            if (!selection.node || selection.node.type !== "sum") {
                return false;
            }
            for (let i = selection.firstPart; i <= selection.lastPart; i++) {
                if (selection.node.args[i].type === "prod") {
                    return true;
                }
            }
            return false;
        }
function renderToolArea() {
            // The old floating menu is intentionally kept in the document for
            // possible future restoration, but the active rule menu now lives
            // in the left panel. When no selection is active, the left panel
            // goes back to showing the level steps.
            hideFloatingMenu();
            document.body.classList.toggle(
                "expression-builder-active",
                uiState.mode === "edit" && uiState.stage === "builder" && !!uiState.expressionBuilder
            );

            if (uiState.mode !== "edit") {
                return;
            }

            if (selection.status === "inProg") {
                if (isLeftPanelShowingToolMenu()) {
                    renderLevelInfo(currentLevelIndex);
                }
                return;
            }

            applyDemoInputForCurrentStep();
            syncToolListToDemoStep();
            const html = buildToolAreaHtml();
            if (!html) {
                if (isLeftPanelShowingToolMenu() || !levelContent.innerHTML.trim()) {
                    renderLevelInfo(currentLevelIndex);
                }
                return;
            }

            levelContent.innerHTML = `<div class="panel-tool-menu">${html}</div>`;
            attachToolListeners(levelContent);
            applyDemoButtonHighlights(levelContent);
            attachInputListeners();
        }

        function beginAutoPreviewThenExecute(executeFn) {
            hideFloatingMenu();
            drawExpression();

            if (uiState.previewTimerId !== null) {
                clearTimeout(uiState.previewTimerId);
            }

            uiState.previewTimerId = setTimeout(() => {
                uiState.previewTimerId = null;
                executeFn();
            }, SETTINGS.previewDurationMs);
        }

        function getAutoExecuteFunctionForTool(toolName) {
            if (toolName === "commuteFirstToLast") {
                return applyCommuteFirstToLastWithPostview;
            }
            if (toolName === "commuteLastToFirst") {
                return applyCommuteLastToFirstWithPostview;
            }
            if (toolName === "eliminateDoubleInverse") {
                return applyEliminateDoubleInverse;
            }
            if (toolName === "insertDoubleInverse") {
                return applyInsertDoubleInverse;
            }
            if (toolName === "cancelProductWithInverse") {
                return applyCancelProductWithInverse;
            }
            if (toolName === "eliminateIdentities") {
                return applyIdentityElimination;
            }
            if (toolName === "cancelOpposites") {
                return getCancelOppositesData() ? applyCancelOpposites : null;
            }
            if (toolName === "doubleNegative") {
                return applyDoubleNegative;
            }
            if (toolName === "zeroProduct") {
                return applyZeroProduct;
            }
            if (isPowerInverseRewriteTool(toolName)) {
                return () => applyPowerInverseRewrite(toolName);
            }
            return null;
        }

        function beginTool(toolName) {
            if (toolName === "insertIdentityAddZeroTop") {
                if (!canInsertIdentity()) {
                    return;
                }
                applyIdentityInsertion("addZero", "top");
                return;
            }
            if (toolName === "insertIdentityAddZeroBottom") {
                if (!canInsertIdentity()) {
                    return;
                }
                applyIdentityInsertion("addZero", "bottom");
                return;
            }
            if (toolName === "insertIdentityMultiplyByOneLeft") {
                if (!canInsertIdentity()) {
                    return;
                }
                applyIdentityInsertion("multiplyByOne", "left");
                return;
            }
            if (toolName === "insertIdentityMultiplyByOneRight") {
                if (!canInsertIdentity()) {
                    return;
                }
                applyIdentityInsertion("multiplyByOne", "right");
                return;
            }
            if (toolName === "insertZeroProductLeft" || toolName === "insertZeroProductRight") {
                if (!canInsertZeroProduct()) {
                    return;
                }
                uiState.activeTool = "insertZeroProduct";
                uiState.zeroProductOrientation = toolName === "insertZeroProductRight" ? "right" : "left";
                uiState.message = "";
                uiState.inputText = "";
                uiState.stage = "builder";
                beginExpressionBuilder("insertZeroProduct");
                renderToolArea();
                refreshStatus();
                drawExpression();
                return;
            }
            if (toolName === "reduceToZero") {
                if (canZeroProduct()) {
                    toolName = "zeroProduct";
                } else if (canCancelOpposites()) {
                    toolName = "cancelOpposites";
                } else {
                    return;
                }
            }
            if (toolName === "reduceToOne") {
                if (canCancelProductWithInverse()) {
                    toolName = "cancelProductWithInverse";
                } else if (canApplyPowerInverseRewrite("eliminateExponentZero")) {
                    toolName = "eliminateExponentZero";
                } else if (canApplyPowerInverseRewrite("oneToAnyPower")) {
                    toolName = "oneToAnyPower";
                } else {
                    return;
                }
            }
            if (!isToolActuallyApplicable(toolName)) {
                return;
            }

            uiState.activeTool = toolName;
            uiState.message = "";
            uiState.inputText = "";
            uiState.chosenDirection = null;
            uiState.chosenIdentity = null;
            uiState.zeroProductOrientation = "left";
            uiState.commuteSelectedIndex = -1;
            uiState.commuteOrder = [];
            uiState.previewColors = null;

            if (
                toolName === "commute" ||
                toolName === "commuteFirstToLast" ||
                toolName === "commuteLastToFirst" ||
                toolName === "commuteTerms" ||
                toolName === "commuteFactors" ||
                toolName === "distributeLeftToRight" ||
                toolName === "distributeRightToLeft" ||
                toolName === "factorLeft" ||
                toolName === "factorRight" ||
                toolName === "distributeInverseOverProduct" ||
                toolName === "factorProductOfInverses" ||
                isPowerInverseRewriteTool(toolName)
            ) {
                uiState.stage = "preview";
            } else if (isStructuredNumericalTool(toolName)) {
                const numericalMode = getStructuredNumericalToolModeForSelection(toolName);
                if (numericalMode === "expand") {
                    uiState.stage = "builder";
                    beginExpressionBuilder(toolName);
                } else {
                    uiState.stage = "input";
                }
            } else if (toolName === "insertIdentity") {
                uiState.stage = "choosePosition";
            } else if (
                toolName === "eliminateIdentities" ||
                toolName === "eliminateDoubleInverse" ||
                toolName === "insertDoubleInverse" ||
                toolName === "cancelProductWithInverse" ||
                (toolName === "cancelOpposites" && getCancelOppositesData()) ||
                toolName === "doubleNegative" ||
                toolName === "zeroProduct"
            ) {
                uiState.stage = "preview";
            } else if (isExpressionBuilderTool(toolName)) {
                uiState.stage = "builder";
                beginExpressionBuilder(toolName);
            } else if (
                toolName === "factorNumber" ||
                toolName === "writeNumberAsSum" ||
                toolName === "evaluate" ||
                toolName === "numericalEquivalence"
            ) {
                uiState.stage = "input";
            } else {
                uiState.stage = "idle";
            }

            if (toolName === "distributeLeftToRight" || toolName === "distributeRightToLeft") {
                const data = toolName === "distributeLeftToRight"
                    ? getDistributionData("left")
                    : getDistributionData("right");
                uiState.previewColors = data ? getDistinctRandomColors(1 + data.sumNode.args.length) : null;
            } else if (toolName === "commute" || toolName === "commuteFirstToLast" || toolName === "commuteLastToFirst" || toolName === "commuteTerms" || toolName === "commuteFactors") {
                const partCount = selection.lastPart - selection.firstPart + 1;
                uiState.previewColors = getDistinctRandomColors(partCount);
            } else if (toolName === "factorLeft" || toolName === "factorRight") {
                const data = toolName === "factorLeft"
                    ? getFactoringData("left")
                    : getFactoringData("right");
                const termCount = selection.lastPart - selection.firstPart + 1;
                uiState.previewColors = data
                    ? getDistinctRandomColors(1 + termCount)
                    : null;
            }

            refreshStatus();
            drawExpression();

            if (
                (toolName === "commute" || toolName === "commuteTerms" || toolName === "commuteFactors") &&
                getSelectedSliceLength() === 2
            ) {
                applyTwoItemCommuteWithPostview();
                return;
            }

            if (toolName === "distributeLeftToRight") {
                beginAutoPreviewThenExecute(applyLeftDistribution);
                return;
            }

            if (toolName === "distributeRightToLeft") {
                beginAutoPreviewThenExecute(applyRightDistribution);
                return;
            }

            if (toolName === "factorLeft") {
                beginAutoPreviewThenExecute(applyLeftFactoring);
                return;
            }

            if (toolName === "factorRight") {
                beginAutoPreviewThenExecute(applyRightFactoring);
                return;
            }

            if (toolName === "distributeInverseOverProduct") {
                applyDistributeInverseOverProduct();
                return;
            }

            if (toolName === "factorProductOfInverses") {
                applyFactorProductOfInverses();
                return;
            }

            const autoExecuteFn = getAutoExecuteFunctionForTool(toolName);
            if (autoExecuteFn) {
                beginAutoPreviewThenExecute(autoExecuteFn);
                return;
            }

            renderToolArea();
        }

        function handleToolAction(action, value) {
            if (action === "backToIntentCategories") {
                uiState.activeToolCategory = null;
                renderToolArea();
                refreshStatus();
                drawExpression();
                return;
            }

            if (action === "backToToolCategories") {
                uiState.activeToolCategory = null;
                renderToolArea();
                refreshStatus();
                drawExpression();
                return;
            }

            if (action === "chooseIdentity") {
                uiState.chosenIdentity = value;
                uiState.stage = "choosePosition";
                renderToolArea();
                refreshStatus();
                drawExpression();
                return;
            }

            if (action === "choosePosition") {
                applyIdentityInsertion(uiState.chosenIdentity, value);
                return;
            }

            if (action === "insertIdentityOption") {
                const parts = String(value || "").split(":");
                if (parts.length === 2) {
                    uiState.chosenIdentity = parts[0];
                    applyIdentityInsertion(parts[0], parts[1]);
                }
                return;
            }

            if (action === "previewEliminateIdentities") {
                uiState.activeTool = "eliminateIdentities";
                uiState.stage = "preview";
                uiState.message = "";
                refreshStatus();
                drawExpression();
                beginAutoPreviewThenExecute(applyIdentityElimination);
                return;
            }

            if (action === "done") {
                clearSelection();
                clearInteraction();
                renderLevelInfo(currentLevelIndex);
                refreshStatus();
                drawExpression();
                return;
            }

            if (action === "execute") {
                if (uiState.activeTool === "distributeLeftToRight") {
                    applyLeftDistribution();
                } else if (uiState.activeTool === "distributeRightToLeft") {
                    applyRightDistribution();
                } else if (uiState.activeTool === "factorLeft") {
                    applyLeftFactoring();
                } else if (uiState.activeTool === "factorRight") {
                    applyRightFactoring();
                } else if (uiState.activeTool === "distributeInverseOverProduct") {
                    applyDistributeInverseOverProduct();
                } else if (uiState.activeTool === "factorProductOfInverses") {
                    applyFactorProductOfInverses();
                } else if (uiState.activeTool === "eliminateDoubleInverse") {
                    applyEliminateDoubleInverse();
                } else if (uiState.activeTool === "cancelProductWithInverse") {
                    applyCancelProductWithInverse();
                } else if (isPowerInverseRewriteTool(uiState.activeTool)) {
                    applyPowerInverseRewrite(uiState.activeTool);
                } else if (uiState.activeTool === "eliminateIdentities") {
                    applyIdentityElimination();
                } else if (uiState.activeTool === "factorNumber") {
                    applyFactorNumber();
                } else if (uiState.activeTool === "writeNumberAsSum") {
                    applyWriteNumberAsSum();
                } else if (uiState.activeTool === "evaluate") {
                    applyEvaluate();
                } else if (uiState.activeTool === "numericalEquivalence") {
                    applyNumericalEquivalence();
                } else if (isStructuredNumericalTool(uiState.activeTool)) {
                    applyStructuredNumericalInputTool(uiState.activeTool);
                } else if (uiState.activeTool === "cancelOpposites") {
                    applyCancelOpposites();
                } else if (uiState.activeTool === "doubleNegative") {
                    applyDoubleNegative();
                } else if (uiState.activeTool === "zeroProduct") {
                    applyZeroProduct();
                } else if (uiState.activeTool === "insertExponentZero") {
                    applyInsertExponentZero();
                } else if (uiState.activeTool === "insertPowerOfOne") {
                    applyInsertPowerOfOne();
                } else if (uiState.activeTool === "replaceOneWithInverseProduct") {
                    applyReplaceOneWithInverseProduct();
                } else if (uiState.activeTool === "insertZeroProduct") {
                    applyInsertZeroProduct();
                }
            }
        }

        function refreshStatus() {
            if (uiState.stage === "postview" && uiState.postviewData) {
                if (uiState.postviewData.type === "distribution") {
                    setStatus("Distribution postview: the transformed expression is shown with the same colors as the preview.");
                } else if (uiState.postviewData.type === "factoring") {
                    setStatus("Factoring postview: the transformed expression is shown with the same colors as the preview.");
                } else {
                    setStatus("Showing transformed expression briefly.");
                }
                return;
            }

            if (!selection.node) {
                setStatus("");
                return;
            }

            if (!uiState.activeTool) {
                setStatus(`Selected ${selection.node.type} part${getSelectedSliceLength() === 1 ? "" : "s"} ${selection.firstPart} through ${selection.lastPart}.`);
                return;
            }

            if (uiState.activeTool === "commute" || uiState.activeTool === "commuteTerms" || uiState.activeTool === "commuteFactors") {
                const chosenCount = Array.isArray(uiState.commuteOrder) ? uiState.commuteOrder.length : 0;
                const totalCount = getSelectedSliceLength();
                if (chosenCount === 0) {
                    setStatus(`Commute: click the ${selection.node.type === "sum" ? "terms" : "factors"} in the order you want them to appear.`);
                } else {
                    setStatus(`Commute: ${chosenCount} of ${totalCount} chosen. Chosen parts are shown in a darker shade. Continue clicking the remaining ${selection.node.type === "sum" ? "terms" : "factors"}.`);
                }
                return;
            }

            if (uiState.activeTool === "commuteFirstToLast") {
                setStatus("Commute preview: the first selected term or factor will move to the end of the selected group.");
                return;
            }

            if (uiState.activeTool === "commuteLastToFirst") {
                setStatus("Commute preview: the last selected term or factor will move to the beginning of the selected group.");
                return;
            }

            if (uiState.activeTool === "distributeLeftToRight") {
                setStatus("Distribution preview: the selected blue region has been partitioned into colored regions. One color marks the factor block on the left, and one color marks each term on the right. The transformation will be performed automatically.");
                return;
            }

            if (uiState.activeTool === "distributeRightToLeft") {
                setStatus("Distribution preview: the selected blue region has been partitioned into colored regions. One color marks the factor block on the right, and one color marks each term on the left. The transformation will be performed automatically.");
                return;
            }

            if (uiState.activeTool === "factorLeft") {
                setStatus("Factoring preview: the selected region has been partitioned into colored regions. The shared left-hand factor block uses one color across the selected terms, and each remainder region has its own color. The transformation will be performed automatically.");
                return;
            }

            if (uiState.activeTool === "factorRight") {
                setStatus("Factoring preview: the selected region has been partitioned into colored regions. The shared right-hand factor block uses one color across the selected terms, and each remainder region has its own color. The transformation will be performed automatically.");
                return;
            }

            if (uiState.activeTool === "distributeInverseOverProduct") {
                setStatus("Power of a product handles exponent -1 now; use the general exponent rule for this transformation.");
                return;
            }

            if (uiState.activeTool === "factorProductOfInverses") {
                setStatus("Factor Common Power handles common exponent -1 now; use the general exponent rule for this transformation.");
                return;
            }

            if (uiState.activeTool === "eliminateDoubleInverse") {
                setStatus("Double inverse preview: an expression raised to -1 and then raised to -1 again will become the original expression automatically.");
                return;
            }

            if (uiState.activeTool === "cancelProductWithInverse") {
                setStatus("Product-inverse preview: an expression times the same expression raised to -1 will become 1 automatically.");
                return;
            }

            if (isPowerInverseRewriteTool(uiState.activeTool)) {
                setStatus("Power/inverse rewrite preview. The transformation will be performed automatically.");
                return;
            }

            if (uiState.activeTool === "insertIdentity") {
                setStatus("Choose the exact identity insertion: add 0 above/below, multiply by 1 left/right, or insert a double inverse around the selection.");
                return;
            }

            if (uiState.activeTool === "replaceOneWithInverseProduct") {
                setStatus("Use the on-screen buttons to build the expression. It will be mirrored inside the inverse.");
                return;
            }

            if (uiState.activeTool === "eliminateIdentities") {
                setStatus("Identity elimination preview: bold green shows all top-level removable identities in the selected sum or product. They will be removed automatically.");
                return;
            }

            if (uiState.activeTool === "factorNumber") {
                setStatus("Enter factors for the selected number, then click Execute.");
                return;
            }

            if (uiState.activeTool === "writeNumberAsSum") {
                setStatus("Enter addends for the selected number, then click Execute.");
                return;
            }

            if (uiState.activeTool === "evaluate") {
                setStatus("Enter the value of the selected expression. Evaluation level 1 allows numeric sums, numeric products, and numeric powers. If it is wrong, keep trying, or click Exit.");
                return;
            }

            if (uiState.activeTool === "cancelOpposites") {
                setStatus("Cancel-opposites preview: bold green shows all top-level opposite pairs x and (-1)x. They will be replaced by 0 and normalized automatically.");
                return;
            }

            if (uiState.activeTool === "doubleNegative") {
                setStatus("Double-negative preview: bold green shows two top-level -1 factors. They will be replaced by 1 and normalized automatically.");
                return;
            }

            if (uiState.activeTool === "zeroProduct") {
                setStatus("Zero-product preview: bold green shows a top-level 0 factor. The selected product will become 0 automatically.");
                return;
            }

            if (uiState.activeTool === "insertZeroProduct") {
                setStatus("Enter an expression A. The selected 0 will become 0 · A.");
                return;
            }

            setStatus("");
        }

        function getClickedIndexWithinSelection(x, y) {
            if (!selection.node || !selection.node.args) {
                return -1;
            }

            for (let i = selection.firstPart; i <= selection.lastPart; i++) {
                if (selection.node.type === "sum") {
                    const term = selection.node.args[i];
                    const y1 = term.top() - getSelectionMargin();
                    const y2 = term.bottom() + getSelectionMargin();

                    if (
                        x >= selection.node.left() &&
                        x <= selection.node.right() &&
                        y >= y1 &&
                        y <= y2
                    ) {
                        return i;
                    }
                }

                if (selection.node.type === "prod") {
                    const factor = selection.node.args[i];
                    const x1 = factor.left() - getSelectionMargin();
                    const x2 = factor.right() + getSelectionMargin();

                    if (
                        x >= x1 &&
                        x <= x2 &&
                        y >= selection.node.top() &&
                        y <= selection.node.bottom()
                    ) {
                        return i;
                    }
                }
            }

            return -1;
        }

        workspaceSvg.addEventListener("mousedown", e => {
            if (uiState.mode !== "edit") {
                return;
            }
            if (uiState.stage === "postview") {
                return;
            }
            if (isDemoModeActive()) {
                const step = getCurrentDemoStep();
                const selectingExpression = !!step && step.type === "select" && uiState.stage === "idle";
                const choosingCommuteOrder = !!step &&
                    uiState.stage === "preview" &&
                    (uiState.activeTool === "commute" || uiState.activeTool === "commuteTerms" || uiState.activeTool === "commuteFactors") &&
                    (step.type === "commuteChoice" || step.type !== "tool");
                if (!selectingExpression && !choosingCommuteOrder) {
                    return;
                }
            }

            const rect = workspaceSvg.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (selection.status === "yes") {
                if (pointIsInCurrentSelection(x, y)) {
                    if (
                        (uiState.activeTool === "commute" || uiState.activeTool === "commuteTerms" || uiState.activeTool === "commuteFactors") &&
                        uiState.stage === "preview"
                    ) {
                        const clickedIndex = getClickedIndexWithinSelection(x, y);
                        if (clickedIndex >= 0) {
                            recordCommutePermutationChoice(clickedIndex);
                        }
                        return;
                    }
                    return;
                } else {
                    if (isDemoModeActive() && getCurrentDemoStep() && getCurrentDemoStep().type === "commuteChoice") {
                        drawExpression();
                        return;
                    }
                    clearSelection();
                    clearInteraction();
                    selection.status = "inProg";
                    selectionArea[0] = x;
                    selectionArea[1] = y;
                    selectionArea[2] = x;
                    selectionArea[3] = y;
                    updateSelectionFromEvent(e);
                    refreshStatus();
                    return;
                }
            }

            selection.status = "inProg";
            selectionArea[0] = x;
            selectionArea[1] = y;
            selectionArea[2] = x;
            selectionArea[3] = y;
            updateSelectionFromEvent(e);
            refreshStatus();
        });

        workspaceSvg.addEventListener("mousemove", e => {
            if (uiState.mode !== "edit") {
                return;
            }
            updateSelectionFromEvent(e);
        });

        workspaceSvg.addEventListener("mouseup", e => {
            if (uiState.mode !== "edit") {
                return;
            }
            updateSelectionFromEvent(e);
            if (selection.status === "inProg") {
                selection.status = selection.node ? "yes" : "no";
                if (!validateDemoSelectionAfterMouseUp()) {
                    return;
                }
                recordCurrentSelectionForSolution();
                clearInteraction();
                refreshStatus();
                drawExpression();
                renderToolArea();
            }
        });

        workspaceSvg.addEventListener("mouseleave", e => {
            if (uiState.mode !== "edit") {
                return;
            }
            if (selection.status === "inProg") {
                updateSelectionFromEvent(e);
                selection.status = selection.node ? "yes" : "no";
                if (!validateDemoSelectionAfterMouseUp()) {
                    return;
                }
                recordCurrentSelectionForSolution();
                clearInteraction();
                refreshStatus();
                drawExpression();
                renderToolArea();
            }
        });

        document.addEventListener("mousedown", e => {
            if (floatingToolMenu.classList.contains("hidden")) {
                return;
            }

            if (floatingToolMenu.contains(e.target)) {
                return;
            }

            if (!selection.node && selection.status !== "inProg") {
                hideFloatingMenu();
            }
        });
        let expressionRoot = null;
        currentExpressionRoot = null;
        window.addEventListener("resize", () => {
            if (expressionRoot) {
                drawExpression();
            }
        });
        window.addEventListener("load", () => {
            if (expressionRoot) {
                drawExpression();
            }
        });
}).catch(error => {
    console.error("Exploded Algebra could not start.", error);
    const target = document.getElementById("levelContent") || document.body;
    target.innerHTML = "";
    const message = document.createElement("div");
    message.className = "level-intro";
    message.textContent = `Exploded Algebra could not start: ${error && error.message ? error.message : String(error)}`;
    target.appendChild(message);
});
