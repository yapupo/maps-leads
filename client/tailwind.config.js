/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base:     '#080B10',
        card:     '#0D1117',
        elevated: '#161B22',
        border:   '#21262D',
        'border-bright': '#30363D',
        accent:   '#F0B429',
        'accent-dim': '#92620A',
        green:    '#3FB950',
        cyan:     '#58A6FF',
        red:      '#F85149',
        text:     '#E6EDF3',
        muted:    '#7D8590',
        dim:      '#484F58',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
        sans:    ['"DM Sans"', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '4px',
        md: '6px',
        lg: '6px',
      },
      animation: {
        scan: 'scan 2s linear infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        scan: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
