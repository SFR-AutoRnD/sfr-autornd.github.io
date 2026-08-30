# AutoResearch — project website

Landing page for **AutoResearch**, the autonomous performance-research agent from
Salesforce AI Research, covering its first three artifacts (hnswlib, pandas, and
SFR-RL).

The site is a single self-contained static page — no build step, no dependencies:

- `index.html` — all content, styles, and figures (charts are inline SVG).

## Publishing

This is a GitHub Pages user/org site (`sfr-autoresearch.github.io`), so it serves
from the repository's **default branch**. Once this content is on the default
branch (or the branch selected under *Settings → Pages*), the site is live at
<https://sfr-autoresearch.github.io>.

## Before it goes live — placeholders to fill in

Search `index.html` for the `MARKETING:` comments:

1. **Pull-request links** — two buttons have `href="XX"`. Replace `XX` with the
   upstream PR URLs for hnswlib and pandas.
2. **Team section** — replace each "Author Name" / "Role" placeholder, and swap
   the placeholder avatar SVG for a real photo, e.g.
   `<img src="assets/authors/<name>.jpg" alt="<Name>">` (create `assets/authors/`).
3. **Acknowledgments** — fill in or delete the placeholder line.
