"use client";

import { useEffect, useState } from "react";
import { resolveTheme, THEME_STORAGE_KEY, type ThemeMode } from "@/lib/theme";

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");
  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    // Restore the saved user preference after hydration without changing server markup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored === "light" || stored === "dark" || stored === "system") setMode(stored);
  }, []);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => document.documentElement.dataset.theme = resolveTheme(mode, preference.matches);
    apply();
    preference.addEventListener("change", apply);
    localStorage.setItem(THEME_STORAGE_KEY, mode);
    return () => preference.removeEventListener("change", apply);
  }, [mode]);
  return <label className="theme-control">Theme <select aria-label="Theme preference" value={mode} onChange={(event) => setMode(event.target.value as ThemeMode)}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>;
}
