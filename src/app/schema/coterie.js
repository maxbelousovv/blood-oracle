import { MODULE_ID } from '../../constants.js'
import { COTERIE_TYPES } from '../rules/coterie-types.js'
import { findAdvantage } from '../rules/catalog.js'
import { FEATURE_TYPES, buildFeatureData, readAdvantageMeta, dotsRange } from './advantages.js'

/**
 * Coterie types and the backgrounds a coterie holds together.
 *
 * A coterie's backgrounds are ordinary feature items on the group actor — the
 * system's own group sheet sorts them into backgrounds, merits and flaws — so
 * they survive without this module. Members read them through their own
 * sheet; nothing is copied onto the characters.
 *
 * A coterie type works like a predator type: choosing it hands out domain
 * dots, backgrounds and flaws, recorded in a journal so a later change of type
 * takes back exactly that and nothing bought on top.
 *
 *   flags.blood-oracle.coterieType   = { id } or { custom: 'Name' }
 *   flags.blood-oracle.coterieGrants = {
 *     type: 'Commando', id: 'commando',
 *     entries: [
 *       { kind: 'domain',  key: 'chasse', delta, label }
 *       { kind: 'feature', itemId, label }          created by the type
 *       { kind: 'raise',   itemId, delta, label }   dots added to an existing one
 *     ]
 *   }
 */

export const TYPE_FLAG = 'coterieType'
export const GRANTS_FLAG = 'coterieGrants'

export const COTERIE_TYPE_BY_ID = Object.fromEntries(COTERIE_TYPES.map((entry) => [entry.id, entry]))

export const DOMAIN_KEYS = ['chasse', 'lien', 'portillon']
const DOMAIN_LABELS = { chasse: 'Chasse', lien: 'Lien', portillon: 'Portillon' }

/** The backgrounds a coterie may hold, by the corebook. Flaws: any background flaw. */
export const COTERIE_BACKGROUNDS = [
  'Adversary', 'Allies', 'Contacts', 'Enemy', 'Haven', 'Herd',
  'Influence', 'Mask', 'Mawla', 'Resources', 'Retainers', 'Status'
]

const norm = (value) => String(value ?? '').trim().toLowerCase()

// The book's wording varies: "Ally" and "Allies", "Enemies" and "Enemy".
const ALIASES = { ally: 'Allies', allies: 'Allies', enemies: 'Enemy', adversaries: 'Adversary' }
export const canonicalName = (name) => ALIASES[norm(name)] ?? String(name ?? '').trim()

const DOTS = (n) => '●'.repeat(Math.max(0, Number(n) || 0))

/* ------------------------------------------------------------------- read */

export function readCoterieType(actor) {
  const flag = actor.getFlag(MODULE_ID, TYPE_FLAG)
  if (flag?.id && COTERIE_TYPE_BY_ID[flag.id]) return { entry: COTERIE_TYPE_BY_ID[flag.id] }
  if (flag && 'custom' in flag) return { custom: flag.custom ?? '' }
  return null
}

export function readGrants(actor) {
  const journal = actor.getFlag(MODULE_ID, GRANTS_FLAG)
  return journal?.id ? journal : null
}

/** The coterie type that granted this item, or null — the "type" mark. */
export function coterieOrigin(actor, itemId) {
  const journal = readGrants(actor)
  if (!journal) return null
  return journal.entries.some((entry) => entry.kind === 'feature' && entry.itemId === itemId) ? journal.type : null
}

/** Background-side features (backgrounds and merits) and flaws of a coterie. */
export function coterieFeatures(actor) {
  const features = actor.items.filter((item) => item.type === 'feature')
  const sort = (a, b) => a.name.localeCompare(b.name)
  return {
    backgrounds: features.filter((item) => (item.system.featuretype || 'background') !== FEATURE_TYPES.flaw).sort(sort),
    flaws: features.filter((item) => item.system.featuretype === FEATURE_TYPES.flaw).sort(sort)
  }
}

/**
 * The group a character belongs to, read from the back-reference the system
 * keeps on every member. Null when there is none or it is gone.
 */
