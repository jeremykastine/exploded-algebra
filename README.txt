EXPLODED ALGEBRA - WEBSITE FILES

Open index.html first. The launcher is designed to work both when index.html is
opened directly from disk (file://) and when the folder is hosted by a web
server such as GitHub Pages.

BUILT-IN EXERCISES

The built-in exercises are ordinary JSON files in the levels folder:

- levels/rewrite-and-simplify-negative-6-plus-4.json
- levels/multiply-binomials-and-combine-like-terms.json
- levels/add-rational-expressions-with-unlike-denominators.json

Exercises.html links to these files in learning order, from foundational to
advanced. Insert each new exercise at its appropriate point in the list.
To make those links work under file://,
where browsers block JavaScript fetch() of neighboring JSON files, Exercises.html
carries a mirrored copy of each JSON payload for transfer into the app. The
standalone JSON files remain in the levels folder for hosting, distribution, and
editing. No exploded-algebra-levels.js file is used.

INTRODUCTION AUDIENCE AND GUIDED EXAMPLES

Introduction.html is currently written for mathematics teachers. Take familiar
ideas slowly to explain the representation and its purpose; keep conventional
notation out of the opening discussion until the explicit comparison section.
The introduction-only examples are in intro-levels, separate from the student
exercise list. Sections on convenient factors, repeated factors, and distribution
each link to direct and rearranged guided routes from the same starting expression.
Preserve showConventionalSteps: false, includeUndoActions: false, and the complete
all-manual numericalRewrite rules from evaluate-sum-then-product.json. Links must
use mode=guided; the completion controls offer an Unguided repeat afterward.

The conventional-notation panel uses three textbook-style sections separated by
horizontal rules. `initialKatex` is the conventional form of the starting
expression. The running solution shows completed steps plus the one current step.
The pre-selection Exercise Guidance view includes the problem statement and the
exercise's numerical-manipulation restrictions. New Problem Builder exports
store the complete, author-editable view in the top-level `exerciseGuidance`
field and set `exerciseGuidanceIsComplete` so the player does not duplicate its
prefilled sections. Older files still receive the automatic sections and may use
`exerciseGuidance` for additional author guidance.

The original expression remains the first item in `steps` for matching and move
history compatibility, but it is displayed only in the problem-statement section.
Subsequent steps are revealed progressively without individual step guidance. A
step may include `beforeKatex` and `afterKatex` conventional-display versions. The before
version is shown while the goal is current; the after version replaces it when the
step is complete. If either is omitted, the ordinary `katex` version is used. This
permits a current goal such as `\\frac{?}{6}+\\frac{5}{6}` without changing the
exact exploded `expression` used to recognize the completed step. If the current
expression matches a later recorded step, intervening steps are marked skipped
with an amber skip icon, the matched step receives a green check, and the next step
is revealed. Undo restores the prior step statuses.

Older files remain compatible: `introduction` falls back to `instruction` in the
problem-statement portion of Exercise Guidance. Legacy per-step guidance fields
remain loadable but are no longer displayed.

The exploded expression is anchored at the upper-left of its workspace. The
idle workspace controls, contextual action choices, and Expression Builder each
use the same compact, bottom-corner keypad footprint; only the controls for the
current state are visible. Each button is opaque, but the control clusters have
no panel background. Tap inside the selection or outside the expression to
clear it; guided demonstrations ignore off-target selections and empty-workspace
clicks. The conventional steps remain visible
above the controls and scroll vertically. Their Large, Medium, or Small text
preference is responsive rather than a fixed pixel size: it refits after
content, panel, viewport, device-input, and orientation changes without wrapping
a step. In student portrait mode and in landscape, the steps panel snaps to
exactly its bottom two rows and follows the current work at the bottom whenever
its content changes.
The settings screen replaces the exploded-expression workspace while open. It
provides a control for the responsive conventional-steps text preference and
an independent Child Alignment switch. Centered is the default. Center / Right
keeps factors vertically centered in products and right-aligns terms in sums.
Bottom / Right bottom-aligns factors and right-aligns terms. Four independent
operation controls determine the appearance of sums and products. Bar Shape
cycles through Thick, Endpoints, Ellipse, Flared, Midline, Nested ( ), Nested +
Ops, and Outward ( ). Bar Shading offers solid black, gray, and light gray, plus
three gradients with the corresponding color at each end and a white center
matching the visible operation symbol's width.
Operation Style chooses a bare black symbol, a black outlined circle containing
a black symbol, or a black filled circle containing a white symbol. Operation
Size scales the chosen symbol and circle to 100%, 75%, or 50% of the reserved
operation width. Bars appear only when a sum or product contains a structured
child; otherwise only the operation symbol appears.
Undo returns through completed expression and workspace-zoom states as far as
the starting expression; Ctrl/Cmd+Z provides the same behavior when focus is not
in a text field. The Exercise Guidance pre-selection button shows numerical
permissions as a two-level bulleted list. The Numerical Manipulation action button
is marked with bold `123`. Operation display
settings, Reset, and Download Move History appear on the settings screen rather
than in the action or expression-builder panels.

Workspace zoom-in, zoom-out, and 100% reset actions are included in Undo and in
downloaded move histories. Initial expression entry and zero-product insertion
use the existing entry canvas and original-expression Peek control.
Manual Numerical Manipulation keeps the complete expression visible, with the
surrounding content at its usual intensity and only the selected original gray.
Blue selection shading is a foreground overlay throughout the program,
including rewrite previews and introductory diagrams. One shared 25% alpha
tints symbols, operations and inverse backgrounds evenly; overlapping blue
regions do not apply the tint twice, and pointer interactions pass through.
The usual blue selection shading remains around the selected range. The old
selection starts at 28% opacity; each symbol entered halves its remaining
opacity (14%, 7%, 3.5%, and so on). Each digit, variable, or operation counts;
negative one and inverse each count as one entry. Regrouping, view controls and
redraws do not count. Undo restores the fading of the surviving entry.
The replacement appears in black directly over the old content, which remains
visible behind it wherever the new ink does not obscure it. There is no
diagonal area, arrow, or entry outline. The child region uses the larger width
and height of the original and replacement, including padding, so neither can
overlap surrounding content. This temporary display tree never enters the
expression or move history. Submit validates and substitutes the replacement as before; cancel
restores the original.
Introducing A times inverse(A) in place of 1 and A plus (-A) in place of 0 uses
the same overlay, blue shading, and fading. Before entry, the selected 1 or 0
remains gray in its original position, with no pair or change to the surrounding
layout. As soon as A has an entered symbol, both copies appear together at the
selected location, updating together as A grows. Sizing accommodates the entire
pair and original value; fading counts only symbols entered in A, rather than
the automatically generated copy, inverse, or negative factor. Undoing all entry
returns to the original layout. Submission and nonzero-inverse validation remain
unchanged.
Addition and multiplication are always entered explicitly. Their first press
places the pending operation at its lowest available level; repeated presses of
that same button, before the next value is entered, cycle it through the higher
levels and back to the lowest. The former Move Up button's grid cell remains
blank. Values, x, negative one, and inverses never insert an operation
implicitly.
The rightmost Builder column contains a double-height multiplication button
above a double-height addition button. The three-column number pad sits
immediately to its left, with negative one, zero, and Inverse across its bottom
row. The next column to the left contains x, Backspace, and a double-height
Submit button; the leftmost column retains Peek and the view controls. Level
cycling flattens a lifted sum into an immediately surrounding sum, and likewise
for products, while retaining meaningful grouping across unlike operations.

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
permission entries in Problem Builder Phase 1. Exercise Guidance in the player
displays all current direction settings.

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
recorded path. Problem Builder authors can instead exclude undos, which removes
the abandoned branch from the saved path. Zoom in, zoom out, and zoom reset are
view-only controls and are never retained as solution moves.

The home page links to Introduction.html and Exercises.html.
The introduction keeps its source examples invisible until the narrative is
ready, while retaining their geometry for rendering. Canceled or inactive
animation runs cannot restore an older frame. Conventional-panel font fitting,
height, and scroll correction settle together before painting; the deliberate
new-step scroll-to-top and two-second scrolling animation remain unchanged.
It also links to problem-builder.html, an authoring application with four or five phases that
uses the real Exploded Algebra player in an embedded authoring session. Completed
levels export with formatVersion 1,
the existing steps/demo/recordedActions structures, editable KaTeX checkpoints,
and enough information for Guided and Unguided modes. During Phase 3,
every completed expression-changing manipulation is automatically saved as a
major step. Phase 4 first chooses which recorded steps to show, then edits only
their pre- and post-completion notation. Phase 5 provides one field prefilled with
the problem statement and numerical restrictions, with View and Edit modes for
reviewing or changing the complete student-facing guidance. Phase 1 defaults to
showing conventional steps. Choosing Hide conventional steps exports
showConventionalSteps: false, skips Phase 4, and removes the entire conventional
steps panel from the student layout in both orientations. Recorded actions remain
available for Guided mode. Existing levels without this setting still show steps.
All Done passes
the current draft to the ordinary player through a short-lived local-storage key
with a window.name fallback, so no JSON file needs to be installed first.

Built-in level URLs include the selected JSON file in the level query parameter.
Every level accepts mode=unguided, and a level that contains recorded guided steps
also accepts mode=guided, for example:
  exploded-algebra.html?level=levels%2Flevel-1-distribute-and-combine-demo.json&source=builtin&mode=guided
  exploded-algebra.html?level=levels%2Flevel-1-distribute-and-combine-demo.json&source=builtin&mode=unguided
Guided follows the recorded action sequence. Unguided progressively reveals the
conventional solution steps without controlling the learner's moves. If mode is
absent or invalid, the learner is asked to choose Guided or Unguided. Guided is
hidden for exercises without recorded guidance. Older assistance=high and
assistance=medium URLs map to Guided and Unguided respectively; Low/final-only is
no longer supported. Reset Exercise clears either query convention and returns to
the Guided/Unguided choice.
The source=builtin flag only enables the local file:// transfer fallback; the level parameter identifies the actual bundled level.
User-selected JSON files likewise include their filename in the level query parameter, for example:
  exploded-algebra.html?level=my-level.json&source=custom

Post-selection action layout
The lower two rows place combine/separate inverses in column 1, multiplication
commute in row 3 columns 2–3, Numerical Manipulation in row 3 columns 4–5,
left and right distribute/factor pairs in row 4 columns 2–3 and 4–5, and
addition commute in column 6 across rows 3–4. The commute buttons use the
existing operation icons and record commuteTerms or commuteFactors. Guided
problems highlight only the matching operation. Clear a selection by tapping
inside it or outside the expression.
