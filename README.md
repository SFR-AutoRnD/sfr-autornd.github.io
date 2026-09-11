# SFR-AutoR&D project website

Umbrella site for **SFR-AutoR&D**, the family of autonomous research and
development agents from Salesforce AI Research, and for its two sub-projects:

| Page | URL | What it is |
|---|---|---|
| SFR-AutoR&D | <https://sfr-autornd.github.io/> | Two research directions, the shared research loop, and selected results from both sub-projects. |
| SFR-AutoR&D-Engineer | <https://sfr-autornd.github.io/engineer/> | Engineering goals on real code: pandas, SFR-RL, USearch, hnswlib. |
| SFR-AutoR&D-TrainForge | <https://sfr-autornd.github.io/trainforge/> | Autonomous model training. Copied from Yiran Zhao's `zhaoyiran924/trainforge` repository. |

Static site, no build step:

- `index.html`: the umbrella page. Editorial layout: byline hero with a
  count-up stat strip, a sticky section nav with scroll-spy and a Pages menu,
  two question cards, a dark five-step loop card with a drawn loop line, a
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
- `assets/site.js`: shared sticky-header offsets, section highlighting, and
  automatic demo pausing when a browser tab is hidden.
  Page anchors work without JavaScript, and reduced-motion preferences are
  respected.
- `engineer/index.html`: the engineering research article, using the shared
  stylesheet and navigation script. Includes the narrated demo after the research
  findings, linked from the hero and section navigation. Technical charts
  remain inline SVG.
- `assets/AutoRD_Leadership_Demo_AI_Voiceover_Final_demo.mp4`: the supplied
  three-minute Engineer demo, served as an H.264/AAC MP4 with native playback
  controls. `assets/engineer-demo-poster.jpg` is its opening title frame.
- `trainforge/`: copied from `zhaoyiran924/trainforge` (commit `a37e93f`,
  "Launch public Training Forge research site"), including the 8.3 MB demo
  video. Its presentation now uses the same shared styles and navigation as
  Overview and Engineer. `trainforge/assets/styles.css` contains only the
  research-gate rows, training-program cards, gains chart, and pipeline
  components. Both project pages share their video-player styling and playback
  behavior through `assets/site.css` and `assets/site.js`.
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

## Research source links

The pandas buttons in `engineer/index.html` link to upstream pull requests
in `pandas-dev/pandas`:

- Nullable-dtype reductions: [PR #68422](https://github.com/pandas-dev/pandas/pull/68422)
- String hashing: [PR #68423](https://github.com/pandas-dev/pandas/pull/68423)
- Row-wise reductions: [PR #68424](https://github.com/pandas-dev/pandas/pull/68424)

The interactive research lab links its pandas examples to the same pull requests.

The hnswlib (nmslib/hnswlib#676) and USearch (unum-cloud/USearch#787) buttons
link to their upstream pull requests.
