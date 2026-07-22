import { useEffect, useRef } from 'react'
import { SCROLL_SENSITIVITY, ABOUT_SCROLL_OUT } from './config'

// ─────────────────────────────────────────────────────────────────────────────
// The page never scrolls. We turn wheel / trackpad / touch into a single number:
// `target`, 0 (entry) → 1 (menu). We return a *ref*, not state, so the render
// loop reads it every frame without re-rendering React.
//
// `nav` is the About-view ref ({ target, current, … }). When we're inside the
// About room, the same gestures instead scroll us BACK OUT (reduce nav.target),
// leaving the main scroll progress frozen where it was.
// ─────────────────────────────────────────────────────────────────────────────
export function useScrollProgress(nav) {
  const progress = useRef({ target: 0, current: 0 })

  useEffect(() => {
    const clamp = (v) => Math.min(1, Math.max(0, v))

    // Are we in (or entering) the About view? Then gestures drive the fly-out.
    const inAbout = () => nav.current.target > 0 || nav.current.current > 0.02

    const apply = (delta) => {
      if (inAbout()) {
        // Scroll up (delta < 0) walks nav.target down toward 0 → fly back out.
        nav.current.target = clamp(nav.current.target + delta * ABOUT_SCROLL_OUT)
      } else {
        progress.current.target = clamp(
          progress.current.target + delta * SCROLL_SENSITIVITY,
        )
      }
    }

    const onWheel = (e) => {
      e.preventDefault()
      apply(e.deltaY)
    }

    let lastTouchY = null
    const onTouchStart = (e) => {
      lastTouchY = e.touches[0].clientY
    }
    const onTouchMove = (e) => {
      if (lastTouchY === null) return
      const y = e.touches[0].clientY
      apply((lastTouchY - y) * 4)
      lastTouchY = y
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
  }, [nav])

  return progress
}
