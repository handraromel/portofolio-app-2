import { useEffect, useState } from "react";
import { useAppSelector } from "./useStore";
import { useAuth } from "@/store/actions/useAuth";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";

interface JWTPayload {
  exp: number;
}

export const useAuthCheck = () => {
  const { refreshToken, logout } = useAuth();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [isChecking, setIsChecking] = useState(true);

  const isTokenExpired = () => {
    const accessToken = Cookies.get("csrf_access_token");
    if (!accessToken) return true;

    try {
      const decoded = jwtDecode<JWTPayload>(accessToken);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime + 30;
    } catch {
      return true;
    }
  };

  useEffect(() => {
    let isSubscribed = true;

    const checkAuth = async () => {
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

      if (isLoggedIn) {
        try {
          if (isTokenExpired()) {
            await refreshToken();
          }
        } catch (error) {
          console.error("Session expired:", error);
          await logout();
        }
      }

      if (isSubscribed) {
        setIsChecking(false);
      }
    };

    checkAuth();

    return () => {
      isSubscribed = false;
    };
  }, []);

  return { isAuthenticated, isChecking };
};
