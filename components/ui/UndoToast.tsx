"use client";

import { useEffect, useState } from "react";

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onExpire: () => void;
  duration?: number;
}

export function UndoToast({
  message,
  onUndo,
  onExpire,
  duration = 5000,
}: UndoToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onExpire();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onExpire]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        setVisible(false);
        onUndo();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onUndo]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-lg bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 shadow-lg">
      <span className="text-sm text-white dark:text-zinc-900">{message}</span>
      <button
        onClick={() => {
          setVisible(false);
          onUndo();
        }}
        className="text-sm font-medium text-zinc-300 hover:text-white dark:text-zinc-600 dark:hover:text-zinc-900 underline"
      >
        Undo
      </button>
    </div>
  );
}
