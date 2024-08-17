import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, MessageState } from "routes/types";
import {
  login,
  register,
  logout,
  refreshToken,
  activateAccount,
} from "store/actions/authActions";

const initialState: AuthState = {
  user: localStorage.getItem("authUserData")
    ? JSON.parse(localStorage.getItem("authUserData")!)
    : null,
  isAuthenticated: localStorage.getItem("isLoggedIn") === "true",
  isLoading: false,
  message: null,
  csrfAccessToken: null,
  csrfRefreshToken: null,
  activationProgress: 0,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setMessage: (state, action: PayloadAction<MessageState>) => {
      state.message = action.payload;
    },
    clearMessage: (state) => {
      state.message = null;
    },
    setActivationProgress: (state, action: PayloadAction<number>) => {
      state.activationProgress = action.payload;
    },
    clearActivationState: (state) => {
      state.activationProgress = 0;
      state.message = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.message = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.csrfAccessToken = action.payload.csrf_access_token;
        state.csrfRefreshToken = action.payload.csrf_refresh_token;
        state.message = null;
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("authUserData", JSON.stringify(action.payload));
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.message = {
          text: action.payload as string,
          type: "error",
        };
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.message = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = {
          text: action.payload as string,
          type: "success",
        };
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.message = {
          text: action.payload as string,
          type: "error",
        };
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
        state.message = {
          text: "Session expired. Please log in again.",
          type: "warning",
        };
      })
      .addCase(activateAccount.pending, (state) => {
        state.isLoading = true;
        state.message = null;
      })
      .addCase(activateAccount.fulfilled, (state, action) => {
        state.isLoading = false;
        state.message = {
          text: "Account activated successfully. Please log in.",
          type: "success",
        };
      })
      .addCase(activateAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.message = {
          text: action.payload as string,
          type: "error",
        };
      });
  },
});

export const {
  setMessage,
  clearMessage,
  setActivationProgress,
  clearActivationState,
} = authSlice.actions;
export default authSlice.reducer;
