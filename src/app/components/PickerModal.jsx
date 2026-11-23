import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { paletteOf } from './floating.js'
import { Modal } from './primitives.jsx'

export default function PickerModal({ title, onClose, children }) {
  const anchor = useRef(null)
  const [portal, setPortal] = useState(null)

  useLayoutEffect(() => {
    const element = anchor.current
    if (element) setPortal({ body: element.ownerDocument.body, palette: paletteOf(element) })
  }, [])

  return (
    <>
      <span ref={anchor} hidden />
      {portal ? createPortal(
        <div className="blood-oracle bo-library-portal" style={portal.palette}>
          <Modal title={title} className="bo-modal bo-picker-dialog" onClose={onClose}>{children}</Modal>
        </div>,
        portal.body
      ) : null}
    </>
  )
}
