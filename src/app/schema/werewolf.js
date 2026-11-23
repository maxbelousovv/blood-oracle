import { MODULE_ID } from '../../constants.js'

export const GAROU_FORMS = [
  { id: 'homid', name: 'Homid', checks: 0, summary: 'Human form. Contact with silver causes no damage.' },
  { id: 'glabro', name: 'Glabro', checks: 1, summary: '+2 dice to Physical tests. −2 dice to Social tests with humans, except Intimidation. Regenerate 1 Superficial Health per check.' },
  { id: 'crinos', name: 'Crinos', checks: 2, summary: '+4 dice to Physical tests and four extra Health boxes. Stealth and Social tests other than Intimidation automatically fail. Claws +3. Bite +1 Aggravated. Regenerate 2 Superficial Health per check. Mundane witnesses suffer Delirium.' },
  { id: 'hispo', name: 'Hispo', checks: 1, summary: '+2 dice to Physical tests except Stealth. −2 dice to Stealth. Communicate with wolves and Garou. Bite +1 Aggravated. Regenerate 1 Superficial Health per check.' },
  { id: 'lupus', name: 'Lupus', checks: 0, summary: 'Wolf form. Contact with silver causes no damage. Communicate with wolves and Garou. The Storyteller may grant +2 dice for tests where wolf form helps.' }
]

export const GAROU_RENOWN = [['glory', 'Glory'], ['honor', 'Honor'], ['wisdom', 'Wisdom']]
export const totalRenownOf = (actor) => GAROU_RENOWN.reduce((sum, [key]) => sum + (Number(actor.system.renown?.[key]?.value) || 0), 0)
export const rageOf = (actor) => Math.max(0, Math.min(5, Number(actor.system.rage?.value) || 0))
export const formOf = (actor) => GAROU_FORMS.find(({ id }) => id === actor.system.activeForm) ?? GAROU_FORMS[0]
export const birthForm = (actor) => actor.getFlag(MODULE_ID, 'birthForm') === 'lupus' ? 'lupus' : 'homid'

function damage(track) {
  return {
    superficial: Number(track?.superficial) || 0,
    aggravated: Number(track?.aggravated) || 0
  }
}

export function garouHealth(actor) {
  const health = actor.system.health ?? {}
  const base = damage(health)
  if (formOf(actor).id !== 'crinos') return { ...base, max: health.max ?? 0 }
  const extra = damage(actor.system.crinosHealth)
  return { max: (health.max ?? 0) + 4, superficial: base.superficial + extra.superficial, aggravated: base.aggravated + extra.aggravated }
}

function writeDamage(key, { superficial, aggravated }) {
  return { ['system.' + key + '.superficial']: superficial, ['system.' + key + '.aggravated']: aggravated }
}

export function fitGarouDamage({ superficial, aggravated }, max) {
  const overflow = Math.max(0, superficial + aggravated - max)
  const severe = Math.min(max, aggravated + overflow)
  return { aggravated: severe, superficial: Math.min(superficial, max - severe) }
}

export function garouHealthUpdate(actor, next, leavingCrinos = false) {
  if (formOf(actor).id !== 'crinos') return writeDamage('health', next)
  const capacity = actor.system.health?.max ?? 0
  if (leavingCrinos) {
    return { ...writeDamage('health', fitGarouDamage(next, capacity)), ...writeDamage('crinosHealth', { superficial: 0, aggravated: 0 }) }
  }
  const base = { aggravated: Math.min(next.aggravated, capacity) }
  base.superficial = Math.min(next.superficial, capacity - base.aggravated)
  return {
    ...writeDamage('health', base),
    ...writeDamage('crinosHealth', { aggravated: next.aggravated - base.aggravated, superficial: next.superficial - base.superficial })
  }
}

export function garouStateUpdate(actor, { rage = rageOf(actor), form = formOf(actor).id, frenzy = Boolean(actor.system.frenzyActive) }) {
  const leavingCrinos = formOf(actor).id === 'crinos' && form !== 'crinos'
  return {
    ...(leavingCrinos ? {
      ...garouHealthUpdate(actor, garouHealth(actor), true)
    } : {}),
    'system.activeForm': form,
    'system.rage.value': rage,
    'system.lostTheWolf': rage === 0,
    'system.frenzyActive': frenzy
  }
}

export function setRage(actor, value, changes = {}) {
  return actor.update({ ...garouStateUpdate(actor, value === 0
    ? { rage: 0, form: formOf(actor).checks ? birthForm(actor) : formOf(actor).id, frenzy: false }
    : { rage: value }), ...changes })
}

export function addWillpowerDamage(actor, points = 1) {
  const willpower = actor.system.willpower ?? {}
  const current = damage(willpower)
  return writeDamage('willpower', fitGarouDamage({ ...current, superficial: current.superficial + points }, willpower.max ?? 0))
}

export function formModifiers(actor, slots, mundaneSocial = true) {
  const form = formOf(actor)
  const attributes = slots.filter((slot) => slot?.kind === 'attribute').map(({ id }) => id)
  const physical = attributes.some((id) => ['strength', 'dexterity', 'stamina'].includes(id))
  const social = attributes.some((id) => ['charisma', 'manipulation', 'composure'].includes(id))
  const stealth = slots.some((slot) => slot?.kind === 'skill' && slot.id === 'stealth')
  const intimidation = slots.some((slot) => slot?.kind === 'skill' && slot.id === 'intimidation')
  const blocked = form.id === 'crinos' && (stealth || (social && !intimidation))
  const parts = []
  if (physical && ['glabro', 'crinos', 'hispo'].includes(form.id) && !(form.id === 'hispo' && stealth)) {
    parts.push({ label: form.name, value: form.id === 'crinos' ? 4 : 2 })
  }
  if ((form.id === 'hispo' && stealth) || (form.id === 'glabro' && social && !intimidation && mundaneSocial)) {
    parts.push({ label: form.name, value: -2 })
  }
  return { parts, blocked, socialTarget: form.id === 'glabro' && social && !intimidation }
}
