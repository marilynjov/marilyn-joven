import { Suspense, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Layers } from './Layers'
import { Menu3D } from './Menu3D'
import { AboutRoom } from './AboutRoom'
import {
  CAMERA_START_Z,
  CAMERA_END_Z,
  SCROLL_DAMPING,
  MENU_Z,
  LOOK_STRENGTH,
  LOOK_DAMPING,
  LOOK_ACTIVATE_START,
  LOOK_ACTIVATE_END,
  ABOUT_DAMPING,
  ABOUT_CAM_Z,
  ABOUT_BG_Z,
  ABOUT_COLOR,
  ABOUT_END_X,
  ABOUT_END_Y,
  ROOM_HALF_W,
  ROOM_BACK_Z,
  ROOM_MID_Z,
  WALL_VIEW_DIST,
  WALL_DAMPING,
} from './config'

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const _menuPos = new THREE.Vector3()
const _menuLook = new THREE.Vector3()
const _wallPos = new THREE.Vector3()
const _wallLook = new THREE.Vector3()
const _finalLook = new THREE.Vector3()
const _lookTarget = new THREE.Vector3() // scratch vector for AboutFill's cover fit

// The pose (camera position + look point) for whichever About wall is focused.
// 'back' matches the old fly-in landing; 'left'/'right' rest in front of a side
// wall, looking straight at it. Uses the clicked block's world xy as room centre.
function wallPose(n, outPos, outLook) {
  const cx = n.cx + ABOUT_END_X
  const cy = n.cy + ABOUT_END_Y
  if (n.wall === 'left') {
    const wx = cx - ROOM_HALF_W
    outPos.set(wx + WALL_VIEW_DIST, cy, ROOM_MID_Z)
    outLook.set(wx, cy, ROOM_MID_Z)
  } else if (n.wall === 'right') {
    const wx = cx + ROOM_HALF_W
    outPos.set(wx - WALL_VIEW_DIST, cy, ROOM_MID_Z)
    outLook.set(wx, cy, ROOM_MID_Z)
  } else {
    outPos.set(cx, cy, ABOUT_CAM_Z)
    outLook.set(cx, cy, ROOM_BACK_Z)
  }
}

// The CameraRig owns the camera every frame. It:
//  1. eases scroll progress → menu z (the journey through the curtain)
//  2. adds the mouse look-around at the menu
//  3. when About is triggered, BLENDS the whole camera pose from the menu into
//     the room, then eases between walls as you turn (nav.wall)
function CameraRig({ progress, nav }) {
  const camera = useThree((state) => state.camera)
  const look = useRef({ x: 0, y: 0 })
  const aboutPos = useRef(new THREE.Vector3())
  const aboutLook = useRef(new THREE.Vector3())

  useFrame((state) => {
    // ── scroll journey → menu z ──
    const p = progress.current
    p.current += (p.target - p.current) * SCROLL_DAMPING
    const eased = easeInOutCubic(p.current)
    const menuZ = CAMERA_START_Z + (CAMERA_END_Z - CAMERA_START_Z) * eased

    // ── ease the About fly-in amount (0 = menu, 1 = fully inside the room) ──
    const n = nav.current
    n.current += (n.target - n.current) * ABOUT_DAMPING
    const a = easeInOutCubic(Math.min(1, Math.max(0, n.current)))

    // ── mouse look-around (menu only; fades out as we enter About) ──
    const activation =
      smoothstep(LOOK_ACTIVATE_START, LOOK_ACTIVATE_END, p.current) * (1 - a)
    look.current.x += (-state.pointer.x * LOOK_STRENGTH * activation - look.current.x) * LOOK_DAMPING
    look.current.y += (-state.pointer.y * LOOK_STRENGTH * activation - look.current.y) * LOOK_DAMPING

    // ── the About endpoint (which wall we're facing), eased so turns animate ──
    // While at the menu (a≈0) snap to the target so the fly-in blends correctly;
    // once inside, ease toward the focused wall so switching walls pans smoothly.
    wallPose(n, _wallPos, _wallLook)
    if (a < 0.02) {
      aboutPos.current.copy(_wallPos)
      aboutLook.current.copy(_wallLook)
    } else {
      aboutPos.current.lerp(_wallPos, WALL_DAMPING)
      aboutLook.current.lerp(_wallLook, WALL_DAMPING)
    }

    // ── blend menu pose → about pose ──
    _menuPos.set(look.current.x, look.current.y, menuZ)
    _menuLook.set(0, 0, MENU_Z)
    camera.position.lerpVectors(_menuPos, aboutPos.current, a)
    _finalLook.lerpVectors(_menuLook, aboutLook.current, a)
    camera.lookAt(_finalLook)
  })

  return null
}

// A full-screen orange fill that sits just behind the orange block and fades in
// as you zoom into it — so once the camera is close, the whole background reads
// as clean orange (covering any ragged paint edges / black behind). It tracks the
// clicked block's x/y and is a solid colour, so we scale it non-uniformly to
// exactly cover the viewport at its depth.
function AboutFill({ nav, about }) {
  const ref = useRef()

  useFrame((state) => {
    if (!ref.current) return
    const n = nav.current
    ref.current.visible = n.current > 0.001
    if (!ref.current.visible) return

    ref.current.position.x = n.cx
    ref.current.position.y = n.cy
    _lookTarget.set(n.cx, n.cy, ABOUT_BG_Z)
    const vp = state.viewport.getCurrentViewport(state.camera, _lookTarget)
    ref.current.scale.set(vp.width * 1.2, vp.height * 1.2, 1)
    // Tint to the clicked block's own colour so the fill blends seamlessly.
    if (n.color) ref.current.material.color.set(n.color)
    // Projects/experience: hold off so you SEE the block magnify first, then the
    // fill covers the edges. About: no fill at all — the room walls fade in to take
    // over directly, so there's no flat-orange stage that later gets covered.
    ref.current.material.opacity = about ? 0 : smoothstep(0.8, 0.95, n.current)
  })

  return (
    <mesh ref={ref} position={[0, 0, ABOUT_BG_Z]} renderOrder={-3}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        color={ABOUT_COLOR}
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

function LoadingFallback() {
  return (
    <mesh>
      <circleGeometry args={[0.15, 24]} />
      <meshBasicMaterial color="#333" />
    </mesh>
  )
}

export function Scene({ progress, nav, onSelect, activeKey, goWall, lang }) {
  const inAbout = activeKey === 'about'
  return (
    <>
      <CameraRig progress={progress} nav={nav} />
      {/* Orange backdrop for every section (fills the block's transparent edges);
          for About it sits behind the room so it just kills the black. */}
      <AboutFill nav={nav} about={inAbout} />
      <Suspense fallback={<LoadingFallback />}>
        <Layers />
        <Menu3D progress={progress} nav={nav} onSelect={onSelect} aboutActive={inAbout} lang={lang} />
        {inAbout && <AboutRoom nav={nav} goWall={goWall} lang={lang} />}
      </Suspense>
    </>
  )
}
