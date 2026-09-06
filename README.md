# SFR-AutoR&D project website

Umbrella site for **SFR-AutoR&D**, the family of autonomous research and
development agents from Salesforce AI Research, and for its two sub-projects:

| Page | URL | What it is |
|---|---|---|
| SFR-AutoR&D | <https://sfr-autornd.github.io/> | Mission, shared design (Figure 1 loop), a two-tab summary of the sub-projects, and a placeholder card for future sub-projects. |
| SFR-AutoR&D-Engineer | <https://sfr-autornd.github.io/engineer/> | Performance research on real code: pandas, SFR-RL, USearch, hnswlib. |
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
- `engineer/index.html`: self-contained (inline styles and inline SVG charts).
  Its `<style>` block is mirrored verbatim at the top of `assets/site.css`
  (everything above the "site nav" marker); keep the two in sync when the
  design system changes. The umbrella components follow below that marker.
- `trainforge/`: copied from `zhaoyiran924/trainforge` (commit `a37e93f`,
  "Launch public Training Forge research site"), including the 8.3 MB demo
  video. Edits on top of the copy: title, brand, branch band and footer renamed
  to SFR-AutoR&D-TrainForge; header links to `../` and `../engineer/` (class
  `family-link`, styled in `assets/styles.css`); em-dashes removed from the copy.
  To resync, re-copy `index.html` and `assets/` from the source repo and
  re-apply those edits.
- `assets/salesforce.svg`: Salesforce logo used in the nav, hero, footer, and favicon.
- `assets/mascot.png`: the Astro, Codey and Einstein illustration shown beside
  the SFR-AutoR&D title on the umbrella page (transparent PNG, 1774 by 887).

All links between the three pages are relative, so the site works at any
host name and from a local checkout.

Author links and photos on the umbrella and Engineer pages point to each
author's personal website (shreypandit.github.io, nxphi47.github.io,
zhaoyiran924.github.io, raihanjoty.github.io), with an initials fallback if a
photo fails to load. The TrainForge page ships its own author photos.

## Publishing

This is the GitHub Pages user site of the `SFR-AutoRnD` organization (repository
`sfr-autornd.github.io`), served from the **default branch** at the repository
root. GitHub does not redirect the old `sfr-autoresearch.github.io` address
after an organization rename, so external links should point at the new host.

## Placeholders still to fill in


Search `engineer/index.html` for the `MARKETING:` comments:

1. **Pull-request links**: the three buttons on the pandas card
   (nullable-dtype reductions, string hashing, row-wise reductions) still
   have `href="XX"`; replace each with the upstream PR URL. The hnswlib
   (nmslib/hnswlib#676) and USearch (unum-cloud/USearch#787) buttons are
   already linked.
2. Optionally add a "Corresponding author" line under the affiliation.
