import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserState } from "@/types/user";

const initialState: UserState = {
  currentPage: 0,
  totalPages: 0,
  totalUsers: 0,
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    setPagination: (
      state,
      action: PayloadAction<{
        currentPage: number;
        totalPages: number;
        totalUsers: number;
      }>,
    ) => {
      state.currentPage = action.payload.currentPage;
      state.totalPages = action.payload.totalPages;
      state.totalUsers = action.payload.totalUsers;
    },
    resetUserState: () => initialState,
  },
});

export const { setPagination, resetUserState } = userSlice.actions;
export default userSlice.reducer;
