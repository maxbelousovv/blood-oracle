import { useEffect, useState } from 'react'
import { artUrl } from '../rules/catalog.js'

/** Tried in this order; the first file that loads is the art. */
const EXTENSIONS = ['webp', 'png', 'jpg']

/**
 * Open the full image in Foundry's own image window, which gives the
 * Storyteller its "Show to Players" control for free.
 */
function openPopout(src, title) {
  const V2 = foundry.applications?.apps?.ImagePopout
  if (V2) {
    new V2({ src, window: { title }, shareable: true }).render(true)
    return
  }
  // Older cores kept the application global.
  if (globalThis.ImagePopout) new globalThis.ImagePopout(src, { title, shareable: true }).render(true)
}

/** Load each candidate in turn off-screen; resolve with the first that exists. */
function findArt(category, id) {
  return new Promise((resolve) => {
    const candidates = EXTENSIONS.map((extension) => artUrl(category, id, extension)).filter(Boolean)
    const next = (index) => {
      if (index >= candidates.length) return resolve(null)
      const probe = new Image()
      probe.onload = () => resolve(candidates[index])
      probe.onerror = () => next(index + 1)
      probe.src = candidates[index]
    }
    next(0)
  })
}

/**
 * A thumbnail of an entity's art from the private art folder, floated to the
 * right of the panel it sits in so the text beside it flows around it.
 *
 * The file is looked for off-screen first and the thumbnail appears only once
 * one has loaded, so a panel without art neither flickers nor shifts: it looks
 * exactly as it always did.
 */
export default function EntityArt({ category, id, title }) {
  const [src, setSrc] = useState(null)

  useEffect(() => {
    let current = true
    setSrc(null)
    findArt(category, id).then((found) => {
      if (current) setSrc(found)
    })
    return () => {
      current = false
    }
  }, [category, id])

  if (!src) return null

  return (
    <button
      type="button"
      className="bo-entity-art"
      title={`Open the art for ${title}`}
      onClick={() => openPopout(src, title)}
    >
      <img src={src} alt="" />
    </button>
  )
}
