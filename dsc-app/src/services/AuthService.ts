import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./ApiService";
import { LoginData, RegisterData, ForgotPasswordData } from "@/types/auth";

export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
  session: () => [...authKeys.all, "session"] as const,
} as const;

const authPrefix = "/auth/user";

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RegisterData) =>
      apiClient(`${authPrefix}/register`, { data, method: "POST" }),
    onSuccess: () => {
      // Invalidate any cached auth data
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginData) =>
      apiClient(`${authPrefix}/login`, { data, method: "POST" }),
    onSuccess: (data) => {
      // Update auth user data in cache with the user object
      queryClient.setQueryData(authKeys.user(), data.user);
      // Invalidate any existing session data
      queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient(`${authPrefix}/logout`, { method: "POST" }),
    onSuccess: () => {
      // Clear all auth-related queries from cache
      queryClient.removeQueries({ queryKey: authKeys.all });
      // Optionally, invalidate other dependent queries
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useRefreshToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiClient(`${authPrefix}/refresh`, { method: "POST" }),
    onSuccess: (data) => {
      if (data.logout) {
        queryClient.removeQueries({ queryKey: authKeys.all });
        return;
      }

      // Update user data in cache
      if (data.user) {
        queryClient.setQueryData(authKeys.user(), data.user);
      }
    },
    onError: () => {
      // Clear auth data on refresh error
      queryClient.removeQueries({ queryKey: authKeys.all });
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("authUserData");
    },
    retry: 1, // Allow one retry
    gcTime: 0,
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data: ForgotPasswordData) =>
      apiClient(`${authPrefix}/forgot-password`, { data, method: "POST" }),
  });
};

export const useActivateAccount = () => {
  return useMutation({
    mutationFn: (token: string) => apiClient(`${authPrefix}/activate/${token}`),
    onError: (error) => {
      console.error("Account activation failed:", error);
    },
  });
};
