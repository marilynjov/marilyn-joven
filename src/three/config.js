// ─────────────────────────────────────────────────────────────────────────────
// All the tunable knobs live here. 
// COORDINATE SYSTEM (Three.js): +X right, +Y up, +Z toward the viewer.
// Our camera sits at a POSITIVE z and looks toward NEGATIVE z (into the screen).
// So "deeper into the scene" = more negative z.
// ─────────────────────────────────────────────────────────────────────────────

// The 5 paint layers, back-to-front. Order matters: layer5 is the BACK of the
// stack (farthest from the viewer), layer1 is the FRONT (nearest). That matches
// how you described stacking them 1→5 with 5 on top.
// layer5 is NOT here — it's the always-on background (MENU_BG_FILE below), so it
// would show twice if it were also in the curtain. These are the moving layers.
export const LAYER_FILES = [
  '/layer4.PNG',
  '/layer3.PNG',
  '/layer2.PNG',
  '/layer1.PNG',
]

// NOTE: layer5 is no longer used — the menu background is now built from the four
// individual label PNGs (see ITEMS in Menu3D.jsx), each a full-screen plane. You
// can leave layer5.PNG in public/ or delete it; nothing imports it anymore.

// Source images are 2388 × 1668 → aspect ratio ~1.43 (wide).
export const IMAGE_ASPECT = 2388 / 1668

// World height of the front-most plane. Width is derived from the aspect ratio.
export const PLANE_HEIGHT = 6

// Extra zoom on the whole curtain beyond "just fills the screen". 1.0 = the paint
// edges sit exactly at the borders; raise it (1.15, 1.3, …) to push those ragged
// edges off-screen so the layers read as full-bleed.
export const LAYER_ZOOM = 1.1

// Gap (in world units) between adjacent paint layers along z.
// Bigger = more dramatic parallax as you fly through.
export const LAYER_GAP = 25

// The front plane (layer5) sits here. Each earlier layer is one LAYER_GAP deeper.
export const FRONT_Z = 0

// Where the camera starts — in front of the whole stack, looking in.
export const CAMERA_START_Z = 5

// Vertical field of view of the camera (degrees). Shared by the <Canvas> and the
// responsive cover math so they always agree.
export const CAMERA_FOV = 50

// Big empty gap AFTER the last paint layer, before the menu. This is the "very
// separated" space you pass into, like stepping out the far side of the curtain.
export const MENU_GAP = 16

// How much to ease/damp the camera toward the target each frame (0..1).
// Lower = smoother, more "weighty" glide. Higher = snappier.
export const SCROLL_DAMPING = 0.06

// How far one notch of wheel/scroll pushes progress (0..1 over the whole journey).
export const SCROLL_SENSITIVITY = 0.0008

// ── Look-around (mouse parallax once you arrive at the menu) ──────────────────

// Max sideways/vertical camera drift, in world units, at full mouse deflection.
// Bigger = you can "peek" further around. Keep it small for a subtle effect.
export const LOOK_STRENGTH = 1.2

// How quickly the camera follows the mouse (0..1). Lower = smoother, laggier.
export const LOOK_DAMPING = 0.05

// Progress range over which look-around fades in — off during the journey, fully
// on only once the menu has arrived. (Menu text fades in over 0.72→1.)
export const LOOK_ACTIVATE_START = 0.85
export const LOOK_ACTIVATE_END = 1.0

// ── Derived positions (don't edit these; edit the knobs above) ───────────────

// z of each layer, index 0 = layer1 (back) … index 4 = layer5 (front).
export const LAYER_Z = LAYER_FILES.map(
  (_, i) => FRONT_Z - (LAYER_FILES.length - 1 - i) * LAYER_GAP,
)

// z of the back-most paint layer (layer1).
export const BACK_Z = LAYER_Z[0]

// The menu floats out here, well past the last layer.
export const MENU_Z = BACK_Z - MENU_GAP

// The painted backdrop sits just behind the menu text.
export const MENU_BG_Z = MENU_Z - 3

// Where the camera ends up: just in front of the menu so you can read it.
export const CAMERA_END_Z = MENU_Z + 6
