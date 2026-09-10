EXPLODED ALGEBRA - WEBSITE FILES

Open index.html first. The launcher is designed to work both when index.html is
opened directly from disk (file://) and when the folder is hosted by a web
server such as GitHub Pages.

BUILT-IN EXERCISES

The built-in exercises are ordinary JSON files in the levels folder:

- levels/level-1-distribute-and-combine.json
- levels/level-1-distribute-and-combine-demo.json
- levels/exercise-2-add-fractions.json
- levels/exercise-3-multiply-binomials-demo.json
- levels/exercise-3-multiply-binomials.json
- levels/exercise-4-multiply-rational-expressions-demo.json
- levels/exercise-4-multiply-rational-expressions.json

Exercises.html links to these files. To make those links work under file://,
where browsers block JavaScript fetch() of neighboring JSON files, Exercises.html
carries a mirrored copy of each JSON payload for transfer into the app. The
standalone JSON files remain in the levels folder for hosting, distribution, and
editing. No exploded-algebra-levels.js file is used.

The conventional-notation panel uses three textbook-style sections separated by
horizontal rules. `instruction` is the brief textbook direction available with
the original expression. `initialKatex` is the conventional form of the starting
expression. The running solution shows completed steps plus the one current step.
Text fields may be one string or an array of strings unless described otherwise.

The original expression remains the first item in `steps` for matching and move
history compatibility, but it is displayed only in the problem-statement section.
Subsequent steps are revealed progressively. A step may include one `guidance`
block, which appears above that step only while it is current. A step may also
include `beforeKatex` and `afterKatex` conventional-display versions. The before
version is shown while the goal is current; the after version replaces it when the
step is complete. If either is omitted, the ordinary `katex` version is used. This
permits a current goal such as `\\frac{?}{6}+\\frac{5}{6}` without changing the
exact exploded `expression` used to recognize the completed step.

Older files remain compatible: `introduction` falls back to `instruction`, and a
step's old `introduction` plus `conclusion` are combined into its single above-step
guidance area. Exercise-wide description fields are no longer used.

The exploded expression is anchored at the upper-left of its workspace. The
idle workspace controls, contextual action choices, and Expression Builder each
use the same compact, bottom-corner keypad footprint; only the controls for the
current state are visible. Each button is opaque, but the control clusters have
no panel background. The conventional steps remain visible above a draggable
horizontal divider and scroll vertically when their chosen height is too small.
The exercise menu also provides plus/minus controls for button size and
conventional-steps font size. The steps panel automatically refits its height
to the rendered expressions when the font size changes.
Undo returns through completed expression states as far as the starting
expression; Ctrl/Cmd+Z provides the same behavior when focus is not in a text
field. Numerical Rewrite shows its exercise-specific permissions as a bulleted
list. Operation display settings, handedness, Reset, and Download Move History
appear in the hamburger options menu rather than in the action or
expression-builder panels.

Each exercise specifies Numerical Rewrite permissions with this structure:

  "numericalRewrite": {
    "addition": "none" | "no-carry" | "flat" | "expression-terms",
    "multiplication": "none" | "one-significant-figure" | "unrestricted",
    "allowNegativeOne": true | false,
    "allowInverses": true | false
  }

`no-carry` permits only flat sums of nonnegative whole-number literals whose
columns do not require carrying. `flat` permits flat whole-number sums with or
without carrying. `expression-terms` permits sums whose terms are any otherwise
allowed numerical expressions. One-significant-figure multiplication checks the
exact value of each factor; unrestricted multiplication permits any factors that
otherwise satisfy the profile. Negative numbers other than the atomic negative
unit are not accepted. An inverse of zero is rejected.
Both the selected expression and its proposed replacement must satisfy the same
profile, and equivalence is checked with exact integer/fraction arithmetic.

Older custom files that contain `arithmeticLevel` instead of `numericalRewrite`
are mapped to a compatible profile when loaded. New move-history downloads retain
the explicit `numericalRewrite` profile.

Introduce Element(s) always offers Add Zero, Multiply by One, and Double Inverse.
Selecting a literal 1 adds a Product of Inverses choice
that replaces 1 with A times inverse(A). Selecting a literal 0 instead adds a
fifth Additive Inverses choice that replaces 0 with A plus negative one times A.
The main Remove Element(s) category retains the existing eraser icon.

Exponents may still appear in conventional-notation KaTeX fields such as
`initialKatex`, `katex`, `beforeKatex`, and `afterKatex`. The corresponding
exploded expression must write each positive whole-number power as repeated
multiplication; for example, conventional `x^2` is exploded as `((x)*(x))`.
There is no exponent node, exponent tool, or exponent input in the exploded
representation. See `EXPONENT_IMPLEMENTATION_ARCHIVE.md` for the archived design.

CUSTOM LEVELS

Choose any compatible JSON file from Exercises.html. The selected JSON is carried
into exploded-algebra.html in the same tab using sessionStorage, with window.name
as a file:// fallback. Refreshing that app tab keeps the selected level. Separate
tabs keep separate level state.

For an interactive level, Download Move History saves the current run as a JSON
file that can later be chosen from the home page.

The home page links to Introduction.html and Exercises.html.

Built-in level URLs now include the selected JSON file in the level query parameter, for example:
  exploded-algebra.html?level=levels%2Flevel-1-distribute-and-combine.json&source=builtin
  exploded-algebra.html?level=levels%2Flevel-1-distribute-and-combine-demo.json&source=builtin
The source=builtin flag only enables the local file:// transfer fallback; the level parameter identifies the actual bundled level.
User-selected JSON files likewise include their filename in the level query parameter, for example:
  exploded-algebra.html?level=my-level.json&source=custom
