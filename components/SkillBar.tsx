"use client";

import { motion } from "framer-motion";
import { FuzzyText } from "./LeftInfoBox";
import { useIsDark } from "./InfoBubble";

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
              backgroundImage: isDark
                ? `linear-gradient(135deg, rgba(248,250,255,0.96) 0%, rgba(255,248,255,0.93) 50%, rgba(248,250,255,0.95) 100%)`
                : `linear-gradient(135deg, rgba(10,10,20,0.95) 0%, rgba(25,15,35,0.92) 50%, rgba(12,18,30,0.94) 100%)`,
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
            backgroundImage: isDark
              ? "linear-gradient(90deg, rgb(180,200,255) 0%, rgb(210,185,230) 15%, rgb(180,210,235) 30%, rgb(215,190,215) 45%, rgb(170,200,230) 60%, rgb(200,185,225) 75%, rgb(180,195,235) 90%, rgb(210,185,220) 100%)"
              : "linear-gradient(90deg, rgb(100,115,145) 0%, rgb(125,110,135) 15%, rgb(105,130,150) 30%, rgb(130,115,130) 45%, rgb(100,125,145) 60%, rgb(120,110,140) 75%, rgb(105,120,148) 90%, rgb(128,115,135) 100%)",
            boxShadow: isDark
              ? "0 0 10px rgba(180,200,255,0.25), inset 0 1px 0 rgba(255,255,255,0.2)"
              : "0 0 8px rgba(100,115,145,0.2), inset 0 1px 0 rgba(255,255,255,0.3)",
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
