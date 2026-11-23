import { MODULE_ID } from '../../constants.js'
import { gearPlace, GEAR_PLACES, isEquipped } from '../schema/inventory.js'
import { HUNTER_EQUIPMENT } from '../rules/hunter-equipment.js'

export const HUNTER_AMMO = {
  'dragons-breath': { label: 'Dragon’s Breath', damage: 0 },
  raufoss: { label: 'Raufoss', damage: 5 }
}

const GEAR_BONUSES = {
  'lockpick-gun': { dice: 4, when: 'Picking a lock', attributes: ['dexterity'], skills: ['larceny'] },
  'tactical-earbuds': { dice: 1, when: 'Composure test in combat', attributes: ['composure'], skills: [] },
  'gps-trackers': { dice: 4, when: 'Locating the wearer of an active tracker', attributes: [], skills: [] }
}

const templateId = (item) => item.getFlag(MODULE_ID, 'hunterEquipment')
const templateOf = (item) => HUNTER_EQUIPMENT.find(({ id }) => id === templateId(item))
const matches = (required, actual) => required.every((id) => actual.includes(id))

export function hunterEquipmentForRoll(actor, slots, choice) {
  const skills = slots.filter((slot) => slot?.kind === 'skill').map(({ id }) => id)
  const attributes = slots.filter((slot) => slot?.kind === 'attribute').map(({ id }) => id)
  const ranges = [
    ...(skills.includes('melee') ? ['melee'] : []),
    ...(skills.includes('firearms') ? ['ranged'] : [])
  ]
  const weapons = actor.items.filter((item) =>
    item.type === 'weapon' && ranges.includes(item.system.weaponType || 'melee') && isEquipped(item) && Number(item.system.quantity ?? 1) > 0
  )
  const weapon = weapons.find(({ id }) => id === choice.weaponId)
  const template = weapon ? templateOf(weapon) : null
  const special = template && !template.classId
  const ammoType = !special && weapon?.system.weaponType === 'ranged' ? weapon.getFlag(MODULE_ID, 'hunterAmmoType') : null
  const carriedGear = actor.items.filter((item) =>
    item.type === 'gear' && gearPlace(item) === GEAR_PLACES.carried && Number(item.system.quantity ?? 1) > 0
  )
  const ammoOptions = Object.hasOwn(HUNTER_AMMO, ammoType)
    ? carriedGear.filter((item) => templateId(item) === ammoType)
    : []
  const ammo = ammoOptions.find(({ id }) => id === choice.ammoId)
  const gear = carriedGear.flatMap((item) => {
    const id = templateId(item)
    const bonus = Object.hasOwn(GEAR_BONUSES, id) ? GEAR_BONUSES[id] : null
    return bonus && matches(bonus.attributes, attributes) && matches(bonus.skills, skills)
      ? [{ item, ...bonus }]
      : []
  })
  const parts = gear.filter(({ item }) => choice.gearIds?.includes(item.id))
    .filter(({ item }, index, selected) => selected.findIndex((entry) => templateId(entry.item) === templateId(item)) === index)
    .map(({ item, dice }) => ({ label: item.name, value: dice }))

  const canCallShot = Boolean(ranges.length || skills.includes('brawl'))
  const calledShot = canCallShot ? choice.calledShot : ''
  if (calledShot && choice.calledShotDice) {
    parts.push({ label: `Called shot (${calledShot})`, value: choice.calledShotDice })
  }

  let damage = null
  const effects = []
  if (weapon) {
    const disguised = weapon.getFlag(MODULE_ID, 'hunterDisguised')
    if (disguised === 'standard') parts.push({ label: `Disguised weapon (${weapon.name})`, value: -1 })
    if (!special || template.damage != null) damage = Number(weapon.system.weaponvalue) || 0
    if (ammo) {
      damage = HUNTER_AMMO[ammoType].damage
      effects.push(ammo.system.description || templateOf(ammo)?.summary)
    } else if (!special && weapon.getFlag(MODULE_ID, 'hunterImprovisedIncendiary')) {
      damage -= 1
      effects.push('Aggravated against targets vulnerable to fire. Total failure deals 3 Aggravated to the user.')
    }
    const properties = weapon.getFlag(MODULE_ID, 'weaponProperties') || (special || template?.id === 'stake' ? template.summary : '')
    if (properties) effects.push(properties)
  }

  return { ranges, weapons, weapon, ammoOptions, ammo, gear, parts, damage, effects: effects.filter(Boolean), calledShot, canCallShot }
}
