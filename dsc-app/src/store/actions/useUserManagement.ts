import { useAppDispatch } from "@/hooks/useStore";
import { setPagination } from "@/store/slices/userSlice";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useActivateUser,
  useChangeUserPrivilege,
  useUpdateUserPassword,
  useCheckPassword,
} from "@/services/UserService";
import { UserDataSubmission, ChangeUserPrivilegeData } from "@/types/user";

const checkPasswordCache = new Map<string, { isSame: boolean }>();

export const useUserManagement = () => {
  const dispatch = useAppDispatch();

  // Query for fetching users
  const usersQuery = useUsers();

  // Mutations
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const activateUserMutation = useActivateUser();
  const changeUserPrivilegeMutation = useChangeUserPrivilege();
  const updatePasswordMutation = useUpdateUserPassword();
  const checkPasswordMutation = useCheckPassword();

  // Handle users fetch
  const fetchUsers = async () => {
    try {
      const data = await usersQuery.refetch();
      if (data.data) {
        dispatch(
          setPagination({
            currentPage: data.data.current_page || 0,
            totalPages: data.data.pages || 0,
            totalUsers: data.data.total || 0,
          }),
        );
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      throw error;
    }
  };

  // Handle user creation
  const handleCreateUser = async (data: UserDataSubmission) => {
    try {
      await createUserMutation.mutateAsync(data);
    } catch (error) {
      console.error("Failed to create user:", error);
      throw error;
    }
  };

  // Handle user update
  const handleUpdateUser = async (userId: string, data: UserDataSubmission) => {
    try {
      await updateUserMutation.mutateAsync({ userId, data });
    } catch (error) {
      console.error("Failed to update user:", error);
      throw error;
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUserMutation.mutateAsync(userId);
    } catch (error) {
      console.error("Failed to delete user:", error);
      throw error;
    }
  };

  // Handle user activation
  const handleActivateUser = async (userId: string, isActive: boolean) => {
    try {
      await activateUserMutation.mutateAsync({ userId, isActive });
    } catch (error) {
      console.error("Failed to update user status:", error);
      throw error;
    }
  };

  // Handle privilege change
  const handleChangeUserPrivilege = async (
    userId: string,
    data: ChangeUserPrivilegeData,
  ) => {
    try {
      await changeUserPrivilegeMutation.mutateAsync({ userId, data });
    } catch (error) {
      console.error("Failed to change user privilege:", error);
      throw error;
    }
  };

  // Handle password update
  const handleUpdatePassword = async (
    userId: string,
    data: { new_password: string },
  ) => {
    try {
      await updatePasswordMutation.mutateAsync({ userId, data });
    } catch (error) {
      console.error("Failed to update password:", error);
      throw error;
    }
  };

  const handleCheckPassword = async (userId: string, new_password: string) => {
    if (!new_password) return { isSame: false };

    // Add a simple cache to prevent duplicate checks
    const cacheKey = `${userId}-${new_password}`;
    if (checkPasswordCache.has(cacheKey)) {
      return checkPasswordCache.get(cacheKey);
    }

    try {
      const result = await checkPasswordMutation.mutateAsync({
        userId,
        new_password,
      });
      const safeResult = { isSame: result.isSame || false };
      checkPasswordCache.set(cacheKey, safeResult);
      return safeResult;
    } catch (error) {
      console.error("Failed to check password:", error);
      return { isSame: false };
    }
  };

  return {
    users: usersQuery.data?.users ?? [],
    isLoading:
      usersQuery.isLoading ||
      createUserMutation.isPending ||
      updateUserMutation.isPending ||
      deleteUserMutation.isPending ||
      activateUserMutation.isPending ||
      changeUserPrivilegeMutation.isPending ||
      updatePasswordMutation.isPending ||
      checkPasswordMutation.isPending,
    error:
      usersQuery.error ||
      createUserMutation.error ||
      updateUserMutation.error ||
      deleteUserMutation.error ||
      activateUserMutation.error ||
      changeUserPrivilegeMutation.error ||
      updatePasswordMutation.error ||
      checkPasswordMutation.error,
    fetchUsers,
    createUser: handleCreateUser,
    updateUser: handleUpdateUser,
    deleteUser: handleDeleteUser,
    activateUser: handleActivateUser,
    changeUserPrivilege: handleChangeUserPrivilege,
    updatePassword: handleUpdatePassword,
    checkPassword: handleCheckPassword,
  };
};
