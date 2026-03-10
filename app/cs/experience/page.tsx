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
        description="Reduced embedded system development time by 23% by refactoring anti-drone software modules in C and C++ for improved modularity and reuse across future product lines.\nIncreased automated testing efficiency by over 40% by restructuring the Python-based test framework, reducing manual intervention and accelerating release cycles.\nEliminated a 3+ minute operator workflow by building a full-stack GUI in React and Flask with real-time control of power, tracking, movement, and logging — reducing test-run response time to under 30 seconds."
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
        description="Sped up impedance matching by 800% by developing an automated capacitor tuning algorithm with Google's OR-tools, dynamically maximizing power coupling and reducing reflected power in RF plasma systems.\nOutperformed the industry-standard denoising filter by 80% by engineering a high-performance Python pipeline, extracting high-fidelity thruster health data from high-noise environments.\nAccelerated plasma thruster analysis by 120% by implementing parallelized signal processing programs in MATLAB, enabling faster experimental iteration.\nBoosted cancer-focused plasma model accuracy by 33% by engineering high-dimensional features from 10M+ data points across diverse treatment parameters."
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
        description="Enabled nano-ampere signal acquisition for the first time in the lab by developing VHDL modules for FPGA-based DSP, unlocking precise characterization of previously unmeasurable micro-sensors.\nImproved sensor stability by integrating artificial damping algorithms via Hardware-in-the-Loop testing with Moku instrumentation, reducing mechanical noise across multiple test configurations.\nAccelerated hardware debugging by designing comprehensive VHDL testbenches that simulated and validated signal responses, enabling rapid iterative prototyping."
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
