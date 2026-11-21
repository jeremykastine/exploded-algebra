EXPLODED ALGEBRA - WEBSITE FILES

Open index.html first. The launcher is designed to work both when index.html is
opened directly from disk (file://) and when the folder is hosted by a web
server such as GitHub Pages.

CREATING AND PLAYING LEVELS

Use Exploded Algebra opens Free Play. Build any starting expression and
transform it without restrictions. Share / Download Moves opens one dialog with
Copy Link, Download Moves (.txt), and a checkbox to have the learner build the
starting expression. Sharing is available during building and transformations,
including unfinished entries. Reset starts the same run again.

Links carry ?moves=<recording>&build=1 or build=0. Both versions contain the
entire build and transformation recording. build=0 reconstructs the starting
expression automatically before the learner begins the transformations.
The downloaded text file contains precisely the moves parameter value, with
its build preference included. Guided Replay opens that file, shows its build
preference in a checkbox, and lets the recipient override it before opening.
A build parameter on a link overrides the preference inside its recording.
Older JSON move histories remain importable; new exports use plain text.
The former Problem Editor URL forwards to Free Play.

One line of conventional notation above the exploded expression shows the
current expression, including any live entry. One text line of whitespace
separates the conventional and exploded notation. During a replacement, the
selected part fades progressively behind the new entry in both views.
Guided Replay highlights the next required action. The conventional notation
above the exploded expression is the only notation shown. Free Play remains
editable without a completion requirement. Drag anywhere in the workspace to pan. Tap a part
of the expression to select it, then tap another part to extend the selection.
Generated conventional expressions use ÷ for division and preserve parentheses
around non-leading negative-one factors.
`initialKatex` remains the conventional form of the starting expression in the
level data.

Legacy level files retain their step and notation metadata for matching and
move-history compatibility. Goal notation and connectors are not displayed.

The conventional notation and exploded expression form one group anchored
at the upper-left by default and move together when you drag. A single
six-column by five-row palette is anchored at the lower-right and resizes from
its upper-left corner. Its permanent top row contains Zoom In, Zoom Out, Reset
View, and Undo. The lower four rows contain contextual actions or
the Expression Builder. Before a selection, those action rows show the full
action layout in a quiet, inactive state so learners can see what becomes
available after selecting. A hamburger menu anchored at the upper-right contains
the run and file actions. The palette stays fully inside the visible viewport and remembers the
user's chosen size. It keeps the button arrangement fixed while labels and icons
scale gently. Tap inside the selection or outside the
expression to clear it; guided demonstrations ignore off-target selections and
empty-workspace clicks. Guided selection prompts draw a yellow outline around the entire required
region. Learners can tap values, inverse headers, or operations within that
region in any order until the selection is complete, then follow the tool
button. Taps that would extend beyond the outlined region are ignored. The
recorded moves and shared-link format are unchanged. Completing a Guided Replay
launches colorful confetti bursts, with a quiet, mostly static version when
reduced motion is requested. Reset or Undo clears the celebration.
Each notation row stays non-wrapping, and long expressions remain reachable by
panning the shared workspace. The outer outline leaves 16 pixels around the
expression, independently of internal component spacing and selection buffers.
Bars use a gray gradient with a white center and a continuous midline.
Operations use the default black filled circle with a white symbol at 100% size.
Bars appear only when a sum or product contains a structured child; otherwise
only the operation symbol appears. Appearance settings are no longer exposed.
Undo returns through completed transformations, then reverses Enter to reopen
the starting-expression builder with its entry history and cursor intact.
Further Undo presses remove builder entries. Ctrl/Cmd+Z also works across this
transition and within the builder when focus is not in a text field.
In Guided Replay, Undo navigates backward one learner tap or button press,
including build entry, selection, tool activation, and completed steps. The yellow
outline or highlighted button then guides the learner forward again. Reconstructing the prior
step preserves pan and zoom, adds no Undo event, and leaves the original shared
recording unchanged. Reset clears this navigation history.
Undo is never recorded; Free Play shares only the surviving build inputs and
transformations. The Numerical Manipulation action button is marked with bold
`123`. Guided Replay follows the recorded numerical
replacement entries. Free Play allows unrestricted numerical replacements.
Share / Download Moves saves or copies the current mathematical recording.

Workspace zoom controls remain separate from guided step navigation.
Shared recordings omit view changes, and guided Undo preserves the current view. Initial expression entry and zero-product insertion
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
Enter fills the four leftmost builder rows. Inverse and negative one occupy
the second column; Times and Plus occupy the far-right column. Digits occupy
the middle three columns, with zero below 1-2 and XYZ below 3. The top row
provides view controls and Undo, which acts as Backspace during entry.
Level cycling flattens a lifted sum into an immediately surrounding sum, and
likewise for products, while retaining grouping across unlike operations.
Free Play accepts numerical replacements with the same exact numerical value.
Guided Replay follows the recorded numerical replacement entry.

There is no exponent node, exponent tool, or exponent input in the exploded
representation. See `EXPONENT_IMPLEMENTATION_ARCHIVE.md` for the archived design.

CUSTOM LEVELS

Choose a moves text file with Guided Replay in the workspace menu, or open
a shared link. Each tab keeps its own level state. Undo in Free Play discards
undone actions from the recording. Abandoned builder entries are omitted;
currently active partial entries remain part of the shared recording.

Legacy hosted exercises can still use exploded-algebra.html?level=path/to/exercise.json.
All exercise links open Guided Replay, including old unguided links. Legacy
files must contain guided actions; checkpoints alone cannot be replayed.
A player URL without a recording opens Free Play; mode=free and legacy
mode=creative links also open Free Play. The editor=1 parameter is retired.

COMPACT MOVES FORMAT

moves-codec.js defines permanent button codes and versioned target numbering.
New recordings use version 2; existing version-1 links remain supported.
A file has this form:
2.<build-default-0-or-1>.<action-stream>.<eight-hex-digit-checksum>
The checksum covers the version, build default, and action stream; it detects
accidental damage and truncation, and is not an authentication mechanism.
The payload uses URL-safe ASCII without percent-encoding expansion.

Button characters: 0123456789ABCDEFGHIJKLMNOPQRSTUV.
Digits 0-9 enter digits. A/B/C enter x/y/z; D cycles the XYZ key. E/F enter
sum/product, G enters inverse, H negative one, and I submits the builder.
J-U encode the twelve contextual transformation buttons in the fixed order
listed in ExplodedAlgebraMoves.commands. Do not reorder these command codes.
V extends a position code beyond the ordinary 32-position alphabet.
Undo is represented by retaining the surviving mathematical actions.

Position characters: WXYZabcdefghijklmnopqrstuvwxyz-_.
In version 2, values and operation separators are numbered in expression
reading order; each inverse header is numbered before its input. The actual
click targets and their order are retained, including a single separator click
that selects two adjacent parts. Guided playback prompts each recorded click
with a filled yellow highlight before enabling the next tool.
Version 1 retains its original values-and-inverses-only numbering. Legacy JSON
files without click detail use an equivalent deterministic target sequence.
Commute permutations continue to use expression targets.
Positions 0-31 occupy one character. Positions 32-1023 use V plus two base-32
position characters, allowing larger intermediate expressions without changing
the ordinary one-character representation.

Opening a compact recording reconstructs its mathematical states with the same
builder and transformation engine, with rendering and animation suppressed.
It then starts guided playback at the requested build stage. Conventional
notation, intermediate trees, and numerical rewrite permissions are not stored
in the shared stream. Future engine changes must preserve version-1 behavior
and version-2 behavior or provide an explicit versioned migration.

Post-selection action layout
The lower two rows place combine/separate inverses in column 1, multiplication
commute in row 3 columns 2–3, Numerical Manipulation in row 3 columns 4–5,
left and right distribute/factor pairs in row 4 columns 2–3 and 4–5, and
addition commute in column 6 across rows 3–4. The commute buttons use the
existing operation icons and record commuteTerms or commuteFactors. Guided
problems highlight only the matching operation. Clear a selection by tapping
inside it or outside the expression.
