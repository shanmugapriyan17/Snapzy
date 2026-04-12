/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Nexus Cobalt Tokens (from stitch/nexus_terminal/DESIGN.md) ──
        'surface-container-lowest': '#ffffff',
        'surface-container-low':    '#f2f3ff',
        'surface-container':        '#eaedff',
        'surface-container-high':   '#e2e7ff',
        'surface-container-highest':'#dae2fd',
        'surface':                  '#faf8ff',
        'surface-dim':              '#d2d9f4',
        'on-surface':               '#131b2e',
        'on-surface-variant':       '#434655',
        'primary':                  '#004ac6',
        'primary-container':        '#2563eb',
        'primary-fixed':            '#dbe1ff',
        'primary-fixed-dim':        '#b4c5ff',
        'on-primary':               '#ffffff',
        'secondary':                '#6b38d4',
        'secondary-container':      '#8455ef',
        'secondary-fixed':          '#e9ddff',
        'on-secondary':             '#ffffff',
        'tertiary':                 '#006242',
        'tertiary-container':       '#007d55',
        'tertiary-fixed':           '#6ffbbe',
        'outline':                  '#737686',
        'outline-variant':          '#c3c6d7',
        'background':               '#faf8ff',
        'on-background':            '#131b2e',
        'error':                    '#ba1a1a',
        'error-container':          '#ffdad6',
        'warning':                  '#f59e0b',
        'warning-container':        '#fef3c7',
        'inverse-surface':          '#283044',
        'inverse-on-surface':       '#eef0ff',
      },
      fontFamily: {
        sans:     ['Poppins', 'sans-serif'],
        poppins:  ['Poppins', 'sans-serif'],
        headline: ['Poppins', 'sans-serif'],
        body:     ['Poppins', 'sans-serif'],
        mono:     ["'Space Mono'", 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',   // 4px
        lg:      '0.5rem',    // 8px
        xl:      '0.75rem',   // 12px — max per spec
        '2xl':   '1rem',
        '3xl':   '1.5rem',
        full:    '9999px',
      },
    },
  },
  plugins: [],
}
