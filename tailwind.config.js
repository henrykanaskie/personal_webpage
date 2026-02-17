const plugin = require("tailwindcss/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  // ... your other config
  darkMode: "class", // Keep this
  plugins: [
    plugin(function ({ addVariant }) {
      // This forces 'dark:' to look for the .dark class on any parent
      addVariant("dark", "&:is(.dark *)");
    }),
  ],
};
