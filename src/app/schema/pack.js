import { MODULE_ID } from '../../constants.js'
import { addExperience, experienceTotals, readExperiences } from './journal.js'
import { TRIBES } from '../rules/garou-identity.js'
import { groupOf } from './coterie.js'

export const CAERN_TRAITS = [
  { id: 'well-hidden', name: 'Well-Hidden', group: 'Bawn', repeatable: true, summary: '+1 Difficulty per dot to actively search for the caern.' },
  { id: 'security', name: 'Security', group: 'Bawn', repeatable: true, summary: '+1 die per dot to notice danger in the caern or its bawn.' },
  { id: 'abundance', name: 'Abundance', group: 'Bawn', repeatable: true, summary: '+1 die per dot to Survival in the caern or bawn for the pack and its acknowledged guests.' },
  { id: 'gauntlet', name: 'Permissive Gauntlet', group: 'Spiritual power', repeatable: true, summary: '+1 die per dot to cross into the Umbra from the caern itself.' },
  { id: 'guardian', name: 'Spirit Guardian', group: 'Spiritual power', repeatable: true, summary: 'The caern’s guardian spirit has Power equal to this rating, from 1 to 5.' },
  { id: 'rite-focus', name: 'Rite Focus', group: 'Spiritual power', repeatable: true, summary: '+1 regular die per dot to the Rite master’s pool when performing a Rite using the focus.' },
  { id: 'attunement', name: 'Spiritual Attunement', group: 'Spiritual power', repeatable: true, summary: 'Once per scene, add 1 die per dot to a Gift activation roll at the caern.' },
  { id: 'ikon', name: 'Ikon of Contemplation', group: 'Amenity', summary: 'Once per session, recover 1 additional Superficial Willpower while using the Ikon.' },
  { id: 'balm', name: 'Balm of Gaia', group: 'Amenity', summary: 'At session start, eligible Garou can heal 1 Aggravated or 3 Superficial Health.' },
  { id: 'kin-beacon', name: 'Kin-Beacon', group: 'Amenity', summary: 'Draws Kin to the caern as a story effect.' },
  { id: 'prestigious', name: 'Prestigious', group: 'Amenity', repeatable: true, summary: 'Each dot adds 1 effective Renown for status among Garou to members of the pack or sept.' }
]

export const packOf = (actor) => {
  const group = groupOf(actor)
  return group?.system?.groupType === 'pack' ? group : null
}
export const packMembers = (group) => (group.system.members ?? []).map((uuid) => fromUuidSync(uuid)).filter(Boolean)
export const readCaern = (group) => ({
  name: '', bawn: '', sept: '', stewardship: 'pack', gauntlet: 2, value: 0, traits: {},
  ...group.getFlag(MODULE_ID, 'packCaern')
})
export const readPackPatron = (group) => group.getFlag(MODULE_ID, 'packPatron') ?? {}
export const patronPreset = (id) => TRIBES.find((entry) => entry.id === id)
export const packPatronName = (patron) => patronPreset(patron.id)?.patron || patron.name || ''
export const caernCost = (level) => level * 5

export function canTakeCaernTrait(caern, id) {
  const trait = CAERN_TRAITS.find((entry) => entry.id === id)
  const current = caern.traits[id] ?? 0
  return Boolean(trait && current < (trait.repeatable ? 5 : 1))
}

const purchaseFlag = 'caernPurchase'
const activePurchases = new Set()
const activePayers = new Set()
export const pendingCaernPurchase = (group) => group.getFlag(MODULE_ID, purchaseFlag)
const entryId = (purchase) => 'caern-' + purchase.id

function getCurrentPlan(group) {
  const purchase = pendingCaernPurchase(group)
  const caern = readCaern(group)
  if (!purchase || group.system.groupType !== 'pack' || purchase.level !== caern.value + 1 ||
      !canTakeCaernTrait(caern, purchase.trait)) throw new Error('The caern purchase is no longer current.')
  return { caern, purchase }
}

export function caernShare(group, actor) {
  const purchase = pendingCaernPurchase(group)
  const amount = purchase?.shares[actor.id] ?? 0
  if (!amount) return null
  const posted = readExperiences(actor).find((entry) => entry.id === entryId(purchase))
  return { amount, paid: posted?.value === -amount }
}

