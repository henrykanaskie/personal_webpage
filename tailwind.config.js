import plugin from "tailwindcss/plugin";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant("dark", "&:is(.dark *)");
    }),
  ],
};
