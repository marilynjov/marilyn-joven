import { useTexture } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  LAYER_FILES,
  LAYER_Z,
  PLANE_HEIGHT,
  IMAGE_ASPECT,
  FRONT_Z,
  CAMERA_START_Z,
  CAMERA_FOV,
  LAYER_ZOOM,
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

// RESPONSIVE COVER
// Perspective cameras have a fixed *vertical* FOV, so the layers always fill the
// height — but on a short, wide window the sides run out of paint and go black.
// This computes a uniform scale for the whole stack so the entry composite COVERS
// the viewport (like `background-size: cover`) at any aspect ratio. It's keyed to
// the camera's START distance, so the framing is fixed and doesn't drift as you
// fly through. Recomputed on resize (useThree `size` re-renders the component).
function useCoverScale() {
  const size = useThree((state) => state.size) // canvas pixels {width, height}
  const aspect = size.width / size.height

  // Visible world size at the front plane, from the camera's start position.
  const visibleHeight =
    2 * FRONT_DISTANCE * Math.tan((CAMERA_FOV * Math.PI) / 180 / 2)
  const visibleWidth = visibleHeight * aspect

  // Cover = the larger of the two axis ratios → guarantees no blank edges.
  // LAYER_ZOOM overscans past that so the ragged paint edges sit off-screen.
  return (
    Math.max(visibleWidth / PLANE_WIDTH, visibleHeight / PLANE_HEIGHT) *
    LAYER_ZOOM
  )
}

export function Layers() {
  // Loads all 5 textures in parallel. Suspends until they're ready (see the
  // <Suspense> wrapper in Scene). `textures` is an array, same order as files.
  const textures = useTexture(LAYER_FILES)
  const cover = useCoverScale()

  return (
    // Scale x/y only (not z) so every layer grows to cover the screen while the
    // depth gaps between them — the curtain spacing — stay exactly as configured.
    <group scale={[cover, cover, 1]}>
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
