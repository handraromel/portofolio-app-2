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
import { UserDataSubmission, UserQueryFilters } from "@/types/user";
import { useState } from "react";

const checkPasswordCache = new Map<string, { isSame: boolean }>();

export const useUserManagement = () => {
  const dispatch = useAppDispatch();

  const [filters, setFilters] = useState<UserQueryFilters>({
    page: 1,
    per_page: 10,
    search: "",
  });

  // Query for fetching users
  const usersQuery = useUsers(filters);

  // Mutations
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const activateUserMutation = useActivateUser();
  const changeUserPrivilegeMutation = useChangeUserPrivilege();
  const updatePasswordMutation = useUpdateUserPassword();
  const checkPasswordMutation = useCheckPassword();

  const fetchUsers = async () => {
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
  };

  const changePage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const changePerPage = (per_page: number) => {
    setFilters((prev) => ({ ...prev, per_page, page: 1 }));
  };

  const searchUsers = (search: string) => {
    setFilters((prev) => ({
      ...prev,
      search,
      page: 1,
    }));
  };

  const handleCreateUser = async (data: UserDataSubmission) => {
    return await createUserMutation.mutateAsync(data);
  };

  const handleUpdateUser = async (userId: string, data: UserDataSubmission) => {
    const response = await updateUserMutation.mutateAsync({
      userId,
      data,
    });
    return response.user;
  };

  const handleDeleteUser = async (userId: string) => {
    return await deleteUserMutation.mutateAsync(userId);
  };

  const handleActivateUser = async (userId: string, isActive: boolean) => {
    return await activateUserMutation.mutateAsync({ userId, isActive });
  };

  const handleUpdatePassword = async (
    userId: string,
    data: { new_password: string },
  ) => {
    return await updatePasswordMutation.mutateAsync({ userId, data });
  };

  const handleCheckPassword = async (userId: string, new_password: string) => {
    if (!new_password) return { isSame: false };

    // Add a simple cache to prevent duplicate checks
    const cacheKey = `${userId}-${new_password}`;
    if (checkPasswordCache.has(cacheKey)) {
      return checkPasswordCache.get(cacheKey);
    }

    return await checkPasswordMutation
      .mutateAsync({ userId, new_password })
      .then((result) => {
        const safeResult = { isSame: result.isSame || false };
        checkPasswordCache.set(cacheKey, safeResult);
        return safeResult;
      })
      .catch(() => {
        return { isSame: false };
      });
  };

  return {
    users: usersQuery.data?.users ?? [],
    pagination: {
      currentPage: usersQuery.data?.current_page || 1,
      totalPages: usersQuery.data?.pages || 1,
      totalRecords: usersQuery.data?.total || 0,
    },
    filters,
    usersQuery,
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
    changePage,
    changePerPage,
    searchUsers,
    createUser: handleCreateUser,
    updateUser: handleUpdateUser,
    deleteUser: handleDeleteUser,
    activateUser: handleActivateUser,
    updatePassword: handleUpdatePassword,
    checkPassword: handleCheckPassword,
  };
};
