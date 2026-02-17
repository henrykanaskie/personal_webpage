"use client";

import { useRef, useCallback } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import AnimatedSvg from "./AnimatedSvg";

interface LeftInfoBoxProps {
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
        className="bg-[rgba(255,255,255,0.5)] [.dark_&]:bg-[rgba(39,39,39,0.55)]"
      />
      <span style={{ position: "relative", zIndex: 1 }}>{children}</span>
    </span>
  );
};

export default function LeftInfoBox({
  title,
  company,
  role,
  description,
  svgPaths, // Use the passed-in paths
}: LeftInfoBoxProps) {
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
      initial={{ opacity: 0, x: -20, y: 10 }}
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
        marginLeft: "5%",

        // "Clear Glass" Visual Styles
        background:
          "linear-gradient(120deg, rgba(12, 11, 11, 0.1) 0%, rgba(17, 16, 16, 0.05) 20%, rgba(0, 0, 0, 0.01) 100%)",
        backdropFilter: "blur(1.5px)",
        WebkitBackdropFilter: "blur(1px)",

        // Borders (mimicking light source from top-left)
        border: "1px solid rgba(12,11,11, 0.01)",
        borderTop: "1px solid rgba(12, 11, 11, 0.01)",
        borderLeft: "1px solid rgba(20, 19, 19, 0.01)",

        // Depth and Inner Volume
        boxShadow:
          "0 4px 30px rgba(0, 0, 0, 0.05), inset 0 0 20px rgba(255, 255, 255, 0.1)",
      }}
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
          background:
            "linear-gradient(105deg, transparent 20%, rgba(255, 255, 255, 0.2) 25%, transparent 30%)",
          pointerEvents: "none",
          opacity: 0.5,
          zIndex: 0,
        }}
      />

      {/* SVG positioned in the top right corner */}
      <div
        style={{
          position: "absolute",
          top: "-250px",
          right: "-250px",
          transformOrigin: "top right",
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
        >
          <FuzzyText>{company}</FuzzyText>
        </h3>
        <h4
          style={{
            marginTop: 0,
            marginBottom: "16px",
            fontSize: "16px",
            color: "#555",
            textAlign: "center",
          }}
        >
          <FuzzyText>{role}</FuzzyText>
        </h4>
        <p
          style={{
            marginTop: 0,
            marginBottom: 0,
            fontSize: "14px",
          }}
        >
          <FuzzyText>{description}</FuzzyText>
        </p>
      </div>
    </motion.div>
  );
}
