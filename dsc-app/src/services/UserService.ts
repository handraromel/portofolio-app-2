import api from "./ApiService";
import { ChangeUserPrivilegeData, UserDataSubmission } from "@/types/user";

const userPrefix = "/manage/user";

const UserService = {
  getAllUsers: () => api.get(`${userPrefix}/all`),

  createUser: (data: UserDataSubmission) =>
    api.post(`${userPrefix}/create`, data),

  updateUser: (userId: string, data: UserDataSubmission) =>
    api.put(`${userPrefix}/${userId}/update`, data),

  deleteUser: (userId: string) => api.delete(`${userPrefix}/${userId}/delete`),

  activateUser: (userId: string, isActive: boolean) =>
    api.put(`${userPrefix}/${userId}/activate_user`, { is_active: isActive }),

  changeUserPrivilege: (userId: string, data: ChangeUserPrivilegeData) =>
    api.put(`${userPrefix}/${userId}/change_user_privilege`, data),
};

export default UserService;
