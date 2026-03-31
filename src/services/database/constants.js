/**
 * Database Constants
 * Shared collection names and common Firestore imports.
 */

import { db } from '../firebase';

export const collections = {
  users: 'users',
  posts: 'posts',
  comments: 'comments',
  icons: 'icons',
  pointsHistory: 'points_history',
  boards: 'boards',
};

export { db };
