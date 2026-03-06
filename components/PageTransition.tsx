"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useContext, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";

function FrozenRouter({ children }: { children: React.ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const frozen = useRef(context).current;
  return (
    <LayoutRouterContext.Provider value={frozen}>
      {children}
    </LayoutRouterContext.Provider>
  );
}

function isFullScreenPath(p: string | null | undefined): boolean {
  if (!p) return false;
  return p === "/" || p.startsWith("/photography");
}

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Capture the EXITING route before the ref updates so exit duration is correct.
  // useLayoutEffect fires after render, so prevPathnameRef.current still holds the
  // old value during the render where pathname changes.
  const prevPathnameRef = useRef(pathname);
  const exitingIsFullScreen = isFullScreenPath(prevPathnameRef.current);
  useLayoutEffect(() => {
    prevPathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  const onExitComplete = useCallback(() => {
    if (!isFullScreenPath(pathname)) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return (
    <AnimatePresence mode="wait" onExitComplete={onExitComplete}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: { duration: 0.3, ease: "easeOut" },
        }}
        exit={{
          opacity: 0,
          transition: {
            // Full-screen pages (home, photography) exit quickly so
            // within-photo navigation doesn't feel like a double-load.
            // Scrollable CS pages exit slower to let content settle.
            duration: exitingIsFullScreen ? 0.2 : 0.6,
            ease: [0.4, 0, 1, 1],
          },
        }}
      >
        <FrozenRouter>{children}</FrozenRouter>
      </motion.div>
    </AnimatePresence>
  );
}
