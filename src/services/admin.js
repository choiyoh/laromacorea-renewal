import { checkAdminPermission } from './admin/permission';
import { noticeService } from './admin/notice';
import { iconAdminService } from './admin/icon';
import { userAdminService } from './admin/user';
import { postAdminService } from './admin/post';
import { dashboardService } from './admin/dashboard';

export const adminService = {
  checkAdminPermission,
  ...noticeService,
  ...iconAdminService,
  ...userAdminService,
  ...postAdminService,
  ...dashboardService,
};

export { checkAdminPermission } from './admin/permission';
export { noticeService } from './admin/notice';
export { iconAdminService } from './admin/icon';
export { userAdminService } from './admin/user';
export { postAdminService } from './admin/post';
export { dashboardService } from './admin/dashboard';
