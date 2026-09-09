# Archived Exploded-Exponent Implementation

## Purpose and current product decision

This document preserves the design of the removed exponent implementation so it
can be reconstructed later without rediscovering its architecture.

The active product intentionally has **no exponent structure in Exploded
Algebra notation**. Conventional notation may still display powers through
KaTeX fields such as `initialKatex`, `katex`, `beforeKatex`, and `afterKatex`.
The corresponding exploded expression uses repeated multiplication. For
example:

| Conventional notation | Exploded expression text |
| --- | --- |
| `x^2` | `((x)*(x))` |
| `2x^3` | `((2)*(x)*(x)*(x))` |
| `(x+1)^2` | `(((x)+(1))*((x)+(1)))` |

The last complete implementation before removal is available in Git history at
commit `d37b151`. That commit is the authoritative source if the feature is
restored. The descriptions below explain how its pieces fit together and which
assumptions must be reconsidered.

## Feature scope that existed

The implementation was not merely an exponent glyph. It spanned:

1. An `exp` node in the expression-tree model.
2. A dedicated SVG layout and visual grammar for that node.
3. Parsing and serialization of fully parenthesized `^` expressions.
4. Exponent construction in the expression builder.
5. Exponent-aware numerical evaluation and permission profiles.
6. Algebraic transformation rules for exponent identities and laws.
7. A third tool-list mode devoted to exponent rules.
8. A conditional Change Form action.
9. Exercise steps and recorded demo actions that converted repeated factors to
   a power.

Restoring only one or two of these layers would produce malformed layouts,
unavailable tools, unrecognized exercise steps, or move histories that cannot
be replayed.

## Expression-tree representation

The removed node had this logical shape:

```js
new ExprNode("exp", [baseNode, exponentNode], null)
```

The two children always had fixed meanings:

- `args[0]`: base
- `args[1]`: exponent

Miniature tool diagrams used a parallel helper:

```js
miniExp(base, exponent)
// returned { type: "exp", base, exponent }
```

The shared renderer converted miniature data and generic object data to the
same `ExprNode("exp", ...)` representation in `miniOopsToExprNode()` and
`exprFromData()`.

The selection system treated a complete exponent node as a two-part structure.
When a common ancestor was an `exp` node, its selection range was `0..1`.
Visible-object hit testing also added the exponent connector itself as a
candidate whose target covered both children.

## Fully parenthesized text format

The parser accepted a top-level caret inside an outer pair of parentheses:

```text
((base)^(exponent))
```

Examples:

```text
((x)^(2))
(((x)+(1))^(3))
((2)^((3)+(4)))
```

`parseParenthesizedExpressionStrict()` located a single top-level `^`, parsed
the text on each side recursively, and built an `exp` node.
`expressionToFullyParenthesizedText()` serialized it as:

```js
`(${baseText}^${exponentText})`
```

The parser required both sides and reported an error when either the base or
exponent was missing. Multiple top-level carets were rejected as ambiguous by
the common top-level-operator finder.

## SVG layout and visual grammar

The exponent renderer placed the base in the lower-left region and the exponent
in the upper-right region. Padding separated the two regions. Its dimensions
were derived from both child layouts:

```text
width  = base.width + 2 * padding + exponent.width
height = exponent.height + 2 * padding + base.height
```

The node stored three vertical and three horizontal guide lines. The middle
vertical guide separated the base and exponent columns; the middle horizontal
guide separated their rows.

Placement used:

- base: left column, lower row
- exponent: right column, upper row

The visual connector was an asymmetric, bent outline connecting these regions.
It included:

- a filled curved corner from the base side to the central junction;
- a filled curved corner from the exponent side toward the lower region;
- a top/right outline around the exponent region;
- short terminal strokes near the base and lower central edge.

The connector was drawn after both children, like the sum and product
operators. Debug bounds covered the full exponent node.

When restoring, recover the exact geometry from
`exploded-algebra-renderer.js` at commit `d37b151`; small changes to padding,
guide lines, or placement can cause selection hit boxes and outlines to diverge
from what is visible.

## Transformation rules

The old transformation engine grouped exponent and inverse rewrites in a single
rule family. The exponent-related rules were:

