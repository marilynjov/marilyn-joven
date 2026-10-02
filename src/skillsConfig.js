// ─────────────────────────────────────────────────────────────────────────────
// SKILLS — the tech icons that float over the skills view.
//
// Each skill needs TWO PNGs (transparent background), same size, in public/skills/:
//     public/skills/bw/<slug>.png      ← black-and-white (shown by default)
//     public/skills/color/<slug>.png   ← full colour  (revealed as you "paint")
// Hover an icon and drag across it — you paint the B&W away to reveal the colour
// under it; colour in enough of it and it stays.
//
//   on      = OPTIONAL. Set `on: false` to switch an icon OFF without deleting it.
//             The rest of its row re-spaces itself, so nothing else needs editing.
//             (Switch a whole row off and its heading disappears too.)
//   y       = which row the icon belongs to (it joins the last SKILL_ROWS heading
//             above it), and how high it floats within that row — as a % of the
//             viewport. Vary it between neighbours to keep the scattered look.
//             The x position is worked out automatically: each row spreads its
//             icons evenly across the screen, and stacks them 3-per-line on phones.
//   size    = scale multiplier on the base icon size (1 = default).
//   amp     = [x, y, rot] cursor-parallax depth: px sideways, px vertical, deg.
//   nudgeX  = OPTIONAL. Shifts just this icon sideways (% of the viewport, may be
//             negative) if the automatic spacing needs a tweak on wide screens.
//   bwScale = OPTIONAL. Scales ONLY the black-and-white layer (1 = default), to
//             realign a B&W PNG that has more/less padding than its colour twin.
//
// Add / remove a skill by editing this list; drop its two PNGs in the folders above.
// ─────────────────────────────────────────────────────────────────────────────
export const SKILLS = [
  // — Languages —
  { name: 'Python',     slug: 'python',     y: 24, size: 1.3, amp: [10, 16, 3] },
  { name: 'Java',       slug: 'java',       y: 18, size: 1.3, amp: [8, 13, 4] },
  { name: 'JavaScript', slug: 'javascript', y: 25, size: 1.3,  amp: [11, 15, 2]},
  { name: 'TypeScript', slug: 'typescript', y: 19, size: 1.2,  amp: [9, 12, 3] },
  { name: 'SQL',        slug: 'sql',        y: 22, size: 1.2,  amp: [7, 17, 4] },

  // — Technologies —
  { name: 'React',      slug: 'react',      y: 54, size: 1.2,  amp: [12, 15, 2], bwScale: 1.001 },
  { name: 'Angular',    slug: 'angular',    y: 60, size: 1.2, amp: [9, 13, 4] },
  { name: 'Flask',      slug: 'flask',      y: 52, size: 1.3,  amp: [8, 16, 3] },
  { name: 'FastAPI',    slug: 'fastapi',    y: 58, size: 1.3,  amp: [11, 12, 3] },
  { name: 'PostgreSQL', slug: 'postgresql', y: 55, size: 1.3, amp: [10, 14, 2] },

  // — Tools —
  { name: 'Power BI',   slug: 'powerbi',    y: 84, size: 1.3,  amp: [8, 13, 4],  bwScale: 1.01  },
  { name: 'Tableau',    slug: 'tableau',    y: 80, size: 1.3, amp: [11, 14, 3], bwScale: 1.01 },
  { name: 'Unity',      slug: 'unity',      y: 82, size: 1.3,  amp: [8, 15, 3] },
  { name: 'AWS',        slug: 'aws',        y: 79, size: 1.3,  amp: [10, 14, 3]},
  { name: 'Docker',     slug: 'docker',     y: 83, size: 1.3,  amp: [9, 16, 3] },
]

// Faded heading above each row (y = % of the viewport, like the icons above).
// `label` is { en, es } — the row headings are the only translated bit here; the
// skill names (Python, React…) are the same in every language.
export const SKILL_ROWS = [
  { label: { en: 'Languages',    es: 'Lenguajes' },    y: 7 },
  { label: { en: 'Technologies', es: 'Tecnologías' },  y: 41 },
  { label: { en: 'Tools',        es: 'Herramientas' }, y: 69 },
]

// Where each icon's two PNGs live, derived from its slug.
export const bwSrc = (slug) => `/skills/bw/${slug}.png`
export const colorSrc = (slug) => `/skills/color/${slug}.png`
