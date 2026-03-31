import { checkAdminPermission } from './permission';
import { noticeService } from './notice';
import { iconAdminService } from './icon';
import { userAdminService } from './user';
import { postAdminService } from './post';
import { dashboardService } from './dashboard';

export const adminService = {
  checkAdminPermission,
  ...noticeService,
  ...iconAdminService,
  ...userAdminService,
  ...postAdminService,
  ...dashboardService,
};

export { checkAdminPermission } from './permission';
export { noticeService } from './notice';
export { iconAdminService } from './icon';
export { userAdminService } from './user';
export { postAdminService } from './post';
export { dashboardService } from './dashboard';
