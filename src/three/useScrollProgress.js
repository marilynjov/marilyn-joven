import { useEffect, useRef } from 'react'
import { SCROLL_SENSITIVITY } from './config'

// ─────────────────────────────────────────────────────────────────────────────
// The page itself never scrolls. Instead we listen for wheel / trackpad / touch
// gestures and accumulate a single number: `target`, from 0 (start, looking at
// the full composite) to 1 (arrived at the menu).
//
// We return a *ref* (a mutable box), NOT React state. Why? This value changes
// every frame — putting it in state would re-render React 60×/sec. Instead the
// Three.js render loop reads `progress.current.target` directly each frame.
// This is a core R3F pattern: keep fast-changing values out of React state.
// ─────────────────────────────────────────────────────────────────────────────
export function useScrollProgress() {
  const progress = useRef({ target: 0, current: 0 })

  useEffect(() => {
    const clamp = (v) => Math.min(1, Math.max(0, v))

    // Mouse wheel / trackpad
    const onWheel = (e) => {
      e.preventDefault() // stop any native scroll/back-swipe
      progress.current.target = clamp(
        progress.current.target + e.deltaY * SCROLL_SENSITIVITY,
      )
    }

    // Touch: remember where a finger last was, convert drag distance to progress.
    let lastTouchY = null
    const onTouchStart = (e) => {
      lastTouchY = e.touches[0].clientY
    }
    const onTouchMove = (e) => {
      if (lastTouchY === null) return
      const y = e.touches[0].clientY
      const delta = lastTouchY - y // finger up = go deeper
      lastTouchY = y
      progress.current.target = clamp(
        progress.current.target + delta * SCROLL_SENSITIVITY * 4,
      )
    }
    const onTouchEnd = () => {
      lastTouchY = null
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return progress
}
