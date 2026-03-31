# COMPOSABLES — Vue Composition API Reusable Logic

## OVERVIEW

Vue composables (`use*` naming) providing reusable reactive logic across components.

## KEY FILES

| File                | Purpose                                        |
| ------------------- | ---------------------------------------------- |
| `useLazyImage.js`   | Lazy image loading directive (`v-lazy-image`)  |
| `usePagination.js`  | Pagination state + navigation logic            |
| `useBoardState.js`  | Board state management (sessionStorage-backed) |
| `useMediaUpload.js` | File upload handling with progress tracking    |

## CONVENTIONS

- All files prefixed with `use`
- Return object with reactive refs + methods
- No side effects on import — must be called within `<script setup>`
- Composables are pure Vue logic; no Firebase calls (use services/ instead)

## ANTI-PATTERNS

- No DOM manipulation outside composables
- No direct component imports — composables are consumed, not imported by other composables
- No stateful globals — each call returns independent state
