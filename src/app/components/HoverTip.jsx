import { useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { paletteOf, placement } from './floating.js'

/**
 * A tooltip in the sheet's style, anchored under (or over) an element.
 * Rendered in <body> so the window cannot clip it.
 */
export default function HoverTip({ anchor, title, children, width = 380 }) {
  const [layout, setLayout] = useState(null)

  useLayoutEffect(() => {
    if (!anchor) return
    setLayout({
      position: placement(anchor, { minWidth: 0, maxHeight: 420, needBelow: 200 }),
      palette: paletteOf(anchor)
    })
  }, [anchor])

  if (!anchor || !layout) return null
  // Sized by its text up to a readable measure, not by the anchor.
  const { width: _anchorWidth, ...position } = layout.position

  return createPortal(
    <div className="bo-spec-tip bo-hover-tip" style={{ ...layout.palette, ...position, maxWidth: width }}>
      {title ? <div className="bo-hover-tip-title">{title}</div> : null}
      <div className="bo-hover-tip-body">{children}</div>
    </div>,
    document.body
  )
}
