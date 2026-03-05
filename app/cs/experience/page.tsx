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
        description="Optimized embedded systems for anti-drone software using C and C++, ensuring modularity for future updates and products, cutting development time by 23%.\nRefactored the product automated testing system using Python, increasing testing efficiency by over 40%.\nDeveloped a full-stack GUI with React and Flask that gave operators real-time control of power, tracking, movement, and logging, reducing response time during test runs."
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
        description="Developed an automated capacitor matching network algorithm using Google's OR-tools to dynamically tune impedance, speeding up the matching pipeline by 800%.\nEngineered a high-performance signal denoising pipeline in Python to extract high-fidelity thruster diagnostic data from high-noise environments.\nAccelerated plasma thruster research by 120% through parallelized signal analysis programs in MATLAB.\nEnhanced the predictive resolution of a cancer-focused plasma model by engineering high-dimensional features from 10M+ data points, improving model accuracy by 33%."
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
        description="Developed VHDL modules for FPGA-based Digital Signal Processing to isolate and filter nano-ampere signals, achieving high-fidelity data acquisition for micro-sensor characterization.\nIntegrated artificial damping algorithms using Hardware-in-the-Loop testing with Moku instrumentation, improving sensor stability and reducing mechanical noise.\nDesigned comprehensive VHDL testbenches to simulate and validate signal responses, shortening the hardware debugging phase by facilitating rapid iterative prototyping."
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
