import { useEffect } from "react";
import { useAppDispatch } from "./useStore";
import { clearMessage } from "@/store/slices/authSlice";
import { MessageState } from "@/routes/types";

export const useAutoDismiss = (
  message: MessageState | null,
  duration: number = 5200,
) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        dispatch(clearMessage());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, duration, dispatch]);
};
