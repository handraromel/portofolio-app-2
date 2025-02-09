import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { fetchUsers } from "@/store/actions/userActions";
import { UserState, UserResponse } from "@/types/user";

const initialState: UserState = {
  users: [],
  isLoading: false,
  error: null,
  totalPages: 0,
  currentPage: 0,
  totalUsers: 0,
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchUsers.fulfilled,
        (state, action: PayloadAction<UserResponse>) => {
          state.isLoading = false;
          state.users = action.payload.users;
          state.totalUsers = action.payload.total;
          state.currentPage = action.payload.current_page;
          state.totalPages = action.payload.pages;
        },
      )
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export default userSlice.reducer;
