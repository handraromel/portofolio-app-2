import { createAsyncThunk } from "@reduxjs/toolkit";
import { isApiError } from "@/utils/apiError";
import UserService from "@/services/UserService";
import { ChangeUserPrivilegeData, UpdateUserData } from "@/types/user";

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await UserService.getAllUsers();
      return response.data;
    } catch (error) {
      if (isApiError(error) && error.response?.data?.msg) {
        return rejectWithValue(error.response.data.msg);
      }
      return rejectWithValue("Failed to fetch users");
    }
  },
);

export const updateUser = createAsyncThunk(
  "users/updateUser",
  async (
    { userId, data }: { userId: string; data: UpdateUserData },
    { rejectWithValue },
  ) => {
    try {
      const response = await UserService.updateUser(userId, data);
      return response.data;
    } catch (error) {
      if (isApiError(error) && error.response?.data?.msg) {
        return rejectWithValue(error.response.data.msg);
      }
      return rejectWithValue("Failed to update user");
    }
  },
);

export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (userId: string, { rejectWithValue }) => {
    try {
      await UserService.deleteUser(userId);
      return userId;
    } catch (error) {
      if (isApiError(error) && error.response?.data?.msg) {
        return rejectWithValue(error.response.data.msg);
      }
      return rejectWithValue("Failed to delete user");
    }
  },
);

export const activateUser = createAsyncThunk(
  "users/activateUser",
  async (
    { userId, isActive }: { userId: string; isActive: boolean },
    { rejectWithValue },
  ) => {
    try {
      const response = await UserService.activateUser(userId, isActive);
      return response.data;
    } catch (error) {
      if (isApiError(error) && error.response?.data?.msg) {
        return rejectWithValue(error.response.data.msg);
      }
      return rejectWithValue("Failed to update user status");
    }
  },
);

export const changeUserPrivilege = createAsyncThunk(
  "users/changeUserPrivilege",
  async (
    { userId, data }: { userId: string; data: ChangeUserPrivilegeData },
    { rejectWithValue },
  ) => {
    try {
      const response = await UserService.changeUserPrivilege(userId, data);
      return response.data;
    } catch (error) {
      if (isApiError(error) && error.response?.data?.msg) {
        return rejectWithValue(error.response.data.msg);
      }
      return rejectWithValue("Failed to change user privilege");
    }
  },
);