export function unpaidCaernMembers(group, purchase = pendingCaernPurchase(group)) {
  if (!purchase) return []
  const members = packMembers(group)
  return Object.keys(purchase.shares).filter((id) => {
    const member = members.find((actor) => actor.id === id)
    return !member || !caernShare(group, member)?.paid
  })
}

export async function proposeCaernDot(group, { trait, shares, riteCompleted }) {
  if (!group.isOwner || group.system.groupType !== 'pack') throw new Error('You need edit access to the Pack.')
  if (pendingCaernPurchase(group)) throw new Error('A Caern purchase already exists.')
  if (!riteCompleted) throw new Error('Confirm that the appropriate Rite succeeded.')
  const caern = readCaern(group)
  const level = caern.value + 1
  if (level > 5 || !canTakeCaernTrait(caern, trait)) throw new Error('Choose a valid new Caern Trait.')
  const entries = Object.entries(shares ?? {}).filter(([, amount]) => amount !== 0)
  const members = new Set(packMembers(group).map(({ id }) => id))
  if (entries.some(([id, amount]) => !members.has(id) || !Number.isInteger(amount) || amount < 1)) {
    throw new Error('Enter whole XP amounts for members of the pack.')
  }
  const cost = entries.reduce((sum, [, amount]) => sum + amount, 0)
  if (caern.stewardship === 'pack' ? cost !== caernCost(level) : cost > caernCost(level)) {
    throw new Error('The contributions do not match the XP required for this caern.')
  }

  const purchase = { level, trait, shares: Object.fromEntries(entries), id: foundry.utils.randomID(8) }
  await group.setFlag(MODULE_ID, purchaseFlag, purchase)
  return purchase
}

export async function payCaernShare(group, actor) {
  const key = actor.uuid ?? actor.id
  if (activePayers.has(key)) throw new Error('This member already has a payment in progress.')
  if (!actor.isOwner || packOf(actor)?.id !== group.id || !packMembers(group).some(({ id }) => id === actor.id)) {
    throw new Error('Only a member’s owner can spend their XP.')
  }
  const { caern, purchase } = getCurrentPlan(group)
  const amount = purchase.shares[actor.id] ?? 0
  if (!amount) return false
  const posted = readExperiences(actor).find((entry) => entry.id === entryId(purchase))
  if (posted) {
    if (posted.value !== -amount) throw new Error('The recorded share does not match the contribution plan.')
    return false
  }
  if (experienceTotals(actor).remaining < amount) throw new Error(actor.name + ' has insufficient XP.')
  activePayers.add(key)
  try {
    await addExperience(actor, { id: entryId(purchase), name: 'Caern · ' + (caern.name || group.name) + ' → ' + purchase.level, amount, spend: true })
    return true
  } finally {
    activePayers.delete(key)
  }
}

export async function finishCaernDot(group) {
  const { caern, purchase } = getCurrentPlan(group)
  if (!group.isOwner || unpaidCaernMembers(group, purchase).length) throw new Error('All assigned contributions must be paid first.')
  const next = {
    ...caern, value: purchase.level,
    traits: { ...caern.traits, [purchase.trait]: (caern.traits[purchase.trait] ?? 0) + 1 }
  }
  await group.update({
    ['flags.' + MODULE_ID + '.packCaern']: next,
    ['flags.' + MODULE_ID + '.-=' + purchaseFlag]: null
  })
}

export async function buyCaernDot(group, options) {
  const key = group.uuid ?? group.id
  if (activePurchases.has(key)) throw new Error('A Caern purchase is already in progress.')
  if (!group.isOwner) throw new Error('You need edit access to the Pack.')
  activePurchases.add(key)
  try {
    if (!pendingCaernPurchase(group)) await proposeCaernDot(group, options)
    const members = packMembers(group)
    for (const id of unpaidCaernMembers(group)) {
      const member = members.find((actor) => actor.id === id)
      if (member?.isOwner) await payCaernShare(group, member)
    }
    if (unpaidCaernMembers(group).length) return false
    await finishCaernDot(group)
    return true
  } finally {
    activePurchases.delete(key)
  }
}
