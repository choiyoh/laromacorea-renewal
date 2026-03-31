# PROJECT KNOWLEDGE BASE

**Generated:** 2026-03-31
**Branch:** main
**Project:** La Roma Corea — AS Roma Korean Fan Community Platform

## OVERVIEW

Vue 3 SPA (Composition API) with Vuetify 3 UI, Pinia state, Firebase backend (Auth/Firestore/Storage/Hosting). Korean-language community site with boards, user profiles, admin tools, icon shop.

## STRUCTURE

```
laromacorea-renewal/
├── src/                    # Application source
│   ├── components/         # Vue components (board, common, admin, user, layout, match)
│   ├── views/              # Page-level components (board, user, admin, auth, test)
│   ├── stores/             # Pinia stores (boards, user, error, counter)
│   ├── services/           # Firebase + API service layer
│   ├── composables/        # Vue composables (lazy image, pagination, etc.)
│   ├── utils/              # Pure utility functions
│   ├── styles/             # SCSS styles (responsive, performance)
│   ├── router/             # Vue Router config with auth guards
│   ├── middleware/         # Route middleware
│   └── __tests__/          # Vitest test files
├── scripts/                # Deployment, admin, data migration scripts (Node.js)
├── functions/              # Firebase Cloud Functions
├── public/                 # Static assets (images, icons, PWA)
└── [configs]               # vite, eslint, prettier, vitest, firebase
```

## WHERE TO LOOK

| Task                | Location                             | Notes                                        |
| ------------------- | ------------------------------------ | -------------------------------------------- |
| Add new page        | `src/views/` + `src/router/index.js` | Lazy-load routes with webpackChunkName       |
| Add component       | `src/components/{domain}/`           | Domain matches board/user/admin/common       |
| State management    | `src/stores/`                        | Pinia stores, one file per domain            |
| Firebase operations | `src/services/`                      | All Firestore/Auth/Storage calls             |
| Reusable logic      | `src/composables/`                   | Vue composables, use\* naming                |
| Deploy              | `npm run deploy`                     | Builds, runs pre-checks, deploys to Firebase |
| Test                | `npm run test:run`                   | Vitest with jsdom, globals enabled           |

## CONVENTIONS

- **JS only** — no TypeScript (jsconfig.json for path aliases)
- **Composition API** — `<script setup>` style in Vue SFCs
- **Path alias** — `@/` maps to `src/`
- **Semi + singleQuote** — Prettier: `semi: true, singleQuote: true, printWidth: 80`
- **ESLint flat config** — `eslint.config.js` (ESLint 9)
- **Firebase services exported** from `src/services/firebase.js` as `auth`, `db`, `storage`, `functions`
- **Route meta** — `requiresAuth`, `requiresAdmin` for auth guards
- **Vendor chunks** — vue-vendor, ui-vendor, firebase-vendor, editor-vendor, utils-vendor

## ANTI-PATTERNS (THIS PROJECT)

- **No direct Firebase calls in components** — use `src/services/` layer
- **No inline styles** — use Vuetify props or SCSS
- **No mutations outside Pinia stores** — state changes via store actions
- **Empty catch blocks** — present in `firebase.js` config validation and emulator setup; do NOT replicate
- **No TypeScript** — project is JS-only; adding TS requires full migration

## UNIQUE STYLES

- **AS Roma theme** — primary `#990a2c` (red), secondary `#fbba00` (yellow)
- **PWA** — skipWaiting + clientsClaim for aggressive cache busting
- **Board state** — sessionStorage-based state persistence per board type (`board_state_${boardType}`)
- **Icon system** — user-purchasable profile icons via points
- **Dev-only routes** — test routes gated by `VITE_APP_ENV === 'development'`

## COMMANDS

```bash
npm run dev              # Dev server (Vite)
npm run build            # Production build
npm run build:prod       # Version bump + sitemap + prod build
npm run test:unit        # Vitest watch mode
npm run test:run         # Vitest single run
npm run lint             # ESLint --fix
npm run format           # Prettier --write src/
npm run deploy           # Full deploy (pre-check → build → firebase → cache-bust)
npm run deploy:hosting   # Hosting-only deploy
npm run deploy:rules     # Deploy Firestore rules + Storage rules
npm run emulators        # Firebase emulators
npm run setup-firebase   # Interactive Firebase setup
```

## NOTES

- **Firebase config** must be in `.env` — 6 required fields validated at startup
- **205 total files**, ~20k lines of code, 5 files >500 lines
- **No existing AGENTS.md** — this is the initial knowledge base
- **Functions directory** exists (`functions/`) with separate package.json
- **Algolia** integration via `src/services/algolia.js` + `npm run sync-algolia`
