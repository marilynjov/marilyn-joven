import { useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Scene } from './three/Scene'
import { useScrollProgress } from './three/useScrollProgress'
import { CAMERA_START_Z } from './three/config'
import './App.css'

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
        camera={{ position: [0, 0, CAMERA_START_Z], fov: 50 }}
        gl={{ antialias: true }}
      >
        {/* Black void. The paint layers are the only lit thing (they use
            MeshBasicMaterial, so they need no lights). */}
        <color attach="background" args={['#000000']} />
        <Scene progress={progress} />
      </Canvas>

      <div className={`hint ${hintVisible ? '' : 'hint--hidden'}`}>
        scroll to enter
      </div>
    </div>
  )
}

export default App
