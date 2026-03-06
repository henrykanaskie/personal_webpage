"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useContext, useRef, useCallback, useEffect } from "react";
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

  // Single AnimatePresence for all routes.
  // Exit duration is determined by the CURRENT page type at render time:
  //   - Full-screen (home, photography): exit instantly so photo→photo navigation
  //     has no double-load feel — the old page snaps away, new page fades in.
  //   - CS pages: slow 0.6s exit so navigating to any destination (including
  //     the split-screen home) has a deliberate, smooth fade-out.
  return (
    <AnimatePresence mode="wait" onExitComplete={onExitComplete}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
        }}
        exit={{
          opacity: 0,
          transition: {
            duration: isFullScreenPath(pathname) ? 0 : 0.6,
            ease: [0.4, 0, 1, 1],
          },
        }}
      >
        <FrozenRouter>{children}</FrozenRouter>
      </motion.div>
    </AnimatePresence>
  );
}
