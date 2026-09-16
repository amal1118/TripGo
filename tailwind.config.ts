import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: '1.5rem', screens: { '2xl': '1360px' } },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        /* هوية TripGo: برتقالي ناعم مطفي */
        sand: {
          50: 'hsl(30 45% 97%)',
          100: 'hsl(28 45% 93%)',
          200: 'hsl(26 50% 86%)',
          300: 'hsl(25 55% 78%)',
          400: 'hsl(24 62% 70%)',
          500: 'hsl(24 70% 62%)',
          600: 'hsl(22 62% 52%)',
          700: 'hsl(20 58% 43%)',
          800: 'hsl(19 50% 34%)',
          900: 'hsl(18 44% 26%)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
        '4xl': '2rem',
      },
      fontFamily: {
        sans: ['var(--font-ar)', 'var(--font-latin)', 'system-ui', 'sans-serif'],
        latin: ['var(--font-latin)', 'system-ui', 'sans-serif'],
        display: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      backdropBlur: { xs: '2px', '4xl': '72px' },
      boxShadow: {
        card: '0 2px 12px -2px hsl(22 40% 25% / 0.06)',
        'card-lg': '0 18px 40px -12px hsl(22 45% 25% / 0.16)',
        float: '0 26px 60px -14px hsl(20 30% 8% / 0.45)',
        glass: '0 8px 32px -8px hsl(22 40% 25% / 0.18), inset 0 1px 0 0 hsl(0 0% 100% / 0.45)',
        'glass-dark': '0 8px 32px -8px hsl(0 0% 0% / 0.6), inset 0 1px 0 0 hsl(0 0% 100% / 0.08)',
        glow: '0 0 0 1px hsl(var(--primary) / 0.25), 0 12px 40px -12px hsl(var(--primary) / 0.55)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        shimmer: 'shimmer 2s infinite',
        float: 'float 7s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
