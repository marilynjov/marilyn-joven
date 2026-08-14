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
    // Clickable links shown under the description.
    links: [
      { label: 'GitHub', url: 'https://github.com/marilynjov' },
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/marilyn-stephany-joven' },
      { label: 'CV (PDF)', url: '/resume.pdf' },
    ],
  },
  left: {
    heading: 'What I bring',
    lines: [
      'Creative technology',
      'Data visualization',
      'Interactive systems',
      'Software craft',
    ],
    languagesHeading: 'Languages',
    languages: [
      'Spanish — Native',
      'English — Advanced',
      'French — Basic',
      'German — Basic',
      'Portuguese — Basic',
    ],
  },
  right: {
    heading: 'This site',
    body:
      'More than a portfolio, this is a little window into who I am. Beyond the code I ' +
      'paint, take photographs, and draw on my iPad — and, above all, I love to program. ' +
      'Every section here is a piece of that.',
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
