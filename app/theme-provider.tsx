
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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("kraz-theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      setThemeState(savedTheme);
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    document.documentElement.dataset.theme = theme;
    localStorage.setItem("kraz-theme", theme);
  }, [theme, ready]);

  function setTheme(nextTheme: Theme) {
    setThemeState(nextTheme);
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
