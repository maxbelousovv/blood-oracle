import { MODULE_ID } from '../../constants.js'
import { garouHealth, garouHealthUpdate } from './werewolf.js'
import { garouPeriod } from './werewolf-session.js'
import { garouIdentities } from './garou-advancement.js'
import { packOf, patronPreset, readCaern, readPackPatron } from './pack.js'

const useFlag = 'caernUses'
const uses = (actor) => actor.getFlag(MODULE_ID, useFlag) ?? {}
const matchesSkills = {
  childrenofgaia: ['awareness', 'insight'],
  ghostcouncil: ['investigation', 'occult', 'subterfuge'],
  glasswalker: ['technology', 'science'],
  hartwarden: ['survival', 'animalken', 'craft'],
  redtalon: ['brawl'],
  shadowlord: ['animalken', 'intimidation', 'subterfuge'],
  silentstrider: ['athletics', 'stealth'],
  silverfang: ['persuasion', 'leadership']
}

export function garouPackContext(actor) {
  const group = packOf(actor)
  if (!group) return null
  const caern = readCaern(group)
  const patron = readPackPatron(group)
  return { group, caern, patron, traits: caern.value > 0 ? caern.traits : {} }
}

export function packFavorPart(actor, slots = []) {
  const context = garouPackContext(actor)
  if (!context?.patron.id) return null
  const preset = patronPreset(context.patron.id)
  const name = preset?.patron ?? context.patron.name
  const value = preset ? (preset.id === garouIdentities(actor).tribe?.id ? 2 : 1) : Number(context.patron.dice) || 0
  if (!name || !value) return null

  const restriction = matchesSkills[preset?.id]
  const eligibleSkill = !restriction || !slots.length || slots.some((slot) => slot.kind === 'skill' && restriction.includes(slot.id))
  if (!eligibleSkill) return null
  if (preset?.id === 'redtalon') {
    const health = garouHealth(actor)
    if (health.max - health.aggravated - health.superficial >= health.max / 2) return null
  }
  return { label: name + ' · Favor', value, detail: preset?.favor || context.patron.favor }
}

export function caernUseKey(actor, name, period) {
  const group = packOf(actor)
  return group ? [group.uuid ?? group.id, period, name].join(':').replaceAll('.', '-') : ''
}

export function caernUseAvailable(actor, effect, period) {
  const key = caernUseKey(actor, effect, period)
  return Boolean(key && uses(actor)[key] !== garouPeriod(period))
}

export function caernUseUpdate(actor, effect, period) {
  const key = caernUseKey(actor, effect, period)
  return key ? { ['flags.' + MODULE_ID + '.' + useFlag + '.' + key]: garouPeriod(period) } : {}
}

const applying = new Set()
export async function applyCaernRecovery(actor, choice) {
  const effect = choice === 'ikon' ? 'ikon' : 'balm'
  const lock = actor.uuid ?? actor.id
  if (applying.has(lock) || !actor.isOwner || actor.type !== 'werewolf' ||
      !garouPackContext(actor)?.traits[effect] || !caernUseAvailable(actor, effect, 'session')) return false

  const health = garouHealth(actor)
  const willpower = actor.system.willpower
  const updates = { ...caernUseUpdate(actor, effect, 'session') }
  if (choice === 'ikon') {
    if (!willpower.superficial) return false
    updates['system.willpower.superficial'] = willpower.superficial - 1
  } else {
    const aggravated = choice === 'balm-aggravated'
    const track = aggravated ? 'aggravated' : 'superficial'
    if (!health[track]) return false
    Object.assign(updates, garouHealthUpdate(actor, { ...health, [track]: Math.max(0, health[track] - (aggravated ? 1 : 3)) }))
  }

  applying.add(lock)
  try {
    await actor.update(updates)
    return true
  } finally {
    applying.delete(lock)
  }
}
