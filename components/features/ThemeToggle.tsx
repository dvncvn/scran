"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyDomTheme,
  getStoredTheme,
  setStoredTheme,
  type ThemeMode,
} from "../../lib/theme";

const modes: ThemeMode[] = ["light", "system", "dark"];

const labels: Record<ThemeMode, string> = {
  light: "Light",
  system: "System",
  dark: "Dark",
};

interface ThemeToggleProps {
  /** Tighter styling when fixed on auth screens */
  compact?: boolean;
}

export function ThemeToggle({ compact }: ThemeToggleProps) {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const stored = getStoredTheme();
    setMode(stored);
    applyDomTheme(stored);
  }, []);

  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyDomTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  const select = useCallback((next: ThemeMode) => {
    setMode(next);
    setStoredTheme(next);
    applyDomTheme(next);
  }, []);

  return (
    <div
      className={
        compact
          ? "flex rounded-lg border border-zinc-200 bg-white/90 p-0.5 shadow-sm backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/90"
          : "flex rounded-lg border border-zinc-200 bg-zinc-50/80 p-0.5 dark:border-zinc-700 dark:bg-zinc-900/50"
      }
      role="group"
      aria-label="Color theme"
    >
      {modes.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => select(m)}
          aria-pressed={mode === m}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            mode === m
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          } ${compact ? "px-1.5" : ""}`}
        >
          {labels[m]}
        </button>
      ))}
    </div>
  );
}
