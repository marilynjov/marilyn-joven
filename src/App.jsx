import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './three/Scene'
import { useScrollProgress } from './three/useScrollProgress'
import { CAMERA_START_Z, CAMERA_FOV, ABOUT_END_X, ABOUT_END_Y } from './three/config'
import { HOME_ITEMS, DOCK } from './homeConfig'
import { EXP_PHOTOS, EXP_ZOOM, EXP_FILL, EXP_DARKEN, DEBUG_HITBOXES } from './experienceConfig'
import { SKILLS, SKILL_ROWS, bwSrc, colorSrc } from './skillsConfig'
import { UI, pick } from './i18n'
import './App.css'

// Sections that have a view when you click their block. Others do nothing (yet).
const SECTIONS = new Set(['about', 'projects', 'experience', 'skills'])

// Experience: six full-frame stills that together form one short animation.
// Landing on the section shows Exp-1; hovering plays 1→6 and holds on 6.
const EXP_FRAMES = ['/experience/Exp-1.png', '/experience/Exp-2.png', '/experience/Exp-3.png', '/experience/Exp-4.png', '/experience/Exp-5.png', '/experience/Exp-6.png']
const EXP_FRAME_MS = 110 // per-frame duration of the hover animation

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// The name/title over the entry composite, fading out as the scroll begins.
function TitleOverlay({ progress, lang }) {
  const ref = useRef()
  useEffect(() => {
    let raf
    const tick = () => {
      if (ref.current) {
        const o = Math.max(0, 1 - progress.current.current / 0.08)
        ref.current.style.opacity = o
        ref.current.style.pointerEvents = o < 0.05 ? 'none' : 'auto'
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [progress])

  return (
    <div className="title" ref={ref}>
      <h1 className="title__name">Marilyn Joven</h1>
      <p className="title__role">{UI[lang].role}</p>
    </div>
  )
}

// "scroll to enter" prompt — tied to scroll progress so it lives ONLY on the entry
// screen (progress ≈ 0) and fades as you scroll in. Because it's driven by progress
// (not a one-shot flag), it comes back if you scroll all the way out to the top.
function ScrollHint({ progress, lang }) {
  const ref = useRef()
  useEffect(() => {
    let raf
    const tick = () => {
      if (ref.current) ref.current.style.opacity = Math.max(0, 1 - progress.current.current / 0.1)
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [progress])

  return (
    <div className="hint" ref={ref}>
      <span className="hint__pulse">{UI[lang].scroll}</span>
    </div>
  )
}

// ── Projects: an iPad-style homescreen, driven entirely by homeConfig.js ──────
const PLACEHOLDER_COLORS = ['#f4a3c0', '#8fd0c4', '#f7d774', '#a7b6f0', '#f0a780', '#b6e08a']
const colorFor = (name = '') => {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return PLACEHOLDER_COLORS[h % PLACEHOLDER_COLORS.length]
}

// One tile — an app icon or a spanning image widget. A link when it has a url.
function Tile({ item, lang }) {
  const isWidget = item.widget
  const name = pick(item.name, lang)
  const style = isWidget
    ? { gridColumn: `span ${item.w || 1}`, gridRow: `span ${item.h || 1}` }
    : undefined

  const media = isWidget
    ? item.image
      ? <img className="home__media" src={item.image} alt={name || ''} style={item.zoom ? { transform: `scale(${item.zoom})` } : undefined} />
      : <div className="home__placeholder" style={{ background: colorFor(name) }}>{name}</div>
    : item.icon
      ? <img className="home__media" src={item.icon} alt="" />
      : <span className="home__initial" style={{ background: colorFor(name) }}>{(name || '?')[0]}</span>

  const inner = (
    <>
      <span className={isWidget ? 'home__widget' : 'home__icon'}>{media}</span>
      {!isWidget && name && <span className="home__label">{name}</span>}
    </>
  )

  // Where a click goes: an explicit url, else (for image widgets) the full image
  // itself — so clicking a widget opens the whole picture in a new tab.
  const href = item.url || (isWidget && item.image) || undefined

  const cls = isWidget ? 'home__tile home__tile--widget' : 'home__tile home__tile--app'
  return href ? (
    <a className={cls} style={style} href={href} target="_blank" rel="noreferrer">
      {inner}
    </a>
  ) : (
    <div className={cls} style={style}>
      {inner}
    </div>
  )
}

function ProjectsHome({ lang }) {
  return (
    <div className="home">
      <div className="home__grid">
        {HOME_ITEMS.map((item, i) => (
          <Tile key={i} item={item} lang={lang} />
        ))}
      </div>
      <div className="home__dock">
        {DOCK.map((item, i) => (
          <Tile key={i} item={item} lang={lang} />
        ))}
      </div>
    </div>
  )
}

// ── Experience: six stills stacked into one plane; hovering plays 1→6 ─────────
function ExperienceFrames({ lang }) {
  const [frame, setFrame] = useState(0) // 0 = Exp-1 (default) … 5 = Exp-6
  const [selected, setSelected] = useState(null) // clicked photo index, or null
  const timer = useRef(null)

  // Preload every frame so the animation doesn't stutter on its first play.
  useEffect(() => {
    EXP_FRAMES.forEach((src) => {
      const img = new Image()
      img.src = src
    })
    return () => clearInterval(timer.current)
  }, [])

  // Advance one frame per tick until Exp-6, then stop and hold there.
  const play = () => {
    if (timer.current) return // already running
    timer.current = setInterval(() => {
      setFrame((f) => {
        if (f >= EXP_FRAMES.length - 1) {
          clearInterval(timer.current)
          timer.current = null
          return f
        }
        return f + 1
      })
    }, EXP_FRAME_MS)
  }

  // Trigger on real movement, not mouseenter: when the section's pointer-events
  // flips on at the end of the zoom, the browser fires a synthetic mouseenter
  // under the stationary cursor — that would skip straight past Exp-1. A genuine
  // mousemove only happens when the user actually moves over the frames.
  const atEnd = frame >= EXP_FRAMES.length - 1 // Exp-6 fully assembled
  const active = selected != null ? EXP_PHOTOS[selected] : null

  // Zoom the strip until the chosen photo fills the screen AND sits dead-center.
  // 1/w and 1/h are the scales that make the frame exactly fill; the max covers
  // both axes, EXP_ZOOM is a floor, and *1.08 hides the edges. Scaling alone (via
  // transform-origin) only pins the photo in place — so we also translate its
  // center (x, y) to the middle (0.5, 0.5). With origin at 0 0, a point at
  // fraction p lands at s*p, so translating by (0.5 - s*p) puts it at center.
  const zoomStyle = (() => {
    if (!active) return undefined
    const s = Math.max(EXP_ZOOM, 1 / active.w, 1 / active.h) * EXP_FILL
    const tx = (0.5 - s * active.x) * 100
    const ty = (0.5 - s * active.y) * 100
    return { transform: `translate(${tx}%, ${ty}%) scale(${s})` }
  })()

  return (
    <div className="exp" onMouseMove={play}>
      {/* Aspect-locked stage so the hotspots line up with the photos exactly. */}
      <div className="exp__stage">
        <div className="exp__zoom" style={zoomStyle}>
          {EXP_FRAMES.map((src, i) => (
            <img
              key={src}
              className="exp__frame"
              src={src}
              alt=""
              style={{ opacity: i === frame ? 1 : 0 }}
            />
          ))}

          {/* Clickable photo targets — only once the strip has fully assembled. */}
          {atEnd &&
            selected == null &&
            EXP_PHOTOS.map((p, i) => (
              <button
                key={i}
                className={`exp__hit ${DEBUG_HITBOXES ? 'exp__hit--debug' : ''}`}
                style={{
                  left: `${p.x * 100}%`,
                  top: `${p.y * 100}%`,
                  width: `${p.w * 100}%`,
                  height: `${p.h * 100}%`,
                }}
                onClick={() => setSelected(i)}
                aria-label={`${p.year} — ${pick(p.role, lang)}`}
              />
            ))}
        </div>
      </div>

      {/* Zoomed into the frame: a soft darken in the corner, then the year is
          burned in like a disposable-camera date stamp with the role beneath. */}
      {active && (
        <div className="exp__detail" style={{ '--exp-dark': EXP_DARKEN }} onClick={() => setSelected(null)}>
          {/* Uniform darken over the WHOLE viewport, so the neighbouring frames that
              peek in at wide aspect ratios read as dark as the focused one. */}
          <div className="exp__dim" />
          {/* Stamp tracks the IMAGE box (same aspect-lock as .exp__stage), so the
              caption stays on the photo even when the frame is letterboxed. */}
          <div className="exp__imgbox">
            <figure className="exp__stamp" onClick={(e) => e.stopPropagation()}>
              <span className="exp__date">{active.year}</span>
              <span className="exp__role">{pick(active.role, lang)}</span>
              {active.note && <span className="exp__note">{pick(active.note, lang)}</span>}
            </figure>
          </div>
          {/* Step to the neighbouring photo (the zoom pans over to it). */}
          {selected > 0 && (
            <button
              className="exp__nav exp__nav--prev"
              onClick={(e) => (e.stopPropagation(), setSelected(selected - 1))}
              aria-label="Previous"
            >
              ‹
            </button>
          )}
          {selected < EXP_PHOTOS.length - 1 && (
            <button
              className="exp__nav exp__nav--next"
              onClick={(e) => (e.stopPropagation(), setSelected(selected + 1))}
              aria-label="Next"
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Alpha bounding box of an image's actual content (ignoring transparent padding),
// in the image's own pixel coordinates. Scanned at low res so it's cheap. Fitting
// BOTH layers by their content — instead of by the file's edges — makes the B&W
// and colour glyphs line up no matter how each PNG was padded/exported.
function contentBounds(img) {
  const nw = img.naturalWidth
  const nh = img.naturalHeight
  if (!nw || !nh) return { x: 0, y: 0, w: 0, h: 0 }
  const scale = Math.min(1, 200 / Math.max(nw, nh))
  const w = Math.max(1, Math.round(nw * scale))
  const h = Math.max(1, Math.round(nh * scale))
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h).data
  let minX = w, minY = h, maxX = -1, maxY = -1
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return { x: 0, y: 0, w: nw, h: nh } // fully transparent → whole frame
  const inv = 1 / scale
  return { x: minX * inv, y: minY * inv, w: (maxX - minX + 1) * inv, h: (maxY - minY + 1) * inv }
}

// One skill: a colour canvas with the B&W canvas painted on top. Both draw their
// glyph fitted to the same target box (via contentBounds), so they align. Moving
// the cursor over it erases the B&W (destination-out) to reveal the colour beneath
// — like colouring it in. Paint enough and the rest clears so it locks to colour.
const FILL_FRAC = 0.92 // how much of the icon box the glyph fills (0–1)

function SkillIcon({ skill }) {
  const bwCanvasRef = useRef() // top layer, painted/erased
  const colorCanvasRef = useRef() // bottom layer, revealed
  const iconRef = useRef() // outer wrapper — its centre is stable (never transformed)
  const floatRef = useRef() // inner element we lean toward the cursor
  const st = useRef({ bwCtx: null, colorCtx: null, bwImg: null, w: 0, h: 0, ready: false, painted: 0, locked: false, last: null, reset: null })

  // Each icon leans toward the cursor on its OWN — from its own centre, with a
  // distance falloff so only the ones near the pointer react. So the field feels
  // alive per-icon instead of sliding around together.
  useEffect(() => {
    const iconEl = iconRef.current
    const floatEl = floatRef.current
    if (!iconEl || !floatEl) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let cx = 0, cy = 0
    const measure = () => {
      const r = iconEl.getBoundingClientRect()
      cx = r.left + r.width / 2
      cy = r.top + r.height / 2
    }
    measure()

    let mx = cx, my = cy, raf = 0
    const apply = () => {
      raf = 0
      const R = Math.min(window.innerWidth, window.innerHeight) * 0.5
      const dx = mx - cx
      const dy = my - cy
      const dist = Math.hypot(dx, dy) || 1
      const fall = Math.max(0, 1 - dist / R) // 1 at the icon, 0 past the radius
      const tx = dx * 0.14 * fall
      const ty = dy * 0.14 * fall
      const rot = (dx / dist) * skill.amp[2] * fall
      floatEl.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg)`
    }
    const onMove = (e) => {
      mx = e.clientX
      my = e.clientY
      if (!raf) raf = requestAnimationFrame(apply)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('resize', measure)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', measure)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [skill.amp])

  useEffect(() => {
    const bwCanvas = bwCanvasRef.current
    const colorCanvas = colorCanvasRef.current
    if (!bwCanvas || !colorCanvas) return
    const s = st.current
    let bwBounds = null
    let colorBounds = null

    // Draw an image's content region, scaled so its longer side fills FILL_FRAC of
    // the box, centred. Both layers use this → their glyphs land in the same place.
    const drawFitted = (ctx, img, b, extra = 1) => {
      if (!b || b.w <= 0) return
      const target = Math.min(s.w, s.h) * FILL_FRAC * extra
      const scale = target / Math.max(b.w, b.h)
      const dw = b.w * scale
      const dh = b.h * scale
      ctx.drawImage(img, b.x, b.y, b.w, b.h, (s.w - dw) / 2, (s.h - dh) / 2, dw, dh)
    }

    const redrawColor = () => {
      if (!s.colorCtx || !s.ready) return
      s.colorCtx.clearRect(0, 0, s.w, s.h)
      drawFitted(s.colorCtx, s.colorImg, colorBounds)
    }
    const reset = () => {
      if (!s.bwCtx || !s.ready) return
      s.bwCtx.globalCompositeOperation = 'source-over'
      s.bwCtx.clearRect(0, 0, s.w, s.h)
      drawFitted(s.bwCtx, s.bwImg, bwBounds, skill.bwScale || 1)
      s.painted = 0
      s.locked = false
    }
    s.reset = reset

    const fit = () => {
      const rect = bwCanvas.getBoundingClientRect()
      if (!rect.width) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      s.w = rect.width
      s.h = rect.height
      for (const [canvas, key] of [[bwCanvas, 'bwCtx'], [colorCanvas, 'colorCtx']]) {
        canvas.width = Math.round(rect.width * dpr)
        canvas.height = Math.round(rect.height * dpr)
        const ctx = canvas.getContext('2d')
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        s[key] = ctx
      }
      redrawColor()
      reset()
    }

    // Load both, measure each one's content box, then draw. onerror also counts so
    // a missing file can't hang the pair.
    const bw = new Image()
    const color = new Image()
    let done = 0
    const onReady = () => {
      if (++done < 2) return
      s.bwImg = bw
      s.colorImg = color
      bwBounds = contentBounds(bw)
      colorBounds = contentBounds(color)
      s.ready = true
      fit()
    }
    bw.onload = onReady
    bw.onerror = onReady
    color.onload = onReady
    color.onerror = onReady
    bw.src = bwSrc(skill.slug)
    color.src = colorSrc(skill.slug)

    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [skill.slug, skill.bwScale])

  // Erase a soft brush stamp at the cursor, accumulating swept area toward a lock.
  const paint = (e) => {
    const s = st.current
    const canvas = bwCanvasRef.current
    if (!s.bwCtx || !s.ready || s.locked || !canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (s.w / rect.width)
    const y = (e.clientY - rect.top) * (s.h / rect.height)
    const r = Math.max(s.w, s.h) * 0.15

    s.bwCtx.globalCompositeOperation = 'destination-out'
    const g = s.bwCtx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(0,0,0,1)')
    g.addColorStop(0.55, 'rgba(0,0,0,0.85)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    s.bwCtx.fillStyle = g
    s.bwCtx.beginPath()
    s.bwCtx.arc(x, y, r, 0, Math.PI * 2)
    s.bwCtx.fill()

    if (s.last) s.painted += Math.hypot(x - s.last.x, y - s.last.y) * r * 2
    s.last = { x, y }

    // Painted enough of the surface → clear the rest so the colour fully shows.
    if (s.painted > s.w * s.h * 2) {
      s.bwCtx.globalCompositeOperation = 'source-over'
      s.bwCtx.clearRect(0, 0, s.w, s.h)
      s.locked = true
    }
  }

  const onEnter = () => { st.current.last = null }
  // Keep whatever's been coloured in — leaving the icon no longer re-inks it.
  const onLeave = () => { st.current.last = null }

  return (
    <div
      ref={iconRef}
      className="skills__icon"
      style={{
        left: `${skill.x}%`,
        top: `${skill.y}%`,
        '--size': skill.size,
      }}
    >
      <span className="skills__float" ref={floatRef}>
        <span className="skills__art" role="img" aria-label={skill.name}>
          <canvas ref={colorCanvasRef} className="skills__color" />
          <canvas
            ref={bwCanvasRef}
            className="skills__bw"
            onPointerEnter={onEnter}
            onPointerMove={paint}
            onPointerLeave={onLeave}
          />
        </span>
        <span className="skills__name">{skill.name}</span>
      </span>
    </div>
  )
}

// ── Skills: tech icons scattered over the red zoom. Each one runs its own cursor
// follower (see SkillIcon), so they react to the pointer individually. The icons
// stay hidden through the zoom and pop in together once it lands (is-ready). ────
function SkillsFloat({ nav, lang }) {
  const ref = useRef()
  useEffect(() => {
    let raf
    const tick = () => {
      // Reveal only once zoomed in AND still zooming in (target === 1), so the set
      // appears at once — and hides instantly on Back, before the zoom-out.
      if (ref.current) {
        const ready = nav.current.target === 1 && nav.current.current > 0.92
        ref.current.classList.toggle('is-ready', ready)
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [nav])

  return (
    <div className="skills" ref={ref}>
      {SKILL_ROWS.map((r) => (
        <p key={r.label.en} className="skills__rowlabel" style={{ top: `${r.y}%` }}>
          {pick(r.label, lang)}
        </p>
      ))}
      {SKILLS.map((s) => (
        <SkillIcon key={s.slug} skill={s} />
      ))}
    </div>
  )
}

// ── Section overlay: fades in with the zoom, renders the active section ───────
function SectionOverlay({ nav, activeKey, onClose, lang }) {
  const ref = useRef()
  useEffect(() => {
    let raf
    const tick = () => {
      if (ref.current) {
        // Reveal only when the zoom has essentially landed AND we're still zooming
        // IN (target === 1). Gating on the target means clicking Back (target → 0)
        // hides the content instantly, so it's gone BEFORE the slow zoom-out plays.
        const ready = nav.current.target === 1 && nav.current.current > 0.92
        ref.current.style.opacity = ready ? 1 : 0
        // A little rise on the way in makes the arrival read clearly (skipped for
        // the full-bleed experience frames, which shouldn't slide).
        const pop = activeKey === 'projects'
        ref.current.style.transform = ready ? 'translateY(0)' : pop ? 'translateY(20px)' : 'none'
        ref.current.style.pointerEvents = ready ? 'auto' : 'none'
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [nav, activeKey])

  // About is a 3D room (its own HUD), so this DOM overlay skips it — otherwise the
  // full-screen panel would swallow the canvas clicks the walls need.
  if (!activeKey || activeKey === 'about') return null

  return (
    <div className={`section section--${activeKey}`} ref={ref}>
      <button className="section__back" onClick={onClose}>
        {UI[lang].back}
      </button>
      {activeKey === 'projects' && <ProjectsHome lang={lang} />}
      {activeKey === 'experience' && <ExperienceFrames lang={lang} />}
      {activeKey === 'skills' && <SkillsFloat nav={nav} lang={lang} />}
    </div>
  )
}

// ── About room HUD: turn arrows + back, over the 3D room. The container is
// click-through (so the walls stay clickable); only the buttons capture clicks. ──
const ABOUT_ORDER = ['left', 'back', 'right']

function AboutHud({ nav, activeWall, goWall, onClose, lang }) {
  const ref = useRef()
  useEffect(() => {
    let raf
    const tick = () => {
      if (ref.current) {
        const o = smoothstep(0.6, 0.98, nav.current.current)
        ref.current.style.opacity = o
        ref.current.dataset.ready = o > 0.5 ? '1' : '0' // gates button clicks
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [nav])

  const idx = ABOUT_ORDER.indexOf(activeWall)

  return (
    <div className="abouthud" ref={ref}>
      <button className="section__back" onClick={onClose}>
        {UI[lang].back}
      </button>
      {idx > 0 && (
        <button
          className="abouthud__arrow abouthud__arrow--left"
          onClick={() => goWall(ABOUT_ORDER[idx - 1])}
          aria-label="Turn left"
        >
          ‹
        </button>
      )}
      {idx < ABOUT_ORDER.length - 1 && (
        <button
          className="abouthud__arrow abouthud__arrow--right"
          onClick={() => goWall(ABOUT_ORDER[idx + 1])}
          aria-label="Turn right"
        >
          ›
        </button>
      )}
      {activeWall !== 'back' && (
        <button className="abouthud__center" onClick={() => goWall('back')}>
          {UI[lang].center}
        </button>
      )}
    </div>
  )
}

function App() {
  // Shared section-view state (mutated imperatively, read every frame). `cx/cy`
  // are the clicked block's world position; `color` tints the zoom-in fill.
  const nav = useRef({ target: 0, current: 0, cx: 0, cy: 0, endX: ABOUT_END_X, endY: ABOUT_END_Y, color: null, wall: 'back' })
  const progress = useScrollProgress(nav)
  const [activeKey, setActiveKey] = useState(null)
  const [lang, setLang] = useState('en') // 'en' | 'es' — flipped by the corner toggle
  // Which About-room wall we're facing (also mirrored into nav for the camera rig).
  const [activeWall, setActiveWall] = useState('back')
  const goWall = (wall) => {
    nav.current.wall = wall
    setActiveWall(wall)
  }

  const onSelect = (key, world, color, end) => {
    if (!SECTIONS.has(key)) return
    nav.current.cx = world.x
    nav.current.cy = world.y
    // Per-label resting offset (falls back to the global default).
    nav.current.endX = end ? end[0] : ABOUT_END_X
    nav.current.endY = end ? end[1] : ABOUT_END_Y
    nav.current.color = color
    nav.current.target = 1
    nav.current.wall = 'back'
    setActiveWall('back')
    setActiveKey(key)
  }
  const closeSection = () => {
    nav.current.target = 0
    nav.current.wall = 'back'
    setActiveWall('back')
  }

  // Once the fly-out finishes, drop the overlay from the tree.
  useEffect(() => {
    let raf
    const tick = () => {
      if (nav.current.target === 0 && nav.current.current < 0.01 && activeKey) {
        setActiveKey(null)
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [activeKey])

  return (
    <div className="stage">
      <Canvas
        camera={{ position: [0, 0, CAMERA_START_Z], fov: CAMERA_FOV }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#000000']} />
        <Scene
          progress={progress}
          nav={nav}
          onSelect={onSelect}
          activeKey={activeKey}
          goWall={goWall}
          lang={lang}
        />
      </Canvas>

      <TitleOverlay progress={progress} lang={lang} />
      <SectionOverlay nav={nav} activeKey={activeKey} onClose={closeSection} lang={lang} />
      {activeKey === 'about' && (
        <AboutHud nav={nav} activeWall={activeWall} goWall={goWall} onClose={closeSection} lang={lang} />
      )}

      <ScrollHint progress={progress} lang={lang} />

      {/* Top-right controls — always available (so they're there over About and
          Projects too): download the current-language CV, and toggle the language. */}
      <div className="topright">
        <a
          className="cvdownload"
          href={UI[lang].cv}
          download={UI[lang].cvName}
          aria-label={UI[lang].cvLabel}
          title={UI[lang].cvLabel}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v11" />
            <path d="M7 10l5 5 5-5" />
            <path d="M4 21h16" />
          </svg>
          <span>CV</span>
        </a>
        <div className="langtoggle" role="group" aria-label="Language">
          <button type="button" className={lang === 'en' ? 'is-active' : ''} aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
            EN
          </button>
          <button type="button" className={lang === 'es' ? 'is-active' : ''} aria-pressed={lang === 'es'} onClick={() => setLang('es')}>
            ES
          </button>
        </div>
      </div>
    </div>
  )
}

export default App
