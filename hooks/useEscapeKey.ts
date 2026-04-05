import { useEffect, useRef } from "react";

/** Calls `onEscape` when Escape is pressed while `enabled` is true. */
export function useEscapeKey(onEscape: () => void, enabled: boolean) {
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onEscapeRef.current();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [enabled]);
}