export function groupOf(actor) {
  if (!actor) return null
  const id = actor.system?.group
  if (id) {
    // An id in the worlds seen so far; a UUID would do as well.
    const group = String(id).includes('.') ? fromUuidSync(id) : game.actors?.get(id)
    if (group?.type === 'group') return group
  }
  // The back-reference can be missing — a member added by other means, or a
  // stale id — while the group's own roster still lists the character. The
  // roster is the truth, so look there too.
  return (
    game.actors?.find(
      (candidate) =>
        candidate.type === 'group' &&
        Array.isArray(candidate.system?.members) &&
        candidate.system.members.includes(actor.uuid)
    ) ?? null
  )
}

/* -------------------------------------------------------- secret members */

/**
 * A member who keeps their allegiance secret avoids some of the coterie's
 * flaws but cannot call on its advantages or its domain. Kept on the group,
 * by member UUID, because it is the coterie's knowledge of itself.
 */
export const SECRET_FLAG = 'secretMembers'

export function isSecretMember(group, member) {
  return Boolean(group && member && (group.getFlag(MODULE_ID, SECRET_FLAG) ?? []).includes(member.uuid))
}

export async function setSecretMember(group, member, value) {
  const current = group.getFlag(MODULE_ID, SECRET_FLAG) ?? []
  const next = value ? [...new Set([...current, member.uuid])] : current.filter((uuid) => uuid !== member.uuid)
  await group.setFlag(MODULE_ID, SECRET_FLAG, next)
}

/**
 * The coterie domain a character can call on in a roll:
 *   null                       not in a coterie
 *   { group, secret: true }    in one, but secretly
 *   { group, chasse, lien, portillon }
 */
export function coterieDomainFor(actor) {
  const group = groupOf(actor)
  if (!group || (group.system.groupType || 'coterie') !== 'coterie') return null
  if (isSecretMember(group, actor)) return { group, secret: true }
  const rating = (key) => Number(group.system?.[key]?.value) || 0
  return { group, chasse: rating('chasse'), lien: rating('lien'), portillon: rating('portillon') }
}

/** Hunting difficulty in the domain: 6 at one dot of Chasse, one less per dot more. */
export function huntingDifficulty(chasse) {
  return chasse > 0 ? Math.max(1, 7 - chasse) : null
}

/* ---------------------------------------------------------------- grants */

export function grantLabel(grant) {
  if (grant.kind === 'domain') return `${DOMAIN_LABELS[grant.key]} ${DOTS(grant.dots)}`
  const name = grant.of ? `${grant.of} flaw: ${grant.name}` : grant.name
  return `${name} ${DOTS(grant.dots)}${grant.detail ? ` (${grant.detail})` : ''}`
}

/** Blank answers for a type's choices. */
export function emptySelections(type) {
  return (type?.choices ?? []).map((choice) => {
    if (choice.kind === 'oneOf') return { pick: null }
    if (choice.kind === 'spread') return { dots: Object.fromEntries(choice.among.map((name) => [name, 0])) }
    if (choice.kind === 'flawsEqual') return { flaws: [] }
    return {}
  })
}

const spreadTotal = (selections, type) =>
  (type?.choices ?? []).reduce(
    (sum, choice, i) =>
      choice.kind === 'spread'
        ? sum + Object.values(selections[i]?.dots ?? {}).reduce((a, b) => a + (Number(b) || 0), 0)
        : sum,
    0
  )

/**
 * Whether every choice is answered: a pick for "one of", no more than the
 * allowance for a spread, and flaws worth exactly the spread when the type
 * asks for equal flaws.
 */
export function choiceStatus(type, selections) {
  const problems = []
  const spent = spreadTotal(selections, type)
  ;(type?.choices ?? []).forEach((choice, i) => {
    const answer = selections[i] ?? {}
    if (choice.kind === 'oneOf' && answer.pick === null) problems.push('Pick one of the options.')
    if (choice.kind === 'spread' && spent > choice.total) problems.push(`Spread at most ${choice.total} dots.`)
    if (choice.kind === 'flawsEqual') {
      const flawDots = (answer.flaws ?? []).reduce((sum, flaw) => sum + (Number(flaw.dots) || 0), 0)
      if (flawDots !== spent) problems.push(`Flaws must come to ${spent} ${spent === 1 ? 'dot' : 'dots'}; now ${flawDots}.`)
      if ((answer.flaws ?? []).some((flaw) => !String(flaw.name ?? '').trim())) problems.push('Every flaw needs a name.')
    }
  })
  return { ok: !problems.length, problems, spent }
}

