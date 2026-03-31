# SCRIPTS — Deployment & Admin Tooling

## OVERVIEW

Node.js scripts for deployment, data migration, admin tasks, and Firebase setup. Run via `npm run <script>`.

## KEY SCRIPTS

| Script                        | Purpose                            | npm command                        |
| ----------------------------- | ---------------------------------- | ---------------------------------- |
| `pre-deployment-check.js`     | Validates env, build readiness     | `npm run pre-deploy-check`         |
| `update-version.js`           | Version bump before prod build     | (called by `build:prod`)           |
| `generate-sitemap.js`         | Static sitemap generation          | `npm run generate-sitemap`         |
| `generate-dynamic-sitemap.js` | Dynamic sitemap with board posts   | `npm run generate-sitemap:dynamic` |
| `post-deploy-cache-bust.js`   | Cache invalidation after deploy    | (called by `deploy`)               |
| `setup-firebase.js`           | Interactive Firebase project setup | `npm run setup-firebase`           |
| `add-sample-data.js`          | Seed sample data                   | `npm run add-sample-data`          |
| `sync-algolia.js`             | Sync Firestore → Algolia           | `npm run sync-algolia`             |
| `check-admin-user.js`         | Verify admin user exists           | `npm run check-admin-user`         |
| `create-test-users.js`        | Create test user accounts          | `npm run create-test-users`        |
| `generate-pwa-icons.js`       | Generate PWA icons via Sharp       | `npm run generate-pwa-icons`       |

## CONVENTIONS

- All scripts are ES modules (`"type": "module"` in package.json)
- Node.js globals available (not browser)
- Firebase Admin SDK used (not client SDK)
- Import from `firebase-admin` for server-side operations

## ANTI-PATTERNS

- No browser APIs (window, document)
- No Vite/client Firebase config — use Admin SDK
- Scripts are one-shot — no long-running processes

## NOTES

- `check-uid.js` at root is a standalone utility
- Scripts use `firebase-admin` which requires service account credentials
- PWA icon generation requires `sharp` package
