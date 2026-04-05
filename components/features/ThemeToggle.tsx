"use client";

import { useCallback, useEffect, useState } from "react";
import {
  applyDomTheme,
  getStoredTheme,
  setStoredTheme,
  type ThemeMode,
} from "../../lib/theme";

const modes: ThemeMode[] = ["light", "system", "dark"];

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

const icons: Record<ThemeMode, () => React.ReactNode> = {
  light: SunIcon,
  system: MonitorIcon,
  dark: MoonIcon,
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
          aria-label={m}
          className={`rounded-md p-1.5 transition-colors ${
            mode === m
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          }`}
        >
          {icons[m]()}
        </button>
      ))}
    </div>
  );
}
