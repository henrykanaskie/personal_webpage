"use client";

import GlassTitle from "@/components/GlassTitle";
import ProjectCard, { ProjectCardProvider } from "@/components/ProjectCard";
import { beePaths } from "@/svgs/beePaths";
import { nnPaths } from "@/svgs/nnPaths";
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
      "Oregon's native bee populations are declining, and the hardest part of habitat restoration is knowing which plants to actually put in the ground. This project tackled that problem by building a recommendation engine on top of the Oregon Bee Atlas that models bee-flower relationships as a sparse matrix and uses truncated SVD to surface the most ecologically relevant plant species for a given area. The goal was a tool land managers could actually use to make decisions.",
    deployment: {
      progress: 100,
    },
    svgs: [
      {
        paths: beePaths,
        corner: "top-left" as const,
        size: 75,
        rotate: -10,
        offset: { x: 25, y: -20 },
        drawDuration: 3,
      },
    ],
  },
  {
    title: "Character Classification Neural Network — From Scratch",
    techStack: "Python, NumPy, Pandas",
    description:
      "The goal here was understanding. I didn't want to just get a model to work, but know exactly why it works. I built a feed-forward neural network entirely from scratch, implementing backpropagation, weight initialization, and the full training loop without touching any ML frameworks. Training it on EMNIST handwritten characters and hitting 85% test accuracy was the payoff, but the real value was the intuition built along the way.",
    deployment: {
      progress: 100,
    },
    svgs: [
      {
        paths: nnPaths,
        corner: "top-right" as const,
        size: 60,
        rotate: 0,
        offset: { x: -10, y: 10 },
        drawDuration: 4,
      },
    ],
  },
];

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
                  svgs={project.svgs}
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
