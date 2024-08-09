import { createSlice } from "@reduxjs/toolkit";
import { AuthState } from "routes/types";
import {
  login,
  register,
  logout,
  refreshToken,
} from "store/actions/authActions";

const initialState: AuthState = {
  user: localStorage.getItem("authUserData")
    ? JSON.parse(localStorage.getItem("authUserData")!)
    : null,
  isAuthenticated: localStorage.getItem("isLoggedIn") === "true",
  isLoading: false,
  error: null,
  csrfAccessToken: null,
  csrfRefreshToken: null,
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
        state.csrfAccessToken = action.payload.csrf_access_token;
        state.csrfRefreshToken = action.payload.csrf_refresh_token;
        state.error = null;
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("authUserData", JSON.stringify(action.payload));
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
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("authUserData");
        return initialState;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.csrfAccessToken = action.payload.csrf_access_token;
        state.csrfRefreshToken = action.payload.csrf_refresh_token;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export default authSlice.reducer;
