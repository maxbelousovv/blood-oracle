import { MODULE_ID } from '../../constants.js'
import { getAttributeGroups, getSkillGroups } from '../traits.js'
import { findAdvantage, entriesForDiscipline } from '../rules/catalog.js'
import { setSingleton } from '../schema/singletons.js'
import { addSpecialty } from '../schema/specialties.js'
import { addFeature, buildFeatureData, FEATURE_TYPES } from '../schema/advantages.js'
import { buildPowerItemData } from '../schema/disciplines.js'
import { applyGrants, resolveGrants } from '../schema/predator-grants.js'
import { takeLevel, LORESHEET_BY_ID } from '../schema/loresheets.js'
import { addExperience } from '../schema/journal.js'
import { BASE_HUMANITY, REQUIRED_SPECIALTY_SKILLS, isCaitiff, isThinBlood } from './rules.js'
import {
  attributeValue,
  chosenPowers,
  generationOf,
  predatorOf,
  predatorSelections
} from './draft.js'

export const DRAFT_FLAG = 'chargenDraft'
export const DONE_FLAG = 'chargenDone'

export const CHOICE_FLAG = 'chargenChoice'

export const readDraft = (actor) => actor.getFlag(MODULE_ID, DRAFT_FLAG) ?? null
/** 'manual' once a player has chosen to fill the sheet in by hand. */
export const chargenChoice = (actor) => actor.getFlag(MODULE_ID, CHOICE_FLAG) ?? null
export const chooseManual = (actor) => actor.setFlag(MODULE_ID, CHOICE_FLAG, 'manual')

/**
 * A vampire nobody has filled in yet: no clan, every attribute at the 1 the
 * system creates it with, no skills, no powers or merits. Anything typed in by
 * hand makes it not blank, so a character made without the wizard is never
 * offered it.
 */
export function isBlankCharacter(actor) {
  if (actor.type !== 'vampire') return false
  if (actor.items.some((item) => ['clan', 'predatorType', 'power', 'feature'].includes(item.type))) return false
  const attributes = Object.values(actor.system.attributes ?? {})
  if (attributes.some((entry) => (Number(entry?.value) || 0) > 1)) return false
  const skills = Object.values(actor.system.skills ?? {})
  return !skills.some((entry) => (Number(entry?.value) || 0) > 0)
}

/** Whether to put the first-time question to this user now. */
export function shouldOfferChargen(actor) {
  return isBlankCharacter(actor) && !chargenDone(actor) && !chargenChoice(actor) && !readDraft(actor)
}
export const saveDraft = (actor, draft) => actor.setFlag(MODULE_ID, DRAFT_FLAG, draft)
export const chargenDone = (actor) => Boolean(actor.getFlag(MODULE_ID, DONE_FLAG))

const powerItem = (key, entry) =>
  buildPowerItemData({ rawName: entry.originalName || entry.name, disciplineKey: key, level: entry.level, rules: entry })

/** A feature by catalogue name, or a plain one when the reference lacks it. */
async function addNamedFeature(actor, name, kind, points) {
  const entry = findAdvantage(name, kind)
  if (entry) {
    const created = await addFeature(actor, { entry })
    if (created && Number(created.system.points) !== points) await created.update({ 'system.points': points })
    return created
  }
  const [created] = await actor.createEmbeddedDocuments('Item', [
    buildFeatureData({ name, featuretype: kind === 'flaw' ? FEATURE_TYPES.flaw : FEATURE_TYPES.merit, points })
  ])
  return created
}

/**
 * Everything at once, in an order where each step finds what it needs: base
 * ratings first, then the clan, then what is added on top of the ratings —
 * the predator's grants raise a discipline and lower Humanity relative to
 * what is already there, so those are written before it.
 */
