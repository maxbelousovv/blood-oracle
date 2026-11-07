import { PREDATORS } from '../rules/predators.js'
import { CLAN_BY_NAME } from '../rules/clans.js'
import { emptySelections, resolveGrants, selectionsComplete } from '../schema/predator-grants.js'
import { featureTypeFor } from '../schema/advantages.js'
import { entriesForDiscipline, isLoaded } from '../rules/catalog.js'
import {
  ATTRIBUTE_TIERS,
  ATTRIBUTE_REST,
  BASE_ADVANTAGES,
  BASE_FLAWS,
  GENERATION_OPTIONS,
  REQUIRED_SPECIALTY_SKILLS,
  SKILL_DISTRIBUTIONS,
  powersFitDots,
  generationOptions,
  isCaitiff,
  isThinBlood
} from './rules.js'

/**
 * The character being made, kept apart from the actor until Finish: on the
 * actor's flags between sessions, in the wizard's state while it is open.
 * Nothing here touches the sheet, so an unfinished character never leaves the
 * real one half-filled.
 */

export const STEPS = [
  { id: 'clan', label: 'Clan' },
  { id: 'attributes', label: 'Attributes' },
  { id: 'skills', label: 'Skills' },
  { id: 'specialties', label: 'Specialties' },
  { id: 'generation', label: 'Generation' },
  { id: 'predator', label: 'Predator type' },
  { id: 'basics', label: 'Basics' },
  { id: 'disciplines', label: 'Disciplines' },
  { id: 'touchstones', label: 'Touchstones' },
  { id: 'merits', label: 'Merits & flaws' }
]

export function emptyDraft(actor) {
  return {
    version: 1,
    step: 0,
    reached: 0,
    clan: null,
    attributes: {},
    distribution: 'balanced',
    skills: {},
    specialties: { required: {}, free: { skill: '', text: '' } },
    generation: GENERATION_OPTIONS[0].id,
    predator: null,
    predatorSelections: [],
    basics: { name: actor?.name && actor.name !== 'New Actor' ? actor.name : '', sire: '', ambition: '', desire: '', appearance: '' },
    caitiffDisciplines: [],
    primary: null,
    secondary: null,
    powers: {},
    thinMerits: [],
    thinFlaws: [],
    formula: null,
    principles: [{ touchstone: '', conviction: '' }],
    advantages: [],
    loresheets: []
  }
}

/* ------------------------------------------------------------- tiers */

/** The index of the tier still being filled, or -1 when all are. */
export function openTier(tiers, assigned) {
  const values = Object.values(assigned)
  for (let i = 0; i < tiers.length; i++) {
    if (values.filter((value) => value === tiers[i].value).length < tiers[i].count) return i
  }
  return -1
}

export function attributeValue(draft, id) {
  if (draft.attributes[id]) return draft.attributes[id]
  return openTier(ATTRIBUTE_TIERS, draft.attributes) < 0 ? ATTRIBUTE_REST : 0
}

export function skillTiers(draft) {
  return SKILL_DISTRIBUTIONS[draft.distribution]?.tiers ?? SKILL_DISTRIBUTIONS.balanced.tiers
}

/* --------------------------------------------------------- generation */

export function generationOf(draft) {
  const options = generationOptions(draft.clan)
  return options.find((option) => option.id === draft.generation) ?? options[0]
}

export function advantageAllowance(draft) {
  const ancilla = generationOf(draft).ancilla
  return { advantages: BASE_ADVANTAGES + (ancilla ? 2 : 0), flaws: BASE_FLAWS + (ancilla ? 2 : 0) }
}

/* ----------------------------------------------------------- predator */

export function predatorOf(draft) {
  return draft.predator ? PREDATORS[draft.predator] ?? null : null
}

export function predatorSelections(draft) {
  const predator = predatorOf(draft)
  if (!predator) return []
  return draft.predatorSelections?.length === predator.blocks.length
    ? draft.predatorSelections
    : emptySelections(predator)
}

/** The discipline the predator type adds a dot to, once it is chosen. */
export function predatorDiscipline(draft) {
  const predator = predatorOf(draft)
  if (!predator || isThinBlood(draft.clan)) return null
  const selections = predatorSelections(draft)
  if (!selectionsComplete(predator, selections)) return null
  return resolveGrants(predator, selections).find((grant) => grant.kind === 'discipline')?.key ?? null
}

/* -------------------------------------------------------- disciplines */

