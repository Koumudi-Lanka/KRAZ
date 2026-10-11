
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type Theme = "dark" | "light";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("kraz-theme");

    const initialTheme: Theme =
      savedTheme === "light" || savedTheme === "dark"
        ? savedTheme
        : "dark";

    document.documentElement.dataset.theme = initialTheme;

    if (initialTheme !== "dark") {
      const frame = window.requestAnimationFrame(() => {
        setThemeState(initialTheme);
      });

      return () => window.cancelAnimationFrame(frame);
    }
  }, []);

  function setTheme(nextTheme: Theme) {
    setThemeState(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("kraz-theme", nextTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
