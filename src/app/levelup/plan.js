import { availablePerks, EDGE_COST, edgeOptions, edgePoolsComplete, hunterEdgePoolItems, PERK_COST, perkData } from '../schema/hunter-edges.js'
import { getAttributeGroups, getSkillGroups, readTrait } from '../traits.js'
import { entriesForDiscipline, bloodPotencyRange } from '../rules/catalog.js'
import { disciplineLabel, buildPowerItemData } from '../schema/disciplines.js'
import { addFeature, featureDataFromEntry, readAdvantageMeta, dotsRange, featureTypeFor } from '../schema/advantages.js'
import { addSpecialty, readSpecialties, specialtyBonus, specialtyLimit } from '../schema/specialties.js'
import { isLoresheetItem, takeLevel, LORESHEET_BY_ID, loresheetsFor, loresheetLevelData } from '../schema/loresheets.js'
import { addExperience, experienceTotals } from '../schema/journal.js'
import { GAROU_RENOWN, totalRenownOf } from '../schema/werewolf.js'
import { garouPowerKind } from '../rules/garou-powers.js'
import { buildGarouChoiceData, garouIdentities, giftPurchaseCost, powerChoiceProblem, RITE_XP } from '../schema/garou-advancement.js'
import { groupOf } from '../schema/coterie.js'
import { ADVANTAGE_COST, SPECIALTY_COST, disciplineMultiplier, stepCost } from './costs.js'
import { powersFitDots } from '../chargen/rules.js'

/**
 * What a player means to buy, kept as the targets they set rather than as
 * deltas, so lowering a stepper back to where it was simply removes the line.
 */
export function emptyPlan() {
  return {
    renown: {},
    garouPicks: [],
    attributes: {},
    skills: {},
    specialties: [],
    edges: [],
    edgePools: {},
    perks: [],
    disciplines: {},
    powers: {},
    rituals: [],
    ceremonies: [],
    formulas: [],
    potency: null,
    features: {},
    newFeatures: [],
    loresheets: [],
    coterie: { domain: {}, features: {}, newFeatures: [] }
  }
}

export const ownedPowerNames = (actor, key) =>
  actor.items.filter((item) => item.type === 'power' && item.system.discipline === key).map((item) => item.name)

export const disciplineValue = (actor, key) => Number(actor.system.disciplines?.[key]?.value) || 0

export function potencyCap(actor) {
  const generation = actor.system.headers?.generation || (actor.system.blood?.generation ? `${actor.system.blood.generation}th` : '')
  return bloodPotencyRange(generation)?.[1] ?? 5
}

/** Features a character can raise: backgrounds and merits, not flaws or loresheet levels. */
export const raisableFeatures = (actor) =>
  actor.items.filter(
    (item) => item.type === 'feature' && item.system.featuretype !== 'flaw' && !isLoresheetItem(item)
  )

export const featureMax = (item) => {
  const range = dotsRange(readAdvantageMeta(item).dots)
  return Math.min(Math.max(range.max, Number(item.system.points) || 0), item.parent?.type === 'werewolf' ? 6 : 5)
}

/** Specialties a skill holds now, plus those planned for it. */
export const specialtyCount = (actor, plan, skill) =>
  readSpecialties(actor, skill).length + plan.specialties.filter((entry) => entry.skill === skill).length

export const skillTarget = (actor, plan, entry) => plan.skills[entry.id] ?? readTrait(actor, entry.path)

const FREE_SPECIALTIES = ['academics', 'craft', 'performance', 'science']

function grantsFirstSpecialty(actor, plan, skill) {
  return ['hunter', 'werewolf'].includes(actor.type) && FREE_SPECIALTIES.includes(skill) &&
    Number(actor.system.skills?.[skill]?.value ?? 0) === 0 && plan.skills[skill] > 0 &&
    !readSpecialties(actor, skill).length
}

export function specialtyPrice(actor, plan, pick) {
  const first = plan.specialties.find((entry) => entry.skill === pick.skill && entry.text.trim())
  return first === pick && grantsFirstSpecialty(actor, plan, pick.skill) ? 0 : SPECIALTY_COST
}

