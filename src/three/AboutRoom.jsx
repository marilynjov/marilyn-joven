import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Text, useTexture } from '@react-three/drei'
import { preloadFont } from 'troika-three-text'
import {
  ROOM_HALF_W,
  ROOM_HALF_H,
  ROOM_BACK_Z,
  ROOM_NEAR_Z,
  ROOM_MID_Z,
  ABOUT_CAM_Z,
  WALL_VIEW_DIST,
  CAMERA_FOV,
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
const PHOTO = ABOUT_PHOTO
const DEPTH = ROOM_NEAR_Z - ROOM_BACK_Z // side-wall / floor / ceiling length along z
const EPS = 0.05 // lift text a hair off the wall to avoid z-fighting

// ── Portrait (phone) layout ──────────────────────────────────────────────────
// The room is framed for a wide screen; on a tall one the camera only sees a
// narrow slice of each wall. So below this aspect the room gets taller and each
// wall's content reflows into a single column sized to what the camera sees.
const COMPACT_ASPECT = 0.8 // width / height below which the portrait layout kicks in
const COMPACT_HALF_H = 2.4 // taller room in portrait, so the walls fill the screen
const BACK_COL = 2.2 // column width (world units) on the back wall
const SIDE_COL = 1.45 // column width on the side walls
const HALF_FOV_TAN = Math.tan((CAMERA_FOV * Math.PI) / 180 / 2)
const BACK_DIST = ABOUT_CAM_Z - ROOM_BACK_Z // camera → back wall when facing it

// Height of a troika Text block once laid out (0 until its first sync).
const blockHeight = (mesh) => {
  const b = mesh?.textRenderInfo?.blockBounds
  return b ? b[3] - b[1] : 0
}
// Warm the wall fonts once the page is idle (after the entry has loaded, so it
// doesn't fight the layers for bandwidth). Troika then has the woff fetched, parsed,
// and its glyphs pre-generated, so the About text appears instantly on first entry.
const ROOM_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÉÍÓÚÑáéíóúñ0123456789 —·.,()/:@'"
const warmRoomFonts = () => {
  preloadFont({ font: ROOM_FONT, characters: ROOM_CHARS }, () => {})
  preloadFont({ font: ROOM_FONT_BOLD, characters: ROOM_CHARS }, () => {})
}
if (typeof requestIdleCallback === 'function') requestIdleCallback(warmRoomFonts)
else setTimeout(warmRoomFonts, 1200)

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

// The "CV / pdf" tile, drawn once to a canvas so it matches the square app icons.
let _cvTex = null
function getCvTex() {
  if (_cvTex) return _cvTex
  const S = 256
  const c = document.createElement('canvas')
  c.width = c.height = S
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#241812'
  ctx.beginPath()
  ctx.roundRect(0, 0, S, S, S * 0.22)
  ctx.fill()
  ctx.fillStyle = '#fff7f0'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `700 ${Math.round(S * 0.42)}px "Helvetica Neue", Helvetica, Arial, sans-serif`
  ctx.fillText('CV', S / 2, S * 0.44)
  ctx.font = `600 ${Math.round(S * 0.15)}px "Helvetica Neue", Helvetica, Arial, sans-serif`
  ctx.fillText('pdf', S / 2, S * 0.7)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  _cvTex = t
  return t
}

// Soft square drop-shadow, baked once to a canvas (unlit scene → no real shadows).
let _iconShadow = null
function getIconShadow() {
  if (_iconShadow) return _iconShadow
  const S = 128
  const c = document.createElement('canvas')
  c.width = c.height = S
  const ctx = c.getContext('2d')
  ctx.shadowColor = 'rgba(0,0,0,1)'
  ctx.shadowBlur = S * 0.09
  ctx.shadowOffsetX = S // draw the shape off-canvas so only its blurred shadow lands
  ctx.fillStyle = '#000'
  const pad = S * 0.15
  ctx.beginPath()
  ctx.roundRect(pad - S, pad, S - 2 * pad, S - 2 * pad, (S - 2 * pad) * 0.22)
  ctx.fill()
  const t = new THREE.CanvasTexture(c)
  _iconShadow = t
  return t
}

// A square icon button on a wall — a projects-style app icon (GitHub / LinkedIn) or
// the generated CV tile. Small drop shadow, clickable, grows on hover.
function WallIcon({ tex: given, texUrl, url, position, size = 0.55 }) {
  const [loaded, setLoaded] = useState(texUrl ? _texCache[texUrl] : null)
  useEffect(() => {
    if (texUrl) loadWallTex(texUrl, setLoaded)
  }, [texUrl])
  const tex = given || loaded
  const [hover, setHover] = useState(false)
  // Mount only once the texture is ready — otherwise the material compiles without a
  // map slot and the late-arriving image never shows (blank/white square).
  if (!tex) return null
  return (
    <group position={position} scale={hover ? 1.12 : 1}>
      {/* small soft shadow, nudged down-right, behind the icon */}
      <mesh position={[0.04, -0.05, -0.01]} renderOrder={1}>
        <planeGeometry args={[size * 1.28, size * 1.28]} />
        <meshBasicMaterial map={getIconShadow()} transparent opacity={0.4} depthTest={false} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh
        renderOrder={2}
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
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

// One flat orange face. `onFace` (optional) makes it clickable to turn to it.
// Transparent so it can fade in — its opacity is driven each frame by the room.
// Wall textures — one per shade, baked from texture.png. Loaded once, cached by URL.
const _texCache = {}
function loadWallTex(url, cb) {
  if (_texCache[url]) return cb(_texCache[url])
  new THREE.TextureLoader().load(url, (t) => {
    t.colorSpace = THREE.SRGBColorSpace
    _texCache[url] = t
    cb(t)
  })
}

function Wall({ position, rotation, size, texUrl, fallback, onFace }) {
  // The whole image IS the wall (no tiling, no tint — the shade is baked into each
  // variant). Show the flat shade until the texture has loaded.
  const [tex, setTex] = useState(_texCache[texUrl])
  useEffect(() => loadWallTex(texUrl, setTex), [texUrl])

  return (
    <mesh
      position={position}
      rotation={rotation}
      onClick={onFace ? (e) => (e.stopPropagation(), onFace()) : undefined}
      onPointerOver={onFace ? setCursor('pointer') : undefined}
      onPointerOut={onFace ? setCursor('auto') : undefined}
    >
      <planeGeometry args={size} />
      <meshBasicMaterial
        map={tex || null}
        color={tex ? '#ffffff' : fallback}
        side={THREE.DoubleSide}
        transparent
        opacity={0}
        toneMapped={false}
      />
    </mesh>
  )
}

// The small About box, dropped right where the orange block is. It stays hidden
// until the fly-in is (almost) complete, then the walls fade in and the text
// pops on — so during the zoom you just see flat orange, and the room "resolves".
export function AboutRoom({ nav, goWall, lang = 'en' }) {
  const cx = nav.current.cx + nav.current.endX
  const cy = nav.current.cy + nav.current.endY
  const wallsRef = useRef()
  const [showText, setShowText] = useState(false)

  // Portrait layout: how wide a slice of each wall the camera sees, and a scale
  // that shrinks a column only if it still wouldn't fit (very narrow phones).
  const size = useThree((state) => state.size)
  const aspect = size.width / size.height
  const compact = aspect < COMPACT_ASPECT
  const H = compact ? COMPACT_HALF_H : ROOM_HALF_H
  const backFit = Math.min(1, (2 * BACK_DIST * HALF_FOV_TAN * aspect * 0.9) / BACK_COL)
  const sideFit = Math.min(1, (2 * WALL_VIEW_DIST * HALF_FOV_TAN * aspect * 0.9) / SIDE_COL)
  // Measured paragraph heights, so what follows a paragraph sits right under it.
  const [backBodyH, setBackBodyH] = useState(0)
  const [rightBodyH, setRightBodyH] = useState(0)

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
          texUrl="/about/wall-back.webp"
          fallback={ROOM_COLORS.back}
          onFace={() => goWall('back')}
        />
        <Wall
          position={[cx, cy + H, ROOM_MID_Z]}
          rotation={[Math.PI / 2, 0, 0]}
          size={[W * 2, DEPTH]}
          texUrl="/about/wall-ceiling.webp"
          fallback={ROOM_COLORS.ceiling}
        />
        <Wall
          position={[cx, cy - H, ROOM_MID_Z]}
          rotation={[-Math.PI / 2, 0, 0]}
          size={[W * 2, DEPTH]}
          texUrl="/about/wall-floor.webp"
          fallback={ROOM_COLORS.floor}
        />
        <Wall
          position={[cx - W, cy, ROOM_MID_Z]}
          rotation={[0, Math.PI / 2, 0]}
          size={[DEPTH, H * 2]}
          texUrl="/about/wall-left.webp"
          fallback={ROOM_COLORS.left}
          onFace={() => goWall('left')}
        />
        <Wall
          position={[cx + W, cy, ROOM_MID_Z]}
          rotation={[0, -Math.PI / 2, 0]}
          size={[DEPTH, H * 2]}
          texUrl="/about/wall-right.webp"
          fallback={ROOM_COLORS.right}
          onFace={() => goWall('right')}
        />
      </group>

      {/* Text preloads its font via React.suspend — keep it in its OWN Suspense so
          that never blanks the menu/walls in the shared boundary. */}
      <Suspense fallback={null}>
        {showText && compact && (
        <group>
          {/* ── Portrait: each wall is one centred column (see COMPACT_* above) ── */}
          <group position={[cx, cy, ROOM_BACK_Z + EPS]} scale={backFit}>
            <Text position={[0, 1.35, 0]} {...head(0.34)}>
              {back.heading.toUpperCase()}
            </Text>
            <Text
              position={[0, 0.95, 0]}
              {...body(0.135)}
              anchorY="top"
              maxWidth={BACK_COL}
              textAlign="center"
              lineHeight={1.45}
              onSync={(m) => setBackBodyH(blockHeight(m))}
            >
              {back.body}
            </Text>
            {back.subtitle && (
              <Text
                position={[0, 0.95 - backBodyH - 0.25, 0]}
                {...head(0.095)}
                anchorY="top"
                maxWidth={BACK_COL}
                textAlign="center"
                lineHeight={1.5}
                letterSpacing={0.12}
                fillOpacity={0.55}
              >
                {back.subtitle.toUpperCase()}
              </Text>
            )}
            {PHOTO.src && PHOTO.wall === 'back' && <WallFrame photo={PHOTO} />}
          </group>

          {/* Left wall: photo on top, strengths + languages stacked beneath it. */}
          <group position={[cx - W + EPS, cy, ROOM_MID_Z]} rotation={[0, Math.PI / 2, 0]} scale={sideFit}>
            {PHOTO.src && PHOTO.wall === 'left' && (
              <WallFrame photo={{ ...PHOTO, width: 1.2, x: 0, y: 1.1 }} />
            )}
            <Text position={[0, 0.38, 0]} {...head(0.14)}>
              {left.heading.toUpperCase()}
            </Text>
            {left.lines.map((l, i) => (
              <Text key={i} position={[0, 0.18 - i * 0.15, 0]} {...body(0.1)}>
                {l}
              </Text>
            ))}
            <Text position={[0, -0.66, 0]} {...head(0.1)} fillOpacity={0.85}>
              {left.languagesHeading.toUpperCase()}
            </Text>
            {left.languages.map((l, i) => (
              <Text key={`lang${i}`} position={[0, -0.83 - i * 0.125, 0]} {...body(0.085)} fillOpacity={0.8}>
                {l}
              </Text>
            ))}
          </group>

          {/* Right wall: heading, paragraph, then the icon row right under it. */}
          <group position={[cx + W - EPS, cy, ROOM_MID_Z]} rotation={[0, -Math.PI / 2, 0]} scale={sideFit}>
            <Text position={[0, 1.15, 0]} {...head(0.19)}>
              {right.heading.toUpperCase()}
            </Text>
            <Text
              position={[0, 0.88, 0]}
              {...body(0.1)}
              anchorY="top"
              maxWidth={SIDE_COL}
              textAlign="center"
              lineHeight={1.45}
              onSync={(m) => setRightBodyH(blockHeight(m))}
            >
              {right.body}
            </Text>
            {back.links.map((link, i) => (
              <WallIcon
                key={i}
                url={link.url}
                tex={link.icon === 'cv' ? getCvTex() : undefined}
                texUrl={link.icon === 'cv' ? undefined : link.icon}
                position={[(i - (back.links.length - 1) / 2) * 0.5, 0.88 - rightBodyH - 0.4, 0]}
                size={0.36}
              />
            ))}
            {PHOTO.src && PHOTO.wall === 'right' && <WallFrame photo={PHOTO} />}
          </group>
        </group>
        )}
        {showText && !compact && (
        <group>
          {/* ── Back wall: description + a row of clickable links ── */}
          <group position={[cx, cy, ROOM_BACK_Z + EPS]}>
            <Text position={[0, H * 0.62, 0]} {...head(0.42)}>
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
            {PHOTO.src && PHOTO.wall === 'back' && <WallFrame photo={PHOTO} />}
          </group>

          {/* ── Left wall (faces +x): strengths + languages on the left, photo right ── */}
          <group position={[cx - W + EPS, cy, ROOM_MID_Z]} rotation={[0, Math.PI / 2, 0]}>
            {/* Text shifted left so the framed photo (photo.x, right) sits beside it. */}
            <group position={[-1.3, 0, 0]}>
              <Text position={[0, H * 0.5, 0]} {...head(0.21)}>
                {left.heading.toUpperCase()}
              </Text>
              {left.lines.map((l, i) => (
                <Text key={i} position={[0, H * 0.32 - i * 0.2, 0]} {...body(0.125)}>
                  {l}
                </Text>
              ))}
              <Text position={[0, -H * 0.3, 0]} {...head(0.13)} fillOpacity={0.85}>
                {left.languagesHeading.toUpperCase()}
              </Text>
              {left.languages.map((l, i) => (
                <Text
                  key={`lang${i}`}
                  position={[0, -H * 0.44 - i * 0.17, 0]}
                  {...body(0.11)}
                  fillOpacity={0.8}
                >
                  {l}
                </Text>
              ))}
            </group>
            {PHOTO.src && PHOTO.wall === 'left' && <WallFrame photo={PHOTO} />}
          </group>

          {/* ── Right wall (faces -x): what this site is, + the contact/CV icons ── */}
          <group position={[cx + W - EPS, cy, ROOM_MID_Z]} rotation={[0, -Math.PI / 2, 0]}>
            <Text position={[0, H * 0.55, 0]} {...head(0.28)}>
              {right.heading.toUpperCase()}
            </Text>
            <Text
              position={[0, H * 0.12, 0]}
              {...body(0.165)}
              maxWidth={W * 1.5}
              textAlign="center"
              lineHeight={1.5}
            >
              {right.body}
            </Text>
            {/* GitHub / LinkedIn / CV — the links live under back.links in the config. */}
            {back.links.map((link, i) => (
              <WallIcon
                key={i}
                url={link.url}
                tex={link.icon === 'cv' ? getCvTex() : undefined}
                texUrl={link.icon === 'cv' ? undefined : link.icon}
                position={[(i - (back.links.length - 1) / 2) * 0.85, -H * 0.62, 0]}
                size={0.55}
              />
            ))}
            {PHOTO.src && PHOTO.wall === 'right' && <WallFrame photo={PHOTO} />}
          </group>
        </group>
        )}
      </Suspense>
    </group>
  )
}
