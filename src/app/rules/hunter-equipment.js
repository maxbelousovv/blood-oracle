import { ARMOR_VALUES, WEAPON_CLASSES, WEAPON_CLASS_BY_ID, buildArmorData, buildWeaponData } from '../schema/inventory.js'
import { MODULE_ID } from '../../constants.js'

export const HUNTER_WEAPON_RULE = 'On a winning attack, add the weapon’s damage rating to the margin to get the damage dealt.'
export const HUNTER_ARMOR_RULE = 'Per damage roll, each point of applicable armor converts one point of Aggravated damage from piercing or bladed weapons to Superficial. Then halve Superficial damage as usual.'

const gear = (id, name, summary, reference = id) => ({ id, name, summary, group: 'Gear', type: 'gear', reference })
const weapon = (id, name, summary, damage) => ({ id, name, summary, group: 'Special Weapons', type: 'weapon', reference: id, damage })

export const HUNTER_EQUIPMENT = [
  ...WEAPON_CLASSES.map(({ id, label, range, bonus, examples }) => ({
    id: `weapon-${id}`, name: label, group: range === 'ranged' ? 'Ranged Weapons' : 'Melee Weapons',
    type: 'weapon', classId: id, damage: bonus, summary: examples, reference: 'weapons'
  })),
  {
    id: 'stake', name: 'Wooden Stake', group: 'Melee Weapons', type: 'weapon', classId: 'improvised',
    damage: 0, reference: 'weapons',
    summary: 'A successful called shot to a vampire’s heart that deals at least five damage stakes and paralyzes them.'
  },
  ...ARMOR_VALUES.map(({ id, label, examples, dice, note }) => ({
    id: `armor-${id}`, name: label, group: 'Armor', type: 'armor', classId: id, rating: dice,
    summary: note ? `${examples}. ${note}.` : examples, reference: 'armor'
  })),
  gear('chaoscopes', 'Chaoscope', 'Detect supernatural disturbances with Intelligence + Awareness at Difficulty 6. Reduce Difficulty by 1 after reliably detecting that creature type before. Requires a fixed installation or dedicated vehicle.'),
  gear('xscopes', 'XScope', 'Scans for signs of life. Basic models can be fooled by a vampire mimicking vital signs; second-generation models can often tell the difference.'),
  gear('gps-trackers', 'GPS Tracker', 'An active tracker gives four dice to locate the wearer. Find one with Wits + Streetwise or Technology. A personnel tracker is Difficulty 3 to spot.'),
  gear('lockpick-gun', 'Lockpick Gun', 'Adds four dice to Dexterity + Larceny when picking a lock.'),
  gear('zip-cuffs', 'Zip Cuffs', 'Restrains limbs. Break with a Difficulty 5 Strength test or cut them off with a suitable tool.', 'restraints'),
  gear('handcuffs', 'Handcuffs', 'Break with a Difficulty 6 Strength test or slip free with Dexterity + Larceny at Difficulty 4.', 'restraints'),
  gear('tactical-earbuds', 'Tactical Earbuds', 'Hearing protection and cell communications. Adds one die to Composure tests in combat.'),
  {
    ...gear('dragons-breath', 'Dragon’s Breath Rounds', 'Shotgun ammunition with a +0 damage bonus. It deals Aggravated damage to vampires and ignites the target for one Aggravated per round. Factory rounds jam on a total failure. Effective to roughly 15 metres.'),
    group: 'Ammunition'
  },
  {
    ...gear('raufoss', 'Raufoss Rounds', 'These rounds ignore body armor and have a +5 damage rating. All damage is Aggravated.'),
    group: 'Ammunition'
  },
  weapon('hafla', 'Hafla', 'A single-use launcher. A hit at Difficulty 3 or higher deals three Aggravated immediately and three more each turn until the burning material is removed.'),
  weapon('flamethrowers', 'Flamethrower', 'A hit deals +0 Aggravated damage and the target continues to burn each turn. The spray can ignite the surroundings.', 0),
  weapon('molotov-cocktail', 'Molotov Cocktail', 'A hit at Difficulty 4 deals two Aggravated per turn. A Difficulty 3 Composure + Survival test stops the burn.'),
  weapon('net-gun', 'Net Gun', 'Reduces Dexterity rather than Health, halved like Superficial damage. At Dexterity 0 the target cannot attack. Breaking free pits Strength + Athletics against the total successes of prior net attacks. A flaming net deals three Aggravated per turn.'),
  gear('plastic-explosives', 'Plastic Explosives', 'Set with Intelligence + Technology. Regular blast damage is Superficial; incendiary or antipersonnel blasts deal Aggravated. Damage varies with the charge and distance.'),
  {
    id: 'disguised-weapons', name: 'Disguised Weapon', group: 'Weapon Modifications', reference: 'disguised-weapons',
    summary: 'Craft with Intelligence + Craft or an appropriate Specialty. Spot with Wits + Awareness at Difficulty 1 plus the higher of the wielder’s Stealth and the maker’s Craft. Attacks lose one die unless crafting was a critical win.'
  },
  {
    id: 'incendiary-weapons', name: 'Incendiary Weapon', group: 'Weapon Modifications', reference: 'incendiary-weapons',
    summary: 'Improvised or black-market incendiaries reduce weapon damage by one but deal Aggravated to targets vulnerable to fire. A total failure deals three Aggravated to the user.'
  }
]

export function hunterWeaponRange(entry) {
  return WEAPON_CLASS_BY_ID[entry.classId]?.range ?? 'ranged'
}

export function buildHunterEquipment(entry) {
  let item
  if (entry.type === 'armor') {
    item = buildArmorData({ name: entry.name, classId: entry.classId })
  } else if (entry.classId) {
    item = buildWeaponData({ name: entry.name, classId: entry.classId })
  } else if (entry.type === 'weapon') {
    item = {
      name: entry.name,
      type: 'weapon',
      system: { quantity: 1, description: '', weaponType: 'ranged', weaponvalue: entry.damage ?? 0 }
    }
  } else {
    item = { name: entry.name, type: 'gear', system: { quantity: 1, description: entry.summary } }
  }

  item.flags ??= {}
  item.flags[MODULE_ID] ??= {}
  item.flags[MODULE_ID].hunterEquipment = entry.id
  if (entry.type === 'weapon' && (entry.id === 'stake' || !entry.classId)) {
    item.flags[MODULE_ID].weaponProperties = entry.summary
  }
  return item
}
