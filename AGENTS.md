# Project instructions

Before making changes, read the project docs in this order:

## Table of contents

1. [Product specification](docs/PRODUCT_SPEC.md) — goals, supported workflows, and requirements.
2. [Architecture](docs/ARCHITECTURE.md) — source files, build process, and runtime structure.
3. [Card model and content](docs/CARD_MODEL.md) — Markdown format, card relationships, and source data.
4. [Study, checkpoints, and profiles](docs/STUDY_AND_PROFILES.md) — lesson ordering, reviews, progress, and profile storage.
5. [Deployment](docs/DEPLOYMENT.md) — GitHub Pages workflow and hosted app behavior.

Keep responses concise. Avoid filler.

Keep project documentation focused on how the system works today. Do not leave iteration fragments, outdated behavior descriptions, or change-history narratives in project docs.

Keep `terms-to-know.md` as the canonical card source and regenerate `app.html` with `build-app.ps1` after changing app sources or card data. Ensure changes align with `docs/PRODUCT_SPEC.md` and update the directly related documentation when behavior changes.
