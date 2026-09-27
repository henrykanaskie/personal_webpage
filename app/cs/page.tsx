"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import GlassTitle from "@/components/GlassTitle";
import InfoBox from "@/components/InfoBox";
import AboutSheet from "@/components/AboutSheet";
import ProjectCard from "@/components/ProjectCard";
import EducationCard from "@/components/EducationCard";
import PartsList from "@/components/PartsList";
import { useIsDark } from "@/hooks/useIsDark";
import { useContactForm } from "@/hooks/useContactForm";
import { CS_SCROLL_KEY, EDUCATION } from "@/lib/site";
import { rocketPaths } from "@/svgs/rocketPaths";
import { cpuPaths } from "@/svgs/cpuPaths";
import { ABOUT, EXPERIENCE, PROJECTS } from "./content";
import SectionIndicator, { useSectionScroll } from "./SectionIndicator";
import ResumeModal from "./ResumeModal";
import ContactModal from "./ContactModal";

function SectionDivider() {
  return (
    <div className="w-full px-[5%] my-12 md:my-24" aria-hidden>
      <div className="dot-rule" />
    </div>
  );
}

// Two cards per row keeps each card at full width and leaves room for the
// side bubbles; a trailing odd card simply centres itself.
const CARDS_PER_ROW = 2;
const PROJECT_ROWS = Array.from({ length: Math.ceil(PROJECTS.length / CARDS_PER_ROW) }, (_, i) =>
  PROJECTS.slice(i * CARDS_PER_ROW, (i + 1) * CARDS_PER_ROW),
);

function ScrollHint({ hidden }: { hidden: boolean }) {
  return (
    <motion.div
      animate={{ opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative z-[1] flex flex-col items-center gap-1 pointer-events-none select-none -mt-4 md:-mt-12"
      style={{ opacity: 1 }}
    >
      <span
        style={{
          color: "var(--ink-2)",
          fontSize: "0.65rem",
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
        }}
      >
        scroll
      </span>
      <motion.div
        className="flex flex-col items-center"
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      >
        {[0, 1].map((i) => (
          <svg
            key={i}
            width="22"
            height="14"
            viewBox="0 0 24 14"
            fill="none"
            style={{
              stroke: "var(--ink)",
              opacity: i === 0 ? 0.6 : 0.28,
              strokeWidth: 2,
              strokeLinecap: "round",
              strokeLinejoin: "round",
              marginTop: i === 1 ? "-4px" : undefined,
            }}
          >
            <polyline points="3 3 12 11 21 3" />
          </svg>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default function CSPage() {
  const isDark = useIsDark();
  const { active, hasScrolled, fillRef } = useSectionScroll();

  const [resumeOpen, setResumeOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const contact = useContactForm();

  // Tell the header to hide its nav while a modal is open
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("csModal", { detail: { open: resumeOpen || emailOpen } }));
  }, [resumeOpen, emailOpen]);

  // Scroll to a section after navigating from another page (e.g. from /resume).
  // Do NOT rely on URL hashes (mobile can preserve them and cause random jumps).
  useEffect(() => {
    history.scrollRestoration = "manual";

    // Clear any stale hash so it can't trigger browser anchor behavior.
    if (window.location.hash) {
      history.replaceState(null, "", "/cs");
    }

    const targetId = sessionStorage.getItem(CS_SCROLL_KEY);
    sessionStorage.removeItem(CS_SCROLL_KEY);

    if (targetId) {
      setTimeout(() => {
        document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
      }, 350);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, []);

  return (
    <div>
      <SectionIndicator active={active} fillRef={fillRef} isDark={isDark} />

      {/* ── About ──────────────────────────────────────────────────────── */}
      <motion.section
        id="about"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, repeat: 0, ease: "easeInOut" }}
        style={{ scrollMarginTop: "80px", position: "relative" }}
        className="flex flex-col items-center gap-12 md:gap-28 pb-[5vh]"
      >
        <AboutSheet
          about={ABOUT}
          onEmail={() => {
            setEmailOpen(true);
            contact.begin();
          }}
          onResume={() => setResumeOpen(true)}
        />
        <ScrollHint hidden={hasScrolled} />
        {resumeOpen && <ResumeModal isDark={isDark} onClose={() => setResumeOpen(false)} />}
        {emailOpen && <ContactModal isDark={isDark} form={contact} onClose={() => setEmailOpen(false)} />}
      </motion.section>

      <SectionDivider />

      {/* ── Experience ─────────────────────────────────────────────────── */}
      <section id="experience" style={{ scrollMarginTop: "80px" }} className="flex flex-col gap-12 md:gap-28 pb-[10vh]">
        <GlassTitle
          text="Experience"
          svgPathsLeft={rocketPaths}
          svgPathsRight={cpuPaths}
          svgRotateLeft={5}
          svgRotateRight={10}
          svgOffsetLeft={{ x: 40, y: 35 }}
          svgOffsetRight={{ x: 10, y: 10 }}
          svgSizeRight={47}
        />
        {EXPERIENCE.map((job) => (
          <InfoBox key={job.company} {...job} />
        ))}
      </section>

      <SectionDivider />

      {/* ── Projects ───────────────────────────────────────────────────── */}
      <section id="projects" style={{ scrollMarginTop: "80px" }} className="flex flex-col gap-12 md:gap-20 pb-[10vh]">
        <GlassTitle text="Projects" />
        <div className="flex flex-col items-center gap-14 md:gap-24 px-4 md:px-[5%]">
          {PROJECT_ROWS.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className="flex flex-col items-center gap-14 md:flex-row md:items-start md:justify-center md:gap-16 w-full"
            >
              {row.map((project, colIdx) => (
                <ProjectCard
                  key={project.title}
                  {...project}
                  bubbleSide={colIdx < row.length / 2 ? "left" : "right"}
                  numCardsInRow={row.length}
                />
              ))}
            </div>
          ))}
        </div>
        <PartsList />
      </section>

      <SectionDivider />

      {/* ── Education ──────────────────────────────────────────────────── */}
      <section id="education" style={{ scrollMarginTop: "80px" }} className="flex flex-col gap-12 md:gap-28 pb-[10vh]">
        <GlassTitle text="Education" />
        <EducationCard {...EDUCATION} />
      </section>

      <div style={{ height: 100 }} />
    </div>
  );
}
