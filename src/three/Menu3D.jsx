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
import { pick } from '../i18n'

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
// `wordAnchor` is { en, es } — the Spanish title PNG can sit at a different spot,
// so tweak the `es` [x, y] (image fractions, 0–1) to move ONLY the _esp title.
// `hit` = block bounding-box size (w, h) as image fractions → the clickable area.
// `nudge` [x, y] shifts the whole item on WIDE screens only (viewport fractions).
// `color` = the block's own colour (sampled), used to tint the zoom-in fill.
// `end` [x, y] = where THIS label's zoom comes to rest, as a world-unit offset from
//   the block's centre. +x moves the camera right (content sits left), +y moves it
//   up. This is the per-label version of ABOUT_END_X/Y — tune each independently.
const ITEMS = [
  // `label` (the coloured block) is shared; `word` (the title) has an es variant.
  { key: 'about', label: '/home/abt.webp', word: { en: '/home/about.webp', es: '/home/about_esp.webp' }, anchor: [0.484, 0.602], wordAnchor: { en: [0.47, 0.582], es: [0.47, 0.575] }, hit: [0.24, 0.277], nudge: [0, 0], end: [0.2, 0.13], color: '#eb7c4e' },
  { key: 'experience', label: '/home/exp.webp', word: { en: '/home/experience.webp', es: '/home/experience_esp.webp' }, anchor: [0.201, 0.428], wordAnchor: { en: [0.188, 0.442], es: [0.188, 0.442] }, hit: [0.273, 0.24], nudge: [0, 0], end: [0.2, 0.13], color: '#5aa9a0' },
  { key: 'projects', label: '/home/proj.webp', word: { en: '/home/projects.webp', es: '/home/proyects_esp.webp' }, anchor: [0.819, 0.695], wordAnchor: { en: [0.843, 0.683], es: [0.843, 0.68] }, hit: [0.238, 0.243], nudge: [0, 0], end: [0.2, 0.13], color: '#f8df6a' },
  { key: 'skills', label: '/home/skill.webp', word: { en: '/home/skills.webp', es: '/home/skill_esp.webp' }, anchor: [0.706, 0.302], wordAnchor: { en: [0.716, 0.329], es: [0.705, 0.329] }, hit: [0.251, 0.249], nudge: [0, 0], end: [0.2, 0.13], color: '#c94f4f' },
]

