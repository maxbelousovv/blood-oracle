import DotTracker from './DotTracker.jsx'
import { HUNTER_COUNTERS, hunterCell, hunterCounter } from '../schema/hunter-state.js'

export default function HunterCounters({ actor, disabled }) {
  const cell = hunterCell(actor)
  const source = cell ?? actor
  if (cell?.visible === false) return <p className="bo-roll-note">The Storyteller controls the cell trackers.</p>
  const readOnly = Boolean(disabled || (cell && !cell.isOwner))
  const update = (key, value) => source.update({ ['system.' + key + '.value']: value })

  return (
    <div className="bo-hunter-counters">
      {Object.entries(HUNTER_COUNTERS).map(([key, { label, max }]) => {
        const value = hunterCounter(actor, key)
        const danger = key === 'danger'
        const dots = danger ? Math.min(max, Math.max(5, value + 1)) : max
        return (
          <div key={key} role="group" aria-label={label + ' ' + value}>
            <div className="bo-label">{label} · {value}</div>
            <div>
              <DotTracker value={value} max={dots} disabled={readOnly} onChange={(next) => update(key, next)}
                color={danger ? (dot) => `color-mix(in srgb, var(--bo-dot), var(--bo-accent) ${Math.min(100, (dot - 1) * 25)}%)` : undefined} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
