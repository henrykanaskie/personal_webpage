"use client";

import { useRef, useCallback } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import AnimatedSvg from "./AnimatedSvg";

interface RightInfoBoxProps {
  title: string;
  company: string;
  role: string;
  description: string;
  svgPaths: string[]; // The SVG paths are now a required prop
}

// Helper component for fuzzy text background
const FuzzyText = ({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) => {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        zIndex: 1,
        ...style,
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: "-10px",
          zIndex: -1,
          filter: "blur(12px)",
          borderRadius: "15px",
        }}
        className="bg-[rgba(255,255,255,0.5)] [.dark_&]:bg-[rgba(29,29,29,0.5)]"
      />
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    </span>
  );
};

export default function RightInfoBox({
  title,
  company,
  role,
  description,
  svgPaths, // Use the passed-in paths
}: RightInfoBoxProps) {
  const boxRef = useRef<HTMLDivElement>(null);

  // SVG draw progress — animated on viewport enter/leave, every time
  const svgProgress = useMotionValue(0);
  const drawTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onViewportEnter = useCallback(() => {
    // Cancel any pending delayed draw from a previous enter
    if (drawTimer.current) clearTimeout(drawTimer.current);
    // Animate from wherever it currently is (no hard reset)
    drawTimer.current = setTimeout(() => {
      animate(svgProgress, 1, { duration: 3, ease: "easeInOut" });
      drawTimer.current = null;
    }, 600);
  }, [svgProgress]);

  const onViewportLeave = useCallback(() => {
    // Cancel any pending draw so it doesn't fire after we've left
    if (drawTimer.current) clearTimeout(drawTimer.current);
    drawTimer.current = null;
    // Undraw from wherever it currently is
    animate(svgProgress, 0, { duration: 1.8, ease: "easeInOut" });
  }, [svgProgress]);

  return (
    <motion.div
      ref={boxRef}
      initial={{ opacity: 0, x: 20, y: 10 }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      onViewportEnter={onViewportEnter}
      onViewportLeave={onViewportLeave}
      viewport={{
        once: false,
        amount: 0.15,
        margin: "-100px 0px -100px 0px",
      }}
      transition={{
        duration: 1.2,
        ease: "easeInOut",
      }}
      style={{
        position: "relative",
        // Geometry
        borderRadius: "24px", // rounded-3xl
        padding: "32px", // p-8
        maxWidth: "650px",
        minHeight: "250px",
        alignSelf: "flex-end",
        marginRight: "5%",
        backdropFilter: "blur(1px)",
        WebkitBackdropFilter: "blur(1px)",
      }}
      className="
        bg-[linear-gradient(120deg,rgba(80,150,255,0.07)_0%,rgba(80,150,255,0.03)_20%,rgba(80,150,255,0.008)_100%)]
        border border-[rgba(80,150,255,0.35)]
border-t-[rgba(120,180,255,0.27)]
border-l-[rgba(120,180,255,0.27)]
        shadow-[0_4px_30px_rgba(0,0,0,0.05),inset_0_0_20px_rgba(255,255,255,0.1)]

        [.dark_&]:bg-[linear-gradient(120deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.03)_23%,rgba(255,255,255,0.008)_100%)]
        [.dark_&]:border-[rgba(255,255,255,0.35)]
        [.dark_&]:border-t-[rgba(255,255,255,0.23)]
        [.dark_&]:border-l-[rgba(255,255,255,0.23)]"
    >
      {/* Glare/Reflection Element (Simulates the ::after pseudo-element) */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "100%",
          borderRadius: "inherit",
          pointerEvents: "none",
          opacity: 0.5,
          zIndex: 0,
        }}
        className="b-[linear-gradient(120deg, transparent 20%, rgba(255, 255, 255, 0.1) 40%, transparent 50%)][.dark_&]: bg-[linear-gradient(120deg, transparent 20%, rgba(255, 255, 255, 0.1) 40%, transparent 50%)]"
      />

      {/* SVG positioned on the opposite side from alignment */}
      <div
        style={{
          position: "absolute",
          top: "-250px",
          left: "-250px",
          transformOrigin: "top left",
          pointerEvents: "auto",
        }}
      >
        <AnimatedSvg
          paths={svgPaths}
          size={600}
          strokeWidth={0.8}
          scrollProgress={svgProgress}
        />
      </div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <h2
          style={{
            marginTop: 0,
            marginBottom: "8px",
            fontSize: "24px",
            textAlign: "center",
          }}
          className="text-black dark:text-white"
        >
          <FuzzyText>{title}</FuzzyText>
        </h2>
        <h3
          style={{
            marginTop: 0,
            marginBottom: "4px",
            fontSize: "18px",
            textAlign: "center",
          }}
          className="text-black dark:text-gray-200"
        >
          <FuzzyText>{company}</FuzzyText>
        </h3>
        <h4
          style={{
            marginTop: 0,
            marginBottom: "16px",
            fontSize: "16px",
            textAlign: "center",
          }}
          className="text-[#555] dark:text-gray-300"
        >
          <FuzzyText>{role}</FuzzyText>
        </h4>
        <p
          style={{
            marginTop: 0,
            marginBottom: 0,
            fontSize: "14px",
          }}
          className="text-inherit dark:text-white"
        >
          <FuzzyText>{description}</FuzzyText>
        </p>
      </div>
    </motion.div>
  );
}
