/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        nexa: ['"Nexa Rust Script"', "serif"],   // your existing custom font
        lato: ['"Lato"', "sans-serif"],          // 👈 added Lato font
      },
    },
  },
  plugins: [],
};
