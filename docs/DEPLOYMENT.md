# Deployment

## GitHub Pages

The app is published at <https://sgendelsman.github.io/japanese-study-guide/>.

The GitHub Actions workflow at `.github/workflows/pages.yml` runs on pushes to `main` and can also be started manually. It rebuilds `app.html`, copies it to `site/index.html`, and deploys that directory using the GitHub Pages artifact actions. The single HTML page embeds its data, JavaScript, CSS, and local fonts.

On first setup, enable Pages in **Settings → Pages → Build and deployment → Source → GitHub Actions**. GitHub does not allow the workflow's default token to create a Pages site. Once Pages is enabled, the workflow configures the deployment and publishes the artifact. The repository must allow Actions to run.

## Browser behavior

- The same app supports direct file opening and the GitHub Pages repository subpath. Card and view navigation uses URL fragments, which remain shareable under the hosted path.
- Profiles and study progress are stored in browser local storage for the current origin. The hosted site and a local `file:` page have separate browser storage; progress is not automatically shared between them.
- Use the Study → Progress tab to export a profile's progress JSON and import it on another browser or computer. Import replaces progress for the currently selected profile after confirmation.
- To enable Study → Progress → **Sync with Google Drive**, enable the Google Drive API in a Google Cloud project, configure the OAuth consent screen, create an OAuth **Web application** client ID, and add `https://sgendelsman.github.io` as an authorized JavaScript origin. No redirect URI or client secret is used. Add the client ID to `window.JAPANESE_STUDY_GOOGLE_CLIENT_ID` in `app-template.html`, then rebuild and deploy. The client ID is public and must not be treated as a secret. Accounts on an OAuth app in testing mode must be added as test users.
- Google Drive sign-in works on the deployed HTTPS GitHub Pages site, not when `app.html` is opened as a `file:` URL. For local development, serve the page from `http://localhost` or `http://localhost:<port>` and register that exact origin as an additional authorized JavaScript origin.
- Sync stores all profiles in Drive's hidden `appDataFolder` using the `drive.appdata` scope. The file is accessible to this app through its API, not through the normal Drive file list. Sync loads Google's Identity Services library and accesses Google APIs only after the user clicks the sync button; the rest of the app remains usable offline. Access tokens are short-lived and are not persisted. Keep JSON exports as an independent backup, since the app-data folder can be removed by the user or when the app is uninstalled.

## Release flow

1. Update `terms-to-know.md` or the application sources.
2. Build and verify `app.html` locally with `build-app.ps1`.
3. Push the changes to `main`.
4. Confirm that the **Deploy GitHub Pages** Actions run completes and check the published URL.
