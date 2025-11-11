/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      // FONT FAMILIES - Per MTE Brand Guide
      fontFamily: {
        // Primary Typeface: Lato (weights: 300, 400, 500, 900)
        lato: ['"Lato"', 'Helvetica', 'Arial', 'sans-serif'],
        
        // Secondary Typeface: Source Serif Pro (weights: 400, 600)
        'source-serif': ['"Source Serif Pro"', 'Georgia', 'Times', 'serif'],
        
        // Specialty Typeface: Nexa Rust Script S 00 (use sparingly)
        nexa: ['"Nexa Rust Script"', 'cursive'],
      },
      
      // FONT WEIGHTS - Explicit definitions for brand compliance
      fontWeight: {
        light: '300',    // Lato Light
        normal: '400',   // Lato Regular, Source Serif Pro Regular
        medium: '500',   // Lato Medium
        semibold: '600', // Lato SemiBold, Source Serif Pro SemiBold
        bold: '700',     // Lato Bold
        black: '900',    // Lato Heavy/Black
      },
      
      // COLORS - Per MTE Brand Guide (exact RGB values)
      colors: {
        // PRIMARY BRAND COLORS
        'mte-blue': '#02ADEE',          // RGB: 2, 173, 238 (Updated per brand requirements)
        'mte-charcoal': '#5c5d5f',      // RGB: 92, 93, 95
        'mte-light-grey': '#f1f1f1',    // RGB: 241, 241, 241
        'mte-black': '#000000',         // RGB: 0, 0, 0
        'mte-white': '#ffffff',         // RGB: 255, 255, 255
        'mte-subdued-white': '#eeeff0', // RGB: 239, 239, 240
        
        // SECONDARY COLORS (use sparingly)
        'mte-green': '#4aa456',         // RGB: 75, 165, 87
        'mte-orange': '#dc6a42',        // RGB: 220, 107, 67
        'mte-purple': '#882781',        // RGB: 137, 39, 130
        'mte-yellow': '#e7d151',        // RGB: 232, 210, 82
        
        // TINT SYSTEM - 20% increments (100%, 80%, 60%, 40%, 20%)
        // MTE Blue Tints (Updated to use #02ADEE)
        'mte-blue-80': 'rgba(2, 173, 238, 0.8)',
        'mte-blue-60': 'rgba(2, 173, 238, 0.6)',
        'mte-blue-40': 'rgba(2, 173, 238, 0.4)',
        'mte-blue-20': 'rgba(2, 173, 238, 0.2)',
        
        // Secondary Color Tints (if needed)
        'mte-green-80': 'rgba(74, 164, 86, 0.8)',
        'mte-green-60': 'rgba(74, 164, 86, 0.6)',
        'mte-green-40': 'rgba(74, 164, 86, 0.4)',
        'mte-green-20': 'rgba(74, 164, 86, 0.2)',
        
        'mte-orange-80': 'rgba(220, 106, 66, 0.8)',
        'mte-orange-60': 'rgba(220, 106, 66, 0.6)',
        'mte-orange-40': 'rgba(220, 106, 66, 0.4)',
        'mte-orange-20': 'rgba(220, 106, 66, 0.2)',
        
        'mte-purple-80': 'rgba(136, 39, 129, 0.8)',
        'mte-purple-60': 'rgba(136, 39, 129, 0.6)',
        'mte-purple-40': 'rgba(136, 39, 129, 0.4)',
        'mte-purple-20': 'rgba(136, 39, 129, 0.2)',
        
        'mte-yellow-80': 'rgba(231, 209, 81, 0.8)',
        'mte-yellow-60': 'rgba(231, 209, 81, 0.6)',
        'mte-yellow-40': 'rgba(231, 209, 81, 0.4)',
        'mte-yellow-20': 'rgba(231, 209, 81, 0.2)',
      },
      
      // TYPOGRAPHY SIZES - Per MTE Brand Guide
      fontSize: {
        // Heading Hierarchy (Option 1 - Formal)
        'h1': ['80px', { lineHeight: '1', fontWeight: '900' }],      // 4.44rem - Lato Heavy
        'h2': ['52px', { lineHeight: '1.2', fontWeight: '600' }],    // 2.89rem - Lato SemiBold
        'h3': ['34px', { lineHeight: '1.2', fontWeight: '400' }],    // 1.89rem - Source Serif Italic
        'h4': ['18px', { lineHeight: '1.4', fontWeight: '700' }],    // 1rem - Lato Bold UPPERCASE
        
        // Content Hierarchy (Option 2)
        'headline': ['50px', { lineHeight: '56px', fontWeight: '900' }],  // Lato Black
        'subhead': ['30px', { lineHeight: '36px', fontWeight: '400' }],   // Source Serif Italic
        'body': ['18px', { lineHeight: '26px', fontWeight: '400' }],      // Lato Regular
        'blockquote': ['30px', { lineHeight: '36px', fontWeight: '400' }],
      },
      
      // SPACING - Per MTE Brand Guide
      spacing: {
        // Bottom margins for typography
        'h1-margin': '50px',
        'h2-margin': '30px',
        'h3-margin': '30px',
        'h4-margin': '20px',
        'p-margin': '16px',
        'blockquote-padding': '40px',
      },
      
      // LINE HEIGHTS - Specific to brand
      lineHeight: {
        'headline': '56px',
        'subhead': '36px',
        'body': '26px',
        'blockquote': '36px',
      },
      
      // BORDERS
      borderWidth: {
        'blockquote': '3px',
      },
      
      // BOX SHADOWS - Brand compliant
      boxShadow: {
        'mte-card': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'mte-card-hover': '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      
      // BACKGROUND IMAGES (optional utilities)
      backgroundImage: {
        'mte-gradient': 'linear-gradient(135deg, #02ADEE 0%, #0896d4 100%)',
      },
    },
  },
  plugins: [],
};