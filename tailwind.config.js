/** @type {import('tailwindcss').Config} */
module.exports = {
  // Приложение вешает класс "dark-mode" (не "dark") на <html>/<body> — app.component.ts
  // setMode(). С обычным 'class' Tailwind генерирует селектор .dark, который никогда не
  // совпадает: все dark: варианты были мертвы, тема держалась только на глобальных
  // !important в dark-mode-utilities.scss (PROFILES_TASK.md §4.1).
  darkMode: ['selector', '.dark-mode'],
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Извлечено пиксельной выборкой из src/assets/isim.png. Каждый цвет закреплён за
        // словом названия (İbtidai/Siniflərin/İnkişaf/Metodikası) — используется только на
        // публичном лендинге, primary/secondary выше держат внутреннюю панель и не трогаются.
        // *Ink — затемнённые пары для текста/кнопок: исходные red (4.46:1) и green (3.19:1)
        // не проходят контраст с белым, заливка плиток — только исходными, ≥24px жирным.
        brand: {
          red: '#EB2229',
          redInk: '#C81119',
          blue: '#2C388F',
          blueInk: '#232C73',
          green: '#13A64E',
          greenInk: '#0A7A38',
          magenta: '#DA218E',
          magentaInk: '#A6106B',
          ink: '#1C2340',
          off: '#F1F1F2',
        },
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
        // Только для публичных страниц (лендинг, /metodika) — Inter выше остаётся шрифтом
        // внутренней панели.
        //
        // В стеке НЕ ДОЛЖНО быть шрифтов без «ə»/«Ə» (U+0259 / U+018F). Раньше первым стоял
        // Trebuchet MS: в нём есть ğ, ş, İ, но нет ə — а это одна из самых частых букв
        // азербайджанского. Браузер рисовал слово в Trebuchet и подставлял ə из следующего
        // шрифта, так что внутри одного слова прыгали ширина и вес букв.
        // Каждый шрифт ниже проверен на полный азербайджанский набор ə Ə ğ ş ç ı İ ö ü.
        // Осторожно с заменами: Georgia и Tahoma эту проверку не проходят.
        'landing': ['"Segoe UI"', 'system-ui', 'Verdana', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}

