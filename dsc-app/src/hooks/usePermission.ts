import { useAppSelector } from "./useStore";

type UserRole = "superadmin" | "admin" | "user";

const ROLE_HIERARCHY: { [key in UserRole]: number } = {
  superadmin: 3,
  admin: 2,
  user: 1,
};

export const usePermission = () => {
  const currentUser = useAppSelector((state) => state.auth.user);

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!currentUser) return false;
    const userRoleLevel =
      ROLE_HIERARCHY[currentUser.role.toLowerCase() as UserRole] || 0;
    const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] || 0;
    return userRoleLevel >= requiredRoleLevel;
  };

  const canManage = (): boolean => hasRole("admin");
  const canDelete = (): boolean => hasRole("superadmin");
  const canEdit = (): boolean => hasRole("admin");
  const canView = (): boolean => hasRole("user");

  return {
    hasRole,
    canManage,
    canDelete,
    canEdit,
    canView,
  };
};
