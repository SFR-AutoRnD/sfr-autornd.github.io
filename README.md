# SFR-AutoR&D project website

Umbrella site for **SFR-AutoR&D**, the family of autonomous research and
development agents from Salesforce AI Research, and for its two sub-projects:

| Page | URL | What it is |
|---|---|---|
| SFR-AutoR&D | <https://sfr-autornd.github.io/> | Mission, shared design (Figure 1 loop), a two-tab summary of the sub-projects, and a placeholder card for future sub-projects. |
| SFR-AutoR&D-Engineer | <https://sfr-autornd.github.io/engineer/> | Engineering goals on real code: pandas, SFR-RL, USearch, hnswlib. |
| SFR-AutoR&D-TrainForge | <https://sfr-autornd.github.io/trainforge/> | Autonomous model training. Copied from Yiran Zhao's `zhaoyiran924/trainforge` repository. |

Static site, no build step:

- `index.html`: the umbrella page. Editorial layout: byline hero with a
  count-up stat strip, a sticky section nav with scroll-spy and a Pages menu,
  three question cards, a dark five-step loop card with a drawn loop line, a
  sub-project switcher (hover, click, or arrow keys; `#engineer` /
  `#trainforge` deep links) with animated bar charts, an editorial
  "In practice" section, and a Team band with the four authors. All styles live in `assets/site.css`; the behaviour is one inline
  script at the end of the page. Without JavaScript every section and both
  switcher panels are visible; only the motion and the scroll-spy are lost.
  `prefers-reduced-motion` turns the animations off.
- `assets/site.css`: the shared design system for all three pages, including
  the Salesforce blue and navy palette, DM Sans headings and body text,
  navigation, article heroes, buttons, author portraits, and footers.
  Change shared styles here so the project pages stay consistent.
- `assets/site.js`: shared sticky-header offsets and section highlighting.
  Page anchors work without JavaScript, and reduced-motion preferences are
  respected.
- `engineer/index.html`: the engineering research article, using the shared
  stylesheet and navigation script. Technical charts remain inline SVG.
- `trainforge/`: copied from `zhaoyiran924/trainforge` (commit `a37e93f`,
  "Launch public Training Forge research site"), including the 8.3 MB demo
  video. Its presentation now uses the same shared styles and navigation as
  Overview and Engineer. `trainforge/assets/styles.css` contains only the
  research-gate rows, training-program cards, gains chart, pipeline, and video
  components. `trainforge/assets/site.js` pauses the demo in a background tab.
  When syncing upstream research content, preserve this shared presentation
  instead of replacing the page and stylesheet wholesale.
- `assets/salesforce.svg`: Salesforce logo used in the nav, hero, footer, and favicon.
- `assets/mascot.png`: the Astro, Codey and Einstein illustration shown beside
  the SFR-AutoR&D title on the umbrella page (transparent PNG, 1774 by 887).

All links between the three pages are relative, so the site works at any
host name and from a local checkout.

Author links point to each author's personal website (shreypandit.github.io,
nxphi47.github.io, zhaoyiran924.github.io, raihanjoty.github.io). All three pages
use the local portraits in `trainforge/assets/`, with an initials fallback if
a photo fails to load.

## Local preview

From the repository root, run:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

Open <http://localhost:8000/>, <http://localhost:8000/engineer/>, and
<http://localhost:8000/trainforge/>. For a remote checkout, forward port 8000
to your computer. This is a preview only; starting it does not publish changes.

## Publishing

This is the GitHub Pages user site of the `SFR-AutoRnD` organization (repository
`sfr-autornd.github.io`), served from the **default branch** at the repository
root. GitHub does not redirect the old `sfr-autoresearch.github.io` address
after an organization rename, so external links should point at the new host.
The old address is kept alive by a one-page redirect site in the re-created
`SFR-Autoresearch` organization (repository `sfr-autoresearch.github.io`),
which forwards every page here and maps old section links to `/engineer/`.

## Placeholders still to fill in


Search `engineer/index.html` for the `MARKETING:` comments:

1. **Pull-request links**: the three buttons on the pandas card
   (nullable-dtype reductions, string hashing, row-wise reductions) still
   have `href="XX"`; replace each with the upstream PR URL. The hnswlib
   (nmslib/hnswlib#676) and USearch (unum-cloud/USearch#787) buttons are
   already linked.
2. Optionally add a "Corresponding author" line under the affiliation.
