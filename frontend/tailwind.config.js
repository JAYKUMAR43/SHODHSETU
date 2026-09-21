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
          DEFAULT: '#0B2447',
          dark: '#061426',
          light: '#19376D',
          hover: '#081c38'
        },
        teal: {
          DEFAULT: '#19A7CE',
          light: '#E0F4FF',
          dark: '#1482a3',
          hover: '#1596ba'
        },
        steel: {
          DEFAULT: '#32476C',
          light: '#4A628A',
          dark: '#22324D',
          border: '#D3DAE4'
        },
        amber: {
          DEFAULT: '#F4B400',
          pending: '#F4B400',
          light: '#FEF9E7',
          border: '#FDE68A'
        },
        green: {
          DEFAULT: '#2ECC71',
          verified: '#2ECC71',
          light: '#E8F8F0',
          border: '#A7F3D0'
        },
        red: {
          DEFAULT: '#E74C3C',
          flagged: '#E74C3C',
          light: '#FDECEC',
          border: '#FECACA'
        },
        canvas: {
          DEFAULT: '#F7F9FB',
          alt: '#F0F4F8'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['Manrope', 'Inter', 'sans-serif']
      }
    },
  },
  plugins: [],
}