| Internal tool | Transformation |
| --- | --- |
| `eliminateExponentOne` | `A^1 -> A` |
| `eliminateExponentZero` | `A^0 -> 1` |
| `insertExponentOne` | `A -> A^1` |
| `insertExponentZero` | `1 -> A^0` |
| `insertPowerOfOne` | `1 -> 1^A` |
| `rewriteNegativeOneExponentAsInverse` | `A^-1 -> inverse(A)` |
| `rewriteInverseAsNegativeOneExponent` | `inverse(A) -> A^-1` |
| `powerOfPower` | `(A^m)^n -> A^(m*n)` |
| `expandPowerOfPower` | `A^(m*n) -> (A^m)^n` |
| `combineSameBasePowers` | `A^m * A^n -> A^(m+n)` |
| `expandPowerOfSum` | `A^(m+n) -> A^m * A^n` |
| `divideSameBasePowers` | same-base quotient to exponent subtraction |
| `distributeExponentOverProduct` | `(A*B)^n -> A^n * B^n` |
| `factorCommonExponent` | `A^n * B^n -> (A*B)^n` |
| `oneToAnyPower` | `1^A -> 1` |
| `negativeOneSquared` | `(-1)^2 -> 1` |
| `negativeOneEvenPower` | `(-1)^(2n) -> 1` |
| `negativeOneOddPower` | `(-1)^(2n+1) -> -1` |
| `repeatedProductToPower` | `A*A*...*A -> A^n` |
| `powerToRepeatedProduct` | `A^n -> A*A*...*A` for literal positive `n` |

Additional compatibility rules mixed inverse behavior with exponent notation:

- `eliminateInverseToNegativeOnePower`
- `distributePowerOverInverse`
- `factorPowerOutOfInverse`
- `inverseFactorAsNegativeExponent`

Several of those compatibility names were not exposed in the main menu but
still existed in rule metadata and replacement logic.

### Applicability details

- Power-to-repeated-product accepted a literal positive integer exponent.
- Expansion required at least two copies and capped the count at 20 to prevent
  an unexpectedly huge expression.
- Repeated-product-to-power required at least two factors and structural
  equality across every factor.
- Combining same-base powers required exactly two exponent nodes with
  structurally equal bases.
- Factoring a common exponent required every selected factor to be an exponent
  node with a structurally equal exponent child.
- Power-of-a-power expansion expected the exponent child to be a product with
  at least two factors.

The implementation normalized replacement trees after applying a rule, so
nested sums and products could flatten immediately.

## Tool menus and Change Form

The non-default legacy tool interface had three modes:

1. General algebra
2. Inverses
3. Exponents

The exponent mode displayed quick rules for:

- same-base multiplication;
- splitting a summed exponent;
- distributing an exponent over a product;
- factoring a common exponent;
- power of a power.

Its detailed form rows paired the forward and reverse visual transformations,
including repeated multiplication versus a power and the two ways to produce
the value one.

The primary intent-category interface conditionally showed **Change Form** only
if a structural scan found an actual `exp` node in exploded expression data.
The scan included:

- `startExpression`;
- each step's `expression` and `explodedExpression`;
- `beforeExpression` and `afterExpression`;
- `beforeExplodedExpression` and `afterExplodedExpression`;
- exploded expressions inside `preCompletion` and `postCompletion` variants.

Conventional KaTeX fields did not enable Change Form. The result was cached per
level in a `WeakMap`.

## Expression Builder integration

The builder offered an exponent-operation button with the keyboard shortcut
`^`. Activating it inserted a binary `exp` node with two editable placeholders.
The base was filled first and the exponent second unless the current value was
being wrapped, in which case navigation followed the same wrapping rules as
sum and product.

Unfilled exponent placeholders defaulted to `1`, matching multiplicative
placeholder behavior. The builder preview used the shared SVG exponent renderer.

The builder also supported special insertion workflows:

- `insertExponentZero`: selecting the literal `1` opened a builder for `A` and
  proposed `A^0`.
- `insertPowerOfOne`: selecting the literal `1` opened a builder for an
  exponent and proposed `1^A`.
- `insertExponentOne`: wrapped the current selection as `A^1`.

