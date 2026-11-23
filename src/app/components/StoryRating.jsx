import { useRef } from 'react'
import { GhostButton } from './primitives.jsx'

export default function StoryRating({ actor, path, label, editable, max, onSave, onRoll, action }) {
  const input = useRef(null)
  const value = Number(foundry.utils.getProperty(actor, path)) || 0

  async function save(event) {
    const field = event.currentTarget
    const next = field.valueAsNumber
    if (!field.validity.valid || !Number.isInteger(next)) {
      field.value = value
      return
    }
    if (next === value) return
    try {
      if (onSave) await onSave(next)
      else await actor.update({ [path]: next })
    } catch (error) {
      field.value = value
      console.error('Blood Oracle | Could not save an NPC rating', error)
      ui.notifications.error('The NPC rating could not be saved.')
    }
  }

  function roll() {
    const field = input.current
    onRoll(field?.validity.valid && Number.isInteger(field.valueAsNumber) ? field.valueAsNumber : value)
  }

  return (
    <div className="bo-stat-row bo-spc-rating">
      <span className="bo-stat-name">{label}</span>
      {editable ? (
        <input ref={input} type="number" min={0} max={max} required className="bo-field"
          key={value} defaultValue={value} aria-label={label} onBlur={save}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
          }} />
      ) : <span className="bo-spc-rating-value">{value}</span>}
      {onRoll ? <GhostButton tone="accent" aria-label={'Roll ' + label} onClick={roll}
        disabled={!editable && value < 1}>Roll</GhostButton> : null}
      {action}
    </div>
  )
}
