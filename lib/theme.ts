export type ThemeMode = "light" | "dark" | "system";
export const THEME_STORAGE_KEY = "tutorme-theme";
export function resolveTheme(mode: ThemeMode, systemDark: boolean): "light" | "dark" {
  return mode === "system" ? (systemDark ? "dark" : "light") : mode;
}
