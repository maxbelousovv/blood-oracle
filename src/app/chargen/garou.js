import { MODULE_ID } from '../../constants.js'
import { AUSPICES, TRIBES, garouIdentityData } from '../rules/garou-identity.js'
import { dotsRange, featureDataFromEntry } from '../schema/advantages.js'
import { buildGarouChoiceData, GAROU_POWER_SLOTS, powerChoiceProblem } from '../schema/garou-advancement.js'
import { LORESHEET_BY_ID, loresheetsFor, loresheetLevelData } from '../schema/loresheets.js'
import { specialtyBonus } from '../schema/specialties.js'
import { getAttributeGroups, getSkillGroups } from '../traits.js'
import { advantageSpend, attributeValue, stepProblem } from './draft.js'
import { REQUIRED_SPECIALTY_SKILLS, BASE_ADVANTAGES, BASE_FLAWS } from './rules.js'
import { GAROU_RENOWN } from '../schema/werewolf.js'

export const GAROU_STEPS = [
  { id: 'garou-basics', label: 'Character' },
  { id: 'garou-identity', label: 'Auspice, Tribe & Renown' },
  { id: 'attributes', label: 'Attributes' },
  { id: 'skills', label: 'Skills' },
  { id: 'specialties', label: 'Specialties' },
  { id: 'merits', label: 'Merits & Flaws' },
  { id: 'garou-powers', label: 'Gifts & Rites' },
  { id: 'garou-review', label: 'Review' }
]
export const GAROU_ALLOWANCE = { advantages: BASE_ADVANTAGES, flaws: BASE_FLAWS }

export const draftGarouIdentities = (draft) => ({
  auspice: AUSPICES.find(({ id }) => id === draft.auspice),
  tribe: TRIBES.find(({ id }) => id === draft.tribe)
})

const itemMarker = (item) => item.getFlag?.(MODULE_ID, 'garouChargenItem')

export function isBlankGarou(actor, retry = false) {
  return !actor.items.some((item) => ['auspice', 'tribe', 'gift', 'feature'].includes(item.type) && !(retry && itemMarker(item))) &&
    !Object.values(actor.system.attributes ?? {}).some(({ value }) => Number(value) > 1) &&
    !Object.values(actor.system.skills ?? {}).some(({ value }) => Number(value) > 0) &&
    !Object.values(actor.system.renown ?? {}).some(({ value }) => Number(value) > 1)
}

export function garouStepProblem(draft, step) {
  if (step === 'garou-basics') {
    if (!draft.basics.name?.trim() || !draft.basics.concept?.trim()) return 'Fill in Name and Concept.'
    if (draft.touchstones.length < 1 || draft.touchstones.length > 3 || draft.touchstones.some((text) => !text.trim())) return 'Name one to three Touchstones.'
    if (!['homid', 'lupus'].includes(draft.birthForm)) return 'Choose a birth form.'
  }
  if (step === 'garou-identity' || step === 'garou-powers') {
    const identities = draftGarouIdentities(draft)
    if (!identities.auspice || !identities.tribe) return 'Choose an Auspice and Tribe.'
    if (!GAROU_RENOWN.some(([key]) => key === draft.otherRenown) || identities.tribe.renown.toLowerCase() === draft.otherRenown) return 'Assign the third dot to a different Renown.'
    if (step === 'garou-powers') {
      const picks = Object.values(draft.garouPicks).filter(Boolean)
      for (const { id, label } of GAROU_POWER_SLOTS) {
        if (draft.garouPicks[id]?.slot !== id) return 'Choose a ' + label + '.'
        const problem = powerChoiceProblem({
          pick: draft.garouPicks[id], identities, renown: 3,
          others: picks.filter((pick) => pick.slot !== id)
        })
        if (problem) return label + ' · ' + problem
      }
    }
  }
  if (step === 'merits') {
    const spent = advantageSpend(draft)
    if (spent.advantages !== GAROU_ALLOWANCE.advantages || spent.flaws !== GAROU_ALLOWANCE.flaws) return 'Spend 7 Advantage dots and take 2 Flaw dots.'
    if (draft.advantages.some(({ entry, dots }) => {
      const range = dotsRange(entry.dots)
      return !Number.isInteger(dots) || dots < Math.max(range.min, 1) || dots > Math.min(range.max, 6)
    })) return 'Choose valid Werewolf Advantages and Flaws.'
    const catalog = loresheetsFor({ type: 'werewolf' })
    if (draft.loresheets.some(({ id, level }) => !catalog.some((entry) => entry.id === id) || !Number.isInteger(level) || level < 1 || level > 5)) return 'Choose a valid Werewolf Loresheet level.'
  }
  if (step === 'specialties') {
    const { skill, text } = draft.specialties.free
    const required = draft.specialties.required[skill]?.trim()
    if (required && required.toLowerCase() === text.trim().toLowerCase()) return 'Choose a different free Specialty.'
    if (required && skill !== 'craft' && draft.skills[skill] < 2) return 'Choose a skill with room for another Specialty.'
  }
  return ['attributes', 'skills', 'specialties'].includes(step) ? stepProblem(draft, step) : ''
}

