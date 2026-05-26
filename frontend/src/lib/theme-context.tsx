'use client';

import { createContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';

export const ThemeContext = createContext<{
  theme: Record<string, string>;
  setTheme: Dispatch<SetStateAction<Record<string, string>>>;
}>({
  theme: {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return {};
    const saved = localStorage.getItem('theme-settings');
    return saved ? JSON.parse(saved) : {};
  });

  // Mapping from theme object keys to CSS variable names
  const themeMap: Record<string, string> = {
    primaryColor: '--primary',
    primaryForeground: '--primary-foreground',
    secondaryColor: '--secondary',
    secondaryForeground: '--secondary-foreground',
    accentColor: '--accent',
    accentForeground: '--accent-foreground',
    backgroundColor: '--background',
    foregroundColor: '--foreground',
    cardColor: '--card',
    cardForeground: '--card-foreground',
    borderColor: '--border',
    mutedColor: '--muted',
    mutedForeground: '--muted-foreground',
  };

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('theme-settings', JSON.stringify(theme));
    // Set CSS variables
    Object.entries(themeMap).forEach(([key, cssVar]) => {
      const value = theme[key];
      if (value !== undefined && value !== null) {
        document.documentElement.style.setProperty(cssVar, value);
      }
    });
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}