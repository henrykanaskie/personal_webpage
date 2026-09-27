"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useContext, useRef, useCallback, useLayoutEffect } from "react";
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
  return p.startsWith("/photography");
}

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  const onExitComplete = useCallback(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  // Single AnimatePresence for all routes.
  //   - Photography: the old page snaps away so photo-to-photo navigation has no
  //     double-load feel, and the new page fades in.
  //   - Everything else: the page lifts and fades quickly while the dot field
  //     (a separate, persistent layer) stays put and replays its configure wave
  //     from the click, so the paper never blinks between pages. The new page
  //     then rises into place on a critically damped spring.
  const photo = isFullScreenPath(pathname);
  return (
    <AnimatePresence mode="wait" onExitComplete={onExitComplete}>
      <motion.div
        key={pathname}
        initial={photo ? { opacity: 0 } : { opacity: 0, y: 18 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: photo
            ? { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
            : { opacity: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }, y: { type: "spring", stiffness: 140, damping: 24 } },
        }}
        exit={
          photo
            ? { opacity: 0, transition: { duration: 0 } }
            : { opacity: 0, y: -10, transition: { duration: 0.24, ease: [0.4, 0, 1, 1] } }
        }
      >
        <FrozenRouter>{children}</FrozenRouter>
      </motion.div>
    </AnimatePresence>
  );
}
