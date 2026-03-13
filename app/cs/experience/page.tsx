"use client";

import { rocketPaths } from "@/svgs/rocketPaths";
import LeftInfoBox from "@/components/LeftInfoBox";
import RightInfoBox from "@/components/RightInfoBox";
import GlassTitle from "@/components/GlassTitle";
import { fpgaPaths } from "@/svgs/fpgaPaths";
import { dronesPaths } from "@/svgs/dronesPaths";
import { thrusterPaths } from "@/svgs/thrusterPaths";
import { cpuPaths } from "@/svgs/cpuPaths";

export default function ResearchPage() {
  return (
    <div className="flex flex-col gap-12 md:gap-28 pb-[10vh]">
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
      <LeftInfoBox
        title="Software Engineering Intern"
        company="DZYNE Technologies"
        role="Embedded Systems & Full-Stack"
        description="DZYNE builds defense systems at the intersection of autonomy and embedded hardware. I joined a small engineering team working on anti-drone software. My main role wasrefactoring C and C++ modules to be more modular, rebuilding the Python test infrastructure, and ultimately designing and shipping an internal full-stack GUI that gave operators real-time control over the entire test workflow. The goal was to make the team move faster with less friction, and every project tied directly back to that."
        svgPaths={dronesPaths}
        svgSize={60}
        svgDrawDuration={3}
        extraInfo={{
          startDate: "Mar 2025",
          endDate: "Sep 2025",
          techStack: "Python, C, C++, SQL, React",
          location: "Portland, OR",
          industry: "Defense Technology",
        }}
      />
      <RightInfoBox
        title="Undergraduate Researcher"
        company="Plasma, Energy, and Space Propulsion Laboratory"
        role="Signal Processing & ML"
        description="The PESP Lab applies plasma physics to problems in aerospace propulsion and cancer treatment. My work sat at the intersection of ML and signal processing. I spent time making clean diagnostic signals out of high-noise environments and building predictive models from large experimental datasets. The research mission is to make plasma systems more efficient and to make them more precisely controlled. I contributed to that across both the thruster and biomedical sides of the lab."
        svgPaths={thrusterPaths}
        svgDrawDuration={6}
        svgSize={75}
        svgRotate={45}
        svgOffset={{ x: -5, y: 50 }}
        extraInfo={{
          startDate: "May 2024",
          endDate: "Jun 2026",
          techStack: "MATLAB, Python, OR-tools",
          location: "Corvallis, OR",
          industry: "Aerospace Research",
        }}
      />
      <LeftInfoBox
        title="Undergraduate Researcher"
        company="Jason Clark Research Group"
        role="FPGA & DSP Engineering"
        description="The Jason Clark Research Group pushes the limits of precision sensing at the micro and nano scale. I worked on the hardware side. I spent my time designing VHDL modules for FPGA-based signal processing so the lab could acquire and characterize nano-ampere signals that were previously impossible to measure. From writing testbenches to integrating damping algorithms via Hardware-in-the-Loop, the work was about giving researchers reliable, stable data they could actually trust."
        svgPaths={fpgaPaths}
        svgSize={65}
        svgOffset={{ x: -45, y: 10 }}
        svgDrawDuration={4}
        extraInfo={{
          startDate: "Feb 2024",
          endDate: "Mar 2025",
          techStack: "VHDL, FPGA, Moku",
          location: "Corvallis, OR",
          industry: "Electrical Engineering Research",
        }}
      />
      <div style={{ height: 100 /* or whatever fits your bubble */ }} />
    </div>
  );
}
