"use client";

import { motion, MotionValue } from "framer-motion";

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
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: "relative",
      }}
    >
      <svg
        viewBox="500 300 136 112"
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