/** Every grant the type makes with these answers, in one flat list. */
export function resolveGrants(type, selections) {
  const grants = []
  for (const key of DOMAIN_KEYS) {
    if (type.domain?.[key]) grants.push({ kind: 'domain', key, dots: type.domain[key] })
  }
  for (const grant of type.backgrounds ?? []) grants.push({ ...grant, kind: 'merit', name: canonicalName(grant.name) })
  for (const grant of type.flaws ?? []) grants.push({ ...grant, kind: 'flaw', name: canonicalName(grant.name) })

  ;(type.choices ?? []).forEach((choice, i) => {
    const answer = selections[i] ?? {}
    if (choice.kind === 'oneOf' && answer.pick !== null && choice.options[answer.pick]) {
      const option = choice.options[answer.pick]
      grants.push({ ...option, kind: 'merit', name: canonicalName(option.name) })
    }
    if (choice.kind === 'spread') {
      for (const [name, dots] of Object.entries(answer.dots ?? {})) {
        if (Number(dots) > 0) grants.push({ kind: 'merit', name: canonicalName(name), dots: Number(dots) })
      }
    }
    if (choice.kind === 'flawsEqual') {
      for (const flaw of answer.flaws ?? []) {
        if (String(flaw.name ?? '').trim() && Number(flaw.dots) > 0) {
          grants.push({ kind: 'flaw', name: canonicalName(flaw.name), dots: Number(flaw.dots), detail: flaw.detail || undefined })
        }
      }
    }
  })
  return grants
}

/** Backgrounds go under the system's background type; other merits stay merits. */
function featureTypeFor(grant) {
  if (grant.kind === 'flaw') return FEATURE_TYPES.flaw
  const entry = findAdvantage(grant.name, 'merit')
  if (entry && entry.group !== 'Backgrounds') return FEATURE_TYPES.merit
  return FEATURE_TYPES.background
}

function findFeature(actor, grant) {
  const featuretype = featureTypeFor(grant)
  return (
    actor.items.find(
      (item) =>
        item.type === 'feature' &&
        (item.system.featuretype || 'background') === featuretype &&
        norm(item.name) === norm(grant.name) &&
        norm(readAdvantageMeta(item).details) === norm(grant.detail)
    ) ?? null
  )
}

/**
 * The item for a granted background or flaw. A type may grant a rating the
 * catalogue range would not allow — Allies ● — so the range widens to hold it
 * and the book's own rating is kept beside it, as with predator grants.
 */
function featureData(grant, typeName) {
  const entry = findAdvantage(grant.name, grant.kind === 'flaw' ? 'flaw' : 'merit')
  const bookDots = entry?.dots ?? ''
  const range = bookDots ? dotsRange(bookDots) : null

  let dots = bookDots
  if (range && (grant.dots < range.min || grant.dots > range.max)) {
    const low = Math.min(range.min, grant.dots)
    const high = range.open ? null : Math.max(range.max, grant.dots)
    dots = range.fixed ? String(grant.dots) : high ? `${low}-${high}` : `${low}+`
  }

  return buildFeatureData({
    name: grant.name,
    featuretype: featureTypeFor(grant),
    points: grant.dots,
    description: entry?.description ?? '',
    meta: {
      group: entry?.group ?? 'Backgrounds',
      dots: dots || String(grant.dots),
      ...(bookDots && dots !== bookDots ? { bookDots } : {}),
      hasDetails: Boolean(entry?.hasDetails || grant.detail),
      detailsPlaceholder: entry?.detailsPlaceholder ?? '',
      details: grant.detail ?? '',
      coterieType: typeName
    }
  })
}

/**
 * Apply a type's grants and write the journal. Domain ratings rise to what the
 * type lists and never fall; backgrounds the coterie already holds gain the
 * dots; flaws already held are not doubled.
 */
export async function applyGrants(actor, type, grants) {
  const update = {}
  const entries = []
  const toCreate = []
  const createdLabels = []
  const raises = []

  for (const grant of grants) {
    const label = grantLabel(grant)

    if (grant.kind === 'domain') {
      const current = Number(actor.system?.[grant.key]?.value) || 0
      if (current >= grant.dots) continue
      update[`system.${grant.key}.value`] = grant.dots
      entries.push({ kind: 'domain', key: grant.key, delta: grant.dots - current, label })
      continue
    }

    const existing = findFeature(actor, grant)
    if (existing) {
      if (grant.kind === 'flaw') continue
      raises.push({ _id: existing.id, 'system.points': (Number(existing.system.points) || 0) + grant.dots })
      entries.push({ kind: 'raise', itemId: existing.id, delta: grant.dots, label })
      continue
    }
    toCreate.push(featureData(grant, type.name))
    createdLabels.push(label)
  }

  if (Object.keys(update).length) await actor.update(update)
  if (raises.length) await actor.updateEmbeddedDocuments('Item', raises)
  if (toCreate.length) {
    const created = await actor.createEmbeddedDocuments('Item', toCreate)
    created.forEach((item, i) => entries.push({ kind: 'feature', itemId: item.id, label: createdLabels[i] }))
  }

  await actor.setFlag(MODULE_ID, GRANTS_FLAG, { type: type.name, id: type.id, entries })
  return entries
}

