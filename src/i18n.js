// ─────────────────────────────────────────────────────────────────────────────
// Tiny i18n. The whole app runs in one language at a time — 'en' or 'es'. The UI
// chrome strings live here; the longer content (About walls, experience notes,
// project/app names…) lives in the config files as { en, es } objects, read with
// pick() below. Proper nouns (LinkedIn, Procreate…) stay plain strings.
// ─────────────────────────────────────────────────────────────────────────────
export const LANGS = ['en', 'es']

export const UI = {
  en: {
    role: 'Creative Engineer',
    scroll: 'scroll to enter',
    back: '← Back',
    center: '⌂ Center',
    other: 'Español', // label on the toggle → the language you'd switch TO
    cv: '/cv/cv-en.pdf', // served file
    cvName: 'Marilyn Joven — CV (EN).pdf', // friendly name the download saves as
    cvLabel: 'Download CV',
  },
  es: {
    role: 'Ingeniera Creativa',
    scroll: 'desliza para entrar',
    back: '← Volver',
    center: '⌂ Centro',
    other: 'English',
    cv: '/cv/cv-es.pdf',
    cvName: 'Marilyn Joven — HV (ES).pdf',
    cvLabel: 'Descargar HV',
  },
}

// Read a maybe-translated value: an { en, es } object resolves to the current
// language; a plain string (a proper noun, a shared path) passes straight through.
export const pick = (v, lang) =>
  v && typeof v === 'object' && !Array.isArray(v) && ('en' in v || 'es' in v)
    ? v[lang] ?? v.en
    : v
