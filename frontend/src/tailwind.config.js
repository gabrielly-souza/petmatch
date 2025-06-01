// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", 
    "./public/index.html",
  ],
  theme: {
    extend: {
      // Definindo suas cores personalizadas aqui para usar como classes Tailwind
      colors: {
        // Cores da paleta principal (vermelho) que temos usado nos componentes
        'primary-red': '#E57373',
        'primary-red-hover': '#D35F5F',
        // Cores secundárias/de destaque (azul)
        'accent-blue': '#00749B',
        'accent-blue-hover': '#006080',

        // Cores do seu :root atual (se você ainda quiser usá-las para algo, mas não no Tailwind)
        // Recomendo priorizar as cores definidas acima ou ajustar para refletir a nova paleta
        'old-primary': '#6BB0BA',     // Cor primária original do seu CSS
        'old-secondary': '#FFB347',   // Cor secundária original do seu CSS
        'background-light': '#F8F8F8',
        'text-dark': '#333333',
        'text-medium': '#707070',
        'success-color': '#28a745',
        'error-color': '#dc3545',
      },
      // Definindo suas sombras personalizadas
      boxShadow: {
        'light': '0px 4px 8px rgba(0, 0, 0, 0.1)',
        'medium': '0px 6px 12px rgba(0, 0, 0, 0.15)',
      },
      // Definindo suas famílias de fonte
      fontFamily: {
        'roboto': ['Roboto', 'sans-serif'],
        'poppins': ['Poppins', 'sans-serif'],
        // Se você quiser que Roboto seja a fonte 'sans' padrão do Tailwind
        sans: ['Roboto', 'sans-serif'], 
      },
    },
  },
  plugins: [],
}