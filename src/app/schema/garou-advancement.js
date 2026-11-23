import { garouGiftEntries, GAROU_RITES, garouPowerData, garouPowerKind, garouPowerMatches } from '../rules/garou-powers.js'
import { AUSPICES, TRIBES, findGarouIdentity } from '../rules/garou-identity.js'
import { readSingletonName } from './singletons.js'

export const GAROU_POWER_SLOTS = [
  { id: 'native', label: 'Native Gift' },
  { id: 'auspice', label: 'Auspice Gift' },
  { id: 'tribe', label: 'Tribe Gift' },
  { id: 'rite', label: 'Rite' }
]

export function garouIdentities(actor) {
  return {
    auspice: findGarouIdentity(AUSPICES, readSingletonName(actor, 'auspice')),
    tribe: findGarouIdentity(TRIBES, readSingletonName(actor, 'tribe'))
  }
}

export function powerEntries(slot, identityId) {
  return slot === 'rite' ? GAROU_RITES : garouGiftEntries(slot, identityId)
}

export const giftNameKey = (name) => String(name ?? '').trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
export const giftPurchaseCost = (known, index) => (known + index + 1) * 2
export const RITE_XP = 5

function catalogueChoice(pick, identityId) {
  return powerEntries(pick.slot, identityId).find((entry) =>
    pick.id ? entry.id === pick.id : giftNameKey(entry.name) === giftNameKey(pick.name))
}

export function powerChoiceProblem({ pick, identities, renown, items = [], others = [] }) {
  const slot = GAROU_POWER_SLOTS.find(({ id }) => id === pick?.slot)
  if (!slot) return 'Choose a Gift or Rite.'
  const kind = slot.id === 'rite' ? 'rite' : 'gift'
  const name = giftNameKey(pick.name)
  if (!name) return 'Enter the name from your source.'
  const identityId = identities[slot.id]?.id
  if (slot.id === 'tribe' || slot.id === 'auspice') {
    if (!identityId || pick.giftType !== identityId) return 'Choose a Gift from the current ' + slot.id + '.'
  }
  const entry = catalogueChoice(pick, identityId)
  if (pick.id && (!entry || giftNameKey(entry.name) !== name || (entry.level ?? 0) !== pick.level)) return 'Choose a valid catalogue entry.'
  if (kind === 'gift') {
    if (!entry && !['glory', 'honor', 'wisdom'].includes(pick.renown)) return 'Choose the Renown associated with the Gift.'
    const level = entry?.level ?? pick.level
    if (!Number.isInteger(level) || level < 1 || level > 15) return 'Enter the Total Renown requirement from the source.'
    if (level > renown) return 'Requires Total Renown ' + level + '.'
  }
  if (others.some((other) => (other.slot === 'rite') === (kind === 'rite') && giftNameKey(other.name) === name) ||
      items.some((item) => garouPowerKind(item) === kind && garouPowerMatches(item, entry ?? pick))) return 'Already learned or selected.'
  return ''
}

export function cataloguePower(slot, entry) {
  return { slot, id: entry.id, name: entry.name, level: entry.level ?? 0, giftType: entry.giftType }
}

export function buildGarouChoiceData(actor, pick) {
  const kind = pick.slot === 'rite' ? 'rite' : 'gift'
  const catalogued = catalogueChoice(pick, pick.giftType)
  if (catalogued) return garouPowerData(actor, kind, catalogued)
  return {
    name: pick.name.trim(),
    type: 'gift',
    system: {
      giftType: pick.giftType || pick.slot,
      level: pick.level,
      ...(kind === 'gift' ? { renown: pick.renown } : {}),
      description: foundry.utils.escapeHTML(pick.description?.trim() || '')
    }
  }
}
