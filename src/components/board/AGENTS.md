# COMPONENTS/BOARD — Board System Components

## OVERVIEW

Vue components for the board/post/comment system — the largest component module (12 files).

## KEY COMPONENTS

| Component            | Purpose                                             |
| -------------------- | --------------------------------------------------- |
| `PostList.vue`       | Post listing with pagination, filters, sorting      |
| `PostCard.vue`       | Individual post preview card                        |
| `PostEditor.vue`     | Rich text editor (Quill) for creating/editing posts |
| `CommentSection.vue` | Comment thread with nested replies                  |
| `CommentItem.vue`    | Single comment with icon display                    |
| `BoardHeader.vue`    | Board title, navigation, search                     |
| `MediaGallery.vue`   | Image/video grid display                            |
| `FileUpload.vue`     | File attachment upload UI                           |

## CONVENTIONS

- Props: use TypeScript-style prop definitions with defaults
- Emits: defineEmits with typed events
- All Firebase calls via services/ layer
- Vuetify components for layout (v-row, v-col, v-card)
- Icon display via user-purchased icon system

## ANTI-PATTERNS

- No inline Firebase calls
- No direct DOM manipulation
- No business logic in components — delegate to composables/services

## NOTES

- Post editor uses Quill with HTML edit button plugin
- Comment icons display user-purchased profile icons
- Board state persists via sessionStorage (`board_state_${boardType}`)
