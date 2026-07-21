/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy green theme — kept so existing (reused) components stay unchanged.
        primary: {
          DEFAULT: '#047857', // MyRecruiter green
          light: '#10b981',
          dark: '#065f46',
          hover: '#065f46',
        },
        // ── Config Builder redesign tokens (design handoff §Design Tokens) ────
        // Named keys are additive; Tailwind deep-merges these onto the built-in
        // scales, so existing components using emerald-500 / slate-200 / amber-*
        // numeric shades are unaffected.
        emerald: {
          DEFAULT: '#50C878', // brand green — primary button fill
          hover: '#34d399',
          tint: '#E9F7EF',    // light accent bg
          text: '#1C7A45',    // AA-safe emerald text on light
          rail: '#7DE3A8',    // rail-active text on navy
          sel: '#F7FDFA',     // selected-row / selected-node fill
        },
        navy: '#0F172A',
        slate: {
          150: '#EEF2F6', // between slate-100 and slate-200 (design token)
        },
        amber: {
          bg: '#FEF3C7',
          border: '#FDE68A',
          text: '#92400E',
          deep: '#B45309',
        },
        danger: {
          DEFAULT: '#DC2626',
          border: '#FECACA',
          bg: '#FEF2F2',
          text: '#B91C1C',
        },
        info: {
          DEFAULT: '#2563EB',
          bg: '#EFF6FF',
          border: '#DBEAFE',
          text: '#1e40af',
        },
        // Widget preview cream palette.
        widget: {
          bg: '#FBF8F3',
          card: '#FDFBF8',
          line: '#EDE6D8',
          muted: '#A8A090',
        },
      },
      borderRadius: {
        card: '14px',
        tile: '9px',
      },
      boxShadow: {
        'cta-glow': '0 4px 14px rgba(80,200,120,.3)',
        popover: '0 20px 48px rgba(2,6,23,.18)',
        modal: '0 24px 64px rgba(2,6,23,.45)',
        drawer: '-18px 0 48px rgba(2,6,23,.22)',
        'focus-ring': '0 0 0 3px rgba(80,200,120,.15)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['ui-monospace', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
