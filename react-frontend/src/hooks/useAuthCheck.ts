import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./useStore";
import { logout, refreshToken } from "../store/actions/authActions";

export const useAuthCheck = () => {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    const checkAuth = async () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      if (isLoggedIn && isAuthenticated) {
        try {
          await dispatch(refreshToken()).unwrap();
        } catch (error) {
          await dispatch(logout());
        }
      }
    };

    checkAuth();
  }, [dispatch, isAuthenticated]);

  return isAuthenticated;
};