/** The three disciplines this character draws from: the clan's, or a Caitiff's pick. */
export function clanDisciplines(draft) {
  if (isCaitiff(draft.clan)) return draft.caitiffDisciplines
  return CLAN_BY_NAME[draft.clan]?.disciplines ?? []
}

/** Dots per discipline: 2 and 1 from the clan's, one more from the predator. */
export function disciplineDots(draft) {
  const dots = {}
  if (draft.primary) dots[draft.primary] = 2
  if (draft.secondary) dots[draft.secondary] = (dots[draft.secondary] ?? 0) + 1
  const extra = predatorDiscipline(draft)
  if (extra) dots[extra] = (dots[extra] ?? 0) + 1
  return dots
}

/* ---------------------------------------------------------- merits */

export function advantageSpend(draft) {
  let advantages = 0
  let flaws = 0
  for (const pick of draft.advantages) {
    if (featureTypeFor(pick.entry) === 'flaw') flaws += pick.dots
    else advantages += pick.dots
  }
  for (const pick of draft.loresheets) advantages += pick.level
  return { advantages, flaws }
}

/* ---------------------------------------------------------- validity */

const filled = (value) => String(value ?? '').trim().length > 0

/** Why a step cannot be confirmed yet, or '' when it can. */
export function stepProblem(draft, stepId) {
  switch (stepId) {
    case 'clan':
      return draft.clan ? '' : 'Choose a clan.'
    case 'attributes':
      return openTier(ATTRIBUTE_TIERS, draft.attributes) < 0 ? '' : 'Assign the highlighted rating.'
    case 'skills':
      return openTier(skillTiers(draft), draft.skills) < 0 ? '' : 'Assign the highlighted rating.'
    case 'specialties': {
      const missing = REQUIRED_SPECIALTY_SKILLS.filter(
        (skill) => (draft.skills[skill] ?? 0) > 0 && !filled(draft.specialties.required[skill])
      )
      if (missing.length) return 'Every skill marked as needing one gets a specialty.'
      const free = draft.specialties.free
      if (!free.skill || !(draft.skills[free.skill] > 0) || !filled(free.text)) return 'Add one more specialty of your choice.'
      return ''
    }
    case 'generation':
      return generationOptions(draft.clan).some((option) => option.id === draft.generation) ? '' : 'Choose a generation.'
    case 'predator': {
      if (isThinBlood(draft.clan)) return ''
      const predator = predatorOf(draft)
      if (!predator) return 'Choose a predator type.'
      return selectionsComplete(predator, predatorSelections(draft)) ? '' : 'Make every choice the predator type asks for.'
    }
    case 'basics':
      return filled(draft.basics.name) ? '' : 'Give the character a name.'
    case 'disciplines': {
      if (isThinBlood(draft.clan)) {
        if (draft.thinMerits.length !== draft.thinFlaws.length) return 'Thin-blood merits and flaws come in pairs: take as many of each.'
        if (draft.thinMerits.includes('Thin-blood Alchemist') && isLoaded() && !draft.formula) return 'Choose your first formula.'
        return ''
      }
      if (isCaitiff(draft.clan) && draft.caitiffDisciplines.length !== 3) return 'Choose your three disciplines.'
      if (!draft.primary || !draft.secondary) return 'Choose the discipline with two dots and the one with one.'
      if (!isLoaded()) return ''
      const dots = disciplineDots(draft)
      for (const [key, count] of Object.entries(dots)) {
        const names = draft.powers[key] ?? []
        if (names.length !== count) return 'Choose one power for every dot.'
        const levels = names.map((name) => entriesForDiscipline(key).find((entry) => entry.name === name)?.level ?? 0)
        if (!powersFitDots(levels)) return 'Each dot takes a power of its own level or lower: one of level 1, one up to 2, one up to 3.'
      }
      return ''
    }
    case 'touchstones':
      return ''
    case 'merits': {
      const allowance = advantageAllowance(draft)
      const spent = advantageSpend(draft)
      if (spent.advantages > allowance.advantages) return 'More advantage points spent than you have.'
      if (spent.flaws > allowance.flaws) return 'More flaw points taken than allowed.'
      return ''
    }
    default:
      return ''
  }
}

/** Powers per discipline as entries from the reference, for the chosen names. */
export function chosenPowers(draft) {
  const result = []
  for (const [key, names] of Object.entries(draft.powers)) {
    const entries = entriesForDiscipline(key)
    for (const name of names) {
      const entry = entries.find((candidate) => candidate.name === name)
      if (entry) result.push({ key, entry })
    }
  }
  return result
}
