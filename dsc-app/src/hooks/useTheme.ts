import { useEffect } from "react";
import { useAppSelector } from "./useStore";

export const useTheme = () => {
  const isDarkMode = useAppSelector((state) => state.theme.isDarkMode);

  useEffect(() => {
    // Handle Tailwind dark mode
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Handle PrimeReact theme
    const linkElement = document.getElementById(
      "prime-theme",
    ) as HTMLLinkElement;
    const theme = isDarkMode ? "lara-dark-indigo" : "lara-light-indigo";

    if (!linkElement) {
      const link = document.createElement("link");
      link.id = "prime-theme";
      link.rel = "stylesheet";
      link.href = `https://cdn.jsdelivr.net/npm/primereact@10.5.1/resources/themes/${theme}/theme.css`;
      document.head.appendChild(link);
    } else {
      linkElement.href = `https://cdn.jsdelivr.net/npm/primereact@10.5.1/resources/themes/${theme}/theme.css`;
    }
  }, [isDarkMode]);
};
