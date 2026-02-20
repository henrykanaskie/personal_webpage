"use client";
import ExperienceCard from "@/components/experienceCard";
import GlassTitle from "@/components/GlassTitle";
import { experiences } from "@/data/experience";

export default function ExperiencePage() {
  return (
    <section className="container mx-auto px-4 py-12">
      <GlassTitle text="experience" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {experiences.map((exp) => (
          <ExperienceCard key={exp.id} experience={exp} />
        ))}
      </div>
    </section>
  );
}
