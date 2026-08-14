// ─────────────────────────────────────────────────────────────────────────────
// THE PROJECTS iPad HOMESCREEN — edit to add / remove tiles.
//
// Every tile is one object in HOME_ITEMS (the main grid) or DOCK (bottom bar).
//
//   App  (small icon):
//     { name: 'GitHub', url: 'https://github.com/you', icon: '/projects/github.png' }
//     - `icon` is optional. No icon → a coloured tile with the first letter.
//
//   Widget (big image tile):
//     { widget: true, image: '/projects/newspaper.png', url: 'https://…', w: 2, h: 2 }
//     - `w` / `h` = how many grid cells it spans (default 1×1).
//     - `url` is optional (drop it for a non-clickable widget).
//     - No `image` yet → a placeholder tile so the layout still works.
//
// Put images in  public/projects/  and reference them as  '/projects/<file>'.
// ─────────────────────────────────────────────────────────────────────────────

export const HOME_ITEMS = [
  // — widgets (big image tiles) —
  { widget: true, name: 'Procreate', image: '/projects/widget-3.jpg', url: 'https://example.com', w: 2, h: 2 },
  { widget: true, name: 'Indigo', image: '/projects/indigo.png', url: 'https://example.com', w: 2, h: 1 },
  { widget: true, name: 'Procreate', image: '/projects/widget-1.jpg', url: 'https://example.com', w: 3, h: 2 },

  // — apps (small icons) — `name` may be a string or { en, es } (see i18n pick()).
  { name: { en: 'Portfolio', es: 'Portafolio' }, url: 'https://marilyn-joven.vercel.app/', icon: '/projects/portfolio.png' },
  { name: { en: 'My Weather', es: 'Mi Clima' }, url: 'https://weather-gamma-blue.vercel.app/',icon: '/projects/myweather-icon.png' },
  { name: 'Posture Guard', url: 'https://notion.so',icon: '/projects/postureguard-icon.png'},
  { name: { en: 'Thesis', es: 'Tesis' }, url: 'https://arc.net/l/quote/vhzdhzom', icon: '/projects/github.png' },
]

export const DOCK = [
  { name: { en: 'Mail', es: 'Correo' }, url: 'mailto:marilynsjf@hotmail.com', icon: '/projects/mail.png' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/marilyn-stephany-joven', icon: '/projects/linkedin-icon.png' },
  { name: 'Github', url: 'https://github.com/marilynjov', icon: '/projects/github-icon.png'  },
]
