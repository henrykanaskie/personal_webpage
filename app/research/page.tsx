"use client";

import { rocketPaths } from "@/svgs/rocket/rocketPaths";
import LeftInfoBox from "@/components/LeftInfoBox";
import RightInfoBox from "@/components/RightInfoBox";

export default function ResearchPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "100px",
        paddingTop: "10vh",
        paddingBottom: "10vh",
      }}
    >
      <LeftInfoBox
        title="Senior Software Engineer"
        company="Tech Corp"
        role="Lead Frontend Developer"
        description="Developed and maintained the company's flagship product, improving performance by 20%.\n Led a team of 5 engineers and collaborated with cross-functional teams to deliver high-quality software solutions.\nImplemented new features based on user feedback, resulting in a 15% increase in user satisfaction."
        svgPaths={rocketPaths}
        extraInfo="This text will appear inside the floating bubble when you click the button!"
      />
      <RightInfoBox
        title="Senior Software Engineer"
        company="Tech Corp"
        role="Lead Frontend Developer"
        description="Developed and maintained the company's flagship product, improving performance by 20%.\n Led a team of 5 engineers and collaborated with cross-functional teams to deliver high-quality software solutions.\nImplemented new features based on user feedback, resulting in a 15% increase in user satisfaction."
        svgPaths={rocketPaths}
        extraInfo="This is extra detail for the right box — the bubble pops out to the left!"
      />
      <LeftInfoBox
        title="Senior Software Engineer"
        company="Tech Corp"
        role="Lead Frontend Developer"
        description="Developed and maintained the company's flagship product, improving performance by 20%.\n Led a team of 5 engineers and collaborated with cross-functional teams to deliver high-quality software solutions.\nImplemented new features based on user feedback, resulting in a 15% increase in user satisfaction."
        svgPaths={rocketPaths}
      />
      <RightInfoBox
        title="Senior Software Engineer"
        company="Tech Corp"
        role="Lead Frontend Developer"
        description="Developed and maintained the company's flagship product, improving performance by 20%.\n Led a team of 5 engineers and collaborated with cross-functional teams to deliver high-quality software solutions.\nImplemented new features based on user feedback, resulting in a 15% increase in user satisfaction."
        svgPaths={rocketPaths}
      />
      <LeftInfoBox
        title="Senior Software Engineer"
        company="Tech Corp"
        role="Lead Frontend Developer"
        description="Developed and maintained the company's flagship product, improving performance by 20%.\n Led a team of 5 engineers and collaborated with cross-functional teams to deliver high-quality software solutions.\nImplemented new features based on user feedback, resulting in a 15% increase in user satisfaction."
        svgPaths={rocketPaths}
      />
      <RightInfoBox
        title="Senior Software Engineer"
        company="Tech Corp"
        role="Lead Frontend Developer"
        description="Developed and maintained the company's flagship product, improving performance by 20%.\n Led a team of 5 engineers and collaborated with cross-functional teams to deliver high-quality software solutions.\nImplemented new features based on user feedback, resulting in a 15% increase in user satisfaction."
        svgPaths={rocketPaths}
      />
      <LeftInfoBox
        title="Senior Software Engineer"
        company="Tech Corp"
        role="Lead Frontend Developer"
        description="Developed and maintained the company's flagship product, improving performance by 20%.\n Led a team of 5 engineers and collaborated with cross-functional teams to deliver high-quality software solutions.\nImplemented new features based on user feedback, resulting in a 15% increase in user satisfaction."
        svgPaths={rocketPaths}
      />
      <RightInfoBox
        title="Senior Software Engineer"
        company="Tech Corp"
        role="Lead Frontend Developer"
        description="Developed and maintained the company's flagship product, improving performance by 20%.\n Led a team of 5 engineers and collaborated with cross-functional teams to deliver high-quality software solutions.\nImplemented new features based on user feedback, resulting in a 15% increase in user satisfaction."
        svgPaths={rocketPaths}
      />
    </div>
  );
}
