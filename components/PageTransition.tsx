"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useContext, useRef, useCallback, useLayoutEffect } from "react";
import { LayoutRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { settle } from "@/lib/motion";

function FrozenRouter({ children }: { children: React.ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const frozen = useRef(context).current;
  return (
    <LayoutRouterContext.Provider value={frozen}>
      {children}
    </LayoutRouterContext.Provider>
  );
}

/**
 * One page's wrapper. When its exit finishes, Framer Motion puts back the values it animated
 * (opacity) for the last frame before the page is removed, which flashed the old page back at full
 * strength, already scrolled to the top. So the moment the exit completes, the page is taken out of
 * the render with a property the animation never touches.
 */
function Page({ photo, children }: { photo: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <motion.div
      ref={ref}
      initial={photo ? { opacity: 0 } : { opacity: 0, y: 18 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: photo
          ? { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
          : { opacity: { duration: 0.35, ease: [0.22, 1, 0.36, 1] }, y: settle },
      }}
      exit={
        photo
          ? { opacity: 0, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }
          : { opacity: 0, y: -10, transition: { duration: 0.24, ease: [0.4, 0, 1, 1] } }
      }
      onAnimationComplete={(def) => {
        // only the exit ends at opacity 0
        if ((def as { opacity?: number } | undefined)?.opacity === 0 && ref.current) ref.current.style.display = "none";
      }}
    >
      {children}
    </motion.div>
  );
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
  //   - Photography: the old page dissolves into the darkroom and the new one
  //     fades up out of it. (It used to vanish in a single frame, which read as
  //     a jump; the new page's mount work now lands on a quiet, empty screen.)
  //   - Everything else: the page lifts and fades quickly while the dot field
  //     (a separate, persistent layer) stays put and replays its configure wave
  //     from the click, so the paper never blinks between pages. The new page
  //     then rises into place on a critically damped spring.
  const photo = !!pathname?.startsWith("/photography");
  return (
    <AnimatePresence mode="wait" onExitComplete={onExitComplete}>
      <Page key={pathname} photo={photo}>
        <FrozenRouter>{children}</FrozenRouter>
      </Page>
    </AnimatePresence>
  );
}
