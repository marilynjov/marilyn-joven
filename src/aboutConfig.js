// ─────────────────────────────────────────────────────────────────────────────
// ABOUT ROOM — the text painted on each wall of the navigable orange box.
// `back` is the wall you land on; `left` / `right` are the side walls you turn to.
// Edit freely; keep lines short so they read well in perspective on the wall.
// ─────────────────────────────────────────────────────────────────────────────
export const ABOUT_WALLS = {
  back: {
    heading: 'About',
    body:
      "I'm a creative engineer who builds at the seam between design and code — " +
      'turning abstract data and ideas into things people can see, touch, and move through.',
  },
  left: {
    heading: 'What I love',
    lines: [
      'Creative technology',
      'Data visualization',
      'Interactive systems',
      'Software craft',
    ],
    meta: ["Master's student", 'Bogotá, Colombia'],
  },
  right: {
    heading: 'Get in touch',
    links: [
      { label: 'Email', url: 'mailto:m.joven@uniandes.edu.co' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/marilyn-stephany-joven' },
      { label: 'GitHub', url: 'https://github.com/marilynjov' },
      { label: 'Resume', url: '/resume.pdf' },
    ],
  },
}

// Flat colours per face (sampled to match the perspective-box reference). Tweak to
// taste — the different shades are what sell the 3D room on unlit materials.
export const ROOM_COLORS = {
  back: '#d67a4d',
  ceiling: '#c56c3d',
  floor: '#ef9159',
  left: '#e28150',
  right: '#dd7d4b',
}

// Text colour on the walls (+ a soft dark outline so it stays legible on orange).
export const ROOM_TEXT = '#fff7f0'
export const ROOM_TEXT_OUTLINE = 'rgba(60, 20, 6, 0.55)'

// Wall type. 3D text needs a real font FILE, so it can't use the site's CSS stack
// ('Helvetica Neue', Helvetica, Arial, …) directly — those are proprietary/system
// fonts. Arimo is the open, metric-compatible match for Arial/Helvetica. woff
// (v1), not woff2 — troika's woff2 path can hang in the worker and hide the text.
export const ROOM_FONT = '/fonts/Arimo-Regular.woff'
export const ROOM_FONT_BOLD = '/fonts/Arimo-Bold.woff'
