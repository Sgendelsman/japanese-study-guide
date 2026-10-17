# Architecture

## Runtime

`app.html` is the self-contained distribution artifact. It embeds card-source JSON, CSS, local font subsets, and the concatenated application scripts. It can be opened directly from disk.

The runtime has three main views:

- Browse parses and merges the Markdown deck, builds search and category filters, renders card details, and provides links between related cards.
- Study renders checkpointed lessons, spaced reviews, daily due counts, and profile-specific progress.
- Conjugation Guide renders the learner-oriented form descriptions documented in the deck source and links to external grammar references.

Card links and view state are represented by URL fragments. The app does not require a server, framework, package installation, or remote service.

## Source files

| File | Responsibility |
|---|---|
| `terms-to-know.md` | Canonical card, reading, meaning, conjugation, and guide content. |
| `app-template.html` | HTML shell and runtime mount points. |
| `app.css` | Application layout and component styles. |
| `font-faces.css` and `fonts/` | Local Noto Sans JP font subsets and license. |
| `app.js` | Markdown parser, card model, conjugation-reading derivation, display helpers, and browser navigation. |
| `app-study.js` | Lesson checkpoints, review scheduling, progress UI, and profile controls. |
| `build-app.ps1` | Embeds the local font files and source data, combines the scripts, and writes `app.html`. |
| `app.html` | Generated offline application. |

## Build

Run from this directory:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\build-app.ps1"
```

The script reads its default inputs relative to its own location and writes `app.html` in this directory. The generated HTML should be rebuilt after changing Markdown, runtime scripts, styles, template, or fonts.

## GitHub Pages

`.github/workflows/pages.yml` builds the standalone app on pushes to `main` and manual dispatch. It publishes the generated HTML as `index.html` in the Pages artifact, so no runtime assets or root-path assumptions are needed. See [Deployment](DEPLOYMENT.md) for the hosted URL and browser storage behavior.

## Browser persistence

Profiles and their card-progress maps are stored together in the `japanese-study-profiles-v1` local-storage entry. Profile IDs are internal identifiers; a profile name is its user-facing identity. See [Study, checkpoints, and profiles](STUDY_AND_PROFILES.md) for the progress record and scheduling behavior.
