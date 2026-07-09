import { Suspense } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Layers } from './Layers'
import { Menu3D } from './Menu3D'
import {
  CAMERA_START_Z,
  CAMERA_END_Z,
  SCROLL_DAMPING,
} from './config'

// Smooth acceleration/deceleration so the journey doesn't feel linear/robotic.
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

// The CameraRig is the heart of the interaction. Every frame it:
//  1. eases the smoothed `current` progress toward the raw `target` (damping)
//  2. maps that 0→1 onto the camera's z, from the entrance to the menu
function CameraRig({ progress }) {
  const camera = useThree((state) => state.camera)

  useFrame(() => {
    const p = progress.current
    // Damping: move a fraction of the remaining distance each frame → smooth glide.
    p.current += (p.target - p.current) * SCROLL_DAMPING

    const eased = easeInOutCubic(p.current)
    camera.position.z = CAMERA_START_Z + (CAMERA_END_Z - CAMERA_START_Z) * eased
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
      </Suspense>
      <Menu3D progress={progress} />
    </>
  )
}
