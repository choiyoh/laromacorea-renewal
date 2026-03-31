# STORES — Pinia State Management

## OVERVIEW

Pinia stores for global application state. All mutations happen through store actions.

## KEY FILES

| File         | Purpose                                           |
| ------------ | ------------------------------------------------- |
| `user.js`    | User auth state, profile, admin status, icon shop |
| `boards.js`  | Board-related state (posts, comments, filters)    |
| `error.js`   | Global error tracking + display state             |
| `counter.js` | Simple counter (demo/test store)                  |

## CONVENTIONS

- Options API style (defineStore with `state`, `getters`, `actions`)
- State is a function returning object
- Actions are async where needed (Firebase calls via services/)
- Getters are computed derivations only — no side effects

## ANTI-PATTERNS

- No direct state mutation — always use actions
- No Firebase imports in stores — call services/ functions
- No component-local state duplication — use store if shared

## NOTES

- `user.js` is the most critical store — handles auth initialization, user profile, admin checks
- `boards.js` manages per-board state with sessionStorage persistence
