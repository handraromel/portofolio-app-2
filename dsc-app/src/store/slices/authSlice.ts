import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, MessageState } from "@/routes/types";
import { User } from "@/types/user";
import Cookies from "js-cookie";

const getUserFromStorage = (): User | null => {
  try {
    const userData = localStorage.getItem("authUserData");
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

const initialState: AuthState = {
  user: getUserFromStorage(),
  isAuthenticated: Boolean(Cookies.get("csrf_access_token")),
  message: null as MessageState | null,
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
    updateAuthUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    resetAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.message = null;
      // Clean up storage
      localStorage.removeItem("isLoggedIn");
      Cookies.remove("csrf_access_token");
    },
  },
});

export const { setMessage, clearMessage, updateAuthUser, resetAuth } =
  authSlice.actions;
export default authSlice.reducer;
