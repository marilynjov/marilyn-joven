// ─────────────────────────────────────────────────────────────────────────────
// THE PROJECTS iPad HOMESCREEN — edit to add / remove tiles.
//
// Every tile is one object in HOME_ITEMS (the main grid) or DOCK (bottom bar).
//
//   App  (small icon):
//     { name: 'GitHub', url: 'https://github.com/you', icon: '/home/github.png' }
//     - `icon` is optional. No icon → a coloured tile with the first letter.
//
//   Widget (big image tile):
//     { widget: true, image: '/home/newspaper.png', url: 'https://…', w: 2, h: 2 }
//     - `w` / `h` = how many grid cells it spans (default 1×1).
//     - `url` is optional (drop it for a non-clickable widget).
//     - No `image` yet → a placeholder tile so the layout still works.
//
// Put images in  public/home/  and reference them as  '/home/<file>'.
// ─────────────────────────────────────────────────────────────────────────────

export const HOME_ITEMS = [
  // — widgets (big image tiles) —
  { widget: true, name: 'Procreate', image: '/widget-3.jpg', url: 'https://example.com', w: 2, h: 2 },
  { widget: true, name: 'Indigo', image: '/home/indigo.png', url: 'https://example.com', w: 2, h: 1 },
  { widget: true, name: 'Procreate', image: '/widget-1.jpg', url: 'https://example.com', w: 3, h: 2 },

  // — apps (small icons) —
  { name: 'Portfolio', url: 'https://marilyn-joven.vercel.app/', icon: '/portfolio.png' },
  { name: 'My Weather', url: 'https://weather-gamma-blue.vercel.app/',icon: '/myweather-icon.png' },
  { name: 'Posture Guard', url: 'https://notion.so',icon: '/postureguard-icon.png'},
  { name: 'Thesis', url: 'https://arc.net/l/quote/vhzdhzom', icon: '/home/github.png' },
]

export const DOCK = [
  { name: 'Mail', url: 'mailto:marilynsjf@hotmail.com', icon: '/mail.png' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/marilyn-stephany-joven', icon: '/linkedin-icon.png' },
  { name: 'Github', url: 'https://github.com/marilynjov', icon: '/github-icon.png'  },
]
