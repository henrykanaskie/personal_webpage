"use client";
import ExperienceCard from "@/components/experienceCard";
import { experiences } from "@/data/experience"; // Your array of experience objects

export default function ExperiencePage() {
  return (
    <section className="container mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold mb-8 font-mono">
        ./technical_experience
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {experiences.map((exp) => (
          <ExperienceCard key={exp.id} experience={exp} />
        ))}
      </div>
    </section>
  );
}
