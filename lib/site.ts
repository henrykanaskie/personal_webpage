// ─── Site-wide facts ────────────────────────────────────────────────────────
// Things more than one page states, kept in one place so they can't disagree.

/** The sections of the single-page CS view, in page order (also their element ids). */
export const CS_SECTIONS = ["about", "experience", "projects", "education"] as const;
export type CsSection = (typeof CS_SECTIONS)[number];

/** Section name as shown in navigation. */
export const sectionLabel = (id: CsSection) => id[0].toUpperCase() + id.slice(1);

export const LINKS = {
  linkedin: "https://linkedin.com/in/henry-kanaskie",
  github: "https://github.com/henrykanaskie",
  email: "mailto:kanaskiehenry@gmail.com",
  resumePdf: "/Kanaskie_Henry_Resume.pdf",
} as const;

/** Where to scroll after navigating into /cs (read and cleared by the CS page). */
export const CS_SCROLL_KEY = "csScrollTo";

export function rememberCsSection(id: string) {
  try {
    sessionStorage.setItem(CS_SCROLL_KEY, id);
  } catch {
    // private mode: land at the top instead
  }
}

export const EDUCATION = {
  school: "Oregon State University",
  degree: "M.S. Computer Science",
  timeline: "2026 - Present",
  earlier: { degree: "Honors B.S. Computer Science", timeline: "Sep 2022 - Jun 2026" },
  gpa: "3.95 / 4.0",
  coursework: [
    "Data Structures & Algorithms",
    "Databases",
    "Software Engineering",
    "Artificial Intelligence",
    "Machine Learning",
    "Deep Learning",
  ],
};
