import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './three/Scene'
import { useScrollProgress } from './three/useScrollProgress'
import { CAMERA_START_Z, CAMERA_FOV } from './three/config'
import { HOME_ITEMS, DOCK } from './homeConfig'
import { EXP_PHOTOS, EXP_ZOOM, EXP_FILL, EXP_DARKEN, DEBUG_HITBOXES } from './experienceConfig'
import './App.css'

// Sections that have a view when you click their block. Others do nothing (yet).
const SECTIONS = new Set(['about', 'projects', 'experience'])

// Experience: six full-frame stills that together form one short animation.
// Landing on the section shows Exp-1; hovering plays 1→6 and holds on 6.
const EXP_FRAMES = ['/Exp-1.png', '/Exp-2.png', '/Exp-3.png', '/Exp-4.png', '/Exp-5.png', '/Exp-6.png']
const EXP_FRAME_MS = 110 // per-frame duration of the hover animation

const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

// The name/title over the entry composite, fading out as the scroll begins.
function TitleOverlay({ progress }) {
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
      <p className="title__role">Creative Engineer</p>
    </div>
  )
}

// ── About content ────────────────────────────────────────────────────────────
function AboutContent() {
  return (
    <div className="about__inner">
      <h2 className="about__title">About</h2>

      <p className="about__intro">
        I’m a creative engineer who builds at the seam between design and code. I
        like turning abstract data and ideas into things people can see, touch,
        and move through. Lately I’ve been exploring immersive web experiences and
        the craft of making interfaces feel alive.
      </p>

      <p className="about__passion">
        Passionate about creative technology, data visualization, interactive
        systems, and software.
      </p>

      <ul className="about__meta">
        <li>Master’s student</li>
        <li>Bogotá, Colombia</li>
      </ul>

      <nav className="about__links">
        <a href="mailto:m.joven@uniandes.edu.co">Email</a>
        <a href="https://www.linkedin.com/in/marilyn-stephany-joven" target="_blank" rel="noreferrer">
          LinkedIn
        </a>
        <a href="https://github.com/marilynjov" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href="/resume.pdf" download>
          Resume ↓
        </a>
      </nav>
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
function Tile({ item }) {
  const isWidget = item.widget
  const style = isWidget
    ? { gridColumn: `span ${item.w || 1}`, gridRow: `span ${item.h || 1}` }
    : undefined

  const media = isWidget
    ? item.image
      ? <img className="home__media" src={item.image} alt={item.name || ''} />
      : <div className="home__placeholder" style={{ background: colorFor(item.name) }}>{item.name}</div>
    : item.icon
      ? <img className="home__media" src={item.icon} alt="" />
      : <span className="home__initial" style={{ background: colorFor(item.name) }}>{(item.name || '?')[0]}</span>

  const inner = (
    <>
      <span className={isWidget ? 'home__widget' : 'home__icon'}>{media}</span>
      {!isWidget && item.name && <span className="home__label">{item.name}</span>}
    </>
  )

  const cls = isWidget ? 'home__tile home__tile--widget' : 'home__tile home__tile--app'
  return item.url ? (
    <a className={cls} style={style} href={item.url} target="_blank" rel="noreferrer">
      {inner}
    </a>
  ) : (
    <div className={cls} style={style}>
      {inner}
    </div>
  )
}

function ProjectsHome() {
  return (
    <div className="home">
      <div className="home__grid">
        {HOME_ITEMS.map((item, i) => (
          <Tile key={i} item={item} />
        ))}
      </div>
      <div className="home__dock">
        {DOCK.map((item, i) => (
          <Tile key={i} item={item} />
        ))}
      </div>
    </div>
  )
}

// ── Experience: six stills stacked into one plane; hovering plays 1→6 ─────────
function ExperienceFrames() {
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
                aria-label={`${p.year} — ${p.role}`}
              />
            ))}
        </div>
      </div>

      {/* Zoomed into the frame: a soft darken in the corner, then the year is
          burned in like a disposable-camera date stamp with the role beneath. */}
      {active && (
        <div className="exp__detail" onClick={() => setSelected(null)}>
          <div className="exp__grade" style={{ '--exp-dark': EXP_DARKEN }} />
          <figure className="exp__stamp" onClick={(e) => e.stopPropagation()}>
            <span className="exp__date">{active.year}</span>
            <span className="exp__role">{active.role}</span>
            {active.note && <span className="exp__note">{active.note}</span>}
          </figure>
          <button className="exp__close" onClick={() => setSelected(null)}>
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

// ── Section overlay: fades in with the zoom, renders the active section ───────
function SectionOverlay({ nav, activeKey, onClose }) {
  const ref = useRef()
  useEffect(() => {
    let raf
    const tick = () => {
      if (ref.current) {
        const o = smoothstep(0.6, 0.98, nav.current.current)
        ref.current.style.opacity = o
        ref.current.style.pointerEvents = o > 0.5 ? 'auto' : 'none'
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [nav])

  if (!activeKey) return null

  return (
    <div className={`section section--${activeKey}`} ref={ref}>
      <button className="section__back" onClick={onClose}>
        ← Back
      </button>
      {activeKey === 'about' && <AboutContent />}
      {activeKey === 'projects' && <ProjectsHome />}
      {activeKey === 'experience' && <ExperienceFrames />}
    </div>
  )
}

function App() {
  // Shared section-view state (mutated imperatively, read every frame). `cx/cy`
  // are the clicked block's world position; `color` tints the zoom-in fill.
  const nav = useRef({ target: 0, current: 0, cx: 0, cy: 0, color: null })
  const progress = useScrollProgress(nav)
  const [activeKey, setActiveKey] = useState(null)

  const onSelect = (key, world, color) => {
    if (!SECTIONS.has(key)) return
    nav.current.cx = world.x
    nav.current.cy = world.y
    nav.current.color = color
    nav.current.target = 1
    setActiveKey(key)
  }
  const closeSection = () => {
    nav.current.target = 0
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

  // Hide the "scroll to enter" hint after the first interaction.
  useEffect(() => {
    const hide = () => document.body.classList.add('interacted')
    window.addEventListener('wheel', hide, { once: true })
    window.addEventListener('touchstart', hide, { once: true })
    return () => {
      window.removeEventListener('wheel', hide)
      window.removeEventListener('touchstart', hide)
    }
  }, [])

  return (
    <div className="stage">
      <Canvas
        camera={{ position: [0, 0, CAMERA_START_Z], fov: CAMERA_FOV }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#000000']} />
        <Scene progress={progress} nav={nav} onSelect={onSelect} />
      </Canvas>

      <TitleOverlay progress={progress} />
      <SectionOverlay nav={nav} activeKey={activeKey} onClose={closeSection} />

      <div className="hint">scroll to enter</div>
    </div>
  )
}

export default App
