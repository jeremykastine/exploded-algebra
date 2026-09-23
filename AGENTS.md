# Exploded Algebra repository instructions

Whenever a change affects any part of the Exploded Algebra app, update every
`.page-last-updated` marker in every HTML file in the same commit. Use one shared
current date and time in the `America/New_York` time zone, include `EDT` or `EST`
in the visible text, and update each `<time>` element's machine-readable
`datetime` value. Keep the markers synchronized across all HTML entry points.
