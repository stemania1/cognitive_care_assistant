export const THEME_STORAGE_KEY = "cca-theme";

export function readThemeIsDark(): boolean {
  if (typeof document === "undefined") return true;
  return document.documentElement.classList.contains("dark");
}

export function setThemeIsDark(isDark: boolean): void {
  document.documentElement.classList.toggle("dark", isDark);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
  } catch {
    /* ignore */
  }
}
