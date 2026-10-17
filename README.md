# Japanese Study Guide

An offline, standalone Japanese kanji and vocabulary study app. Open `app.html` in a browser to browse and study the deck; progress is stored in that browser.

## Build

From this directory, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\build-app.ps1"
```

The builder reads `terms-to-know.md` and writes the self-contained `app.html`.

## GitHub Pages

Push to `main` to build and deploy the app. The hosted entry point is:

<https://sgendelsman.github.io/japanese-study-guide/>

See [deployment details](docs/DEPLOYMENT.md).

## Project documentation

- [Product specification](docs/PRODUCT_SPEC.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Card model and content](docs/CARD_MODEL.md)
- [Study, checkpoints, and profiles](docs/STUDY_AND_PROFILES.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Source attributions and licenses](SOURCES.md)
