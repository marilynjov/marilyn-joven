import { Suspense, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Layers } from './Layers'
import { Menu3D } from './Menu3D'
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
  ABOUT_LOOK_Z,
  ABOUT_BG_Z,
  ABOUT_COLOR,
  ABOUT_END_X,
  ABOUT_END_Y,
} from './config'

const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const lerp = (a, b, t) => a + (b - a) * t

const _lookTarget = new THREE.Vector3()

// The CameraRig owns the camera every frame. It:
//  1. eases scroll progress → menu z (the journey through the curtain)
//  2. adds the mouse look-around at the menu
//  3. when About is triggered, BLENDS the whole camera pose from the menu to a
//     spot inside the About room, flying at the clicked block (nav.cx, nav.cy)
function CameraRig({ progress, nav }) {
  const camera = useThree((state) => state.camera)
  const look = useRef({ x: 0, y: 0 })

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

    // ── blend menu pose → about pose ──
    // Menu: at (look, menuZ), looking at the menu plane center.
    // About: centered on the clicked block (cx, cy) and pulled right up to it, so
    // the orange fills the frame; aim straight in so it stays centered.
    // Final framing target = block center + the manual nudge. Both the camera and
    // its look point shift together, so the view pans cleanly (no angling).
    const tx = n.cx + ABOUT_END_X
    const ty = n.cy + ABOUT_END_Y
    camera.position.set(
      lerp(look.current.x, tx, a),
      lerp(look.current.y, ty, a),
      lerp(menuZ, ABOUT_CAM_Z, a),
    )
    _lookTarget.set(
      lerp(0, tx, a),
      lerp(0, ty, a),
      lerp(MENU_Z, ABOUT_LOOK_Z, a),
    )
    camera.lookAt(_lookTarget)
  })

  return null
}

// A full-screen orange fill that sits just behind the orange block and fades in
// as you zoom into it — so once the camera is close, the whole background reads
// as clean orange (covering any ragged paint edges / black behind). It tracks the
// clicked block's x/y and is a solid colour, so we scale it non-uniformly to
// exactly cover the viewport at its depth.
function AboutFill({ nav }) {
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
    // Hold off until later in the zoom so you SEE the block magnify first, then
    // the fill covers any edges/black for a clean all-orange finish.
    ref.current.material.opacity = smoothstep(0.8, 0.95, n.current)
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

export function Scene({ progress, nav, onSelect }) {
  return (
    <>
      <CameraRig progress={progress} nav={nav} />
      <AboutFill nav={nav} />
      <Suspense fallback={<LoadingFallback />}>
        <Layers />
        <Menu3D progress={progress} nav={nav} onSelect={onSelect} />
      </Suspense>
    </>
  )
}
