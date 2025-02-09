import api from "./ApiService";
import { ChangeUserPrivilegeData, UpdateUserData } from "@/types/user";

const userPrefix = "/manage/user";

const UserService = {
  getAllUsers: () => api.get(`${userPrefix}/all`),

  updateUser: (userId: string, data: UpdateUserData) =>
    api.put(`${userPrefix}/${userId}/update`, data),

  deleteUser: (userId: string) => api.delete(`${userPrefix}/${userId}/delete`),

  activateUser: (userId: string, isActive: boolean) =>
    api.put(`${userPrefix}/${userId}/activate_user`, { is_active: isActive }),

  changeUserPrivilege: (userId: string, data: ChangeUserPrivilegeData) =>
    api.put(`${userPrefix}/${userId}/change_user_privilege`, data),
};

export default UserService;