/** Take back exactly what the journal records, then clear it. */
export async function revertGrants(actor) {
  const journal = readGrants(actor)
  if (!journal) return

  const update = {}
  const raises = []
  const toDelete = []

  for (const entry of journal.entries) {
    if (entry.kind === 'domain') {
      const current = Number(actor.system?.[entry.key]?.value) || 0
      update[`system.${entry.key}.value`] = Math.max(0, current - entry.delta)
    }
    if (entry.kind === 'feature' && actor.items.get(entry.itemId)) toDelete.push(entry.itemId)
    if (entry.kind === 'raise') {
      const item = actor.items.get(entry.itemId)
      if (item) raises.push({ _id: item.id, 'system.points': Math.max(0, (Number(item.system.points) || 0) - entry.delta) })
    }
  }

  if (Object.keys(update).length) await actor.update(update)
  if (raises.length) await actor.updateEmbeddedDocuments('Item', raises)
  if (toDelete.length) await actor.deleteEmbeddedDocuments('Item', toDelete)
  await actor.unsetFlag(MODULE_ID, GRANTS_FLAG)
}

async function confirmRevert(actor) {
  const journal = readGrants(actor)
  if (!journal) return true
  const escape = foundry.utils.escapeHTML
  const list = journal.entries.map((entry) => `<li>${escape(entry.label)}</li>`).join('')
  return foundry.applications.api.DialogV2.confirm({
    classes: ['blood-oracle', 'bo-dialog'],
    window: { title: 'Remove coterie type grants' },
    content:
      `<p>Changing the coterie type takes back what <strong>${escape(journal.type)}</strong> granted:</p>` +
      (list ? `<ul>${list}</ul>` : '<p><em>Nothing was recorded.</em></p>') +
      '<p>Anything added on top stays.</p>'
  })
}

/**
 * Change the type: { id } for a catalogue type, { custom } for one of the
 * table's own, or null to clear. Returns the catalogue entry when its grants
 * dialog should open, null when not, and false when the change was abandoned.
 */
export async function changeCoterieType(actor, next) {
  const journal = readGrants(actor)
  const nextId = next?.id ?? null
  if (journal && journal.id !== nextId) {
    if (!(await confirmRevert(actor))) return false
    await revertGrants(actor)
  }

  // Unset first: setting an object flag merges into the old one, which would
  // leave an { id } and a { custom } side by side.
  await actor.unsetFlag(MODULE_ID, TYPE_FLAG)
  if (next) await actor.setFlag(MODULE_ID, TYPE_FLAG, next)

  const entry = nextId ? COTERIE_TYPE_BY_ID[nextId] : null
  const alreadyApplied = journal && journal.id === nextId
  return entry && !alreadyApplied ? entry : null
}

/**
 * A possible extra as a search for the picker: "Haven (clubhouse)" → Haven,
 * "Enemies 2" → Enemy (a flaw). Null when it names nothing the coterie can buy
 * ("a shared relic…"), which then shows as a plain note.
 */
export function readExtra(text) {
  const raw = String(text ?? '').trim()
  const head = raw.split(/[\s(:]/)[0]
  const name = canonicalName(head)
  if (!COTERIE_BACKGROUNDS.includes(name)) return null
  const flaw = name === 'Enemy' || name === 'Adversary' || /\bflaw\b/i.test(raw)
  // "Haven flaw: Haunted" searches for Haunted; "Mask flaw 2" leaves the
  // flaw open, since the book names none.
  const named = raw.match(/flaw:\s*([^(\d]+)/i)?.[1]?.trim()
  const query = flaw ? (named ?? (name === 'Enemy' || name === 'Adversary' ? name : '')) : name
  return { name, flaw, query, label: raw }
}
