"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import LoadingScreen from "@/components/layout/LoadingScreen";

export const NAVIGATION_START_EVENT = "party-play:navigation-start";

export default function NavigationLoading() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [loadingPathname, setLoadingPathname] = useState("");
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearTimers = () => {
      if (showTimer.current) clearTimeout(showTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      showTimer.current = null;
      hideTimer.current = null;
    };

    const begin = () => {
      clearTimers();
      const startPathname = window.location.pathname;
      showTimer.current = setTimeout(() => {
        setLoadingPathname(startPathname);
        setVisible(true);
      }, 120);
      hideTimer.current = setTimeout(() => setVisible(false), 1200);
    };

    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank" || link.hasAttribute("download")) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.href === window.location.href) return;
      begin();
    };

    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener(NAVIGATION_START_EVENT, begin);
    return () => {
      clearTimers();
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener(NAVIGATION_START_EVENT, begin);
    };
  }, []);

  return visible && loadingPathname === pathname ? <LoadingScreen overlay /> : null;
}
