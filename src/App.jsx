import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './three/Scene'
import { useScrollProgress } from './three/useScrollProgress'
import { CAMERA_START_Z, CAMERA_FOV } from './three/config'
import { HOME_ITEMS, DOCK } from './homeConfig'
import './App.css'

// Sections that have a view when you click their block. Others do nothing (yet).
const SECTIONS = new Set(['about', 'projects'])

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
