import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import {
  LAYER_FILES,
  LAYER_Z,
  PLANE_HEIGHT,
  IMAGE_ASPECT,
  FRONT_Z,
  CAMERA_START_Z,
} from './config'

// ─────────────────────────────────────────────────────────────────────────────
// THE PERSPECTIVE-COMPENSATION TRICK
//
// You want all 5 layers to line up into ONE composite image when the user first
// looks in. But we use a PerspectiveCamera (things farther away look smaller).
// If every plane were the same size, the back layers would appear shrunk and the
// composite wouldn't align.
//
// Fix: scale each plane in proportion to its distance from the camera's START
// position. A plane twice as far away is drawn twice as big, so it subtends the
// same angle → looks the same size → the layers overlap perfectly on entry.
//
// As the camera moves forward, this balance breaks on purpose: nearer planes
// swell faster than farther ones, so the layers peel apart — the curtain effect.
// ─────────────────────────────────────────────────────────────────────────────

const PLANE_WIDTH = PLANE_HEIGHT * IMAGE_ASPECT
const FRONT_DISTANCE = CAMERA_START_Z - FRONT_Z // distance to the nearest plane

export function Layers() {
  // Loads all 5 textures in parallel. Suspends until they're ready (see the
  // <Suspense> wrapper in Scene). `textures` is an array, same order as files.
  const textures = useTexture(LAYER_FILES)

  return (
    <group>
      {textures.map((texture, i) => {
        // Correct color handling for image textures.
        texture.colorSpace = THREE.SRGBColorSpace

        const z = LAYER_Z[i]
        const scale = (CAMERA_START_Z - z) / FRONT_DISTANCE

        return (
          <mesh
            key={LAYER_FILES[i]}
            position={[0, 0, z]}
            scale={scale}
            renderOrder={i} // draw back (0) → front, correct for transparency
          >
            <planeGeometry args={[PLANE_WIDTH, PLANE_HEIGHT]} />
            <meshBasicMaterial
              map={texture}
              transparent // honor the PNG alpha channel
              depthWrite={false} // don't let transparent planes block each other
              toneMapped={false} // keep the paint colors exactly as painted
            />
          </mesh>
        )
      })}
    </group>
  )
}
