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

Each exercise may include a short `instruction` and a `conclusion`. Either field
may be one string or an array of strings. The instruction stays above the original
expression, and the conclusion stays below the move cards. The older
`introduction` field remains compatible as a fallback for `instruction`.
`description` and `instructions` remain valid level metadata but are not displayed
with the move cards.

Move cards are revealed progressively. The original expression, all accomplished
steps, and only the next unaccomplished step are visible. A step may include its
own `introduction` and `conclusion` (one string or an array of strings); these are
shown above and below that card only while it is the current goal. A step may also
include `beforeKatex` and `afterKatex` display versions. The before version is
shown while the goal is current; the after version replaces it when the step is
complete. If either is omitted, the ordinary `katex` version is used. This permits
a current goal such as `\\frac{?}{6}+\\frac{5}{6}` without changing the exact
`expression` used to recognize the completed step. All of these fields are optional.

The Numerical Rewrite button is the final button in the main tool list. The
current exercise's arithmetic-level specification appears directly beneath it.
Insert always offers Add Zero, Multiply by One, Double Inverse, and Exponent of
One. Selecting a literal 1 adds a fifth Inverse Product choice that replaces 1
with A times inverse(A). Selecting a literal 0 instead adds a fifth Additive
Inverses choice that replaces 0 with A plus negative one times A.

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
