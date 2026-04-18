/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base:            'var(--color-base)',
        card:            'var(--color-card)',
        elevated:        'var(--color-elevated)',
        border:          'var(--color-border)',
        'border-bright': 'var(--color-border-bright)',
        accent:          'var(--color-accent)',
        'accent-dim':    'var(--color-accent-dim)',
        green:           'var(--color-green)',
        cyan:            'var(--color-cyan)',
        red:             'var(--color-red)',
        text:            'var(--color-text)',
        muted:           'var(--color-muted)',
        dim:             'var(--color-dim)',
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