// Every image the menu can show — both language variants of each title, so the
// switch is instant (all preloaded). Deduped, then looked up by path.
const ALL_FILES = [...new Set(ITEMS.flatMap((it) => [it.label, it.word.en, it.word.es]))]

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
  aboutActive,
  sectionKeep = false,
  children,
}) {
  const ref = useRef()
  const cur = useRef({ b: 0, s: 1, t: 1 }) // eased: layout blend, scale, tint

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

    // Desktop position: stay as painted + word→label alignment + manual nudge.
    // Computed with the CURRENT scale and applied instantly (no easing), so the
    // word zooms locked to its label instead of lagging/sliding on arrival.
    let dx = nudge[0] * vp.width
    let dy = nudge[1] * vp.height
    if (alignAnchor) {
      dx += (alignAnchor[0] - selfAnchor[0]) * BG_WIDTH * s
      dy += (selfAnchor[1] - alignAnchor[1]) * PLANE_HEIGHT * s
    }

    // Mobile-column position: this plane's own anchor placed at its column slot.
    const cx = layout.screen[0] * vp.width - (selfAnchor[0] - 0.5) * BG_WIDTH * s
    const cy = layout.screen[1] * vp.height - (0.5 - selfAnchor[1]) * PLANE_HEIGHT * s

    // Ease ONLY the wide↔mobile blend, so the layout switch animates while the
    // in-layout position tracks the zoom exactly.
    cur.current.b += ((layout.stack ? 1 : 0) - cur.current.b) * ANIM
    cur.current.t += (tint - cur.current.t) * ANIM

    ref.current.scale.set(s, s, 1)
    ref.current.position.x = dx + (cx - dx) * cur.current.b
    ref.current.position.y = dy + (cy - dy) * cur.current.b
    ref.current.material.color.setScalar(cur.current.t)

    // Hold the magnified block until the very end, then fade it (0.9→0.98) to hand
    // off to the room. The block covers the screen with orange the whole way in, so
    // the room only appears once fully zoomed and there's no flat-orange fill.
    // On narrow screens the blocks are stacked at centre, so during a section zoom
    // they'd all magnify into a mix of colours. Fade everything but the selected
    // block out as the zoom begins, leaving just its colour (+ the fill) on screen.
    const stackFade =
      layout.stack && !sectionKeep ? 1 - smoothstep(0.12, 0.4, nav.current.current) : 1
    const mf = (aboutActive ? 1 - smoothstep(0.9, 0.98, nav.current.current) : 1) * stackFade
    if (fade) {
      const o = smoothstep(0.72, 1, progress.current.current) * mf
      ref.current.material.opacity = o
      ref.current.visible = o > 0.01
    } else {
      ref.current.material.opacity = mf
      ref.current.visible = mf > 0.01
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

function MenuItem({ item, labelTex, wordTex, layout, progress, nav, onSelect, dim, onHover, aboutActive, lang, activeKey }) {
  // Clicks/hover only count at the menu (scrolled in) and not mid-About.
  const active = () =>
    progress.current.current > 0.8 && nav.current.current < 0.3

  const isSelected = item.key === activeKey

  return (
    <group>
      {/* Label plane + an invisible hit-box sized to the painted block. The selected
          block stays through the zoom (its colour fills); the rest fade on mobile. */}
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
        aboutActive={aboutActive}
        sectionKeep={isSelected}
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
            onSelect(item.key, e.object.getWorldPosition(_world), item.color, item.end)
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

      {/* Word plane — dims when another item is hovered. Its anchor can differ per
          language (the es title PNG may sit differently), so pick by lang. */}
      <CoverPlane
        texture={wordTex}
        z={WORD_Z}
        renderOrder={-1}
        selfAnchor={pick(item.wordAnchor, lang)}
        alignAnchor={item.anchor}
        nudge={item.nudge}
        layout={layout}
        fade={true}
        tint={dim ? 0.7 : 1}
        progress={progress}
        nav={nav}
        aboutActive={aboutActive}
      />
    </group>
  )
}

export function Menu3D({ progress, nav, onSelect, onHoverChange, aboutActive, lang = 'en', activeKey }) {
  const textures = useTexture(ALL_FILES)
  textures.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace))
  // Look textures up by path so we can pick the block + the current-language title.
  const texOf = (file) => textures[ALL_FILES.indexOf(file)]

  const width = useThree((state) => state.size.width)
  const isSmall = width < SMALL_BREAKPOINT
  const n = ITEMS.length

  const [hoveredKey, setHoveredKey] = useState(null)
  // Update local dim state AND notify React-land (App) which item is hovered.
  const handleHover = (key) => {
    setHoveredKey(key)
    if (onHoverChange) onHoverChange(key)
  }

  return (
    <group>
      {ITEMS.map((it, i) => {
        const layout = {
          stack: isSmall,
          screen: [0, columnY(i, n)],
          scale: isSmall ? SMALL_SCALE : 1,
        }
        return (
          <MenuItem
            key={it.key}
            item={it}
            labelTex={texOf(it.label)}
            wordTex={texOf(it.word[lang])}
            layout={layout}
            progress={progress}
            nav={nav}
            onSelect={onSelect}
            dim={hoveredKey !== null && hoveredKey !== it.key}
            onHover={handleHover}
            aboutActive={aboutActive}
            lang={lang}
            activeKey={activeKey}
          />
        )
      })}
    </group>
  )
}
