import { MODULE_ID } from '../../constants.js'
import { groupOf } from './coterie.js'

export const HUNTER_COUNTERS = {
  desperation: { label: 'Desperation', max: 5 },
  danger: { label: 'Danger', max: 10 }
}

export function hunterCell(actor) {
  if (actor.type !== 'hunter') return null
  const group = groupOf(actor)
  return group?.system.groupType === 'cell' ? group : null
}

export function hunterCounter(actor, key) {
  const source = hunterCell(actor) ?? actor
  if (source.visible === false) return 0
  const value = Math.trunc(Number(source.system[key]?.value)) || 0
  return Math.max(0, Math.min(HUNTER_COUNTERS[key].max ?? Infinity, value))
}

const dangerUpdates = new Map()

export async function increaseHunterDanger(source, amount, messageId) {
  const key = source.uuid
  const previous = dangerUpdates.get(key) ?? Promise.resolve()
  const update = previous.catch(() => {}).then(async () => {
    if (messageId && source.getFlag(MODULE_ID, 'appliedDanger')?.[messageId]) return
    const current = hunterCounter(source, 'danger')
    const next = Math.min(current + amount, HUNTER_COUNTERS.danger.max)
    const changes = { 'system.danger.value': next }
    if (messageId) changes['flags.' + MODULE_ID + '.appliedDanger.' + messageId] = true
    await source.update(changes)
    return next - current
  })
  dangerUpdates.set(key, update)
  try {
    return await update
  } finally {
    if (dangerUpdates.get(key) === update) dangerUpdates.delete(key)
  }
}
