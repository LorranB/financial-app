/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      // Tailwind v3 usa "currentColor" como padrão pra classe "border" sem sufixo de cor,
      // o que gera bordas escuras herdando a cor do texto (visível nos cantos arredondados).
      // Isso restaura um padrão neutro, como era no v2.
      borderColor: {
        DEFAULT: '#e2e8f0', // slate-200
      },
    },
  },
  plugins: [],
}
