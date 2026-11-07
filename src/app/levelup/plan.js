import { getAttributeGroups, getSkillGroups, readTrait } from '../traits.js'
import { entriesForDiscipline, bloodPotencyRange } from '../rules/catalog.js'
import { disciplineLabel, buildPowerItemData } from '../schema/disciplines.js'
import { addFeature, readAdvantageMeta, dotsRange, featureTypeFor } from '../schema/advantages.js'
import { addSpecialty, readSpecialties } from '../schema/specialties.js'
import { isLoresheetItem, takeLevel, LORESHEET_BY_ID } from '../schema/loresheets.js'
import { addExperience } from '../schema/journal.js'
import { groupOf } from '../schema/coterie.js'
import { ADVANTAGE_COST, SPECIALTY_COST, disciplineMultiplier, stepCost } from './costs.js'
import { powersFitDots } from '../chargen/rules.js'

/**
 * What a player means to buy, kept as the targets they set rather than as
 * deltas, so lowering a stepper back to where it was simply removes the line.
 */
export function emptyPlan() {
  return {
    attributes: {},
    skills: {},
    specialties: [],
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
  return Math.min(Math.max(range.max, Number(item.system.points) || 0), 5)
}

/** Specialties a skill holds now, plus those planned for it. */
export const specialtyCount = (actor, plan, skill) =>
  readSpecialties(actor, skill).length + plan.specialties.filter((entry) => entry.skill === skill).length

export const skillTarget = (actor, plan, entry) => plan.skills[entry.id] ?? readTrait(actor, entry.path)

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
    if (entry.skill && entry.text.trim()) lines.push({ label: `Specialty: ${entry.text.trim()}`, cost: SPECIALTY_COST })
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
  if (group) {
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
  if (plan.specialties.some((entry) => !entry.skill || !entry.text.trim())) return 'Every new specialty needs a skill and a name.'
  return ''
}

const powerItem = (key, name) => {
  const entry = entriesForDiscipline(key).find((candidate) => candidate.name === name)
  return entry ? buildPowerItemData({ rawName: entry.originalName || entry.name, disciplineKey: key, level: entry.level, rules: entry }) : null
}

/** Buy it all, then record one entry in the experience journal. */
export async function applyPlan(actor, plan) {
  const lines = planLines(actor, plan)
  const total = planTotal(lines)

  const update = {}
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
  if (Object.keys(update).length) await actor.update(update)

  const raises = Object.entries(plan.features)
    .filter(([id, to]) => to > (Number(actor.items.get(id)?.system.points) || 0))
    .map(([id, to]) => ({ _id: id, 'system.points': to }))
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
    await addExperience(actor, { name: summary || 'Experience spent', amount: total, spend: true })
  }
}

export { featureTypeFor }
