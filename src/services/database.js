import { collections, db } from './database/constants.js';
import { userService } from './database/user.js';
import { postService } from './database/post.js';
import { commentService } from './database/comment.js';
import { adminService } from './database/admin.js';
import { iconService } from './database/icon.js';
import { boardService } from './database/board.js';

const databaseService = {
  ...userService,
  ...postService,
  ...commentService,
  ...adminService,
  ...iconService,
  ...boardService,
};

export {
  collections,
  db,
  userService,
  postService,
  commentService,
  adminService,
  iconService,
  boardService,
  databaseService,
};