const entryLevel = (key, name) => entriesForDiscipline(key).find((entry) => entry.name === name)?.level ?? 0

/**
 * Every line of the purchase with its cost:
 *   [{ label, cost }]
 */
export function planLines(actor, plan) {
  const lines = []
  const traitLines = (groups, targets, multiplier) => {
    for (const group of groups) {
      for (const entry of group.entries) {
        const from = readTrait(actor, entry.path)
        const to = targets[entry.id]
        if (to > from) lines.push({ label: `${entry.label} ${from} → ${to}`, cost: stepCost(from, to, multiplier) })
      }
    }
  }
  traitLines(getAttributeGroups(), plan.attributes, 5)
  traitLines(getSkillGroups(), plan.skills, 3)

  for (const entry of plan.specialties) {
    if (entry.skill && entry.text.trim()) lines.push({ label: `Specialty: ${entry.text.trim()}`, cost: specialtyPrice(actor, plan, entry) })
  }

  if (actor.type === 'hunter') {
    const options = edgeOptions(actor)
    for (const id of plan.edges) lines.push({ label: 'Edge: ' + (options.find(({ value }) => value === id)?.label ?? id), cost: EDGE_COST })
    for (const perk of plan.perks) lines.push({ label: 'Perk: ' + perk.name, cost: PERK_COST })
  }

  if (actor.type === 'werewolf') {
    for (const [id, label] of GAROU_RENOWN) {
      const from = Number(actor.system.renown?.[id]?.value) || 0
      const to = plan.renown[id] ?? from
      if (to > from) lines.push({ label: label + ' ' + from + ' → ' + to, cost: stepCost(from, to, 5) })
    }
    const known = actor.items.filter((item) => garouPowerKind(item) === 'gift').length
    let giftIndex = 0
    for (const pick of plan.garouPicks) {
      lines.push({ label: pick.name, cost: pick.slot === 'rite' ? RITE_XP : giftPurchaseCost(known, giftIndex++) })
    }
  }

  for (const [key, to] of Object.entries(plan.disciplines)) {
    const from = disciplineValue(actor, key)
    if (to > from) {
      lines.push({ label: `${disciplineLabel(key)} ${from} → ${to}`, cost: stepCost(from, to, disciplineMultiplier(actor, key)) })
    }
  }
  for (const [key, names] of Object.entries(plan.powers)) {
    for (const name of names) lines.push({ label: `${disciplineLabel(key)} power: ${name}`, cost: 0 })
  }

  const perLevel = (key, names, title) => {
    for (const name of names) {
      const level = entryLevel(key, name)
      lines.push({ label: `${title}: ${name} (level ${level})`, cost: level * 3 })
    }
  }
  perLevel('rituals', plan.rituals, 'Ritual')
  perLevel('ceremonies', plan.ceremonies, 'Ceremony')
  perLevel('alchemy', plan.formulas, 'Formula')

  const potency = Number(actor.system.blood?.potency) || 0
  if (plan.potency > potency) lines.push({ label: `Blood Potency ${potency} → ${plan.potency}`, cost: stepCost(potency, plan.potency, 10) })

  for (const [id, to] of Object.entries(plan.features)) {
    const item = actor.items.get(id)
    const from = Number(item?.system.points) || 0
    if (item && to > from) lines.push({ label: `${item.name} ${from} → ${to}`, cost: (to - from) * ADVANTAGE_COST })
  }
  for (const pick of plan.newFeatures) lines.push({ label: `${pick.entry.name} ${'●'.repeat(pick.dots)}`, cost: pick.dots * ADVANTAGE_COST })
  for (const pick of plan.loresheets) {
    const entry = LORESHEET_BY_ID[pick.id]
    lines.push({ label: `Loresheet: ${entry?.levels?.[pick.level - 1] ?? pick.id} (${'●'.repeat(pick.level)})`, cost: pick.level * ADVANTAGE_COST })
  }

  const group = groupOf(actor)
  if (group && actor.type !== 'werewolf') {
    for (const [key, to] of Object.entries(plan.coterie.domain)) {
      const from = Number(group.system?.[key]?.value) || 0
      if (to > from) lines.push({ label: `Coterie ${key.charAt(0).toUpperCase() + key.slice(1)} ${from} → ${to}`, cost: (to - from) * ADVANTAGE_COST })
    }
    for (const [id, to] of Object.entries(plan.coterie.features)) {
      const item = group.items.get(id)
      const from = Number(item?.system.points) || 0
      if (item && to > from) lines.push({ label: `Coterie ${item.name} ${from} → ${to}`, cost: (to - from) * ADVANTAGE_COST })
    }
    for (const pick of plan.coterie.newFeatures) {
      lines.push({ label: `Coterie ${pick.entry.name} ${'●'.repeat(pick.dots)}`, cost: pick.dots * ADVANTAGE_COST })
    }
  }

  return lines
}

