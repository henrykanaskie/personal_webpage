"use client";
import { motion } from "framer-motion";

export default function HomePage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 text-center"
    >
      <h1 className="text-4xl font-bold mb-4">Welcome to My Portfolio</h1>
      <p>
        Use the navigation above to learn more about me, my experience, and my
        research.
      </p>
    </motion.div>
  );
}
