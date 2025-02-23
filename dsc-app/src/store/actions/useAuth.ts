import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch } from "@/hooks/useStore";
import {
  useLogin,
  useRegister,
  useLogout,
  useRefreshToken,
  useActivateAccount,
  useForgotPassword,
} from "@/services/AuthService";
import {
  resetAuth,
  setMessage,
  updateAuthUser,
} from "@/store/slices/authSlice";
import { LoginData, RegisterData, ForgotPasswordData } from "@/types/auth";
import { User } from "@/types/user";
import { ApiError } from "@/types/api";

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  const refreshTokenMutation = useRefreshToken();
  const activateAccountMutation = useActivateAccount();
  const forgotPasswordMutation = useForgotPassword();

  const handleLogin = async (loginData: LoginData) => {
    try {
      const response = await loginMutation.mutateAsync(loginData);
      if (response.login && response.user) {
        dispatch(updateAuthUser(response.user as User));
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("authUserData", JSON.stringify(response.user));
        return response.user;
      } else {
        dispatch(
          setMessage({
            text: response.msg || "Authorization Failed",
            type: "error",
          }),
        );
      }
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data.msg || "Login failed";
      dispatch(
        setMessage({
          text: errorMessage,
          type: "error",
        }),
      );
    }
  };

  const handleRegister = async (registerData: RegisterData) => {
    try {
      const response = await registerMutation.mutateAsync(registerData);
      dispatch(
        setMessage({
          text: response.msg || "Your account is successfully registered",
          type: "success",
        }),
      );
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = apiError.response?.data.msg || "Registration failed";
      dispatch(setMessage({ text: errorMessage, type: "error" }));
    }
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // Always clean up regardless of server response
      dispatch(resetAuth());
      queryClient.clear();
    }
  };

  const handleRefreshToken = async () => {
    try {
      const response = await refreshTokenMutation.mutateAsync();
      if (response?.user) {
        dispatch(updateAuthUser(response.user as User));
        localStorage.setItem("authUserData", JSON.stringify(response.user));
        return response;
      }
      throw new Error("Invalid refresh token response");
    } catch (error) {
      // Clean up on refresh failure
      await handleLogout();
      throw error;
    }
  };

  const handleActivateAccount = async (token: string) => {
    try {
      const response = await activateAccountMutation.mutateAsync(token);
      return {
        success: response.success,
        msg: response.msg,
      };
    } catch (error) {
      const apiError = error as ApiError;
      throw {
        response: {
          data: {
            success: false,
            msg: apiError.response?.data.msg || "Activation failed",
          },
        },
      };
    }
  };

  const handleForgotPassword = async (email: ForgotPasswordData) => {
    try {
      const response = await forgotPasswordMutation.mutateAsync(email);
      return response;
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage =
        apiError.response?.data.msg || "Password reset failed";
      dispatch(setMessage({ text: errorMessage, type: "error" }));
      throw error;
    }
  };

  return {
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    refreshToken: handleRefreshToken,
    activateAccount: handleActivateAccount,
    forgotPassword: handleForgotPassword,
    isLoading:
      loginMutation.isPending ||
      registerMutation.isPending ||
      logoutMutation.isPending ||
      refreshTokenMutation.isPending ||
      activateAccountMutation.isPending ||
      forgotPasswordMutation.isPending,
    error:
      loginMutation.error ||
      registerMutation.error ||
      logoutMutation.error ||
      refreshTokenMutation.error ||
      activateAccountMutation.error ||
      forgotPasswordMutation.error,
  };
};
