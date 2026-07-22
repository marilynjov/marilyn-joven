import { useRef, useState } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import {
  MENU_Z,
  MENU_BG_Z,
  PLANE_HEIGHT,
  IMAGE_ASPECT,
  CAMERA_FOV,
  CAMERA_END_Z,
} from './config'

const BG_WIDTH = PLANE_HEIGHT * IMAGE_ASPECT
const _target = new THREE.Vector3() // reused each frame (set to each plane's z)
const _world = new THREE.Vector3() // reused for reading a hit-box's world position

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

// `anchor`/`wordAnchor` = block/text centers, measured from each PNG's alpha.
// `hit` = block bounding-box size (w, h) as image fractions → the clickable area.
// `nudge` [x, y] shifts the whole item on WIDE screens only (viewport fractions).
const ITEMS = [
  { key: 'about', label: '/abt.png', word: '/about.png', anchor: [0.484, 0.602], wordAnchor: [0.47, 0.582], hit: [0.24, 0.277], nudge: [0, 0] },
  { key: 'experience', label: '/exp.png', word: '/experience.png', anchor: [0.201, 0.428], wordAnchor: [0.188, 0.442], hit: [0.273, 0.24], nudge: [0, 0] },
  { key: 'projects', label: '/proj.png', word: '/projects.png', anchor: [0.819, 0.695], wordAnchor: [0.85, 0.69], hit: [0.238, 0.243], nudge: [0, 0] },
  { key: 'skills', label: '/skill.png', word: '/skills.png', anchor: [0.706, 0.302], wordAnchor: [0.716, 0.329], hit: [0.251, 0.249], nudge: [0, 0] },
]

const ALL_FILES = ITEMS.flatMap((it) => [it.label, it.word])

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

// The viewport's world size at distance `d` for the camera's vertical FOV.
const HALF_FOV_TAN = Math.tan((CAMERA_FOV * Math.PI) / 180 / 2)

const columnY = (i, n) => (n === 1 ? 0 : COL_HALF - (2 * COL_HALF) * (i / (n - 1)))

// One full-screen plane that cover-scales at its own depth `z`. Handles the
// responsive stack, the word→label alignment, the scroll fade, and a `tint`
// (1 = full colour, <1 = dimmed). Children (e.g. a hit-box) ride its transform.
function CoverPlane({
  texture,
  z,
  renderOrder,
  selfAnchor,
  alignAnchor,
  nudge,
  layout,
  fade,
  tint = 1,
  progress,
  nav,
  children,
}) {
  const ref = useRef()
  const cur = useRef({ x: 0, y: 0, s: 1, t: 1 }) // animated world state + tint

  useFrame((state) => {
    if (!ref.current) return

    _target.set(0, 0, z)
    const vp = state.viewport.getCurrentViewport(state.camera, _target)
    const zoom = 1 + progress.current.current * BG_SCROLL_ZOOM

    // Live cover: re-fits the viewport every frame (keeps it responsive). Frozen
    // cover: the size it has when viewed from the MENU camera distance. During the
    // About zoom we blend live → frozen so moving the camera actually magnifies
    // the block (otherwise the live re-fit cancels the camera's zoom out entirely).
    const liveCover =
      Math.max(vp.width / BG_WIDTH, vp.height / PLANE_HEIGHT) * BG_COVER * zoom
    const refH = 2 * (CAMERA_END_Z - z) * HALF_FOV_TAN
    const refW = refH * (vp.width / vp.height)
    const refCover =
      Math.max(refW / BG_WIDTH, refH / PLANE_HEIGHT) * BG_COVER * zoom
    const a = easeInOutCubic(Math.min(1, Math.max(0, nav.current.current)))
    const cover = liveCover + (refCover - liveCover) * a

    cur.current.s += (layout.scale - cur.current.s) * ANIM
    const s = cover * cur.current.s

    let offX
    let offY
    if (layout.stack) {
      const ax = (selfAnchor[0] - 0.5) * BG_WIDTH * s
      const ay = (0.5 - selfAnchor[1]) * PLANE_HEIGHT * s
      offX = layout.screen[0] * vp.width - ax
      offY = layout.screen[1] * vp.height - ay
    } else {
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
    cur.current.t += (tint - cur.current.t) * ANIM

    ref.current.scale.set(s, s, 1)
    ref.current.position.x = cur.current.x
    ref.current.position.y = cur.current.y
    ref.current.material.color.setScalar(cur.current.t)

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
      {children}
    </mesh>
  )
}

function MenuItem({ item, labelTex, wordTex, layout, progress, nav, onSelect, dim, onHover }) {
  // Clicks/hover only count at the menu (scrolled in) and not mid-About.
  const active = () =>
    progress.current.current > 0.8 && nav.current.current < 0.3

  return (
    <group>
      {/* Label plane + an invisible hit-box sized to the painted block. */}
      <CoverPlane
        texture={labelTex}
        z={LABEL_Z}
        renderOrder={-2}
        selfAnchor={item.anchor}
        nudge={item.nudge}
        layout={layout}
        fade={false}
        progress={progress}
        nav={nav}
      >
        <mesh
          position={[
            (item.anchor[0] - 0.5) * BG_WIDTH,
            (0.5 - item.anchor[1]) * PLANE_HEIGHT,
            0.3,
          ]}
          onClick={(e) => {
            if (!active()) return
            e.stopPropagation()
            onSelect(item.key, e.object.getWorldPosition(_world))
          }}
          onPointerOver={(e) => {
            if (!active()) return
            e.stopPropagation()
            onHover(item.key)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            onHover(null)
            document.body.style.cursor = 'auto'
          }}
        >
          <planeGeometry args={[item.hit[0] * BG_WIDTH, item.hit[1] * PLANE_HEIGHT]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </CoverPlane>

      {/* Word plane — dims when another item is hovered. */}
      <CoverPlane
        texture={wordTex}
        z={WORD_Z}
        renderOrder={-1}
        selfAnchor={item.wordAnchor}
        alignAnchor={item.anchor}
        nudge={item.nudge}
        layout={layout}
        fade={true}
        tint={dim ? 0.7 : 1}
        progress={progress}
        nav={nav}
      />
    </group>
  )
}

export function Menu3D({ progress, nav, onSelect }) {
  const textures = useTexture(ALL_FILES)
  textures.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace))

  const width = useThree((state) => state.size.width)
  const isSmall = width < SMALL_BREAKPOINT
  const n = ITEMS.length

  const [hoveredKey, setHoveredKey] = useState(null)

  return (
    <group>
      {ITEMS.map((it, i) => {
        const layout = isSmall
          ? { stack: true, screen: [0, columnY(i, n)], scale: SMALL_SCALE }
          : { stack: false, scale: 1 }
        return (
          <MenuItem
            key={it.key}
            item={it}
            labelTex={textures[i * 2]}
            wordTex={textures[i * 2 + 1]}
            layout={layout}
            progress={progress}
            nav={nav}
            onSelect={onSelect}
            dim={hoveredKey !== null && hoveredKey !== it.key}
            onHover={setHoveredKey}
          />
        )
      })}
    </group>
  )
}
