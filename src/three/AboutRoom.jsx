import { Suspense, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Text, useTexture } from '@react-three/drei'
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
  ABOUT_PHOTO,
  ROOM_COLORS,
  ROOM_TEXT,
  ROOM_FONT,
  ROOM_FONT_BOLD,
} from '../aboutConfig'

const W = ROOM_HALF_W
const H = ROOM_HALF_H
const PHOTO = ABOUT_PHOTO
const DEPTH = ROOM_NEAR_Z - ROOM_BACK_Z // side-wall / floor / ceiling length along z
const EPS = 0.05 // lift text a hair off the wall to avoid z-fighting

// A framed horizontal photo, rendered INSIDE a wall's group so it inherits that
// wall's position/rotation. Local +z points into the room, so small +z offsets lift
// the mat and photo off the frame. Height follows the image's aspect (no stretch).
const SHADOW_PAD = 0.3 // world units of soft shadow bleed around the frame

function WallFrame({ photo }) {
  const tex = useTexture(photo.src)
  tex.colorSpace = THREE.SRGBColorSpace
  const aspect = tex.image ? tex.image.width / tex.image.height : 1.5
  const w = photo.width
  const h = w / aspect
  const fw = photo.frameWidth
  const mw = photo.matColor ? photo.matWidth : 0
  const outerW = w + (mw + fw) * 2
  const outerH = h + (mw + fw) * 2

  // Soft drop shadow: an offscreen-blurred dark rounded rect baked to a canvas
  // texture (the scene is unlit, so there are no real shadows). Only the blur is
  // kept — the solid shape is drawn off-canvas via shadowOffsetX.
  const shadowTex = useMemo(() => {
    const ppu = 128
    const cw = Math.round((outerW + SHADOW_PAD * 2) * ppu)
    const ch = Math.round((outerH + SHADOW_PAD * 2) * ppu)
    const c = document.createElement('canvas')
    c.width = cw
    c.height = ch
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#000'
    ctx.shadowColor = 'rgba(0,0,0,0.95)'
    ctx.shadowBlur = SHADOW_PAD * ppu * 0.65
    ctx.shadowOffsetX = cw // push the shape off-canvas so only its shadow lands
    ctx.beginPath()
    ctx.roundRect(SHADOW_PAD * ppu - cw, SHADOW_PAD * ppu, outerW * ppu, outerH * ppu, 6)
    ctx.fill()
    return new THREE.CanvasTexture(c)
  }, [outerW, outerH])

  // depthTest off + renderOrder makes the frame stack layer by draw order and sit
  // ON the wall from ANY angle — otherwise the shadow, sitting a hair off the wall,
  // loses the depth test at grazing angles (only shows when viewed head-on/focused).
  return (
    <group position={[photo.x, photo.y, 0.02]}>
      {/* shadow, behind the frame, nudged down-right (lit from upper-left) */}
      <mesh position={[0.06, -0.07, -0.01]} renderOrder={1}>
        <planeGeometry args={[outerW + SHADOW_PAD * 2, outerH + SHADOW_PAD * 2]} />
        <meshBasicMaterial map={shadowTex} transparent opacity={0.6} depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh renderOrder={2}>
        <planeGeometry args={[outerW, outerH]} />
        <meshBasicMaterial color={photo.frameColor} transparent depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
      {photo.matColor && (
        <mesh position={[0, 0, 0.006]} renderOrder={3}>
          <planeGeometry args={[w + mw * 2, h + mw * 2]} />
          <meshBasicMaterial color={photo.matColor} transparent depthTest={false} depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      <mesh position={[0, 0, 0.012]} renderOrder={4}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} transparent depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

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
  letterSpacing: 0.02,
})
const body = (size) => ({
  ...baseText,
  font: ROOM_FONT,
  fontSize: size,
})

// A clickable link on a wall — bold, with a soft drop shadow (troika's outline blur
// + offset) so it lifts off the orange. Grows and darkens its shadow on hover.
function WallLink({ label, url, position, size = 0.18 }) {
  const [hover, setHover] = useState(false)
  return (
    <group position={position} scale={hover ? 1.08 : 1}>
      <Text
        {...body(size)}
        font={ROOM_FONT_BOLD}
        outlineColor="#2a0f04"
        outlineOpacity={hover ? 0.9 : 0.6}
        outlineWidth="2%"
        outlineBlur="20%"
        outlineOffsetX="7%"
        outlineOffsetY="7%"
        onClick={(e) => (e.stopPropagation(), window.open(url, '_blank'))}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHover(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHover(false)
          document.body.style.cursor = 'auto'
        }}
      >
        {label}
      </Text>
    </group>
  )
}

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
export function AboutRoom({ nav, goWall, lang = 'en' }) {
  const cx = nav.current.cx + ABOUT_END_X
  const cy = nav.current.cy + ABOUT_END_Y
  const wallsRef = useRef()
  const [showText, setShowText] = useState(false)

  useFrame(() => {
    const nv = nav.current.current
    // Room resolves only at the very end. Walls are readied just before the block
    // fades (Menu3D's block fade is 0.9→0.98), so when the block clears the room is
    // already there to take over — no flat-orange stage, no black gap.
    const reveal = smoothstep(0.86, 0.94, nv)
    if (wallsRef.current) {
      wallsRef.current.visible = reveal > 0.01
      wallsRef.current.traverse((o) => {
        if (o.material) o.material.opacity = reveal
      })
    }
    // Text shows once fully zoomed in, and only while zooming IN — clicking Back
    // (target → 0) hides it at once, before the room zooms out.
    const want = nav.current.target === 1 && nv > 0.92
    setShowText((s) => (s === want ? s : want))
  })

  const walls = ABOUT_WALLS[lang] || ABOUT_WALLS.en
  const back = walls.back
  const left = walls.left
  const right = walls.right

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
          {/* ── Back wall: description + a row of clickable links ── */}
          <group position={[cx, cy, ROOM_BACK_Z + EPS]}>
            <Text position={[0, H * 0.52, 0]} {...head(0.42)}>
              {back.heading.toUpperCase()}
            </Text>
            <Text
              position={[0, H * 0.08, 0]}
              {...body(0.17)}
              maxWidth={W * 1.5}
              textAlign="center"
              lineHeight={1.45}
            >
              {back.body}
            </Text>
            {/* Degree, set apart below the paragraph — small, spaced-out, faded. */}
            {back.subtitle && (
              <Text position={[0, -H * 0.38, 0]} {...head(0.13)} letterSpacing={0.14} fillOpacity={0.55}>
                {back.subtitle.toUpperCase()}
              </Text>
            )}
            {back.links.map((link, i) => (
              <WallLink
                key={i}
                label={link.label}
                url={link.url}
                position={[(i - (back.links.length - 1) / 2) * 1.25, -H * 0.6, 0]}
                size={0.18}
              />
            ))}
            {PHOTO.src && PHOTO.wall === 'back' && <WallFrame photo={PHOTO} />}
          </group>

          {/* ── Left wall (faces +x): strengths + languages on the left, photo right ── */}
          <group position={[cx - W + EPS, cy, ROOM_MID_Z]} rotation={[0, Math.PI / 2, 0]}>
            {/* Text shifted left so the framed photo (photo.x, right) sits beside it. */}
            <group position={[-1.3, 0, 0]}>
              <Text position={[0, H * 0.62, 0]} {...head(0.21)}>
                {left.heading.toUpperCase()}
              </Text>
              {left.lines.map((l, i) => (
                <Text key={i} position={[0, H * 0.32 - i * 0.2, 0]} {...body(0.125)}>
                  {l}
                </Text>
              ))}
              <Text position={[0, -H * 0.24, 0]} {...head(0.13)} fillOpacity={0.85}>
                {left.languagesHeading.toUpperCase()}
              </Text>
              {left.languages.map((l, i) => (
                <Text
                  key={`lang${i}`}
                  position={[0, -H * 0.38 - i * 0.17, 0]}
                  {...body(0.11)}
                  fillOpacity={0.8}
                >
                  {l}
                </Text>
              ))}
            </group>
            {PHOTO.src && PHOTO.wall === 'left' && <WallFrame photo={PHOTO} />}
          </group>

          {/* ── Right wall (faces -x): what this site is ── */}
          <group position={[cx + W - EPS, cy, ROOM_MID_Z]} rotation={[0, -Math.PI / 2, 0]}>
            <Text position={[0, H * 0.5, 0]} {...head(0.28)}>
              {right.heading.toUpperCase()}
            </Text>
            <Text
              position={[0, -H * 0.02, 0]}
              {...body(0.165)}
              maxWidth={W * 1.5}
              textAlign="center"
              lineHeight={1.5}
            >
              {right.body}
            </Text>
            {PHOTO.src && PHOTO.wall === 'right' && <WallFrame photo={PHOTO} />}
          </group>
        </group>
        )}
      </Suspense>
    </group>
  )
}
