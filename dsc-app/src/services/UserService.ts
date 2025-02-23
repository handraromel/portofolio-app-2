import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./ApiService";
import {
  ChangeUserPrivilegeData,
  UserDataSubmission,
  UserResponse,
  User,
} from "@/types/user";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) =>
    [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
} as const;

const userPrefix = "/manage/user";

export const useUsers = () => {
  return useQuery<UserResponse, Error>({
    queryKey: userKeys.lists(),
    queryFn: async (): Promise<UserResponse> => {
      const response = await apiClient<User>(`${userPrefix}/all`);
      return response as UserResponse;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserDataSubmission) =>
      apiClient(`${userPrefix}/create`, { data, method: "POST" }),
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: UserDataSubmission;
    }) => apiClient(`${userPrefix}/${userId}/update`, { data, method: "PUT" }),
    onSuccess: (_, { userId }) => {
      // Invalidate specific user and list
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      apiClient(`${userPrefix}/${userId}/delete`, { method: "DELETE" }),
    onSuccess: (_, userId) => {
      // Remove user from cache and invalidate lists
      queryClient.removeQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

export const useActivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      apiClient(`${userPrefix}/${userId}/activate_user`, {
        data: { is_active: isActive },
        method: "PUT",
      }),
    onSuccess: (_, { userId }) => {
      // Invalidate specific user and list
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

export const useChangeUserPrivilege = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: ChangeUserPrivilegeData;
    }) =>
      apiClient(`${userPrefix}/${userId}/change_user_privilege`, {
        data,
        method: "PUT",
      }),
    onSuccess: (_, { userId }) => {
      // Invalidate specific user and list
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

export const useUpdateUserPassword = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: { new_password: string };
    }) =>
      apiClient(`${userPrefix}/${userId}/update_user_password`, {
        data,
        method: "PUT",
      }),
    onSuccess: (_, { userId }) => {
      // Only invalidate specific user since password change doesn't affect list
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
    },
  });
};

export const useCheckPassword = () => {
  return useMutation({
    mutationFn: ({
      userId,
      new_password,
    }: {
      userId: string;
      new_password: string;
    }) =>
      apiClient(`${userPrefix}/${userId}/check_password`, {
        data: { new_password },
        method: "POST",
      }),
    gcTime: 0,
    retry: false,
  });
};
