import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './three/Scene'
import { useScrollProgress } from './three/useScrollProgress'
import { CAMERA_START_Z, CAMERA_FOV } from './three/config'
import './App.css'

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

// The About content. It's HTML (crisp text, real links) layered over the 3D room
// you fly into. Its opacity is driven by the fly-in amount (nav.current.current),
// so it materialises only once you're inside the room.
function AboutOverlay({ nav, onClose }) {
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

  return (
    <div className="about" ref={ref}>
      <button className="about__back" onClick={onClose}>
        ← Back
      </button>

      <div className="about__inner">
        <h2 className="about__title">About</h2>

        <p className="about__intro">
          I’m a creative engineer who builds at the seam between design and code.
          I like turning abstract data and ideas into things people can see,
          touch, and move through. Lately I’ve been exploring immersive web
          experiences and the craft of making interfaces feel alive.
        </p>

        <p className="about__passion">
          Passionate about creative technology, data visualization, interactive
          systems, and software.
        </p>

        <ul className="about__meta">
          <li>Master’s student</li>
          <li>Bogotá, Colombia</li> {/* optional — edit or remove */}
        </ul>

        <nav className="about__links">
          <a href="mailto:you@example.com">Email</a>
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
    </div>
  )
}

function App() {
  // Shared About-view state (mutated imperatively, read every frame). `cx/cy`
  // are the world position of the clicked block, so the camera flies at it.
  const nav = useRef({ target: 0, current: 0, cx: 0, cy: 0 })
  const progress = useScrollProgress(nav)

  const onSelect = (key, world) => {
    if (key !== 'about') return // only About is wired up for now
    nav.current.cx = world.x
    nav.current.cy = world.y
    nav.current.target = 1
  }
  const closeAbout = () => {
    nav.current.target = 0
  }

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
      <AboutOverlay nav={nav} onClose={closeAbout} />

      <div className="hint">scroll to enter</div>
    </div>
  )
}

export default App