export async function finishCharacter(actor, draft) {
  const generation = generationOf(draft)
  const thin = isThinBlood(draft.clan)

  const update = {}
  if (draft.basics.name?.trim()) update.name = draft.basics.name.trim()

  for (const group of getAttributeGroups()) {
    for (const entry of group.entries) update[entry.path] = attributeValue(draft, entry.id) || 1
  }
  for (const group of getSkillGroups()) {
    for (const entry of group.entries) update[entry.path] = draft.skills[entry.id] ?? 0
  }

  update['system.headers.sire'] = draft.basics.sire ?? ''
  update['system.headers.ambition'] = draft.basics.ambition ?? ''
  update['system.headers.desire'] = draft.basics.desire ?? ''
  update['system.appearance'] = draft.basics.appearance ?? ''
  update['system.headers.generation'] = `${generation.generation}th`
  update['system.blood.generation'] = String(generation.generation)
  update['system.blood.potency'] = generation.potency
  update['system.humanity.value'] = BASE_HUMANITY - (generation.ancilla ? 1 : 0)

  if (!thin) {
    if (draft.primary) update[`system.disciplines.${draft.primary}.value`] = 2
    if (draft.secondary) update[`system.disciplines.${draft.secondary}.value`] = 1
  }
  if (thin && draft.thinMerits.includes('Thin-blood Alchemist')) update['system.disciplines.alchemy.value'] = 1

  await actor.update(update)
  await setSingleton(actor, 'clan', draft.clan)

  // Specialties: the required ones and the free one, each its own record.
  for (const skill of REQUIRED_SPECIALTY_SKILLS) {
    const text = draft.specialties.required[skill]
    if ((draft.skills[skill] ?? 0) > 0 && text?.trim()) await addSpecialty(actor, skill, text)
  }
  if (draft.specialties.free.skill && draft.specialties.free.text?.trim()) {
    await addSpecialty(actor, draft.specialties.free.skill, draft.specialties.free.text)
  }

  // Powers, and a thin-blood alchemist's first formula.
  const powers = chosenPowers(draft).map(({ key, entry }) => powerItem(key, entry))
  if (thin && draft.formula) {
    const formula = entriesForDiscipline('alchemy').find((entry) => entry.name === draft.formula)
    if (formula) powers.push(powerItem('alchemy', formula))
  }
  if (powers.length) await actor.createEmbeddedDocuments('Item', powers)

  // The predator type, through the same grants the sheet uses, so its journal
  // can still undo it later.
  const predator = predatorOf(draft)
  if (predator && !thin) {
    await setSingleton(actor, 'predatorType', predator.name)
    await applyGrants(actor, predator, resolveGrants(predator, predatorSelections(draft)))
  }

  // Merits, backgrounds and flaws at their chosen dots; loresheet levels.
  for (const pick of draft.advantages) {
    const created = await addFeature(actor, { entry: pick.entry })
    if (created && Number(created.system.points) !== pick.dots) await created.update({ 'system.points': pick.dots })
  }
  for (const pick of draft.loresheets) {
    const entry = LORESHEET_BY_ID[pick.id]
    if (entry) await takeLevel(actor, entry, pick.level)
  }

  // Thin-blood merits and flaws have no dots: each flaw balances a merit.
  if (thin) {
    for (const name of draft.thinMerits) await addNamedFeature(actor, name, 'merit', 0)
    for (const name of draft.thinFlaws) await addNamedFeature(actor, name, 'flaw', 0)
  }

  // The Caitiff begin Suspect, over and above the flaws they choose.
  if (isCaitiff(draft.clan)) await addNamedFeature(actor, 'Suspect', 'flaw', 1)

  const principles = draft.principles
    .filter((entry) => entry.touchstone?.trim() || entry.conviction?.trim())
    .map((entry) => ({ touchstone: entry.touchstone.trim(), conviction: entry.conviction.trim(), portrait: '' }))
  if (principles.length) await actor.setFlag(MODULE_ID, 'principles', principles)

  // The stage's experience goes on the sheet unspent, for the level-up to use.
  if (generation.xp) {
    await addExperience(actor, { name: `Character creation: ${generation.stage}`, amount: generation.xp, spend: false })
  }

  await actor.setFlag(MODULE_ID, DONE_FLAG, true)
  await actor.unsetFlag(MODULE_ID, DRAFT_FLAG)
}
