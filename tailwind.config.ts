import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: 'var(--brand-primary)',
        brandSecondary: 'var(--brand-secondary)',
      },
    },
  },
  plugins: [],
};

export default config;
