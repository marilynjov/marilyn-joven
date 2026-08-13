import { Suspense, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import {
  ROOM_HALF_W,
  ROOM_HALF_H,
  ROOM_BACK_Z,
  ROOM_NEAR_Z,
  ROOM_MID_Z,
  ABOUT_END_X,
  ABOUT_END_Y,
} from './config'
import {
  ABOUT_WALLS,
  ROOM_COLORS,
  ROOM_TEXT,
  ROOM_FONT,
  ROOM_FONT_BOLD,
} from '../aboutConfig'

const W = ROOM_HALF_W
const H = ROOM_HALF_H
const DEPTH = ROOM_NEAR_Z - ROOM_BACK_Z // side-wall / floor / ceiling length along z
const EPS = 0.05 // lift text a hair off the wall to avoid z-fighting

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const setCursor = (v) => () => (document.body.style.cursor = v)

// Shared text styling. `head` = uppercase, letter-spaced label (echoes the site's
// "SCROLL TO ENTER" hint); `body` = readable sentence case. Both use Inter.
const baseText = {
  color: ROOM_TEXT,
  anchorX: 'center',
  anchorY: 'middle',
  toneMapped: false,
}
const head = (size) => ({
  ...baseText,
  font: ROOM_FONT_BOLD,
  fontSize: size,
  letterSpacing: 0.14,
})
const body = (size) => ({
  ...baseText,
  font: ROOM_FONT,
  fontSize: size,
})

// One flat orange face. `onFace` (optional) makes it clickable to turn to it.
// Transparent so it can fade in — its opacity is driven each frame by the room.
function Wall({ position, rotation, size, color, onFace }) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      onClick={onFace ? (e) => (e.stopPropagation(), onFace()) : undefined}
      onPointerOver={onFace ? setCursor('pointer') : undefined}
      onPointerOut={onFace ? setCursor('auto') : undefined}
    >
      <planeGeometry args={size} />
      <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0} toneMapped={false} />
    </mesh>
  )
}

// The small About box, dropped right where the orange block is. It stays hidden
// until the fly-in is (almost) complete, then the walls fade in and the text
// pops on — so during the zoom you just see flat orange, and the room "resolves".
export function AboutRoom({ nav, goWall }) {
  const cx = nav.current.cx + ABOUT_END_X
  const cy = nav.current.cy + ABOUT_END_Y
  const wallsRef = useRef()
  const [showText, setShowText] = useState(false)

  useFrame(() => {
    const nv = nav.current.current
    const reveal = smoothstep(0.86, 0.95, nv) // walls resolve as the zoom lands
    if (wallsRef.current) {
      wallsRef.current.visible = reveal > 0.01
      wallsRef.current.traverse((o) => {
        if (o.material) o.material.opacity = reveal
      })
    }
    const want = nv > 0.92 // text appears once fully zoomed in (matches sections)
    setShowText((s) => (s === want ? s : want))
  })

  const back = ABOUT_WALLS.back
  const left = ABOUT_WALLS.left
  const right = ABOUT_WALLS.right

  return (
    <group>
      {/* ── The five faces (fade in together) ── */}
      <group ref={wallsRef} visible={false}>
        <Wall
          position={[cx, cy, ROOM_BACK_Z]}
          size={[W * 2, H * 2]}
          color={ROOM_COLORS.back}
          onFace={() => goWall('back')}
        />
        <Wall
          position={[cx, cy + H, ROOM_MID_Z]}
          rotation={[Math.PI / 2, 0, 0]}
          size={[W * 2, DEPTH]}
          color={ROOM_COLORS.ceiling}
        />
        <Wall
          position={[cx, cy - H, ROOM_MID_Z]}
          rotation={[-Math.PI / 2, 0, 0]}
          size={[W * 2, DEPTH]}
          color={ROOM_COLORS.floor}
        />
        <Wall
          position={[cx - W, cy, ROOM_MID_Z]}
          rotation={[0, Math.PI / 2, 0]}
          size={[DEPTH, H * 2]}
          color={ROOM_COLORS.left}
          onFace={() => goWall('left')}
        />
        <Wall
          position={[cx + W, cy, ROOM_MID_Z]}
          rotation={[0, -Math.PI / 2, 0]}
          size={[DEPTH, H * 2]}
          color={ROOM_COLORS.right}
          onFace={() => goWall('right')}
        />
      </group>

      {/* Text preloads its font via React.suspend — keep it in its OWN Suspense so
          that never blanks the menu/walls in the shared boundary. */}
      <Suspense fallback={null}>
        {showText && (
        <group>
          {/* ── Back wall ── */}
          <group position={[cx, cy, ROOM_BACK_Z + EPS]}>
            <Text position={[0, H * 0.5, 0]} {...head(0.5)}>
              {back.heading.toUpperCase()}
            </Text>
            <Text
              position={[0, -H * 0.05, 0]}
              {...body(0.2)}
              maxWidth={W * 1.5}
              textAlign="center"
              lineHeight={1.45}
            >
              {back.body}
            </Text>
          </group>

          {/* ── Left wall (faces +x) ── */}
          <group position={[cx - W + EPS, cy, ROOM_MID_Z]} rotation={[0, Math.PI / 2, 0]}>
            <Text position={[0, H * 0.55, 0]} {...head(0.32)}>
              {left.heading.toUpperCase()}
            </Text>
            {left.lines.map((l, i) => (
              <Text key={i} position={[0, H * 0.14 - i * 0.28, 0]} {...body(0.18)}>
                {l}
              </Text>
            ))}
            {left.meta.map((m, i) => (
              <Text
                key={`m${i}`}
                position={[0, -H * 0.5 - i * 0.24, 0]}
                {...body(0.13)}
                fillOpacity={0.75}
              >
                {m}
              </Text>
            ))}
          </group>

          {/* ── Right wall (faces -x); links are clickable ── */}
          <group position={[cx + W - EPS, cy, ROOM_MID_Z]} rotation={[0, -Math.PI / 2, 0]}>
            <Text position={[0, H * 0.55, 0]} {...head(0.32)}>
              {right.heading.toUpperCase()}
            </Text>
            {right.links.map((link, i) => (
              <Text
                key={i}
                position={[0, H * 0.12 - i * 0.34, 0]}
                {...body(0.22)}
                onClick={(e) => (e.stopPropagation(), window.open(link.url, '_blank'))}
                onPointerOver={setCursor('pointer')}
                onPointerOut={setCursor('auto')}
              >
                {link.label}
              </Text>
            ))}
          </group>
        </group>
        )}
      </Suspense>
    </group>
  )
}
