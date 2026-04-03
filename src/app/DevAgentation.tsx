"use client";

import { useEffect, useRef } from "react";
import { Agentation } from "agentation";

const AUTO_EXPAND_SESSION_KEY = "scran-agentation-auto-expanded";

/**
 * Agentation has no defaultOpen prop. Once per dev session, expand the toolbar
 * after mount so feedback controls start visible (bottom-right via globals.css).
 */
export function DevAgentation() {
  const done = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || done.current) return;
    try {
      if (sessionStorage.getItem(AUTO_EXPAND_SESSION_KEY) === "1") {
        done.current = true;
        return;
      }
    } catch {
      /* private mode */
    }

    let attempts = 0;
    const maxAttempts = 40;

    const tryExpand = () => {
      const toolbar = document.querySelector("[data-agentation-toolbar]");
      const panel = toolbar?.firstElementChild;
      if (panel instanceof HTMLElement && panel.tabIndex === 0) {
        panel.click();
        done.current = true;
        try {
          sessionStorage.setItem(AUTO_EXPAND_SESSION_KEY, "1");
        } catch {
          /* ignore */
        }
        return;
      }
      if (attempts++ < maxAttempts) {
        requestAnimationFrame(tryExpand);
      }
    };

    requestAnimationFrame(tryExpand);
  }, []);

  return <Agentation />;
}
