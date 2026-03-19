"use client";

import { motion } from "framer-motion";
import { FuzzyText, useIsDark } from "../lib/glass";
import { cs, themed } from "../lib/tokens";

interface SkillBarProps {
  name: string;
  level: number; // 0–100
}

export default function SkillBar({ name, level }: SkillBarProps) {
  const isDark = useIsDark();

  return (
    <div className="flex items-center gap-3 md:gap-4 py-3">
      {/* Skill name */}
      <div className="w-[90px] md:w-[120px] shrink-0 text-right">
        <FuzzyText>
          <span
            className="bg-clip-text text-transparent font-[family-name:var(--font-elevated)]"
            style={{
              WebkitBackgroundClip: "text",
              backgroundImage: themed(isDark, cs.bodyShort.dark, cs.bodyShort.light),
              fontSize: "clamp(0.8rem, 1.1vw, 0.95rem)",
              fontWeight: 600,
              letterSpacing: "-0.01em",
            }}
          >
            {name}
          </span>
        </FuzzyText>
      </div>

      {/* Track */}
      <div className="flex-1 relative h-[14px] md:h-[18px] rounded-full overflow-hidden">
        {/* Background track */}
        <div
          className="absolute inset-0 rounded-full bg-black/[0.06] dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.1]"
        />

        {/* Fill bar */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${level}%` }}
          transition={{ duration: 1.2, ease: [0.25, 1, 0.5, 1], delay: 0.3 }}
          style={{
            backgroundImage: themed(isDark, cs.iridescentHorizontal.dark, cs.iridescentHorizontal.light),
            boxShadow: themed(isDark, cs.skillBarShadow.dark, cs.skillBarShadow.light),
          }}
        />
      </div>

      {/* Percentage */}
      <div className="w-[36px] shrink-0">
        <FuzzyText>
          <span
            className="text-black/40 dark:text-white/40"
            style={{
              fontSize: "clamp(0.65rem, 0.9vw, 0.75rem)",
              fontFamily: "monospace",
              letterSpacing: "0.02em",
            }}
          >
            {level}%
          </span>
        </FuzzyText>
      </div>
    </div>
  );
}
