import { useEffect, useRef } from "react";
import { useAuth } from "@/actions/useAuth";

const INACTIVITY_TIMEOUT = 3600 * 1000; // 1 hour in milliseconds

export const useInactivityTimeout = () => {
  const { logout } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Only set timer if user is logged in
    if (localStorage.getItem("isLoggedIn") === "true") {
      timerRef.current = setTimeout(() => {
        console.warn("User inactive for too long, logging out");
        logout();
      }, INACTIVITY_TIMEOUT);
    }
  };

  useEffect(() => {
    // Events that indicate user activity
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Add event listeners to reset timer on user activity
    activityEvents.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    // Initial timer setup
    resetTimer();

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      activityEvents.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [logout]);

  return null;
};
