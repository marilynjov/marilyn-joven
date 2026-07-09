import { useRef, useState } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { MENU_Z } from './config'

// Edit these to whatever your portfolio sections are.
const ITEMS = [
  { label: 'Work', href: null },
  { label: 'About', href: null },
  { label: 'Contact', href: null },
]

// smoothstep: eases a value from 0→1 between edges a and b (nice for fades).
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function MenuItem({ label, y, onSelect }) {
  const ref = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame(() => {
    if (!ref.current) return
    // Ease scale toward the hover target for a soft grow-on-hover.
    const target = hovered ? 1.15 : 1
    ref.current.scale.x += (target - ref.current.scale.x) * 0.15
    ref.current.scale.y = ref.current.scale.x
  })

  return (
    <Text
      ref={ref}
      position={[0, y, MENU_Z]}
      fontSize={1.1}
      color={hovered ? '#ffffff' : '#c9c6d0'}
      anchorX="center"
      anchorY="middle"
      letterSpacing={0.02}
      onClick={() => onSelect(label)}
      onPointerOver={() => {
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      {label}
    </Text>
  )
}

// `progress` is the ref from useScrollProgress. The menu fades in as the camera
// approaches (progress 0.72 → 1) so it "arrives" out of the black.
export function Menu3D({ progress }) {
  const groupRef = useRef()

  useFrame(() => {
    if (!groupRef.current) return
    const o = smoothstep(0.72, 1, progress.current.current)
    groupRef.current.visible = o > 0.01
    // Fade every text child's material opacity together.
    groupRef.current.traverse((child) => {
      if (child.material) {
        child.material.transparent = true
        child.material.opacity = o
      }
    })
  })

  const onSelect = (label) => {
    // Wire this up to routing later. For now, just log.
    console.log('menu:', label)
  }

  return (
    <group ref={groupRef} visible={false}>
      {ITEMS.map((item, i) => (
        <MenuItem
          key={item.label}
          label={item.label}
          y={(ITEMS.length - 1) / 2 - i} // stack them vertically, centered
          onSelect={onSelect}
        />
      ))}
    </group>
  )
}
