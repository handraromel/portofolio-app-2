import React, { useState, useCallback, useRef, useEffect } from "react";

interface UseNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UseNavigationReturn {
  navRef: React.RefObject<HTMLDivElement | null>;
  openSubMenus: Record<string, boolean>;
  toggleSubMenu: (id: string) => void;
  handleDrag: (e: TouchEvent) => void;
  isDragging: boolean;
}

export const useNavigation = ({
  isOpen,
  onClose,
}: UseNavigationProps): UseNavigationReturn => {
  const navRef = useRef<HTMLDivElement>(null);
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);

  const toggleSubMenu = useCallback((id: string) => {
    setOpenSubMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleDrag = useCallback(
    (e: TouchEvent) => {
      if (!isOpen || window.innerWidth >= 1024) return;

      const touch = e.touches[0];
      const diff = touch.clientX - startX;

      if (diff < 0) {
        if (navRef.current) {
          navRef.current.style.transform = `translateX(${diff}px)`;
        }
        setCurrentX(diff);
      }
    },
    [isOpen, startX],
  );

  const handleTouchStart = useCallback((e: TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (currentX < -50) {
      onClose();
    }
    if (navRef.current) {
      navRef.current.style.transform = "";
    }
    setCurrentX(0);
  }, [currentX, onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        navRef.current &&
        !navRef.current.contains(event.target as Node) &&
        window.innerWidth < 1024
      ) {
        onClose();
      }
    };

    if (navRef.current) {
      const nav = navRef.current;
      nav.addEventListener("touchstart", handleTouchStart);
      nav.addEventListener("touchmove", handleDrag);
      nav.addEventListener("touchend", handleTouchEnd);
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      if (navRef.current) {
        const nav = navRef.current;
        nav.removeEventListener("touchstart", handleTouchStart);
        nav.removeEventListener("touchmove", handleDrag);
        nav.removeEventListener("touchend", handleTouchEnd);
      }
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose, handleDrag, handleTouchStart, handleTouchEnd]);

  return {
    navRef,
    openSubMenus,
    toggleSubMenu,
    handleDrag,
    isDragging,
  };
};
