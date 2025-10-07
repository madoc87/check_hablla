/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms';
import scrollbar from 'tailwind-scrollbar';

export default {
  darkMode: 'class', // Habilita o modo escuro baseado em classe
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    forms,
    scrollbar,
  ],
}