"use client";
import React from "react";
import { motion } from "framer-motion";
import { Experience } from "@/types/Experience"; // Path to your interface

interface Props {
  experience: Experience;
}

export default function ExperienceCard({ experience }: Props) {
  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      animate="rest"
      className="relative p-6 bg-slate-900/50 text-slate-200 rounded-lg overflow-hidden border border-slate-800"
    >
      {/* The Blueprint SVG Border */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width="100%"
        height="100%"
      >
        <motion.rect
          x="2"
          y="2"
          width="calc(100% - 4px)"
          height="calc(100% - 4px)"
          rx="8" // Matches the rounded corners of the div
          fill="transparent"
          stroke="#38bdf8" // A "blueprint cyan" color
          strokeWidth="2"
          strokeDasharray="0 1"
          variants={{
            rest: { pathLength: 0, opacity: 0 },
            hover: { pathLength: 1, opacity: 1 },
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </svg>

      {/* Content Layer */}
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-mono font-bold text-sky-400">
            {experience.title}
          </h3>
          <span className="text-xs font-mono text-slate-500">
            {experience.startDate.getFullYear()} —{" "}
            {experience.endDate?.getFullYear() || "PRESENT"}
          </span>
        </div>

        <p className="text-sm text-slate-400 mb-4">{experience.description}</p>

        {/* Tech Stack Tags */}
        <div className="flex flex-wrap gap-2">
          {experience.technologies.map((tech) => (
            <span
              key={tech}
              className="px-2 py-1 text-[10px] font-mono bg-sky-900/30 border border-sky-500/30 text-sky-300 rounded"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
