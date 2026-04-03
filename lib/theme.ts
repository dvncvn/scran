export const THEME_STORAGE_KEY = "scran-theme";

export type ThemeMode = "light" | "dark" | "system";

export function resolveDark(mode: ThemeMode): boolean {
  if (typeof window === "undefined") return false;
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* private mode */
  }
  return "system";
}

export function setStoredTheme(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function applyDomTheme(mode: ThemeMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolveDark(mode));
}
