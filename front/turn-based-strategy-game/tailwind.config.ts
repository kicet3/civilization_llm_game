import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundColor: {
        'game-dark': '#1a202c',
        'game-dark-light': '#2d3748',
      },
      colors: {
        'terrain-plain': '#a3c557',
        'terrain-mountain': '#8b8b8b',
        'terrain-forest': '#2d6a4f',
        'terrain-water': '#4ea8de',
        'terrain-desert': '#e9c46a',
      }
    },
  },
  plugins: [],
}

export default config