/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shd: {
          orange: '#F26A1B',
          orangeDark: '#D4550F',
          orangeLight: '#FF883E',
          bg: '#0C0F12',
          surface1: '#101418',
          surface2: '#12171C',
          surface3: '#1D2731',
          border1: '#1E242B',
          border2: '#242C34',
          border3: '#2A323B',
          textPrimary: '#E8EAED',
          textSecondary: '#C4CCD4',
          textMuted: '#8B96A2',
          textMonoMuted: '#7C8894',
          redCore: '#E53E3E',
          blueCore: '#3182CE',
          yellowCore: '#D69E2E',
          exotic: '#FF6B00',
          named: '#E2A03F',
          gearSet: '#38A169',
          brand: '#805AD5'
        }
      },
      fontFamily: {
        heading: ['Chakra Petch', 'system-ui', 'sans-serif'],
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