export const planTotal = (lines) => lines.reduce((sum, line) => sum + line.cost, 0)

/** Why the plan cannot be bought yet — powers missing for new dots — or ''. */
export function planProblem(actor, plan) {
  for (const [id, to] of Object.entries(plan.features)) {
    const item = actor.items.get(id)
    if (!item) continue
    const from = Number(item.system.points) || 0
    const { min } = dotsRange(readAdvantageMeta(item).dots)
    if (to > from && (!Number.isInteger(to) || to < min || to > featureMax(item))) {
      return 'Invalid purchase rating for ' + item.name + '.'
    }
  }
  if (actor.type === 'werewolf') {
    const identities = garouIdentities(actor)
    const renown = totalRenownOf(actor) + GAROU_RENOWN.reduce((sum, [id]) => {
      const from = Number(actor.system.renown?.[id]?.value) || 0
      return sum + Math.max(0, (plan.renown[id] ?? from) - from)
    }, 0)
    for (const [id, to] of Object.entries(plan.renown)) {
      const from = Number(actor.system.renown?.[id]?.value) || 0
      if (!GAROU_RENOWN.some(([key]) => key === id) || !Number.isInteger(to) || to < from || to > 5) return 'Invalid Renown rating.'
    }
    for (const [index, pick] of plan.garouPicks.entries()) {
      const problem = powerChoiceProblem({ pick, identities, renown, items: actor.items, others: plan.garouPicks.slice(0, index) })
      if (problem) return pick.name + ' · ' + problem
    }
    const ownedLore = actor.items.map((item) => item.getFlag?.('blood-oracle', 'loresheet')).filter(Boolean)
    const catalog = loresheetsFor(actor)
    if (plan.loresheets.some(({ id, level }, index) => !catalog.some((entry) => entry.id === id) ||
      !Number.isInteger(level) || level < 1 || level > 5 || [...ownedLore, ...plan.loresheets.slice(0, index)].some((pick) => pick.id === id && pick.level === level))) {
      return 'A Loresheet level is already owned or unavailable.'
    }
    if (planTotal(planLines(actor, plan)) > experienceTotals(actor).remaining) return 'The purchase exceeds available XP.'
  }
  if (actor.type === 'hunter') {
    const options = edgeOptions(actor)
    if (plan.edges.some((id) => !options.some(({ value }) => value === id))) return 'An Edge in this plan is already owned or unavailable.'
    const missingPool = options.find(({ value }) => plan.edges.includes(value) && !edgePoolsComplete(value, plan.edgePools[value]))
    if (missingPool) return 'Choose the dice pool for ' + missingPool.label + '.'
    for (const [index, pick] of plan.perks.entries()) {
      if (!actor.system.edges?.[pick.edge]?.visible && !plan.edges.includes(pick.edge)) return 'A Perk needs its Edge.'
      if (!pick.name.trim()) return 'Every new Perk needs a name.'
      if (!pick.custom && !availablePerks(actor, pick.edge, plan.perks.slice(0, index)).some(([name]) => name === pick.name)) return 'A Perk in this plan is already owned or unavailable.'
    }
  }
  for (const [key, to] of Object.entries(plan.disciplines)) {
    if (key === 'alchemy') continue
    const need = Math.max(0, to - disciplineValue(actor, key))
    if (need && entriesForDiscipline(key).length && (plan.powers[key] ?? []).length !== need) {
      return `Choose ${need} ${need === 1 ? 'power' : 'powers'} for ${disciplineLabel(key)}.`
    }
    const levels = (plan.powers[key] ?? []).map((name) => entryLevel(key, name))
    if (need && !powersFitDots(levels, disciplineValue(actor, key))) {
      return `Each new ${disciplineLabel(key)} dot takes a power of its own level or lower.`
    }
  }
  const skills = getSkillGroups().flatMap((group) => group.entries)
  const namesBySkill = new Map()
  for (const pick of plan.specialties) {
    const skill = skills.find(({ id }) => id === pick.skill)
    const name = pick.text.trim().toLowerCase()
    if (!skill || !name) return 'Every new specialty needs a skill and a name.'
    const names = namesBySkill.get(skill.id) ?? readSpecialties(actor, skill.id).map(({ text }) => text.toLowerCase())
    if (names.includes(name)) return 'That specialty is already on ' + skill.label + ' or in this purchase.'
    if (names.length >= specialtyLimit(actor, skill.id, skillTarget(actor, plan, skill))) return skill.label + ' cannot hold another specialty at this rating.'
    namesBySkill.set(skill.id, [...names, name])
  }
  const missingFree = skills.find(({ id }) => grantsFirstSpecialty(actor, plan, id) && !namesBySkill.has(id))
  if (missingFree) return 'Choose the free ' + missingFree.label + ' specialty before spending.'
  return ''
}

