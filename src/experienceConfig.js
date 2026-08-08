// ─────────────────────────────────────────────────────────────────────────────
// EXPERIENCE — the photos on the Exp-6 film strip (left → right, newest first).
// Each entry is one CLICKABLE frame. `x`,`y` = the frame CENTER, `w`,`h` = its
// size, ALL as fractions of the Exp-6 image (0 = left/top … 1 = right/bottom).
// Nudge these until each clickable box sits exactly over its photo — set
// DEBUG_HITBOXES = true below to see the boxes while you tune.
//
// `year` / `role` print in the film-style caption; `note` is an optional line.
// There are 5 frames on the strip (the 6th slot is where the film canister sits).
// ─────────────────────────────────────────────────────────────────────────────
export const EXP_PHOTOS = [
  { x: 0.123, y: 0.503, w: 0.14, h: 0.145, year: '2022', role: 'Teaching Assistant · Universidad de los Andes',
    note: '2022–24. Supported the Languages & Machines course — problem-solving, grading, and academic follow-up for 40+ students.' },
  { x: 0.287, y: 0.503, w: 0.14, h: 0.145, year: '2024', role: 'Research Assistant · Universidad de los Andes',
    note: '2024. Built the core algorithmic logic, data model, and frontend for a service within the No Estás Solx platform.' },
  { x: 0.451, y: 0.503, w: 0.14, h: 0.145, year: '2024', role: 'Data Analyst · Cornell University',
    note: '2024. Cleaned, analyzed, and visualized maternal mental-health data (PRAMS), applying statistical methods to surface insights.' },
  { x: 0.615, y: 0.503, w: 0.14, h: 0.145, year: '2024', role: 'Full-Stack Developer · Verivolt',
    note: '2024–25. Led frontend for hardware-operations automation — UI design, data visualization, and backend integration that improved workflows.' },
  // The two Graduate Assistant roles at Uniandes, merged into one stamp.
  { x: 0.778, y: 0.503, w: 0.14, h: 0.145, year: '2025', role: 'Graduate Assistant · Universidad de los Andes',
    note: '2025–26. Full-stack work on the No Estás Solx platform, now automating institutional processes and QA for the Digital Transformation Vice Rectorate.' },
]

// Minimum zoom floor toward the clicked photo (the fill scale usually wins).
export const EXP_ZOOM = 2.0

// How tightly the click zooms in. 1 = the photo exactly fills the screen; LOWER
// (e.g. 0.9) zooms in a little less and shows a sliver of film around it; higher
// (1.1) crops in tighter. Lower this to "zoom in a little less".
export const EXP_FILL = 0.95

// How dark the fade-to-black over the photo gets (0 = none … 1 = fully black).
// Raise it to make the stamped photo a little darker.
export const EXP_DARKEN = 1.6

// Flip to true to visualize the clickable boxes while positioning them.
export const DEBUG_HITBOXES = false
