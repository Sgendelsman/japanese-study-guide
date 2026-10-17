# Deployment

## GitHub Pages

The app is published at <https://sgendelsman.github.io/japanese-study-guide/>.

The GitHub Actions workflow at `.github/workflows/pages.yml` runs on pushes to `main` and can also be started manually. It rebuilds `app.html`, copies it to `site/index.html`, and deploys that directory using the GitHub Pages artifact actions. The single HTML page embeds its data, JavaScript, CSS, and local fonts.

The workflow enables GitHub Pages for the repository when needed, configures GitHub Actions as its deployment source, and deploys the artifact. The repository must allow Actions to run.

## Browser behavior

- The same app supports direct file opening and the GitHub Pages repository subpath. Card and view navigation uses URL fragments, which remain shareable under the hosted path.
- Profiles and study progress are stored in browser local storage for the current origin. The hosted site and a local `file:` page have separate browser storage; progress is not automatically shared between them.
- The app makes no remote requests for its core functionality. Links in the source-attribution section open external reference sites when selected.

## Release flow

1. Update `terms-to-know.md` or the application sources.
2. Build and verify `app.html` locally with `build-app.ps1`.
3. Push the changes to `main`.
4. Confirm that the **Deploy GitHub Pages** Actions run completes and check the published URL.