const powerItem = (key, name) => {
  const entry = entriesForDiscipline(key).find((candidate) => candidate.name === name)
  return entry ? buildPowerItemData({ rawName: entry.originalName || entry.name, disciplineKey: key, level: entry.level, rules: entry }) : null
}

/** Buy it all, then record one entry in the experience journal. */
export async function applyPlan(actor, plan) {
  const problem = planProblem(actor, plan)
  if (problem) throw new Error(problem)
  const lines = planLines(actor, plan)
  const total = planTotal(lines)

  const update = {}
  const newEdges = actor.type === 'hunter' ? edgeOptions(actor).filter(({ value }) => plan.edges.includes(value)) : []
  for (const group of getAttributeGroups()) {
    for (const entry of group.entries) if (plan.attributes[entry.id] > readTrait(actor, entry.path)) update[entry.path] = plan.attributes[entry.id]
  }
  for (const group of getSkillGroups()) {
    for (const entry of group.entries) if (plan.skills[entry.id] > readTrait(actor, entry.path)) update[entry.path] = plan.skills[entry.id]
  }
  for (const [key, to] of Object.entries(plan.disciplines)) {
    if (to > disciplineValue(actor, key)) update[`system.disciplines.${key}.value`] = to
  }
  const potency = Number(actor.system.blood?.potency) || 0
  if (plan.potency > potency) update['system.blood.potency'] = plan.potency
  const raises = Object.entries(plan.features)
    .filter(([id, to]) => to > (Number(actor.items.get(id)?.system.points) || 0))
    .map(([id, to]) => ({ _id: id, 'system.points': to }))
  if (actor.type === 'werewolf') return applyGarouPurchase(actor, plan, { update, raises, lines, total })
  if (Object.keys(update).length) await actor.update(update)
  if (raises.length) await actor.updateEmbeddedDocuments('Item', raises)

  const items = []
  for (const [key, names] of Object.entries(plan.powers)) for (const name of names) items.push(powerItem(key, name))
  for (const name of plan.rituals) items.push(powerItem('rituals', name))
  for (const name of plan.ceremonies) items.push(powerItem('ceremonies', name))
  for (const name of plan.formulas) items.push(powerItem('alchemy', name))
  const valid = items.filter(Boolean)
  if (valid.length) await actor.createEmbeddedDocuments('Item', valid)

  for (const entry of plan.specialties) {
    if (entry.skill && entry.text.trim()) await addSpecialty(actor, entry.skill, entry.text)
  }

  for (const pick of plan.newFeatures) {
    const created = await addFeature(actor, { entry: pick.entry })
    if (created && Number(created.system.points) !== pick.dots) await created.update({ 'system.points': pick.dots })
  }
  for (const pick of plan.loresheets) {
    const entry = LORESHEET_BY_ID[pick.id]
    if (entry) await takeLevel(actor, entry, pick.level)
  }

  const group = groupOf(actor)
  if (group?.isOwner) {
    const domain = {}
    for (const [key, to] of Object.entries(plan.coterie.domain)) {
      if (to > (Number(group.system?.[key]?.value) || 0)) domain[`system.${key}.value`] = to
    }
    if (Object.keys(domain).length) await group.update(domain)
    const groupRaises = Object.entries(plan.coterie.features)
      .filter(([id, to]) => to > (Number(group.items.get(id)?.system.points) || 0))
      .map(([id, to]) => ({ _id: id, 'system.points': to }))
    if (groupRaises.length) await group.updateEmbeddedDocuments('Item', groupRaises)
    for (const pick of plan.coterie.newFeatures) {
      const created = await addFeature(group, { entry: pick.entry })
      if (created && Number(created.system.points) !== pick.dots) await created.update({ 'system.points': pick.dots })
    }
  }

  if (total > 0) {
    const summary = lines.filter((line) => line.cost > 0).map((line) => line.label).join(', ')
    const purchase = { name: summary || 'Experience spent', amount: total, spend: true }
    if (actor.type !== 'hunter') {
      await addExperience(actor, purchase)
      return
    }

    const hunterItems = plan.perks.map(({ edge, name }) => perkData(edge, name))
    for (const { value, label } of newEdges) {
      hunterItems.push(...hunterEdgePoolItems(value, label, plan.edgePools[value]))
    }
    const created = hunterItems.length ? await actor.createEmbeddedDocuments('Item', hunterItems) : []
    try {
      if (created.length !== hunterItems.length) throw new Error('Could not create all Hunter purchase items')
      const changes = Object.fromEntries(newEdges.map(({ value }) => ['system.edges.' + value + '.visible', true]))
      await addExperience(actor, purchase, changes)
    } catch (error) {
      if (created.length) await actor.deleteEmbeddedDocuments('Item', created.map(({ id }) => id))
      throw error
    }
  }
}

