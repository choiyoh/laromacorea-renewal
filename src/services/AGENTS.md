# SERVICES — Firebase + API Layer

## OVERVIEW

All Firebase operations live here. Components MUST import from services/, never call Firebase SDK directly.

## KEY FILES

| File          | Purpose                                                         |
| ------------- | --------------------------------------------------------------- |
| `firebase.js` | Firebase app init, exports `auth`, `db`, `storage`, `functions` |
| `auth.js`     | Authentication flows (login, signup, logout, password reset)    |
| `database.js` | Firestore CRUD operations                                       |
| `storage.js`  | Firebase Storage uploads/downloads                              |
| `admin.js`    | Admin-only Firestore operations                                 |
| `algolia.js`  | Algolia search sync + queries                                   |
| `match.js`    | Match/schedule data operations                                  |
| `points.js`   | User points system                                              |
| `stats.js`    | Analytics/statistics operations                                 |

## CONVENTIONS

- Export named functions, not classes
- Error handling: catch → log → throw (never silent catch)
- All Firestore calls use `db` from `firebase.js`
- Async/await only, no raw promises
- Functions return plain objects/arrays, not Firestore DocumentSnapshots

## ANTI-PATTERNS

- No component-level Firebase imports (`firebase/firestore`, etc.)
- No direct `db.collection()` chains — use wrapper functions
- No mutation logic in components — delegate to services
- Empty catch blocks exist in `firebase.js` only (legacy); do NOT replicate

## NOTES

- `database-simple.js` and `database-init.js` are legacy — prefer `database.js`
- `stats-cache.js` provides cached statistics to reduce Firestore reads
- Algolia sync runs via `npm run sync-algolia` (Node script, not in-app)
