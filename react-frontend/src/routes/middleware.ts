import { User } from "./types";

export const checkRole = (user: User | null, allowedRoles: string[]) => {
  if (!user) return false;
  return allowedRoles.includes(user.role) && user.is_active;
};
