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
} from './config'

// Smooth acceleration/deceleration so the journey doesn't feel linear/robotic.
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

// smoothstep: eases 0→1 between edges a and b (used to fade look-around in).
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const _lookTarget = new THREE.Vector3() // reused each frame (no per-frame allocs)

// The CameraRig is the heart of the interaction. Every frame it:
//  1. eases the smoothed `current` progress toward the raw `target` (damping)
//  2. maps that 0→1 onto the camera's z, from the entrance to the menu
//  3. once you've arrived, drifts the camera with the mouse and pivots to keep
//     the menu centered — parallax "look around"
function CameraRig({ progress }) {
  const camera = useThree((state) => state.camera)
  // Smoothed camera x/y offset — kept in a ref so it eases frame to frame.
  const look = useRef({ x: 0, y: 0 })

  useFrame((state) => {
    const p = progress.current
    // Damping: move a fraction of the remaining distance each frame → smooth glide.
    p.current += (p.target - p.current) * SCROLL_DAMPING

    const eased = easeInOutCubic(p.current)
    const z = CAMERA_START_Z + (CAMERA_END_Z - CAMERA_START_Z) * eased

    // How "on" is the look-around? 0 during the flight, 1 once at the menu.
    const activation = smoothstep(
      LOOK_ACTIVATE_START,
      LOOK_ACTIVATE_END,
      p.current,
    )

    // state.pointer is the mouse, normalized to -1..1 (x right, y up). Free from R3F.
    // We move the camera OPPOSITE the mouse and pivot back to the menu, so the
    // view swings toward where the cursor points (mouse right → look right).
    const targetX = -state.pointer.x * LOOK_STRENGTH * activation
    const targetY = -state.pointer.y * LOOK_STRENGTH * activation
    look.current.x += (targetX - look.current.x) * LOOK_DAMPING
    look.current.y += (targetY - look.current.y) * LOOK_DAMPING

    // Move the camera, then aim it back at the menu. Because the backdrop sits
    // deeper than the text, they slide by different amounts → a sense of depth.
    camera.position.set(look.current.x, look.current.y, z)
    _lookTarget.set(0, 0, MENU_Z)
    camera.lookAt(_lookTarget)
  })

  return null
}

// Shown while the 5 textures load. It's rendered INSIDE the Canvas, so it must
// be a 3D object, not HTML — a dim dot at the origin is plenty.
function LoadingFallback() {
  return (
    <mesh>
      <circleGeometry args={[0.15, 24]} />
      <meshBasicMaterial color="#333" />
    </mesh>
  )
}

export function Scene({ progress }) {
  return (
    <>
      <CameraRig progress={progress} />
      <Suspense fallback={<LoadingFallback />}>
        <Layers />
        <Menu3D progress={progress} />
      </Suspense>
    </>
  )
}
