/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0B0F19',
          card: '#111827',
          border: '#1F2937',
          accent: '#00F0FF',
          accentGlow: 'rgba(0, 240, 255, 0.15)',
          danger: '#FF0055',
          warning: '#FFB800',
          success: '#00FF66',
          muted: '#94A3B8'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -5px rgba(0, 240, 255, 0.4)',
        'glow-danger': '0 0 20px -5px rgba(255, 0, 85, 0.4)',
      }
    },
  },
  plugins: [],
}
