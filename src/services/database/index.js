/**
 * Database Service — Barrel Export
 * Re-exports all domain-specific services from the split modules.
 * All existing imports from '@/services/database' continue to work.
 */

export { collections, db } from './constants';
export { userService } from './user';
export { postService } from './post';
export { commentService } from './comment';
export { adminService } from './admin';
export { iconService } from './icon';
export { boardService } from './board';

// 통합 데이터베이스 서비스 (legacy compat)
import { userService } from './user';
import { postService } from './post';
import { commentService } from './comment';
import { adminService } from './admin';
import { iconService } from './icon';
import { boardService } from './board';

export const databaseService = {
  ...userService,
  ...postService,
  ...commentService,
  ...adminService,
  ...iconService,
  ...boardService,
};
