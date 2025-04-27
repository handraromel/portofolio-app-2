import { useEffect, useState, useRef } from "react";
import { useAppSelector } from "./useStore";
import { useAuth } from "@/actions/useAuth";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { useNavigate, useLocation } from "react-router-dom";

interface JWTPayload {
  exp: number;
}

export const useAuthCheck = () => {
  const { refreshToken, logout } = useAuth();
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const refreshAttempted = useRef(false);
  const lastCheckedPath = useRef<string | null>(null);
  const navigateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const publicPaths = [
    "/login",
    "/register",
    "/forgot-password",
    "/activate-account",
  ];

  const isPublicPath = () => {
    return publicPaths.some(
      (path) =>
        location.pathname === path ||
        location.pathname.startsWith("/activate-account/"),
    );
  };

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
      // Reset refreshAttempted when path changes
      if (location.pathname !== lastCheckedPath.current) {
        refreshAttempted.current = false;
        lastCheckedPath.current = location.pathname;
      }

      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

      // If not logged in and not on a public path, redirect to login
      if (!isLoggedIn && !isPublicPath()) {
        // Save current path for redirecting back after login
        localStorage.setItem("redirectAfterLogin", location.pathname);

        // Clear any pending navigations
        if (navigateTimeout.current) {
          clearTimeout(navigateTimeout.current);
        }

        // Debounce navigation to prevent rapid calls
        navigateTimeout.current = setTimeout(() => {
          navigate("/login");
        }, 100);

        if (isSubscribed) setIsChecking(false);
        return;
      }

      // If logged in, check token validity
      if (isLoggedIn) {
        try {
          // Only attempt refresh if the token is expired AND we haven't tried yet
          if (isTokenExpired() && !refreshAttempted.current) {
            refreshAttempted.current = true; // Mark that we've attempted refresh
            await refreshToken();
          }
        } catch (error) {
          console.error("Session expired:", error);
          // Clear the refresh flag before logout to prevent loops
          refreshAttempted.current = true;
          await logout();

          // Redirect to login if not on a public path
          if (!isPublicPath()) {
            localStorage.setItem("redirectAfterLogin", location.pathname);

            // Clear any pending navigations
            if (navigateTimeout.current) {
              clearTimeout(navigateTimeout.current);
            }

            // Debounce navigation to prevent rapid calls
            navigateTimeout.current = setTimeout(() => {
              navigate("/login");
            }, 100);
          }
        }
      }

      if (isSubscribed) {
        setIsChecking(false);
      }
    };

    checkAuth();

    return () => {
      isSubscribed = false;
      // Clear timeout on cleanup
      if (navigateTimeout.current) {
        clearTimeout(navigateTimeout.current);
      }
    };
  }, [location.pathname, navigate, refreshToken, logout]);

  return { isAuthenticated, isChecking };
};
