/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple Color Palette
        apple: {
          'gray-1': '#1d1d1f',
          'gray-2': '#424245',
          'gray-3': '#6e6e73',
          'gray-4': '#86868b',
          'gray-5': '#d2d2d7',
          'gray-6': '#f5f5f7',
          'blue': '#0071e3',
          'blue-hover': '#0077ed',
          'blue-light': 'rgba(0, 113, 227, 0.12)',
          'green': '#30d158',
          'red': '#ff3b30',
          'orange': '#ff9500',
          'yellow': '#ffd60a',
        }
      },
      fontFamily: {
        apple: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      borderRadius: {
        'apple-sm': '8px',
        'apple-md': '12px',
        'apple-lg': '18px',
        'apple-xl': '24px',
      },
      boxShadow: {
        'apple-sm': '0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.06)',
        'apple-md': '0 4px 8px rgba(0, 0, 0, 0.08), 0 12px 24px rgba(0, 0, 0, 0.1)',
        'apple-lg': '0 8px 16px rgba(0, 0, 0, 0.12), 0 20px 40px rgba(0, 0, 0, 0.15)',
      },
      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'apple-decelerate': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      },
      animation: {
        'apple-fadeIn': 'appleSlideUp 0.6s cubic-bezier(0.0, 0.0, 0.2, 1)',
        'apple-scaleIn': 'appleScaleIn 0.4s cubic-bezier(0.0, 0.0, 0.2, 1)',
      },
      keyframes: {
        appleSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        appleScaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
