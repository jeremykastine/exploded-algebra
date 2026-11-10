# Exploded Algebra repository instructions

Whenever a change affects any part of the Exploded Algebra app, update every
`.page-last-updated` marker in every HTML file in the same commit. Use one shared
current date and time in the `America/New_York` time zone, include `EDT` or `EST`
in the visible text, and update each `<time>` element's machine-readable
`datetime` value. Keep the markers synchronized across all HTML entry points.

## Introduction and read-aloud version

Treat `Introduction.html` and `Introduction-read-aloud.html` as a pair. When a
request changes the content of either page, apply the corresponding change to the
other page in the same commit, regardless of which page the request names.

Keep the read-aloud version as static, text-only HTML. Match the introduction’s
prose, headings, section order, captions, and links. Use the corresponding
accessibility descriptions in place of formulas and diagrams, and update those
descriptions when the examples change. Compare the affected sections in both
files before committing.
