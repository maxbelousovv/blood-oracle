import { MODULE_ID } from '../../constants.js'
import { getAttributeGroups, getSkillGroups } from '../traits.js'
import { findCreed } from '../rules/creeds.js'
import { findDrive } from '../rules/drives.js'
import { HUNTER_EDGES } from '../rules/hunter-edges.js'
import { availablePerks, edgeOptions, edgePoolsComplete, hunterEdgePoolItems, perkData } from '../schema/hunter-edges.js'
import { dotsRange, featureDataFromEntry } from '../schema/advantages.js'
import { LORESHEET_BY_ID, loresheetLevelData, loresheetsFor } from '../schema/loresheets.js'
import { specialtyBonus } from '../schema/specialties.js'
import { advantageSpend, attributeValue, stepProblem } from './draft.js'
import { BASE_ADVANTAGES, BASE_FLAWS, REQUIRED_SPECIALTY_SKILLS } from './rules.js'

export const HUNTER_STEPS = [
  { id: 'hunter-basics', label: 'Character' },
  { id: 'hunter-drive', label: 'Creed & Drive' },
  { id: 'attributes', label: 'Attributes' },
  { id: 'skills', label: 'Skills' },
  { id: 'specialties', label: 'Specialties' },
  { id: 'merits', label: 'Merits & flaws' },
  { id: 'hunter-edges', label: 'Edges & Perks' },
  { id: 'hunter-review', label: 'Review' }
]

export const HUNTER_ALLOWANCE = { advantages: BASE_ADVANTAGES, flaws: BASE_FLAWS }

const itemMarker = (item) => item.getFlag?.(MODULE_ID, 'hunterChargenItem')

export function isBlankHunter(actor, retry = false) {
  const itemTypes = ['creed', 'drive', 'perk', 'edgepool', 'feature']
  return !actor.items.some((item) => itemTypes.includes(item.type) && !(retry && itemMarker(item))) &&
    !Object.entries(actor.system.edges ?? {}).some(([id, edge]) => edge.visible &&
      !(retry && actor.items.some((item) => itemMarker(item) && item.type === 'perk' && item.system.edge === id))) &&
    !Object.values(actor.system.attributes ?? {}).some((entry) => Number(entry.value) > 1) &&
    !Object.values(actor.system.skills ?? {}).some((entry) => Number(entry.value) > 0)
}

export function hunterEdgeOptions(actor) {
  const startingEdges = { ...actor.system.edges }
  // The system can derive visibility from embedded Perks created in an earlier attempt.
  for (const item of actor.items) {
    if (itemMarker(item) && item.type === 'perk') delete startingEdges[item.system.edge]
  }
  return edgeOptions({ system: { edges: startingEdges } }).filter(({ value }) => Object.hasOwn(HUNTER_EDGES, value))
}

export function hunterStepProblem(actor, draft, step) {
  if (step === 'hunter-basics') {
    if (['name', 'concept', 'ambition', 'desire'].some((key) => !draft.basics[key]?.trim())) return 'Fill in Name, Concept, Ambition and Desire.'
    if (!draft.touchstones.length || draft.touchstones.length > 3 || draft.touchstones.some((entry) => !entry.touchstone.trim())) return 'Name one to three Touchstones.'
  }
  if (step === 'hunter-drive' && (!findCreed(draft.creed) || !findDrive(draft.drive))) return 'Choose both a Creed and a Drive.'
  if (step === 'specialties') {
    const shared = stepProblem(draft, step)
    if (shared) return shared
    const { skill, text } = draft.specialties.free
    const required = draft.specialties.required[skill]?.trim()
    if (required && required.toLowerCase() === text.trim().toLowerCase()) return 'Choose a different Specialty for the free pick.'
    if (required && skill !== 'craft' && draft.skills[skill] < 2) return 'That skill has no room for a second Specialty.'
  }
  if (step === 'merits') {
    const spent = advantageSpend(draft)
    if (spent.advantages !== HUNTER_ALLOWANCE.advantages || spent.flaws !== HUNTER_ALLOWANCE.flaws) return 'Spend 7 Advantage dots and take 2 Flaw dots.'
    if (draft.advantages.some(({ entry, dots }) => {
      const range = dotsRange(entry.dots)
      return !Number.isInteger(dots) || dots < Math.max(range.min, 1) || dots > range.max
    })) return 'An Advantage or Flaw has an invalid rating.'
    const catalog = loresheetsFor(actor)
    if (draft.loresheets.some(({ id, level }) => !catalog.some((entry) => entry.id === id) || !Number.isInteger(level) || level < 1 || level > 5)) return 'Choose a valid Loresheet level.'
  }
  if (step === 'hunter-edges') {
    const options = hunterEdgeOptions(actor)
    if (![1, 2].includes(draft.edges.length) || draft.perks.length !== 3 - draft.edges.length) return 'Choose 2 Edges and 1 Perk, or 1 Edge and 2 Perks.'
    if (new Set(draft.edges).size !== draft.edges.length || draft.edges.some((edge) => !options.some(({ value }) => value === edge))) return 'One of the selected Edges is unavailable.'
    for (const [index, pick] of draft.perks.entries()) {
      if (!draft.edges.includes(pick.edge) || !availablePerks({ items: [] }, pick.edge, draft.perks.slice(0, index)).some(([name]) => name === pick.name)) return 'Choose available Perks from your Edges.'
    }
    for (const edge of draft.edges) {
      if (!edgePoolsComplete(edge, draft.edgePools[edge])) return 'Choose the dice pools for your Edges.'
    }
  }
  return ['attributes', 'skills'].includes(step) ? stepProblem(draft, step) : ''
}

