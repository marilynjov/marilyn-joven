// ─────────────────────────────────────────────────────────────────────────────
// SKILLS — the tech icons that float over the skills view.
//
// Each skill needs TWO PNGs (transparent background), same size, in public/skills/:
//     public/skills/bw/<slug>.png      ← black-and-white (shown by default)
//     public/skills/color/<slug>.png   ← full colour  (revealed as you "paint")
// Hovering an icon and moving the cursor over it erases the B&W to reveal the
// colour underneath; paint enough of it and it locks to full colour.
//
//   x / y   = where the icon's CENTRE sits, as a % of the viewport (0–100).
//   size    = scale multiplier on the base icon size (1 = default).
//   amp     = [x, y, rot] cursor-parallax depth: px sideways, px vertical, deg.
//   bwScale = OPTIONAL. Scales ONLY the black-and-white layer (1 = default), to
//             realign a B&W PNG that has more/less padding than its colour twin.
//
// Add / remove a skill by editing this list; drop its two PNGs in the folders above.
// ─────────────────────────────────────────────────────────────────────────────
export const SKILLS = [
  // — Languages —
  { name: 'Python',     slug: 'python',     x: 10, y: 24, size: 1.3, amp: [10, 16, 3] },
  { name: 'Java',       slug: 'java',       x: 25, y: 18, size: 1.3, amp: [8, 13, 4] },
  { name: 'JavaScript', slug: 'javascript', x: 44, y: 25, size: 1.3,  amp: [11, 15, 2]},
  { name: 'TypeScript', slug: 'typescript', x: 60, y: 19, size: 1.2,  amp: [9, 12, 3] },
  { name: 'SQL',        slug: 'sql',        x: 84, y: 22, size: 1.2,  amp: [7, 17, 4] },

  // — Technologies —
  { name: 'React',      slug: 'react',      x: 8,  y: 54, size: 1.2,  amp: [12, 15, 2], bwScale: 1.001 },
  { name: 'Angular',    slug: 'angular',    x: 23, y: 60, size: 1.2, amp: [9, 13, 4] },
  { name: 'Flask',      slug: 'flask',      x: 41, y: 52, size: 1.3,  amp: [8, 16, 3] },
  { name: 'FastAPI',    slug: 'fastapi',    x: 64, y: 58, size: 1.3,  amp: [11, 12, 3] },
  { name: 'PostgreSQL', slug: 'postgresql', x: 80, y: 55, size: 1.3, amp: [10, 14, 2] },

  // — Tools —
  { name: 'Power BI',   slug: 'powerbi',    x: 24, y: 84, size: 1.3,  amp: [8, 13, 4],  bwScale: 1.01  },
  { name: 'Tableau',    slug: 'tableau',    x: 55, y: 80, size: 1.3, amp: [11, 14, 3], bwScale: 1.01 },
  { name: 'Unity',      slug: 'unity',      x: 86, y: 82, size: 1.3,  amp: [8, 15, 3] },
]

// Faded heading above each row (y = % of the viewport, like the icons above).
export const SKILL_ROWS = [
  { label: 'Languages',    y: 7 },
  { label: 'Technologies', y: 41 },
  { label: 'Tools',        y: 69 },
]

// Where each icon's two PNGs live, derived from its slug.
export const bwSrc = (slug) => `/skills/bw/${slug}.png`
export const colorSrc = (slug) => `/skills/color/${slug}.png`
