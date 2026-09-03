# AutoR&D — project website

Landing page for **AutoR&D**, the autonomous performance-research agent from
Salesforce AI Research, covering its first three artifacts (hnswlib, pandas, and
SFR-RL).

Static site, no build step:

- `index.html` — all content, styles, and figures (charts are inline SVG).
- `assets/salesforce.svg` — Salesforce logo used in the hero, footer, and favicon.

Author links and photos point to each author's personal website
(shreypandit.github.io, nxphi47.github.io, zhaoyiran924.github.io,
raihanjoty.github.io), with an initials fallback if a photo fails to load.

## Publishing

This is a GitHub Pages user/org site (`sfr-autoresearch.github.io`), so it serves
from the repository's **default branch**. Once this content is on the default
branch (or the branch selected under *Settings → Pages*), the site is live at
<https://sfr-autoresearch.github.io>.

## Before it goes live — placeholders to fill in

Search `index.html` for the `MARKETING:` comments:

1. **Pull-request links** — five buttons have `href="XX"`: three on the
   pandas card (nullable-dtype reductions, string hashing, row-wise
   reductions), one on the USearch card, one on the hnswlib card. Replace
   each `XX` with the corresponding upstream PR URL.
2. Optionally add a "Corresponding author" line under the affiliation.
