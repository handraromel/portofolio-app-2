import { useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
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
    return await loginMutation
      .mutateAsync(loginData)
      .then((response) => {
        if (response.login && response.user) {
          dispatch(updateAuthUser(response.user as User));
          localStorage.setItem("isLoggedIn", "true");
          localStorage.setItem("authUserData", JSON.stringify(response.user));
          localStorage.setItem("firstLoginTime", Date.now().toString());
          return response.user;
        }
        dispatch(
          setMessage({
            text: response.msg || "Authorization Failed",
            type: "error",
          }),
        );
      })
      .catch((error) => {
        const apiError = error as ApiError;
        const errorMessage = apiError.response?.data.msg || "Login failed";
        dispatch(
          setMessage({
            text: errorMessage,
            type: "error",
          }),
        );
      });
  };

  const handleRegister = async (registerData: RegisterData) => {
    return await registerMutation
      .mutateAsync(registerData)
      .then((response) => {
        dispatch(
          setMessage({
            text: response.msg || "Your account is successfully registered",
            type: "success",
          }),
        );
        return response;
      })
      .catch((error) => {
        const apiError = error as ApiError;
        const errorMessage =
          apiError.response?.data.msg || "Registration failed";
        dispatch(
          setMessage({
            text: errorMessage,
            type: "error",
          }),
        );
      });
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      Cookies.remove("csrf_access_token");
      Cookies.remove("csrf_refresh_token");
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("authUserData");
      localStorage.removeItem("firstLoginTime");

      dispatch(resetAuth());
      queryClient.clear();
    }
  };

  const handleRefreshToken = async () => {
    try {
      const firstLoginTime = localStorage.getItem("firstLoginTime");
      const currentTime = Date.now();
      if (
        firstLoginTime &&
        currentTime - parseInt(firstLoginTime) > 24 * 3600 * 1000
      ) {
        console.warn("Maximum session duration reached (24h), logging out");
        await handleLogout();
        throw new Error("Maximum session duration exceeded");
      }
      const response = await refreshTokenMutation.mutateAsync();
      if (response?.user) {
        dispatch(updateAuthUser(response.user as User));
        localStorage.setItem("authUserData", JSON.stringify(response.user));
        return response;
      }
      await handleLogout();
      throw new Error("Invalid refresh token response");
    } catch (error) {
      console.error("Token refresh failed:", error);
      await handleLogout();
      throw error;
    }
  };

  const handleActivateAccount = async (token: string) => {
    return await activateAccountMutation
      .mutateAsync(token)
      .then((response) => {
        return {
          success: response.success,
          msg: response.msg,
        };
      })
      .catch((error) => {
        const apiError = error as ApiError;
        throw {
          response: {
            data: {
              success: false,
              msg: apiError.response?.data.msg || "Activation failed",
            },
          },
        };
      });
  };

  const handleForgotPassword = async (email: ForgotPasswordData) => {
    return await forgotPasswordMutation
      .mutateAsync(email)
      .then((response) => {
        return response;
      })
      .catch((error) => {
        const apiError = error as ApiError;
        const errorMessage =
          apiError.response?.data.msg || "Password reset failed";
        dispatch(setMessage({ text: errorMessage, type: "error" }));
        throw error;
      });
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
