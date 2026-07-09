// ─────────────────────────────────────────────────────────────────────────────
// All the tunable knobs live here. Change these numbers and watch the scene
// react — this is the fastest way to build intuition for 3D space.
//
// COORDINATE SYSTEM (Three.js): +X right, +Y up, +Z toward the viewer.
// Our camera sits at a POSITIVE z and looks toward NEGATIVE z (into the screen).
// So "deeper into the scene" = more negative z.
// ─────────────────────────────────────────────────────────────────────────────

// The 5 paint layers, back-to-front. Order matters: layer1 is the BACK of the
// stack (farthest from the viewer), layer5 is the FRONT (nearest). That matches
// how you described stacking them 1→5 with 5 on top.
export const LAYER_FILES = [
  '/layer5.PNG', 
  '/layer4.PNG',  
  '/layer3.PNG',
  '/layer2.PNG',
  '/layer1.PNG', 
]

// Your source images are 2388 × 1668 → aspect ratio ~1.43 (wide).
export const IMAGE_ASPECT = 2388 / 1668

// World height of the front-most plane. Width is derived from the aspect ratio.
export const PLANE_HEIGHT = 6

// Gap (in world units) between adjacent paint layers along z.
// Bigger = more dramatic parallax as you fly through.
export const LAYER_GAP = 4

// The front plane (layer5) sits here. Each earlier layer is one LAYER_GAP deeper.
export const FRONT_Z = 0

// Where the camera starts — in front of the whole stack, looking in.
export const CAMERA_START_Z = 5

// Big empty gap AFTER the last paint layer, before the menu. This is the "very
// separated" space you pass into, like stepping out the far side of the curtain.
export const MENU_GAP = 16

// How much to ease/damp the camera toward the target each frame (0..1).
// Lower = smoother, more "weighty" glide. Higher = snappier.
export const SCROLL_DAMPING = 0.06

// How far one notch of wheel/scroll pushes progress (0..1 over the whole journey).
export const SCROLL_SENSITIVITY = 0.0008

// ── Derived positions (don't edit these; edit the knobs above) ───────────────

// z of each layer, index 0 = layer1 (back) … index 4 = layer5 (front).
export const LAYER_Z = LAYER_FILES.map(
  (_, i) => FRONT_Z - (LAYER_FILES.length - 1 - i) * LAYER_GAP,
)

// z of the back-most paint layer (layer1).
export const BACK_Z = LAYER_Z[0]

// The menu floats out here, well past the last layer.
export const MENU_Z = BACK_Z - MENU_GAP

// Where the camera ends up: just in front of the menu so you can read it.
export const CAMERA_END_Z = MENU_Z + 6
