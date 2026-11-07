/**
 * The character creation rules the wizard enforces, from the V5 corebook,
 * with the Caitiff and thin-blood exceptions.
 */

export const ATTRIBUTE_TIERS = [
  { value: 4, count: 1, label: 'Your strongest attribute' },
  { value: 1, count: 1, label: 'Your weakest attribute' },
  { value: 3, count: 3, label: 'Three good attributes' }
]
/** Whatever is left after the tiers. */
export const ATTRIBUTE_REST = 2

export const SKILL_DISTRIBUTIONS = {
  jack: {
    label: 'Jack of All Trades',
    note: 'A little of everything',
    tiers: [
      { value: 3, count: 1 },
      { value: 2, count: 8 },
      { value: 1, count: 10 }
    ]
  },
  balanced: {
    label: 'Balanced',
    note: 'The default choice',
    tiers: [
      { value: 3, count: 3 },
      { value: 2, count: 5 },
      { value: 1, count: 7 }
    ]
  },
  specialist: {
    label: 'Specialist',
    note: 'Deep in a few things',
    tiers: [
      { value: 4, count: 1 },
      { value: 3, count: 3 },
      { value: 2, count: 3 },
      { value: 1, count: 3 }
    ]
  }
}

const TIER_WORDS = { 4: 'exceptional', 3: 'strong', 2: 'decent', 1: 'passable' }
export const tierWord = (value) => TIER_WORDS[value] ?? ''

/** Skills that always need a specialty once they have a dot. */
export const REQUIRED_SPECIALTY_SKILLS = ['academics', 'craft', 'performance', 'science']

/**
 * Generation and stage together, one entry per choice that changes anything.
 * Childer and neonates share generations; only the experience differs.
 */
export const GENERATION_OPTIONS = [
  { id: '13-neonate', generation: 13, stage: 'Neonate', potency: 1, xp: 15 },
  { id: '13-childer', generation: 13, stage: 'Childer', potency: 1, xp: 0 },
  { id: '12-neonate', generation: 12, stage: 'Neonate', potency: 1, xp: 15 },
  { id: '12-childer', generation: 12, stage: 'Childer', potency: 1, xp: 0 },
  { id: '11-ancilla', generation: 11, stage: 'Ancilla', potency: 2, xp: 35, ancilla: true },
  { id: '10-ancilla', generation: 10, stage: 'Ancilla', potency: 2, xp: 35, ancilla: true }
]

export const THIN_BLOOD_GENERATIONS = [
  { id: '14-thin', generation: 14, stage: 'Childer', potency: 0, xp: 0 },
  { id: '15-thin', generation: 15, stage: 'Childer', potency: 0, xp: 0 },
  { id: '16-thin', generation: 16, stage: 'Childer', potency: 0, xp: 0 }
]

export function generationOptions(clan) {
  return clan === 'Thin-blood' ? THIN_BLOOD_GENERATIONS : GENERATION_OPTIONS
}

export function generationLabel(option) {
  const bonus = option.ancilla
    ? '+35 XP, +2 advantages, +2 flaws, −1 Humanity'
    : option.xp
      ? `+${option.xp} XP`
      : option.potency === 0
        ? 'thin-blood'
        : 'no bonus XP'
  return `${option.generation}th — ${option.stage} (${bonus})`
}

/**
 * Powers fit their dots: the power bought with dot N is of level N or lower.
 * A set of powers bought for dots base+1 … base+k fits when, weakest first,
 * the i-th is no higher than base + i. `base` is 0 in creation and the
 * discipline's old rating when levelling up.
 */
export function powersFitDots(levels, base = 0) {
  return [...levels].sort((a, b) => a - b).every((level, i) => level <= base + i + 1)
}

export const BASE_ADVANTAGES = 7
export const BASE_FLAWS = 2
export const BASE_HUMANITY = 7
export const MAX_PRINCIPLES = 3

export const isThinBlood = (clan) => clan === 'Thin-blood'
export const isCaitiff = (clan) => clan === 'Caitiff'
