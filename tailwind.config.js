/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Modern dark-accented color palette
        'primary-dark': '#2b2d42',
        'gray': '#8d99ae',
        'light-bg': '#edf2f4',
        'accent-red': '#ef233c',
        'deep-red': '#d80032',
        
        // Semantic color mapping
        primary: {
          50: '#f8f9fa',
          100: '#edf2f4',
          200: '#d3d9db',
          300: '#b9c0c2',
          400: '#8d99ae',
          500: '#6c757d',
          600: '#495057',
          700: '#343a40',
          800: '#2b2d42',
          900: '#212529',
          950: '#1a1c2e',
        },
        secondary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef233c',
          600: '#dc2626',
          700: '#d80032',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        accent: {
          50: '#fef7f7',
          100: '#fef2f2',
          200: '#fee2e2',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef233c',
          600: '#d80032',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        background: '#edf2f4',
        foreground: '#2b2d42',
        card: '#ffffff',
        'card-foreground': '#2b2d42',
        popover: '#ffffff',
        'popover-foreground': '#2b2d42',
        muted: '#f8f9fa',
        'muted-foreground': '#8d99ae',
        border: '#d3d9db',
        input: '#ffffff',
        ring: '#ef233c',
        destructive: '#ef233c',
        'destructive-foreground': '#ffffff',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 2px 10px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
};