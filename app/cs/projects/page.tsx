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
    title: "Bee Habitat Recommendation System",
    techStack: "Python, React, JavaScript",
    description:
      "Built a full-stack AI recommendation engine using truncated SVD on Oregon Bee Atlas data to predict bee-flower interactions, enabling data-driven habitat restoration for land managers. Modeled complex ecological relationships via sparse matrix factorization, identifying optimal plant species for local bee populations across diverse Oregon ecosystems.",
    deployment: {
      progress: 100,
    },
  },
  {
    title: "Character Classification Neural Network — From Scratch",
    techStack: "Python, NumPy, Pandas",
    description:
      "Built a Feed Forward Neural Network from scratch in Python — no ML frameworks — implementing backpropagation, weight initialization, and hyperparameter tuning by hand; achieved 85% test accuracy on EMNIST.",
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
        <div className="flex flex-col items-center gap-14 md:gap-24 px-4 md:px-[5%]">
          {rows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className="flex flex-col items-center gap-14 md:flex-row md:justify-center md:gap-16 w-full"
            >
              {row.map((project, colIdx) => (
                <ProjectCard
                  key={project.title}
                  title={project.title}
                  techStack={project.techStack}
                  description={project.description}
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
