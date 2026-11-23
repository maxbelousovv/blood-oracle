import { useState } from 'react'
import { FullRulesButton, Modal } from './primitives.jsx'

export default function RulesReference({ title, source, children, inline = false }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={inline ? undefined : 'bo-block'}>
      <FullRulesButton onClick={() => setOpen(true)} />
      {open ? <Modal title={title} subtitle={source} wide onClose={() => setOpen(false)}>{children}</Modal> : null}
    </div>
  )
}
