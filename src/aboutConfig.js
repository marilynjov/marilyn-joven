// ─────────────────────────────────────────────────────────────────────────────
// ABOUT ROOM — the text painted on each wall of the navigable orange box.
// `back` is the wall you land on; `left` / `right` are the side walls you turn to.
// Edit freely; keep lines short so they read well in perspective on the wall.
// ─────────────────────────────────────────────────────────────────────────────
// Wall text, per language. The component reads ABOUT_WALLS[lang]. Links are the
// same in both languages (GitHub / LinkedIn / CV), so only the labels that differ
// need translating.
export const ABOUT_WALLS = {
  en: {
    back: {
      heading: 'About',
      subtitle: 'MSc in Systems and Computer Engineering',
      body:
        "I'm a full-stack developer and visual-analytics researcher focused on decision-making — " +
        'with experience in process automation, data visualization, and building solutions that ' +
        'make an impact across diverse technological environments.',
      links: [
        { label: 'GitHub', url: 'https://github.com/marilynjov' },
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/marilyn-stephany-joven' },
        { label: 'CV (PDF)', url: '/cv/cv-en.pdf' },
      ],
    },
    left: {
      heading: 'What I bring',
      lines: ['Full-stack development', 'Visual analytics', 'Process automation', 'Data visualization', 'Interactive Systems'],
      languagesHeading: 'Languages',
      languages: [
        'Spanish — Native',
        'English — Advanced',
        'Portuguese — Basic',
        'French — Basic',
        'German — Basic',
      ],
    },
    right: {
      heading: 'This site',
      body:
        'More than a portfolio, this is a little window into who I am. Beyond the code I ' +
        'paint, take photos, draw on my iPad, and create things — and, above all, I love to program. ' +
        'Every section here is a piece of that.',
    },
  },
  es: {
    back: {
      heading: 'Sobre mí',
      subtitle: 'Maestría en Ingeniería de Sistemas y Computación',
      body:
        'Soy desarrolladora full-stack e investigadora en visual analytics aplicada a la toma de ' +
        'decisiones — con experiencia en automatización de procesos, visualización de datos y el ' +
        'desarrollo de soluciones con impacto en entornos tecnológicos diversos.',
      links: [
        { label: 'GitHub', url: 'https://github.com/marilynjov' },
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/marilyn-stephany-joven' },
        { label: 'CV (PDF)', url: '/cv/cv-es.pdf' },
      ],
    },
    left: {
      heading: 'Lo que aporto',
      lines: ['Desarrollo full-stack', 'Visual analytics', 'Automatización de procesos', 'Visualización de datos', 'Sistemas interactivos'],
      languagesHeading: 'Idiomas',
      languages: [
        'Español — Nativo',
        'Inglés — Avanzado',
        'Portugués — Básico',
        'Francés — Básico',
        'Alemán — Básico',
      ],
    },
    right: {
      heading: 'Esta página',
      body:
        'Más que un portafolio, esta es una pequeña parte de quién soy. Más allá del código ' +
        'me gusta pintar, tomar fotos, dibujar en mi iPad y crear cosas — y, sobre todo, me encanta programar. ' +
        'Cada sección aquí es una parte de eso.',
    },
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
// directly. Inter (woff v1 — not woff2, whose troika worker path can hang and hide
// the text). Swap these two paths to change the About room typeface.
export const ROOM_FONT = '/fonts/Inter-Regular.woff'
export const ROOM_FONT_BOLD = '/fonts/Inter-Bold.woff'

// ── Framed photo on the wall ─────────────────────────────────────────────────
// A horizontal picture hung like a framed print. Drop a wide image in public/about/
// and point `src` at it (leave src empty '' to show nothing). The frame sizes to
// `width`; its height follows the image's own aspect ratio, so it won't stretch.
//   wall  : which wall it hangs on — 'back' | 'left' | 'right'
//   width : frame width in world units (the room is ~5.6 wide, ~3.4 tall)
//   x / y : offset along that wall (world units; +x right, +y up)
export const ABOUT_PHOTO = {
  src: '/about/yo.JPG', // note: case-sensitive on deploy — file is yo.JPG
  wall: 'left',
  width: 1.7,
  x: 1.5, // to the right of the (left-shifted) text
  y: 0,
  frameColor: '#241812', // the outer frame border
  frameWidth: 0.04,
  matColor: '#f4ece0', // thin inner mat around the photo; set to null to skip
  matWidth: 0.04,
}
