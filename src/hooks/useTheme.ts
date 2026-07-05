import { useState, useEffect } from 'react';
import { getSavedTheme, saveThemeSetting } from '../utils/storage';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getSavedTheme());

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.backgroundColor = '#09090b';
    } else {
      root.classList.remove('dark');
      root.style.backgroundColor = '#f8fafc';
    }
    saveThemeSetting(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, setTheme, toggleTheme };
}
