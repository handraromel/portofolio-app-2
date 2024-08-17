import { createAsyncThunk } from "@reduxjs/toolkit";
import AuthService, { LoginData, RegisterData } from "services/AuthService";
import { AuthState } from "routes/types";
import { isApiError } from "utils/apiError";
import Cookies from "js-cookie";

export const login = createAsyncThunk(
  "auth/login",
  async (loginData: LoginData, { rejectWithValue }) => {
    try {
      const response = await AuthService.login(loginData);
      const fetched = response.data;
      if (fetched.login) {
        return fetched.user;
      } else {
        return rejectWithValue(fetched.msg);
      }
    } catch (error) {
      if (isApiError(error) && error.response?.data?.msg) {
        return rejectWithValue(error.response.data.msg);
      } else if (error instanceof Error) {
        return rejectWithValue(error.message);
      } else {
        return rejectWithValue("Login failed");
      }
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (registerData: RegisterData, { rejectWithValue }) => {
    try {
      const response = await AuthService.register(registerData);
      return response.data.msg;
    } catch (error) {
      if (isApiError(error) && error.response?.data?.msg) {
        return rejectWithValue(error.response.data.msg);
      } else if (error instanceof Error) {
        return rejectWithValue(error.message);
      } else {
        return rejectWithValue("Registration failed");
      }
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await AuthService.logout();
      Cookies.remove("csrf_access_token");
      Cookies.remove("csrf_refresh_token");
    } catch (error) {
      return rejectWithValue("Logout failed");
    }
  },
);

export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    try {
      const response = await AuthService.refresh();
      return response.data;
    } catch (error) {
      if (isApiError(error) && error.response?.data?.msg) {
        return rejectWithValue(error.response.data.msg);
      } else if (error instanceof Error) {
        return rejectWithValue(error.message);
      } else {
        return rejectWithValue("Token refresh failed");
      }
    }
  },
);

export const activateAccount = createAsyncThunk(
  "auth/activateAccount",
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await AuthService.activateAccount(token);
      return response.data;
    } catch (error) {
      if (isApiError(error) && error.response?.data?.msg) {
        return rejectWithValue(error.response.data.msg);
      } else if (error instanceof Error) {
        return rejectWithValue(error.message);
      } else {
        return rejectWithValue("Activation failed");
      }
    }
  },
  {
    condition: (token, { getState }) => {
      const { auth } = getState() as { auth: AuthState };
      if (auth.isLoading) {
        return false;
      }
    },
  },
);
