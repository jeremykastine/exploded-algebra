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
no panel background. Clear Selection appears only with the post-selection
actions and is blocked in guided demonstrations, where off-target selections
and empty-workspace clicks are ignored. The conventional steps remain visible
above a draggable horizontal divider and scroll vertically when their chosen
height is too small.
The settings screen replaces the exploded-expression workspace while open. It
provides plus/minus controls for button size and conventional-steps font size.
The steps panel automatically refits its height to the rendered expressions
when the font size changes.
Undo returns through completed expression and workspace-zoom states as far as
the starting expression; Ctrl/Cmd+Z provides the same behavior when focus is not
in a text field. Numerical Rewrite shows its exercise-specific permissions as a
bulleted list, and its action button is marked with bold `123`. Operation display
settings, handedness, Reset, and Download Move History
appear on the settings screen rather than in the action or expression-builder
panels. Handedness reflects each button layout, while the numeric Expression
Builder keypad moves as a single block so its internal order remains familiar.

Workspace zoom-in, zoom-out, and 100% reset actions are included in Undo and in
downloaded move histories. In Expression Builder, the original and proposed
expressions use the same blue shading as an initial selection.

Each exercise specifies Numerical Rewrite permissions with this structure:

  "numericalRewrite": {
    "rules": {
      "nonnegativeArithmetic": { "forward": "automatic" | "manual", "reverse": "manual" },
      "signedArithmetic": { "forward": "automatic" | "manual" | "not-allowed", "reverse": "manual" | "not-allowed" },
      "nonnegativeFractionSimplification": { "forward": "automatic" | "manual" | "not-allowed", "reverse": "manual" | "not-allowed" },
      "signedFractionSimplification": { "forward": "automatic" | "manual" | "not-allowed", "reverse": "manual" | "not-allowed" },
      "inverseOne": { "forward": "automatic" | "manual", "reverse": "manual" },
      "inverseNegativeOne": { "forward": "automatic" | "manual", "reverse": "manual" },
      "doubleNegative": { "forward": "automatic" | "manual", "reverse": "manual" }
    }
  }

Nonnegative whole-number addition and multiplication share one permission and
have no carrying or
significant-figure restrictions. Any narrower expectations belong in the
exercise's recorded steps rather than its numerical-manipulation permissions.
They are always available: their forward direction may be Automatic or Manual,
and their reverse direction is always Manual.
Signed number addition and multiplication share one permission. Signed
arithmetic is flat and represents negative numbers with negative-one factors.
The four arithmetic and fraction categories are mutually exclusive:
nonnegative addition or multiplication, signed addition or multiplication,
nonnegative integer-over-integer fractions, and signed integer-over-integer
fractions containing a negative-one factor in the numerator or denominator.
Fraction simplification produces the
canonical reduced integer or fraction, removing the inverse when the result is
an integer. Reverse Manual may expand an integer or reduced fraction into an
equivalent structure in its enabled fraction category. Forward Automatic
evaluates to a canonical exact integer or fraction; Forward Manual opens the
Expression Builder; Not allowed disables that direction. Reverse is never
automatic. Manual rewrites must be exactly equivalent and match the enabled
category and direction.

`(-1)(-1) ↔ 1`, `inverse(1) ↔ 1`, and `inverse(-1) ↔ -1` also appear as full
permission entries in Exercise Builder Phase 1. Long-holding Numerical
Manipulation in the player displays all current direction settings.

Older custom files that contain separate addition and multiplication rules,
`arithmeticLevel`, a previous broad `numericalRewrite` profile, the seven-rule
granular profile, or the five-rule profile are mapped to the current combined
rules when loaded. If an older file assigns different permissions to addition
and multiplication, migration keeps the more restrictive choice. New
move-history downloads retain the explicit rule matrix.

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
file that can later be chosen from the home page. Undo is retained as an explicit
move: the attempted forward steps remain in the history, and guided playback
requires the learner to undo at the same point before continuing along the
recorded path. Exercise Builder authors can instead exclude undos, which removes
the abandoned branch from the saved path. Zoom in, zoom out, and zoom reset are
view-only controls and are never retained as solution moves.

The home page links to Introduction.html and Exercises.html.
It also links to exercise-builder.html, a four-phase authoring application that
uses the real Exploded Algebra player in an embedded authoring session. Builder
drafts autosave in localStorage. Completed levels export with formatVersion 1,
the existing steps/demo/recordedActions structures, editable KaTeX checkpoints,
and enough information for High, Medium, and Low assistance. During Phase 3,
every completed expression-changing manipulation is automatically saved as a
major step. Phase 4 displays every saved step and lets the author delete unwanted
intermediate steps before export. Test Level passes
the current draft to the ordinary player through a short-lived local-storage key
with a window.name fallback, so no JSON file needs to be installed first.

Built-in level URLs include the selected JSON file in the level query parameter.
Every level accepts assistance=medium or assistance=low, and a level that contains
guided steps also accepts assistance=high, for example:
  exploded-algebra.html?level=levels%2Flevel-1-distribute-and-combine-demo.json&source=builtin&assistance=high
  exploded-algebra.html?level=levels%2Flevel-1-distribute-and-combine-demo.json&source=builtin&assistance=medium
  exploded-algebra.html?level=levels%2Flevel-1-distribute-and-combine-demo.json&source=builtin&assistance=low
High assistance follows the recorded guided moves. Medium assistance progressively
reveals the conventional solution steps without controlling the learner's moves.
Low assistance shows the original problem and final target while hiding all
intermediate conventional steps. Completion is checked directly against the final
expression, so the learner may use a different valid sequence of moves.
If assistance is absent or invalid, the learner is asked to choose, with Medium
highlighted by default. High is hidden for exercises without recorded guidance.
Legacy mode=guided, mode=unguided, and mode=final-only URLs remain supported.
The source=builtin flag only enables the local file:// transfer fallback; the level parameter identifies the actual bundled level.
User-selected JSON files likewise include their filename in the level query parameter, for example:
  exploded-algebra.html?level=my-level.json&source=custom
