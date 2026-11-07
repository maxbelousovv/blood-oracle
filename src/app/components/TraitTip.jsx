import { useEffect, useRef, useState } from 'react'
import HoverTip from './HoverTip.jsx'
import { getTraitText } from '../rules/catalog.js'

/** Long enough that passing over a row does not flash it; short enough to wait for. */
export const TRAIT_TIP_DELAY = 1000

/**
 * A tooltip that appears only after the pointer has rested on an element.
 * Leaving, pressing (a click on a trait name rolls) or scrolling hides it.
 *
 *   const tip = useDelayedTip()
 *   <button {...tip.bind}>…</button>
 *   {tip.anchor ? <HoverTip anchor={tip.anchor}>…</HoverTip> : null}
 */
export function useDelayedTip(delay = TRAIT_TIP_DELAY) {
  const [anchor, setAnchor] = useState(null)
  const timer = useRef(null)

  const hide = () => {
    clearTimeout(timer.current)
    setAnchor(null)
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  useEffect(() => {
    if (!anchor) return
    document.addEventListener('scroll', hide, true)
    return () => document.removeEventListener('scroll', hide, true)
  }, [anchor])

  return {
    anchor,
    bind: {
      onMouseEnter: (event) => {
        const target = event.currentTarget
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setAnchor(target), delay)
      },
      onMouseLeave: hide,
      onMouseDown: hide
    }
  }
}

/**
 * What an attribute or skill means and the specialties it usually takes, from
 * the private trait file. Renders nothing when there is no text for it.
 */
export function TraitTip({ anchor, entry, fallback }) {
  if (!anchor) return null
  // The private file's text when there is one; otherwise a short line of our
  // own, where the caller has one, so the tooltip is never empty for no reason.
  const found = getTraitText(entry.id, entry.label)
  const text = found?.description ? found : fallback ? { name: entry.label, description: fallback } : null
  if (!text) return null

  return (
    <HoverTip anchor={anchor} title={text.name || entry.label} width={420}>
      {text.description}
      {text.specialties?.length ? (
        <span className="bo-trait-tip-specs">
          <span className="bo-trait-tip-label">Specialties</span>
          {text.specialties.join(' · ')}
        </span>
      ) : null}
    </HoverTip>
  )
}
