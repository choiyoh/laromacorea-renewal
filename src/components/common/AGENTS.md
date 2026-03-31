# COMPONENTS/COMMON — Shared UI Components

## OVERVIEW

Reusable UI components used across multiple views (13 files). These are the building blocks.

## KEY COMPONENTS

| Component            | Purpose                          |
| -------------------- | -------------------------------- |
| `AppHeader.vue`      | Site-wide header with navigation |
| `AppFooter.vue`      | Site-wide footer                 |
| `AppSidebar.vue`     | Navigation sidebar               |
| `LoadingSpinner.vue` | Loading indicator                |
| `ErrorAlert.vue`     | Error display component          |
| `ConfirmDialog.vue`  | Confirmation modal               |
| `Pagination.vue`     | Reusable pagination controls     |
| `IconDisplay.vue`    | User icon rendering              |
| `Snackbar.vue`       | Toast notification wrapper       |

## CONVENTIONS

- Props-only data flow — no internal state that depends on parent
- Vuetify props for styling (color, elevation, size)
- Slots for content projection
- Emits for user actions (click, submit, cancel)

## ANTI-PATTERNS

- No Firebase calls
- No route navigation logic (emit events instead)
- No business logic — pure UI components