export async function finishHunter(actor, draft) {
  if (actor.getFlag(MODULE_ID, 'chargenDone') || !isBlankHunter(actor, true)) throw new Error('Hunter already has character data')
  for (const { id } of HUNTER_STEPS) {
    const problem = hunterStepProblem(actor, draft, id)
    if (problem) throw new Error(problem)
  }
  const creed = findCreed(draft.creed)
  const drive = findDrive(draft.drive)
  const items = [
    { name: creed.name, type: 'creed', system: { desperationFields: creed.field } },
    { name: drive.name, type: 'drive', system: { redemption: drive.redemption } },
    ...draft.advantages.map(({ entry, dots }) => featureDataFromEntry({ entry, points: dots })),
    ...draft.loresheets.map(({ id, level }) => loresheetLevelData(LORESHEET_BY_ID[id], level)),
    ...draft.perks.map(({ edge, name }) => perkData(edge, name))
  ]
  const options = hunterEdgeOptions(actor)
  for (const edge of draft.edges) {
    const label = options.find(({ value }) => value === edge).label
    items.push(...hunterEdgePoolItems(edge, label, draft.edgePools[edge]))
  }

  // The native data model stores embedded items separately from the actor.
  // Recognize completed item writes when Finish is retried after an error.
  const pending = actor.items.filter(itemMarker)
  const existing = new Map(pending.map((item) => [itemMarker(item), item]))
  const missing = []
  for (const [index, data] of items.entries()) {
    const key = String(index)
    const item = existing.get(key)
    data.flags ??= {}
    data.flags[MODULE_ID] = { ...data.flags[MODULE_ID], hunterChargenItem: key }
    if (item?.type === data.type) {
      await item.update({ name: data.name, system: data.system, flags: data.flags })
      existing.delete(key)
    } else {
      missing.push(data)
    }
  }
  if (existing.size) await actor.deleteEmbeddedDocuments('Item', [...existing.values()].map(({ id }) => id))
  if (missing.length) {
    const created = await actor.createEmbeddedDocuments('Item', missing)
    if (created.length !== missing.length) throw new Error('Some starting items could not be created')
  }

  const update = { name: draft.basics.name.trim() }
  for (const field of ['concept', 'ambition', 'desire']) update['system.headers.' + field] = draft.basics[field].trim()
  for (const group of getAttributeGroups()) {
    for (const entry of group.entries) update[entry.path] = attributeValue(draft, entry.id)
  }
  for (const group of getSkillGroups()) {
    for (const entry of group.entries) update[entry.path] = draft.skills[entry.id] ?? 0
  }
  const addBonus = (skill, text) => {
    const path = 'system.skills.' + skill + '.bonuses'
    update[path] ??= [...(actor.system.skills?.[skill]?.bonuses ?? [])]
    if (!update[path].some((bonus) => bonus.source === text.trim())) update[path].push(specialtyBonus(skill, text.trim()))
  }
  for (const skill of REQUIRED_SPECIALTY_SKILLS) {
    if (draft.skills[skill] > 0) addBonus(skill, draft.specialties.required[skill])
  }
  addBonus(draft.specialties.free.skill, draft.specialties.free.text)
  for (const edge of draft.edges) update['system.edges.' + edge + '.visible'] = true
  update['system.health.max'] = attributeValue(draft, 'stamina') + 3
  update['system.willpower.max'] = attributeValue(draft, 'composure') + attributeValue(draft, 'resolve')
  update['flags.' + MODULE_ID + '.hunterTouchstones'] = draft.touchstones.map(({ touchstone, portrait }) => ({ touchstone: touchstone.trim(), portrait }))
  update['flags.' + MODULE_ID + '.chargenDone'] = true
  update['flags.' + MODULE_ID + '.-=chargenDraft'] = null
  await actor.update(update)
}