const activeGarouPurchases = new Set()

async function applyGarouPurchase(actor, plan, { update, raises, lines, total }) {
  const key = actor.uuid ?? actor.id
  if (activeGarouPurchases.has(key)) throw new Error('A purchase is already in progress.')
  if (!total) return
  activeGarouPurchases.add(key)
  const created = []
  const originalRatings = raises.map(({ _id }) => ({ _id, 'system.points': actor.items.get(_id).system.points }))
  let attemptedRaises = false
  try {
    for (const [id, value] of Object.entries(plan.renown)) update['system.renown.' + id + '.value'] = value
    for (const { skill, text } of plan.specialties) {
      const path = 'system.skills.' + skill + '.bonuses'
      update[path] ??= [...(actor.system.skills?.[skill]?.bonuses ?? [])]
      update[path].push(specialtyBonus(skill, text.trim()))
    }
    const documents = [
      ...plan.garouPicks.map((pick) => buildGarouChoiceData(actor, pick)),
      ...plan.newFeatures.map(({ entry, dots }) => featureDataFromEntry({ entry, points: dots })),
      ...plan.loresheets.map(({ id, level }) => loresheetLevelData(LORESHEET_BY_ID[id], level))
    ]
    if (documents.length) {
      created.push(...await actor.createEmbeddedDocuments('Item', documents))
      if (created.length !== documents.length) throw new Error('Could not create all Werewolf purchase items.')
    }
    if (raises.length) {
      attemptedRaises = true
      await actor.updateEmbeddedDocuments('Item', raises)
    }
    if (total > experienceTotals(actor).remaining) throw new Error('The XP balance changed while spending.')
    await addExperience(actor, { name: lines.map(({ label }) => label).join(', '), amount: total, spend: true }, update)
  } catch (error) {
    if (attemptedRaises) await actor.updateEmbeddedDocuments('Item', originalRatings)
    if (created.length) await actor.deleteEmbeddedDocuments('Item', created.map(({ id }) => id))
    throw error
  } finally {
    activeGarouPurchases.delete(key)
  }
}

export { featureTypeFor }
