import { create } from 'zustand';

interface ThemeStore {
  isDark: boolean;
  toggleDarkMode: () => void;
}

const getInitialTheme = () => {
  const saved = localStorage.getItem('theme');
  if (saved) return saved === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

const applyTheme = (isDark: boolean) => {
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  document.documentElement.classList.toggle('dark', isDark);
};

export const useThemeStore = create<ThemeStore>((set) => {
  const isDark = getInitialTheme();
  applyTheme(isDark);

  return {
    isDark,
    toggleDarkMode: () =>
      set((state) => {
        const newValue = !state.isDark;
        applyTheme(newValue);
        return { isDark: newValue };
      }),
  };
});