export async function finishGarou(actor, draft) {
  if (actor.getFlag(MODULE_ID, 'chargenDone') || !isBlankGarou(actor, true)) throw new Error('Werewolf already has character data')
  for (const { id } of GAROU_STEPS) {
    const problem = garouStepProblem(draft, id)
    if (problem) throw new Error(problem)
  }
  const { auspice, tribe } = draftGarouIdentities(draft)
  const documents = [
    { name: auspice.name, type: 'auspice', system: garouIdentityData('auspice', auspice) },
    { name: tribe.name, type: 'tribe', system: garouIdentityData('tribe', tribe) },
    ...Object.values(draft.garouPicks).map((pick) => buildGarouChoiceData(actor, pick)),
    ...draft.advantages.map(({ entry, dots }) => featureDataFromEntry({ entry, points: dots })),
    ...draft.loresheets.map(({ id, level }) => loresheetLevelData(LORESHEET_BY_ID[id], level))
  ]
  const pending = new Map(actor.items.filter(itemMarker).map((item) => [itemMarker(item), item]))
  const missing = []
  for (const [index, data] of documents.entries()) {
    const key = String(index)
    const existing = pending.get(key)
    data.flags ??= {}
    data.flags[MODULE_ID] = { ...data.flags[MODULE_ID], garouChargenItem: key }
    if (existing?.type === data.type) {
      await existing.update({ name: data.name, system: data.system, flags: data.flags })
      pending.delete(key)
    } else missing.push(data)
  }
  if (pending.size) await actor.deleteEmbeddedDocuments('Item', [...pending.values()].map(({ id }) => id))
  if (missing.length) {
    const created = await actor.createEmbeddedDocuments('Item', missing)
    if (created.length !== missing.length) throw new Error('Some starting items could not be created')
  }
  const update = {
    name: draft.basics.name.trim(),
    'system.headers.concept': draft.basics.concept.trim(),
    'system.headers.chronicle': draft.basics.chronicle?.trim() || '',
    ['flags.' + MODULE_ID + '.garouTouchstones']: draft.touchstones.map((text) => ({
      id: foundry.utils.randomID(), touchstone: text.trim(), portrait: ''
    })),
    'system.activeForm': draft.birthForm,
    'system.rage.value': 1,
    'system.balance.harano.value': 0,
    'system.balance.hauglosk.value': 0,
    'system.health.max': attributeValue(draft, 'stamina') + 3,
    'system.willpower.max': attributeValue(draft, 'composure') + attributeValue(draft, 'resolve'),
    ['flags.' + MODULE_ID + '.birthForm']: draft.birthForm,
    ['flags.' + MODULE_ID + '.chargenDone']: true,
    ['flags.' + MODULE_ID + '.-=chargenDraft']: null
  }
  if (draft.basics.portrait) update.img = draft.basics.portrait
  for (const group of getAttributeGroups()) {
    for (const entry of group.entries) update[entry.path] = attributeValue(draft, entry.id)
  }
  for (const group of getSkillGroups()) {
    for (const entry of group.entries) update[entry.path] = draft.skills[entry.id] ?? 0
  }
  const specialties = Object.fromEntries(REQUIRED_SPECIALTY_SKILLS
    .filter((skill) => draft.skills[skill] > 0)
    .map((skill) => [skill, [draft.specialties.required[skill].trim()]]))
  const { skill, text } = draft.specialties.free
  specialties[skill] ??= []
  specialties[skill].push(text.trim())
  for (const [id, names] of Object.entries(specialties)) {
    update['system.skills.' + id + '.bonuses'] = [
      ...(actor.system.skills?.[id]?.bonuses ?? []),
      ...names.map((name) => specialtyBonus(id, name))
    ]
  }
  for (const [key] of GAROU_RENOWN) {
    update['system.renown.' + key + '.value'] = key === tribe.renown.toLowerCase() ? 2 : key === draft.otherRenown ? 1 : 0
  }
  await actor.update(update)
}
