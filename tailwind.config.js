/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        nexa: ['"Nexa Rust Script"', "serif"],     // Specialty script font for emphasis
        lato: ['"Lato"', "sans-serif"],            // Primary workhorse font
        source: ['"Source Serif Pro"', "serif"],   // Secondary serif font
      },
      colors: {
        // MTE Brand Primary Colors (from Brand Guide)
        'mte-blue': '#00ADEE',          // Primary brand color - CMYK: 70, 16, 0, 0
        'mte-charcoal': '#5c5d5f',      // Charcoal gray - CMYK: 0, 0, 0, 78
        'mte-light-grey': '#f1f1f1',    // Light grey - CMYK: 4, 3, 3, 0
        'mte-black': '#000000',         // True black - CMYK: 0, 0, 0, 100
        'mte-white': '#ffffff',         // True white - CMYK: 0, 0, 0, 0
        'mte-subdued-white': '#eeeff0', // Subdued white - CMYK: 0, 0, 0, 6
        
        // MTE Brand Secondary Colors (use sparingly)
        'mte-green': '#4aa456',         // Secondary green - CMYK: 73, 11, 88, 1
        'mte-orange': '#dc6a42',        // Secondary orange - CMYK: 8, 70, 80, 2
        'mte-purple': '#882781',        // Secondary purple - CMYK: 55, 100, 11, 1
        'mte-yellow': '#e7d151',        // Secondary yellow - CMYK: 8, 10, 80, 2
        
        // MTE Brand Tints (20% increments per brand guide)
        'mte-blue-80': 'rgba(0, 173, 238, 0.8)',
        'mte-blue-60': 'rgba(0, 173, 238, 0.6)',
        'mte-blue-40': 'rgba(0, 173, 238, 0.4)',
        'mte-blue-20': 'rgba(0, 173, 238, 0.2)',
      },
      backgroundImage: {
        'mte-gradient': 'linear-gradient(135deg, #00ADEE 0%, #0896d4 100%)',
        'mte-diagonal': 'linear-gradient(135deg, transparent 0%, transparent 45%, #00ADEE 45%, #00ADEE 55%, transparent 55%)',
      },
      boxShadow: {
        'mte-card': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'mte-card-hover': '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
};