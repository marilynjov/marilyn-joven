import { useRef } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { MENU_Z, MENU_BG_Z, PLANE_HEIGHT, IMAGE_ASPECT } from './config'

const BG_WIDTH = PLANE_HEIGHT * IMAGE_ASPECT
const _target = new THREE.Vector3() // reused each frame (set to each plane's z)

// Overscan past "just covers the viewport". Shared so the menu zooms together.
const BG_COVER = 1.09

// Tiny scroll-driven zoom so the menu feels alive instead of pasted-on.
const BG_SCROLL_ZOOM = 0.04

// The two depths that give the menu its 3D feel. Labels sit deeper; words float a
// little closer to the camera, so with the mouse look-around they parallax apart.
const LABEL_Z = MENU_BG_Z
const WORD_Z = MENU_Z // ~3 units nearer than the labels (see config MENU_BG_Z)

// ── Responsive stacking ──────────────────────────────────────────────────────
const SMALL_BREAKPOINT = 768 // canvas width (px) below which we stack vertically
const COL_HALF = 0.36 // half-height of the mobile column, as a screen fraction
const SMALL_SCALE = 0.55 // shrink each item on mobile so the rows don't overlap
const ANIM = 0.12 // easing per frame for the layout transition (0..1)

// ─────────────────────────────────────────────────────────────────────────────
// Each menu item is TWO full-screen PNG planes, pre-positioned in the image so
// they cover-scale into place:
//   • label — the painted block. ALWAYS visible; the four form the background.
//   • word  — the section name, on a nearer plane (3D pop). FADES IN with scroll.
//
// `anchor` is the element's CENTER in the image, [x, y], (0,0) = top-left,
// (1,1) = bottom-right. On wide screens items stay exactly where painted; on
// mobile we place the point at `anchor` into a centered, evenly-spaced column.
// ⚠️ Set each anchor to where YOUR element actually sits in its full-screen PNG.
// ─────────────────────────────────────────────────────────────────────────────
// `anchor`     = label block's center in its PNG (measured from alpha).
// `wordAnchor` = word text's center in its PNG (measured from alpha).
// The word plane auto-shifts so wordAnchor lands on the label's anchor, so the
// text always sits centered on its block — re-measure both if you move things.
// `nudge` [x, y] shifts the whole item on WIDE screens only, in viewport
// fractions: −x = left, +x = right; +y = up, −y = down. (Mobile re-centers.)
const ITEMS = [
  { key: 'about', label: '/abt.png', word: '/about.png', anchor: [0.484, 0.602], wordAnchor: [0.47, 0.582], nudge: [0, 0] },
  { key: 'experience', label: '/exp.png', word: '/experience.png', anchor: [0.201, 0.428], wordAnchor: [0.188, 0.442], nudge: [0, 0] },
  { key: 'projects', label: '/proj.png', word: '/projects.png', anchor: [0.819, 0.695], wordAnchor: [0.85, 0.69], nudge: [0, 0] },
  { key: 'skills', label: '/skill.png', word: '/skills.png', anchor: [0.706, 0.302], wordAnchor: [0.716, 0.329], nudge: [0, 0] },
]

// Flat list of every file, [label, word, label, word, …], for useTexture.
const ALL_FILES = ITEMS.flatMap((it) => [it.label, it.word])

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// Where row i sits in the mobile column, as a centered screen fraction of height
// (+ = up). Row 0 at the top (+COL_HALF), last row at the bottom (−COL_HALF).
const columnY = (i, n) => (n === 1 ? 0 : COL_HALF - (2 * COL_HALF) * (i / (n - 1)))

// One full-screen plane that cover-scales at its own depth `z`. When `layout.stack`
// is on, it shifts (in WORLD units, computed live) so the point at `anchor` lands
// at the target screen spot — correct no matter how the element sits in the image.
// Position + scale ease toward their targets so wide ↔ mobile animates smoothly.
function CoverPlane({
  texture,
  z,
  renderOrder,
  selfAnchor,
  alignAnchor,
  nudge,
  layout,
  fade,
  progress,
}) {
  const ref = useRef()
  const cur = useRef({ x: 0, y: 0, s: 1 }) // animated world state

  useFrame((state) => {
    if (!ref.current) return

    _target.set(0, 0, z)
    const vp = state.viewport.getCurrentViewport(state.camera, _target)
    const zoom = 1 + progress.current.current * BG_SCROLL_ZOOM
    const cover =
      Math.max(vp.width / BG_WIDTH, vp.height / PLANE_HEIGHT) * BG_COVER * zoom

    // Ease scale first — the offset math below depends on the current scale.
    cur.current.s += (layout.scale - cur.current.s) * ANIM
    const s = cover * cur.current.s

    let offX
    let offY
    if (layout.stack) {
      // Mobile: shift so this plane's own element (selfAnchor) lands at the slot.
      const ax = (selfAnchor[0] - 0.5) * BG_WIDTH * s
      const ay = (0.5 - selfAnchor[1]) * PLANE_HEIGHT * s // image y is top-down
      offX = layout.screen[0] * vp.width - ax
      offY = layout.screen[1] * vp.height - ay
    } else {
      // Wide: stay as painted, plus (for the word) align selfAnchor → alignAnchor
      // so the text centers on its block, plus any manual per-item nudge.
      let ax = 0
      let ay = 0
      if (alignAnchor) {
        ax = (alignAnchor[0] - selfAnchor[0]) * BG_WIDTH * s
        ay = (selfAnchor[1] - alignAnchor[1]) * PLANE_HEIGHT * s
      }
      offX = nudge[0] * vp.width + ax
      offY = nudge[1] * vp.height + ay
    }

    cur.current.x += (offX - cur.current.x) * ANIM
    cur.current.y += (offY - cur.current.y) * ANIM

    ref.current.scale.set(s, s, 1)
    ref.current.position.x = cur.current.x
    ref.current.position.y = cur.current.y

    if (fade) {
      const o = smoothstep(0.72, 1, progress.current.current)
      ref.current.material.opacity = o
      ref.current.visible = o > 0.01
    }
  })

  return (
    <mesh ref={ref} position={[0, 0, z]} renderOrder={renderOrder}>
      <planeGeometry args={[BG_WIDTH, PLANE_HEIGHT]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
        opacity={fade ? 0 : 1}
      />
    </mesh>
  )
}

export function Menu3D({ progress }) {
  const textures = useTexture(ALL_FILES)
  textures.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace))

  // Live breakpoint — re-renders on resize.
  const width = useThree((state) => state.size.width)
  const isSmall = width < SMALL_BREAKPOINT
  const n = ITEMS.length

  return (
    <group>
      {ITEMS.map((it, i) => {
        // Same layout drives the label and its word so they move together.
        const layout = isSmall
          ? { stack: true, screen: [0, columnY(i, n)], scale: SMALL_SCALE }
          : { stack: false, scale: 1 }
        return (
          <group key={it.key}>
            {/* Label: its own block center is the anchor; no alignment. */}
            <CoverPlane
              texture={textures[i * 2]}
              z={LABEL_Z}
              renderOrder={-2}
              selfAnchor={it.anchor}
              nudge={it.nudge}
              layout={layout}
              fade={false}
              progress={progress}
            />
            {/* Word: aligns its text center onto the label's block center. */}
            <CoverPlane
              texture={textures[i * 2 + 1]}
              z={WORD_Z}
              renderOrder={-1}
              selfAnchor={it.wordAnchor}
              alignAnchor={it.anchor}
              nudge={it.nudge}
              layout={layout}
              fade={true}
              progress={progress}
            />
          </group>
        )
      })}
    </group>
  )
}
