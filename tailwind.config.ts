import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: '#E91E8C',
          wine: '#6B1A3A',
          dark: '#1A0A12',
          white: '#FFFFFF',
        },
      },
      backgroundImage: {
        'gradient-hero': 'linear-gradient(135deg, #1A0A12 0%, #6B1A3A 60%, #E91E8C 100%)',
        'gradient-card': 'linear-gradient(135deg, #6B1A3A 0%, #1A0A12 100%)',
        'gradient-pink': 'linear-gradient(90deg, #E91E8C 0%, #6B1A3A 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
