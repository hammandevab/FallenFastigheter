/** Designtokens enligt designspec 9.2 – komponenter refererar aldrig hårdkodade färger.
 *  Färgerna definieras som RGB-tripletter i index.css så att Tailwinds
 *  opacity-modifierare (t.ex. bg-primary/10) fungerar via <alpha-value>. */
const c = (v) => `rgb(var(${v}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    container: { center: true },
    extend: {
      colors: {
        bg: c('--background-rgb'),
        ink: c('--foreground-rgb'),
        primary: { DEFAULT: c('--primary-rgb'), dark: c('--primary-dark-rgb'), ink: c('--primary-foreground-rgb') },
        secondary: c('--secondary-rgb'),
        accent: { DEFAULT: c('--accent-rgb'), soft: c('--accent-soft-rgb') },
        muted: { DEFAULT: c('--muted-rgb'), ink: c('--muted-foreground-rgb') },
        card: c('--card-rgb'),
        destructive: c('--destructive-rgb'),
        line: c('--border-rgb'),
        status: {
          ny: c('--status-ny-rgb'),
          pagaende: c('--status-pagaende-rgb'),
          vantar: c('--status-vantar-rgb'),
          atgardad: c('--status-atgardad-rgb'),
          stangd: c('--status-stangd-rgb'),
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { DEFAULT: 'var(--radius)', lg: 'var(--radius)', xl: 'calc(var(--radius) + 0.25rem)' },
      maxWidth: { site: '76rem' },
      boxShadow: {
        card: '0 1px 2px rgb(34 48 43 / 0.05), 0 4px 16px rgb(34 48 43 / 0.06)',
        lift: '0 2px 4px rgb(34 48 43 / 0.06), 0 12px 32px rgb(34 48 43 / 0.12)',
      },
    },
  },
  plugins: [],
};
