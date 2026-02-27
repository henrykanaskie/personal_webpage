"use client";

import GlassTitle from "@/components/GlassTitle";
import ProjectCard, { ProjectCardProvider } from "@/components/ProjectCard";
import { rocketPaths } from "@/svgs/rocketPaths";

// Split children into balanced rows:
// Even N → N/2 per row.  Odd N → floor(N/2) on top, ceil(N/2) on bottom.
function splitIntoRows<T>(items: T[]): T[][] {
  const n = items.length;
  if (n <= 3) return [items];
  const topCount = Math.floor(n / 2);
  return [items.slice(0, topCount), items.slice(topCount)];
}

// Data-driven project list so we can compute layout from count
const projects = [
  {
    title: "Personal Website",
    techStack: "Next.js, TypeScript, Tailwind, Framer Motion",
    description:
      "A glassmorphic portfolio site with animated SVGs, iridescent text, and vapor particle effects. Built to showcase projects and experience with a unique aesthetic.",
    motivation:
      "I wanted a portfolio that felt like looking through frosted glass — something that conveyed both precision and artistry. Every element is designed to feel physical and alive.",
    deployment: {
      githubUrl: "https://github.com/henrykanaskie/personal-website",
      siteUrl: "https://henrykanaskie.com",
      progress: 75,
    },
  },
  {
    title: "Bee Habitat Recommendation System",
    techStack: "Python, React, JavaScript",
    description:
      "A predictive tool for land managers and hobbyists to identify optimal plant species for local bee populations, leveraging sparse matrix factorization to model complex ecological relationships.",
    motivation:
      "Pollinator decline is a real problem. I wanted to build something that turns ecological data into actionable guidance — connecting Oregon Bee Atlas datasets to habitat restoration through a full-stack AI recommendation engine using truncated SVD.",
    deployment: {
      progress: 100,
    },
  },
  {
    title: "Character Classification Neural Network",
    techStack: "Python, NumPy, Pandas",
    description:
      "A Feed Forward Neural Network engineered and trained from scratch to classify handwritten characters from the EMNIST dataset, achieving 85% test accuracy without any deep learning frameworks.",
    motivation:
      "I wanted to understand neural networks at the lowest level — no PyTorch, no TensorFlow, just raw math. Building backpropagation and gradient descent from scratch solidified my understanding of how learning actually works.",
    deployment: {
      progress: 100,
    },
  },
  {
    title: "Small Shell",
    techStack: "C, Linux",
    description:
      "A lightweight, interactive shell for Linux featuring command execution, I/O redirection, background processes, and custom signal handling for SIGINT and SIGTSTP.",
    motivation:
      "Systems programming is where you learn how computers actually work. Building a shell from scratch taught me process management, file descriptors, and signal handling at the OS level.",
    deployment: {
      progress: 100,
    },
  },
] as const;

export default function ProjectsPage() {
  const rows = splitIntoRows([...projects]);

  return (
    <ProjectCardProvider>
      <div className="flex flex-col gap-12 md:gap-20 pb-[10vh]">
        <GlassTitle text="Projects" svgPaths={rocketPaths} />

        {/* Mobile: single column. Desktop: balanced rows */}
        <div className="flex flex-col items-center gap-10 md:gap-16 px-4 md:px-[5%]">
          {rows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className="flex flex-col items-center gap-10 md:flex-row md:justify-center md:gap-12 w-full"
            >
              {row.map((project, colIdx) => (
                <ProjectCard
                  key={project.title}
                  title={project.title}
                  techStack={project.techStack}
                  description={project.description}
                  motivation={project.motivation}
                  deployment={project.deployment}
                  bubbleSide={colIdx < row.length / 2 ? "left" : "right"}
                />
              ))}
            </div>
          ))}
        </div>

        <div style={{ height: 100 }} />
      </div>
    </ProjectCardProvider>
  );
}
