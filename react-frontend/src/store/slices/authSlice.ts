import { createSlice } from "@reduxjs/toolkit";
import { AuthState } from "routes/types";
import { login, register, logout } from "store/actions/authActions";
import Cookies from "js-cookie";

const initialState: AuthState = {
  user: localStorage.getItem("authUser")
    ? JSON.parse(localStorage.getItem("authUser")!)
    : null,
  isAuthenticated: !!localStorage.getItem("authUser"),
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
        localStorage.setItem("authUser", JSON.stringify(action.payload));
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, () => {
        localStorage.removeItem("authUser");
        Cookies.remove("csrf_access_token");
        return initialState;
      });
  },
});

export default authSlice.reducer;
