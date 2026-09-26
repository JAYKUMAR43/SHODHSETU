/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B192C',
          dark: '#060E1A',
          deep: '#040914',
          card: '#0F223D',
          elevated: '#152C4E',
          light: '#1B365D',
          hover: '#132845',
          border: 'rgba(255, 255, 255, 0.12)'
        },
        teal: {
          DEFAULT: '#2DD4BF',
          light: '#CCFBF1',
          dark: '#0F766E',
          hover: '#14B8A6',
          glow: 'rgba(45, 212, 191, 0.35)'
        },
        gold: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#B45309',
          accent: '#D97706',
          glow: 'rgba(245, 158, 11, 0.35)'
        },
        steel: {
          DEFAULT: '#334155',
          light: '#475569',
          dark: '#1E293B',
          border: '#334155'
        },
        amber: {
          DEFAULT: '#F59E0B',
          pending: '#F59E0B',
          light: '#FEF3C7',
          border: '#FDE68A'
        },
        green: {
          DEFAULT: '#10B981',
          verified: '#10B981',
          light: '#D1FAE5',
          border: '#A7F3D0'
        },
        red: {
          DEFAULT: '#EF4444',
          flagged: '#EF4444',
          light: '#FEE2E2',
          border: '#FECACA'
        },
        canvas: {
          DEFAULT: '#060E1A',
          alt: '#0B192C',
          light: '#F8FAFC'
        }
      },
      boxShadow: {
        'glow-teal': '0 0 25px -5px rgba(45, 212, 191, 0.4)',
        'glow-teal-lg': '0 0 45px -8px rgba(45, 212, 191, 0.5)',
        'glow-gold': '0 0 25px -5px rgba(245, 158, 11, 0.4)',
        'glow-navy': '0 20px 40px -15px rgba(6, 14, 26, 0.7)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-elevated': '0 20px 50px 0 rgba(0, 0, 0, 0.5)',
        'glass-deep': '0 25px 60px rgba(0, 0, 0, 0.7)',
        'float': '0 16px 40px -8px rgba(0, 0, 0, 0.5)',
        'float-hover': '0 24px 55px -10px rgba(0, 0, 0, 0.6), 0 0 25px -5px rgba(45, 212, 191, 0.2)'
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],      // 11px
        'xs': ['0.8125rem', { lineHeight: '1.25rem' }],     // 13px — bumped from 12
        'sm': ['0.875rem', { lineHeight: '1.375rem' }],     // 14px
        'base': ['0.9375rem', { lineHeight: '1.625rem' }],  // 15px — bumped from 16
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],      // 18px
        'xl': ['1.3125rem', { lineHeight: '1.875rem' }],    // 21px
        '2xl': ['1.625rem', { lineHeight: '2.125rem' }],    // 26px
        '3xl': ['2rem', { lineHeight: '2.5rem' }],          // 32px
        '4xl': ['2.5rem', { lineHeight: '3rem' }],          // 40px
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out both',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-left': 'slideInLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-right': 'slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-pop': 'scalePop 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
        'float': 'floatOrb 8s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-30px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(30px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        scalePop: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '70%': { transform: 'scale(1.02)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        floatOrb: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(15px, -20px) scale(1.05)' },
          '66%': { transform: 'translate(-10px, 12px) scale(0.97)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(180deg, rgba(15,34,61,0.85) 0%, rgba(11,25,44,0.92) 50%, rgba(6,14,26,0.95) 100%)',
        'glass-card-gradient': 'linear-gradient(135deg, rgba(15,34,61,0.85) 0%, rgba(11,25,44,0.92) 100%)',
        'teal-gradient': 'linear-gradient(135deg, #2DD4BF, #0F766E)',
      },
    },
  },
  plugins: [],
}
