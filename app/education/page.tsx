"use client";

import GlassTitle from "@/components/GlassTitle";
import EducationCard from "@/components/EducationCard";

export default function EducationPage() {
  return (
    <div className="flex flex-col gap-12 md:gap-28 pb-[10vh]">
      <GlassTitle text="Education" />

      <EducationCard
        school="Oregon State University"
        degree="Honors B.S. Computer Science"
        timeline="Sep 2022 — Jun 2026"
        gpa="3.95 / 4.0"
        coursework={[
          "Data Structures & Algorithms",
          "Databases",
          "Software Engineering",
          "Artificial Intelligence",
          "Machine Learning",
          "Deep Learning",
        ]}
      />

      <div style={{ height: 100 }} />
    </div>
  );
}
