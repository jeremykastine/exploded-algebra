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
horizontal rules. `instruction` is the brief textbook direction. `initialKatex`
is the conventional form of the starting expression. The running solution shows
completed steps plus the one current step. `exerciseInfo` supplies the exercise-wide
information shown while work is in progress, and `completionMessage` replaces it
when the final step is complete. Text fields may be one string or an array of
strings unless described otherwise.

The original expression remains the first item in `steps` for matching and move
history compatibility, but it is displayed only in the problem-statement section.
Subsequent steps are revealed progressively. A step may include one `guidance`
block, which appears above that step only while it is current. A step may also
include `beforeKatex` and `afterKatex` conventional-display versions. The before
version is shown while the goal is current; the after version replaces it when the
step is complete. If either is omitted, the ordinary `katex` version is used. This
permits a current goal such as `\\frac{?}{6}+\\frac{5}{6}` without changing the
exact exploded `expression` used to recognize the completed step.

Older files remain compatible: `introduction` falls back to `instruction`;
`description` plus `instructions` fall back to `exerciseInfo`; `conclusion` falls
back to `completionMessage`; and a step's old `introduction` plus `conclusion` are
combined into its single above-step guidance area.

The Numerical Rewrite button is the final button in the main tool list. The
description area beneath the action buttons changes when an action is hovered or
focused. Each action has a brief explanation; Numerical Rewrite shows the
current exercise's allowed arithmetic level as part of its explanation. Download
Move History appears only with the textbook steps panel, not in the action or
expression-builder panels.
Introduce Element(s) always offers Add Zero, Multiply by One, Double Inverse, and
Exponent of One. Selecting a literal 1 adds a fifth Product of Inverses choice
that replaces 1 with A times inverse(A). Selecting a literal 0 instead adds a
fifth Additive Inverses choice that replaces 0 with A plus negative one times A.
The main Remove Element(s) category retains the existing eraser icon.

Change Form is not enabled by a level flag. It appears only when the structural
scan of `startExpression` and the exploded expression fields in `steps` finds an
actual `exp` node. Conventional-only exponents in `initialKatex`, `katex`,
`beforeKatex`, or `afterKatex` do not affect the result. Optional exploded
pre/post variants (`beforeExpression`, `afterExpression`,
`beforeExplodedExpression`, `afterExplodedExpression`, or the expression inside
`preCompletion` / `postCompletion`) are included in the scan when present.

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
