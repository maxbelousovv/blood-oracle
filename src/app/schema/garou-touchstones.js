import { MODULE_ID } from '../../constants.js'
import { rageOf, setRage } from './werewolf.js'
import { garouPeriod } from './werewolf-session.js'

const TOUCHSTONES = 'garouTouchstones'
const USES = 'garouTouchstoneUses'

export const TOUCHSTONE_BENEFITS = [
  { id: 'rage', label: 'Lower Rage to 1' },
  { id: 'willpower', label: 'Heal 1 Aggravated Willpower' },
  { id: 'harano', label: 'Move Harano → Hauglosk' },
  { id: 'hauglosk', label: 'Move Hauglosk → Harano' }
]

export function garouTouchstones(actor) {
  const saved = actor.getFlag(MODULE_ID, TOUCHSTONES)
  if (Array.isArray(saved)) return saved
  const text = actor.system.headers?.touchstones ?? ''
  return text
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .split(/\n\s*\n/)
    .map((touchstone) => touchstone.trim())
    .filter(Boolean)
    .map((touchstone, index) => ({ id: 'legacy-' + index, touchstone, portrait: '' }))
}
export const writeGarouTouchstones = (actor, rows) => actor.setFlag(MODULE_ID, TOUCHSTONES, rows)
const benefitKey = (choice) => ['harano', 'hauglosk'].includes(choice) ? 'move' : choice
const opposite = (choice) => choice === 'harano' ? 'hauglosk' : 'harano'

export function touchstoneBenefitProblem(actor, choice) {
  const used = actor.getFlag(MODULE_ID, USES) ?? {}
  if (used.session === garouPeriod('session')) return 'A Touchstone benefit was already used this session.'
  if (used[benefitKey(choice)] === garouPeriod('story')) return 'You have used this benefit in the current story.'
  if (choice === 'rage' && rageOf(actor) < 2) return 'Rage must be above 1.'
  if (choice === 'willpower' && !actor.system.willpower?.aggravated) return 'No Aggravated Willpower damage.'
  if (['harano', 'hauglosk'].includes(choice)) {
    const balance = actor.system.balance
    if (!balance?.[choice]?.value || (balance?.[opposite(choice)]?.value ?? 0) >= 5) return 'No mark can be moved this way.'
  }
  return ''
}

const applying = new Set()
export async function applyTouchstoneBenefit(actor, touchstoneId, choice) {
  const key = actor.uuid ?? actor.id
  if (applying.has(key) || actor.type !== 'werewolf' || !actor.isOwner ||
      !TOUCHSTONE_BENEFITS.some(({ id }) => id === choice) ||
      !garouTouchstones(actor).some(({ id, touchstone }) => id === touchstoneId && touchstone.trim()) ||
      touchstoneBenefitProblem(actor, choice)) return false
  const changes = {
    ['flags.' + MODULE_ID + '.' + USES + '.session']: garouPeriod('session'),
    ['flags.' + MODULE_ID + '.' + USES + '.' + benefitKey(choice)]: garouPeriod('story')
  }

  applying.add(key)
  try {
    if (choice === 'rage') await setRage(actor, 1, changes)
    else if (choice === 'willpower') await actor.update({
      ...changes,
      'system.willpower.aggravated': actor.system.willpower.aggravated - 1
    })
    else {
      const other = opposite(choice)
      const balance = actor.system.balance
      await actor.update({
        ...changes,
        ['system.balance.' + choice + '.value']: balance[choice].value - 1,
        ['system.balance.' + other + '.value']: (balance?.[other]?.value ?? 0) + 1
      })
    }
    return true
  } finally {
    applying.delete(key)
  }
}
