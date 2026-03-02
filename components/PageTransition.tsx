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

export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const scrollYRef = useRef(0);

  // Disable browser scroll restoration so the page doesn't snap to top mid-animation
  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Freeze the page in place during exit so components slide out from
  // their current visual positions instead of snapping to the top first.
  const onExitStart = useCallback(() => {
    scrollYRef.current = window.scrollY;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollYRef.current}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
  }, []);

  const onExitComplete = useCallback(() => {
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    window.scrollTo(0, 0);
  }, []);

  return (
    <AnimatePresence
      mode="wait"
      onExitComplete={onExitComplete}
    >
      <motion.div
        key={pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: 0.35, ease: "easeOut" } }}
        exit={{
          opacity: 0,
          transition: { duration: 0.6, ease: [0.4, 0, 1, 1] },
        }}
        onAnimationStart={(def) => {
          if (typeof def === "object" && "opacity" in def && def.opacity === 0) {
            onExitStart();
          }
        }}
      >
        <FrozenRouter>{children}</FrozenRouter>
      </motion.div>
    </AnimatePresence>
  );
}
