"use client";

import { useState } from "react";
import { motion, MotionValue, useMotionValueEvent } from "framer-motion";

interface AnimatedSvgProps {
  paths: string[];
  size?: number;
  color?: string;
  strokeWidth?: number;
  scrollProgress: MotionValue<number>;
  className?: string;
}

export default function AnimatedSvg({
  paths,
  size = 240,
  color = "#166c8bff",
  strokeWidth = 2,
  scrollProgress,
  className = "",
}: AnimatedSvgProps) {
  // const [debugValue, setDebugValue] = useState(0);

  // useMotionValueEvent(scrollProgress, "change", (latest) => {
  //   setDebugValue(latest);
  // });

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: "relative",
      }}
    >
      {/* DEBUG OVERLAY */}
      {/* <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          background: "rgba(0,0,0,0.7)",
          color: "white",
          fontSize: "12px",
          padding: "4px",
          zIndex: 50,
          pointerEvents: "none",
        }}
      >
        Progress: {debugValue.toFixed(6)}
      </div> */}

      <svg
        viewBox="0 0 1024 572"
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        <g
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {paths.map((path, index) => (
            <motion.path
              key={index}
              d={path}
              initial={{ pathLength: 0 }}
              style={{ pathLength: scrollProgress }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