Portrait layout placed the exponent button as the fifth operation button after
negative one, sum, product, and inverse. Removing it required redistributing the
four remaining buttons across the row.

## Numerical evaluation and permissions

Exercise files formerly included:

```json
"numericalRewrite": {
  "addition": "none",
  "multiplication": "unrestricted",
  "allowNegativeOne": true,
  "allowExponents": true,
  "allowInverses": false
}
```

`allowExponents` controlled whether both the selected expression and its
proposed numerical replacement could contain an `exp` node. It appeared in
profile validation, legacy arithmetic-level conversion, profile summaries, and
move-history exports.

Exact evaluation required an integer-valued exponent. It used exponentiation by
squaring on exact rational values and rejected:

- zero raised to zero;
- zero raised to a negative exponent;
- a non-integer exponent;
- an absolute exponent greater than 10,000;
- a negative exponent when inverse operations were disallowed.

Legacy arithmetic classification treated a power of two whole-number leaves as
level 2 and more complex numeric powers as level 3. The older text-input path
also accepted one binary expression such as `2^3`.

## Built-in exercise integration

The multiply-binomials exercise converted `x*x` to `x^2` in the exploded tree.
Its guided demo selected `((x)*(x))` and invoked
`repeatedProductToPower`. Subsequent exploded step expressions used
`((x)^(2))`, while their conventional KaTeX used `x^2`.

The current version removes that conversion. Its exploded steps retain
`(2)*(x)*(x)` while the conventional panel continues to show `2x^2`. If the
feature is restored, update both sources of built-in data:

- `levels/exercise-3-multiply-binomials.json`
- `levels/exercise-3-multiply-binomials-demo.json`
- the mirrored JSON payloads inside `Exercises.html`

The standalone JSON and embedded mirror must remain byte-for-byte equivalent as
parsed JSON, or file-based and hosted launches can behave differently.

## Recommended restoration sequence

1. Create a feature branch; do not restore directly on the production branch.
2. Recover the exponent-specific sections from commit `d37b151` rather than
   rewriting them from this prose.
3. Restore the `exp` node conversion, measurement, placement, drawing, and
   export paths in `exploded-algebra-renderer.js`.
4. Restore parser and serializer support in `exploded-algebra-tool.js`.
5. Restore hit testing and selection-range behavior for binary exponent nodes.
6. Restore rule metadata, applicability, replacement logic, and auto-execution.
7. Decide whether Change Form and the separate exponent tool mode still fit the
   current interface before restoring their UI.
8. Restore builder construction, preview, keyboard handling, placeholder rules,
   button layout, and validation.
9. Restore `allowExponents` only if per-exercise numeric permission remains a
   desired product behavior.
10. Update level JSON and the `Exercises.html` mirrors together.
11. Add focused automated tests before enabling an exponent exercise.

## Tests required for a future restoration

At minimum, verify:

- parser/serializer round trips for literal and nested powers;
- renderer bounds for a tall base, tall exponent, nested power, and power inside
  an inverse;
- clicking the base, exponent, and connector creates the expected selection;
- every forward/reverse rule preserves structural equivalence;
- repeated-product expansion respects the maximum count;
- exact numerical evaluation handles positive, zero, and negative integer
  exponents and all undefined cases;
- builder keyboard and touch input can create and navigate both operands;
- conventional-only KaTeX powers do not create an exploded exponent node;
- standalone level JSON and embedded mirrors load identically;
- old move histories either migrate cleanly or fail with a clear compatibility
  message.

## Product questions to answer before restoring

The previous implementation allowed symbolic exponent manipulation inside the
exploded notation. The current decision instead treats repeated multiplication
as the exploded meaning of a positive whole-number power. Before restoring,
decide:

- whether the pedagogy benefits from a separate exponent geometry;
- whether symbolic, zero, negative, and fractional exponents belong in the same
  visual system;
- whether inverse should remain a dedicated exploded operator or be represented
  through negative exponents;
- whether a power should be a persistent structure or merely a conventional
  abbreviation for a repeated product;
- how large literal exponents should be visualized without producing unwieldy
  repeated products;
- how exponent laws should interact with the project's goal that learners carry
  out every minute algebraic manipulation explicitly.

Those decisions should drive any restoration rather than automatically reviving
all of the old behaviors.
