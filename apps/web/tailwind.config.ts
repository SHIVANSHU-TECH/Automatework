import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
    './packages/ui/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0B132B',
          dark: '#050914',
        },
        brandblue: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
        },
        accentpurple: {
          DEFAULT: '#7C3AED',
          hover: '#6D28D9',
        },
        success: '#22C55E',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        customBorder: '#E2E8F0',
        textsecondary: '#64748B',
      },
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'primary-gradient': 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
        'alt-gradient': 'linear-gradient(90deg, #0B132B 0%, #2563EB 100%)',
      },
      borderRadius: {
        'card': '16px',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(11, 19, 43, 0.05), 0 2px 8px -1px rgba(11, 19, 43, 0.03)',
        card: '0 10px 30px -10px rgba(11, 19, 43, 0.08), 0 1px 3px rgba(11, 19, 43, 0.02)',
      },
    },
  },
  plugins: [],
};

export default config;
