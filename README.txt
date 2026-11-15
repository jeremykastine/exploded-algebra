EXPLODED ALGEBRA - WEBSITE FILES

Open index.html first. The launcher is designed to work both when index.html is
opened directly from disk (file://) and when the folder is hosted by a web
server such as GitHub Pages.

CREATING AND PLAYING LEVELS

In Creative Mode, build a starting expression and transform it. The workspace
menu downloads the moves and opens either a guided player or the Problem Editor.
The player menu opens a copy in the editor. The editor can open the edited copy
in the player and download it as a level JSON file. Exercises.html also opens
a downloaded file.

Conventional notation appears as an unboxed stack immediately above the exploded
expression. A Transform heading introduces the current expression followed by
into on the second line and the next target on the third. Replace uses the
selected expression followed by with and the live replacement on the third
line. You transformed uses the original and completed expressions in the same
layout. The expression stays editable after completion. The stack shares the
workspace pan and zoom.
`initialKatex` remains the conventional form of the starting expression in the
level data.
Exercise Guidance includes the problem statement and numerical rewrite mode. New Problem Builder exports
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

The conventional notation stack and exploded expression form one group anchored
at the upper-left by default; the Pan tool moves them together. A single
six-column by five-row palette is anchored at the lower-right and resizes from
its upper-left corner. Its permanent top row contains Zoom In, Zoom Out, Reset
View, Pan, Select, and Undo. The lower four rows contain contextual actions or
the Expression Builder. Before a selection, those action rows show the full
action layout in a quiet, inactive state so learners can see what becomes
available after selecting. A hamburger menu anchored at the upper-right contains
Settings and Exercise Guidance. The palette stays fully inside the visible viewport
and remembers the user's chosen size. It keeps the button arrangement fixed
while labels and icons scale gently. Tap inside the selection or outside the
expression to clear it; guided demonstrations ignore off-target selections and
empty-workspace clicks. Each notation row stays non-wrapping, and long expressions remain reachable by
panning the shared workspace.
The settings screen replaces the exploded-expression workspace while open.
Four independent operation controls determine the appearance of sums and
products. Bar Shape
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
settings appear on the settings screen. Restart Problem, Download Moves, and
Close Problem are available in the workspace menu.

Workspace zoom-in, zoom-out, and 100% reset actions are included in Undo and in
downloaded move histories. Initial expression entry and zero-product insertion
use the shared expression entry canvas.
Manual Numerical Manipulation keeps the complete expression visible, with the
surrounding content at its usual intensity and only the selected original gray.
Opening a replacement editor preserves the expression's footprint. An empty or
smaller replacement adds no layout padding; width and height grow independently
only when the replacement exceeds the original in that dimension. Selection tint
keeps its visual buffer outside the layout footprint. Partial selections remain
parts of their enclosing sum or product rather than new nested operations.
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
levels and back to the lowest. Values, x, negative one, and inverses never
insert an operation implicitly.
Inverse and negative one occupy two rows each in the leftmost column.
Times and Plus occupy two rows each beside them. The number pad sits in the
middle, with a single zero key under 1, 2, and 3. Variable x and Submit
occupy two rows each on the right. The top workspace row provides the view controls and Undo, which
acts as Backspace during entry. Level cycling flattens a lifted sum into an
immediately surrounding sum, and likewise for products, while retaining
meaningful grouping across unlike operations.

Free Numerical Rewrites accepts any different expression of the same exact
numerical value. Only Prescribed Numerical Rewrites offers the replacements
recorded for the selected expression. Add `rewrites=prescribed` to the player URL
to use choices. The default is free rewrites, and the downloaded level JSON can
be used with either setting.

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

Choose a compatible JSON file from Exercises.html, or move between Creative Mode,
the player and the Problem Editor using their menus. Each tab keeps its own level
state. The player’s Edit a Copy opens the authored level in a separate editor tab.

Move histories keep the inputs used to build the starting expression and the
completed transformations. Undo discards the undone actions from the recording.
The editor keeps the starting and final expressions and lets you choose
intermediate checkpoints, edit conventional notation, and add student guidance.
Open in Player starts a guided build-first replay. Download Level saves the edited
exercise JSON.

Guided mode highlights the recorded steps. Unguided mode accepts the learner’s
own steps and is the default for uploaded levels. Restart Problem in the player
lets the learner choose Guided mode and build-first independently.

Post-selection action layout
The lower two rows place combine/separate inverses in column 1, multiplication
commute in row 3 columns 2–3, Numerical Manipulation in row 3 columns 4–5,
left and right distribute/factor pairs in row 4 columns 2–3 and 4–5, and
addition commute in column 6 across rows 3–4. The commute buttons use the
existing operation icons and record commuteTerms or commuteFactors. Guided
problems highlight only the matching operation. Clear a selection by tapping
inside it or outside the expression.
