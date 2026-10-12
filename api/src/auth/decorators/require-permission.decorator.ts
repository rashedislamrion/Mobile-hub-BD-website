import { SetMetadata } from '@nestjs/common';
import { ModuleName, PermissionAction } from '@prisma/client';

export const PERMISSION_KEY = 'permission';

export interface RequiredPermission {
  module: ModuleName;
  action: PermissionAction;
  branchParam?: string; // the param/body/query key holding the target branch id
}

export const RequirePermission = (perm: RequiredPermission) =>
  SetMetadata(PERMISSION_KEY, perm);
