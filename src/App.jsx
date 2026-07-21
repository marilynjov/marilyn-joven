import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './three/Scene'
import { useScrollProgress } from './three/useScrollProgress'
import { CAMERA_START_Z, CAMERA_FOV } from './three/config'
import './App.css'

// The name/title over the entry composite. It lives in HTML (not the 3D scene)
// so the text stays perfectly crisp. A requestAnimationFrame loop reads the
// shared progress ref and fades the title out as soon as you start scrolling —
// fully gone by ~8% in, so it clears before the curtain really opens.
function TitleOverlay({ progress }) {
  const ref = useRef()

  useEffect(() => {
    let raf
    const tick = () => {
      if (ref.current) {
        const p = progress.current.current
        const o = Math.max(0, 1 - p / 0.08)
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

function App() {
  // One shared source of truth for how far into the journey we are.
  const progress = useScrollProgress()

  // Fade out the "scroll to enter" hint after the first interaction.
  const [hintVisible, setHintVisible] = useState(true)
  useEffect(() => {
    const hide = () => setHintVisible(false)
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
        {/* Black void. The paint layers are the only lit thing (they use
            MeshBasicMaterial, so they need no lights). */}
        <color attach="background" args={['#000000']} />
        <Scene progress={progress} />
      </Canvas>

      <TitleOverlay progress={progress} />

      <div className={`hint ${hintVisible ? '' : 'hint--hidden'}`}>
        scroll to enter
      </div>
    </div>
  )
}

export default App
