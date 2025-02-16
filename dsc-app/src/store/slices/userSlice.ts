import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  fetchUsers,
  updateUser,
  createUser,
  activateUser,
  deleteUser,
  updateUserPassword,
} from "@/store/actions/userActions";
import { UserState, UserResponse } from "@/types/user";

interface ErrorPayload {
  msg?: string;
  message?: string;
}

const initialState: UserState = {
  users: [],
  isLoading: false,
  error: null,
  totalPages: 0,
  currentPage: 0,
  totalUsers: 0,
};

// Common state updates
const setPending = (state: UserState) => {
  state.isLoading = true;
  state.error = null;
};

const setFulfilled = (state: UserState) => {
  state.isLoading = false;
  state.error = null;
};

const setRejected = (state: UserState, action: { payload: unknown }) => {
  state.isLoading = false;

  if (typeof action.payload === "string") {
    state.error = { message: action.payload };
  } else if (action.payload && typeof action.payload === "object") {
    const errorPayload = action.payload as ErrorPayload;
    state.error = {
      message: errorPayload.msg || errorPayload.message || "An error occurred",
    };
  } else {
    state.error = { message: "An unknown error occurred" };
  }
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, setPending)
      .addCase(
        fetchUsers.fulfilled,
        (state, action: PayloadAction<UserResponse>) => {
          setFulfilled(state);
          state.users = action.payload.users;
          state.totalUsers = action.payload.total;
          state.currentPage = action.payload.current_page;
          state.totalPages = action.payload.pages;
        },
      )
      .addCase(fetchUsers.rejected, setRejected)

      // Update user
      .addCase(updateUser.pending, setPending)
      .addCase(updateUser.fulfilled, setFulfilled)
      .addCase(updateUser.rejected, setRejected)

      // Create user
      .addCase(createUser.pending, setPending)
      .addCase(createUser.fulfilled, setFulfilled)
      .addCase(createUser.rejected, setRejected)

      // Activate user
      .addCase(activateUser.pending, setPending)
      .addCase(activateUser.fulfilled, setFulfilled)
      .addCase(activateUser.rejected, setRejected)

      // Delete user
      .addCase(deleteUser.pending, setPending)
      .addCase(deleteUser.fulfilled, setFulfilled)
      .addCase(deleteUser.rejected, setRejected)

      // Update user password
      .addCase(updateUserPassword.pending, setPending)
      .addCase(updateUserPassword.fulfilled, setFulfilled)
      .addCase(updateUserPassword.rejected, setRejected);
  },
});

export default userSlice.reducer;
