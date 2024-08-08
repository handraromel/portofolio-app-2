import { createAsyncThunk } from "@reduxjs/toolkit";
import AuthService, { LoginData, RegisterData } from "services/AuthService";
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
      return rejectWithValue(
        error instanceof Error ? error.message : "Login failed",
      );
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (registerData: RegisterData, { rejectWithValue }) => {
    try {
      await AuthService.register(registerData);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Registration failed",
      );
    }
  },
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const csrfToken = Cookies.get("csrf_access_token");
      await AuthService.logout(csrfToken);
      localStorage.removeItem("csrf_access_token");
    } catch (error) {
      return rejectWithValue("Logout failed");
    }
  },
);
