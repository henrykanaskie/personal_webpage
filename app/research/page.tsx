"use client";

import { rocketPaths } from "@/svgs/rocketPaths";
import LeftInfoBox from "@/components/LeftInfoBox";
import RightInfoBox from "@/components/RightInfoBox";
import GlassTitle from "@/components/GlassTitle";
import { daimlerPaths } from "@/svgs/daimlerPaths";
import { fpgaPaths } from "@/svgs/fpgaPaths";
import { dronesPaths } from "@/svgs/dronesPaths";
import { thrusterPaths } from "@/svgs/thrusterPaths";
import { satPaths } from "@/svgs/satPaths";

export default function ResearchPage() {
  return (
    <div className="flex flex-col gap-12 md:gap-28 pb-[10vh]">
      <GlassTitle
        text="Experience"
        svgPathsLeft={rocketPaths}
        svgPathsRight={satPaths}
        svgRotateLeft={5}
        svgRotateRight={10}
        svgOffsetLeft={{ x: 40, y: 35 }}
        svgOffsetRight={{ x: 10, y: 10 }}
      />
      <LeftInfoBox
        title="Senior Software Engineer"
        company="Tech Corp"
        role="Lead Frontend Developer"
        description="Developed and maintained the company's flagship product, improving performance by 20%.\n Led a team of 5 engineers and collaborated with cross-functional teams to deliver high-quality software solutions.\nImplemented new features based on user feedback, resulting in a 15% increase in user satisfaction."
        svgPaths={dronesPaths}
        svgSize={60}
        svgDrawDuration={3}
        extraInfo={{
          startDate: "Jun 2022",
          endDate: "Present",
          techStack: "React, TypeScript, Python, ROS2",
          location: "Austin, TX",
          industry: "Autonomous Systems",
        }}
      />
      <RightInfoBox
        title="Senior Software Engineer"
        company="Tech Corp"
        role="Lead Frontend Developer"
        description="Developed and maintained the company's flagship product, improving performance by 20%.\n Led a team of 5 engineers and collaborated with cross-functional teams to deliver high-quality software solutions.\nImplemented new features based on user feedback, resulting in a 15% increase in user satisfaction."
        svgPaths={daimlerPaths}
        svgSize={80}
        svgDrawDuration={3}
        extraInfo={{
          startDate: "Jan 2021",
          endDate: "May 2022",
          techStack: "C++, MATLAB, Simulink",
          location: "Stuttgart, DE",
          industry: "Automotive",
        }}
      />
      <LeftInfoBox
        title="Senior Software Engineer"
        company="Tech Corp"
        role="Lead Frontend Developer"
        description="Developed and maintained the company's flagship product, improving performance by 20%.\n Led a team of 5 engineers and collaborated with cross-functional teams to deliver high-quality software solutions.\nImplemented new features based on user feedback, resulting in a 15% increase in user satisfaction."
        svgPaths={thrusterPaths}
        svgDrawDuration={6}
        svgSize={75}
        svgRotate={45}
        svgOffset={{ x: -5, y: 50 }}
        extraInfo={{
          startDate: "Aug 2019",
          endDate: "Dec 2020",
          techStack: "Python, VHDL, FPGA, C",
          location: "Boulder, CO",
          industry: "Aerospace",
        }}
      />
      <RightInfoBox
        title="Senior Software Engineer"
        company="Tech Corp"
        role="Lead Frontend Developer"
        description="Developed and maintained the company's flagship product, improving performance by 20%.\n Led a team of 5 engineers and collaborated with cross-functional teams to deliver high-quality software solutions.\nImplemented new features based on user feedback, resulting in a 15% increase in user satisfaction."
        svgPaths={fpgaPaths}
        svgSize={65}
        svgOffset={{ x: -45, y: 10 }}
        svgDrawDuration={4}
        extraInfo={{
          startDate: "Mar 2018",
          endDate: "Jul 2019",
          techStack: "VHDL, SystemVerilog, Python",
          location: "San Diego, CA",
          industry: "Defense",
        }}
      />
    </div>
  );
}
