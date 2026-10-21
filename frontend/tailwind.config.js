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
        obsidian: {
          950: '#060910',
          900: '#090D16', // Main background
          850: '#0E1424',
          800: '#111827', // Card surface
          750: '#161F33',
          700: '#1E293B',
        },
        analyst: {
          light: '#818CF8',
          DEFAULT: '#6366F1', // Electric Indigo
          dark: '#4F46E5',
          glow: 'rgba(99, 102, 241, 0.35)',
        },
        scientist: {
          purple: '#A855F7', // Neon Purple
          emerald: '#10B981', // Neon Emerald
          glow: 'rgba(168, 85, 247, 0.35)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-indigo': '0 0 25px -5px rgba(99, 102, 241, 0.3)',
        'glow-purple': '0 0 25px -5px rgba(168, 85, 247, 0.3)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      transitionTimingFunction: {
        'spring-snappy': 'cubic-bezier(0.23, 1, 0.32, 1)',
      }
    },
  },
  plugins: [],
}
