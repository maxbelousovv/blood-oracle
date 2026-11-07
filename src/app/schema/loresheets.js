import { MODULE_ID } from '../../constants.js'
import { LORESHEETS } from '../rules/loresheets.js'
import { getLoresheetText } from '../rules/catalog.js'
import { readSingletonName } from './singletons.js'
import { FEATURE_TYPES } from './advantages.js'

/**
 * A loresheet is five merits on a ladder. Each level the character takes is
 * an ordinary merit item, so the system's own sheet, experience and macros see
 * it as a merit; a flag ties it back to its loresheet and level:
 *
 *   flags['blood-oracle'].loresheet = { id: 'the-week-of-nightmares', level: 2 }
 *
 * The rating of a level is its place on the ladder, which is also its price.
 * Which loresheets are kept private is a list on the actor.
 */

export const LORESHEET_BY_ID = Object.fromEntries(LORESHEETS.map((entry) => [entry.id, entry]))

const PRIVATE_FLAG = 'privateLoresheets'

export function loresheetFlag(item) {
  return item?.getFlag?.(MODULE_ID, 'loresheet') ?? null
}

export function isLoresheetItem(item) {
  return Boolean(loresheetFlag(item)?.id)
}

/**
 * The loresheets the character has at least one level of, by name:
 *   [{ entry, owned: Map(level → item), dots }]
 * A loresheet missing from the catalogue (an older table) still shows, under
 * the name stored on its items.
 */
export function ownedLoresheets(actor) {
  const byId = new Map()
  for (const item of actor.items) {
    if (item.type !== 'feature') continue
    const flag = loresheetFlag(item)
    if (!flag?.id) continue
    let group = byId.get(flag.id)
    if (!group) {
      const entry = LORESHEET_BY_ID[flag.id] ?? {
        id: flag.id,
        name: flag.name ?? item.name.split(':')[0],
        levels: ['', '', '', '', '']
      }
      group = { entry, owned: new Map() }
      byId.set(flag.id, group)
    }
    group.owned.set(Number(flag.level), item)
  }
  return [...byId.values()]
    .map((group) => ({ ...group, dots: [...group.owned.keys()].reduce((sum, level) => sum + level, 0) }))
    .sort((a, b) => a.entry.name.localeCompare(b.entry.name))
}

export async function takeLevel(actor, entry, level) {
  const index = level - 1
  const name = entry.levels[index] || `Level ${level}`
  const text = getLoresheetText(entry.id)?.levels?.[index] ?? ''

  const [created] = await actor.createEmbeddedDocuments('Item', [
    {
      name: `${entry.name}: ${name}`,
      type: 'feature',
      system: { featuretype: FEATURE_TYPES.merit, points: level, description: text },
      flags: {
        [MODULE_ID]: {
          loresheet: { id: entry.id, level, name: entry.name },
          // Read by the merit list's dot rules: a level costs what it costs.
          advantage: { group: 'Loresheet', dots: String(level) }
        }
      }
    }
  ])
  return created
}

export async function dropLevel(item) {
  await item.delete()
}

export async function dropLoresheet(actor, id) {
  const ids = actor.items.filter((item) => loresheetFlag(item)?.id === id).map((item) => item.id)
  if (ids.length) await actor.deleteEmbeddedDocuments('Item', ids)
  await setPrivate(actor, id, false)
}

/* ------------------------------------------------------------- privacy */

export function isPrivate(actor, id) {
  return (actor.getFlag(MODULE_ID, PRIVATE_FLAG) ?? []).includes(id)
}

export async function setPrivate(actor, id, value) {
  const current = actor.getFlag(MODULE_ID, PRIVATE_FLAG) ?? []
  const next = value ? [...new Set([...current, id])] : current.filter((entry) => entry !== id)
  if (next.length === current.length && next.every((entry, i) => entry === current[i])) return
  await actor.setFlag(MODULE_ID, PRIVATE_FLAG, next)
}

/**
 * Whether this user may see a loresheet on the sheet. A private loresheet is
 * for the character's owners and the Storyteller; anyone else who can open the
 * sheet does not see it.
 */
export function canSee(actor, id) {
  return actor.isOwner || !isPrivate(actor, id)
}

/* --------------------------------------------------------- availability */

const norm = (value) => String(value ?? '').trim().toLowerCase()

/**
 * Whether the character meets a loresheet's restriction:
 *   { ok: true } or { ok: false, reason: 'Ventrue characters only' }
 * Unmet loresheets are shown dimmed, never hidden: the Storyteller decides.
 */
export function availability(actor, entry) {
  const restriction = entry.restriction
  if (!restriction || actor.type === 'spc') return { ok: true }

  const clan = norm(readSingletonName(actor, 'clan'))
  const reason = restriction.text

  if (restriction.clans?.length && !restriction.clans.some((key) => clan.includes(key))) {
    return { ok: false, reason }
  }
  if (restriction.notClans?.some((key) => clan.includes(key))) return { ok: false, reason }
  if (restriction.discipline) {
    const rating = Number(actor.system.disciplines?.[restriction.discipline]?.value) || 0
    if (rating < 1) return { ok: false, reason }
  }
  return { ok: true }
}
