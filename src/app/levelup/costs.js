import { CLANS } from '../rules/clans.js'
import { readSingletonName } from '../schema/singletons.js'

/** The corebook's experience costs, as shown in the level-up window. */
export const COST_TABLE = [
  ['Increase attribute', 'New level × 5'],
  ['Increase skill', 'New level × 3'],
  ['New specialty', '3'],
  ['Clan discipline', 'New level × 5'],
  ['Other discipline', 'New level × 7'],
  ['Caitiff discipline', 'New level × 6'],
  ['Blood Sorcery ritual / Oblivion ceremony', 'Ritual level × 3'],
  ['Thin-blood formula', 'Formula level × 3'],
  ['Advantage, loresheet level, coterie dot', '3 per dot'],
  ['Blood Potency', 'New level × 10']
]

export const SPECIALTY_COST = 3
export const ADVANTAGE_COST = 3

/** Raising from `from` to `to` pays each new level in turn: 2 → 4 is 3×k + 4×k. */
export function stepCost(from, to, multiplier) {
  let total = 0
  for (let level = from + 1; level <= to; level++) total += level * multiplier
  return total
}

const norm = (value) => String(value ?? '').trim().toLowerCase()

export function clanOf(actor) {
  const name = norm(readSingletonName(actor, 'clan'))
  return CLANS.find((clan) => norm(clan.name) === name) ?? null
}

/**
 * The per-level multiplier for a discipline: 5 in clan, 7 out of it, 6 for
 * every discipline of a Caitiff. Thin-Blood Alchemy is a thin-blood's own.
 */
export function disciplineMultiplier(actor, key) {
  const clan = clanOf(actor)
  if (clan?.name === 'Caitiff') return 6
  if (clan?.name === 'Thin-blood') return key === 'alchemy' ? 5 : 7
  return clan?.disciplines.includes(key) ? 5 : 7
}
