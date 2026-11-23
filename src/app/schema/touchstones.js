import { MODULE_ID } from '../../constants.js'

export function hunterTouchstones(actor) {
  const saved = actor.getFlag?.(MODULE_ID, 'hunterTouchstones')
  if (Array.isArray(saved)) return saved
  const legacy = actor.system.headers?.touchstones?.trim()
  return legacy ? [{ touchstone: legacy, portrait: '' }] : []
}

export function hasNoHunterTouchstones(actor) {
  return actor.type === 'hunter' && !hunterTouchstones(actor).some((entry) => entry.touchstone?.trim())
}

export function hunterInDespair(actor) {
  return actor.type === 'hunter' && (hasNoHunterTouchstones(actor) || Boolean(actor.system.despair?.value))
}

/** A recovery may come from the native sheet, a macro, or Blood Oracle. */
export function guardHunterWillpowerRecovery(actor, changes) {
  if (!hasNoHunterTouchstones(actor)) return
  const { getProperty, setProperty } = foundry.utils
  const current = actor.system.willpower ?? {}
  const paths = ['superficial', 'aggravated']
  const values = paths.map((kind) => {
    const path = 'system.willpower.' + kind
    const flat = Object.hasOwn(changes, path)
    const value = flat ? changes[path] : getProperty(changes, path)
    return { path, flat, value, before: Number(current[kind]) || 0 }
  })
  const [superficial, aggravated] = values
  const next = (field) => Number(field.value ?? field.before)
  // Converting superficial damage to aggravated is damage, not recovery.
  const allowedSuperficial = Math.max(0, superficial.before - Math.max(0, next(aggravated) - aggravated.before))
  let blocked = false
  for (const [field, minimum] of [[superficial, allowedSuperficial], [aggravated, aggravated.before]]) {
    if (field.value == null || next(field) >= minimum) continue
    if (field.flat) changes[field.path] = minimum
    else setProperty(changes, field.path, minimum)
    blocked = true
  }
  if (blocked) ui.notifications.warn('Willpower cannot recover without a Touchstone.')
}
