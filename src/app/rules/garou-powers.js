import { MODULE_ID } from '../../constants.js'
import { GAROU_IDENTITY_GIFTS, GAROU_TRIBE_GIFT_ROUTES } from './garou-gift-catalogue.js'

const CORE = 'Werewolf: The Apocalypse Core Rulebook'
const SHATTERED = 'Shattered Nation'
const CORE_GIFTS = 'Core Rulebook · Native Gifts'
const EXTRA_GIFTS = 'Shattered Nation · Native Gifts'
const COMMON = 'Core Rulebook · Common Rites'
const CORE_SOCIAL = 'Core Rulebook · Social Rites'
const MYSTICAL = 'Shattered Nation · Mystical Rites'
const SOCIAL = 'Shattered Nation · Social Rites'

function gift(id, name, page, level, renown, details, source = CORE) {
  return {
    id: 'gift-' + id,
    name, page, source, level, renown,
    group: source === CORE ? CORE_GIFTS : EXTRA_GIFTS,
    meta: 'Renown ' + level,
    ...details
  }
}

function rite(id, name, page, group, pool, difficulty, summary) {
  return {
    id: 'rite-' + id,
    name, page, group, pool, difficulty, summary,
    source: group === COMMON || group === CORE_SOCIAL ? CORE : SHATTERED
  }
}

export const GAROU_GIFTS = [
  gift('catfeet', 'Catfeet', '146', 1, 'Honor', {
    willpower: 1, action: 'Free', duration: 'One scene',
    pool: 'Wits + Survival if surprised', difficulty: '3 if surprised',
    summary: 'In any form, keep your balance on surfaces that can hold you and ignore falling damage from up to 10 meters per dot of Honor.'
  }),
  gift('eyes-of-the-owl', 'Eyes of the Owl', '146–147', 1, 'Wisdom', {
    willpower: 1, action: 'Free', duration: 'One scene',
    summary: 'See normally in natural darkness. Add Wisdom dice to any test that can resist a supernatural source of darkness.'
  }),
  gift('hares-leap', 'Hare’s Leap', '147', 1, 'Glory', {
    rage: 1, action: 'Full', pool: 'Strength + Glory',
    summary: 'Leap 3 meters horizontally or 2 meters vertically per success.'
  }),
  gift('penumbral-senses', 'Penumbral Senses', '147', 1, 'Wisdom', {
    willpower: 1, action: 'Free', duration: 'One scene',
    pool: 'Intelligence + Wisdom', difficulty: 'Local Gauntlet',
    summary: 'On a win, perceive the physical world and the Umbra together and interact with their inhabitants as the Storyteller allows.'
  }),
  gift('raging-strike', 'Raging Strike', '147', 1, 'Glory', {
    rage: 1, action: 'Free', duration: 'One attack',
    summary: 'Add Glory dice to one Brawl attack.'
  }),
  gift('staredown', 'Staredown', '147', 1, 'Honor', {
    rage: 1, action: 'Full', duration: 'One scene',
    pool: 'Charisma + Honor vs. Composure + Resolve when resisted',
    summary: 'In any form, meet a subject’s eyes within 2 meters to make them yield. Mundane subjects yield automatically. Use once per subject per scene, outside physical conflict.'
  }),
  gift('sharpened-senses', 'Sharpened Senses', '147–148', 4, 'Wisdom', {
    willpower: 1, action: 'Free', duration: 'One scene',
    summary: 'In any form, reduce the Difficulty of Awareness tests by your Wisdom, to a minimum of 2.'
  }),
  gift('spirit-of-the-fray', 'Spirit of the Fray', '148', 4, 'Glory', {
    specialCost: '1 Rage Check per additional opponent', action: 'Free', duration: 'One attack',
    summary: 'Apply a single attack roll to the original target and up to Glory additional opponents within reach, with the same bonuses and no extra penalty.'
  }),
  gift('thwarting-the-arrow', 'Thwarting the Arrow', '148', 4, 'Honor', {
    willpower: 1, action: 'Minor', duration: 'One scene',
    summary: 'In Crinos, add Honor dice to tests to avoid projectile weapons.'
  }),
  gift('body-shift', 'Body Shift', '148', 7, 'Glory', {
    rage: 1, action: 'Minor', duration: 'One scene',
    pool: 'Stamina + Glory', difficulty: '2 for moving dots',
    summary: 'Move one dot between Physical Attributes per point of margin, keeping each Attribute between 0 and 5. The Storyteller may also allow a test to squeeze through a tight space.'
  }),
  gift('jam-technology', 'Jam Technology', '148–149', 7, 'Honor', {
    rage: 1, action: 'Full', duration: 'One scene',
    pool: 'Resolve + Honor', difficulty: '2–6+, by device',
    summary: 'Disable every device within 20 meters that your successes can affect. Different kinds of equipment have different thresholds.'
  }),
  gift('tongue-of-the-beasts', 'Tongue of the Beasts', '149', 7, 'Wisdom', {
    willpower: 1, action: 'Full', duration: 'One scene',
    pool: 'Manipulation + Wisdom for information or Charisma + Wisdom for a task', difficulty: '2–5',
    summary: 'Speak to animals and understand what they can express. Test to persuade one to share information or do something for you.'
  }),
  gift('the-howl-carries', 'The Howl Carries', '131', 1, 'Wisdom', {
    willpower: 1, specialCost: '1 Willpower. Optional Rage Check to confine the howl to the bawn.',
    action: 'Free', duration: 'Until the next dusk or dawn',
    summary: 'Mundane wolves carry your howl for miles. Garou and some spirits recognize it, and humans cannot intercept the message.'
  }, SHATTERED)
]

export const GAROU_RITES = [
  rite('abjuration', 'Rite of Abjuration', '180', COMMON, 'Honor + Occult', 'Set by the Storyteller',
    'Drive out a possessing spirit or strip the spiritual properties from an object. Living targets must consent or be incapacitated.'),
  rite('rage', 'Rite of Rage', '181', COMMON, 'Glory + Intimidation', 'Participants, minimum 3. Add 2 for the stronger effect.',
    'On a win, each participant gains 1 Rage. Declare the stronger version before the test to grant 2 Rage instead.'),
  rite('tranquility', 'Rite of Tranquility', '181', COMMON, 'Wisdom + Performance', 'Participants, minimum 3',
    'On a win, reduce every participant’s Rage to 1. On a Brutal outcome the Rite fails and each participant takes 1 Superficial Willpower damage.'),
  rite('contrition', 'Rite of Contrition', '182', COMMON, 'Honor + Etiquette', '2 + chagrin penalty, or half the spirit’s Power, rounded up',
    'Make amends to a spirit or lift chagrin as part of atonement. Offer a small gift or bring something that represents the spirit.'),
  rite('forgetful-record', 'Rite of the Forgetful Record', '182', COMMON, 'Wisdom + Investigation', 'Number of participants',
    'Raise by 3 the Difficulty of identifying or finding participants through existing records. Memories stay intact. A new felony or registration breaks the protection.'),
  rite('living-caern', 'Rite of the Living Caern', '182', COMMON, 'Wisdom + Craft', '2 + Caern Value',
    'Maintain a caern’s current rating until the next monthly ceremony. If the Rite does not succeed during the full moon, the caern loses 1 dot.'),
  rite('shadow-passage', 'Rite of Shadow Passage', '182–183', COMMON, 'Any Renown + Occult', 'Local Gauntlet, reduced by 2 on the return to the physical world',
    'Let the participants cross between the physical world and the Umbra. Dedicated clothing and gear carried by another supernatural effect can accompany them.'),
  rite('dedication', 'Rite of Dedication', '183', COMMON, '', '',
    'Bind one outfit to a Garou so it follows them through shapeshifting and into the Umbra. Jewelry and small items in pockets can come along.'),
  rite('kinseeking', 'Rite of Kinseeking', '183', COMMON, 'Wisdom + Investigation', '2 nearby or 4 across town. Add 1 if Garou outside the pack are in the area.',
    'Pick up the scent of the closest Kin and gain 2 dice on relevant tests to find them over the next month.'),
  rite('spirit-summoning', 'Rite of Spirit Summoning', '183–184', COMMON, 'Honor + Persuasion vs. spirit’s Power', '',
    'Call a spirit to a place it can reach. On a win it stays for a scene and can decide for itself whether to help.'),
  rite('binding', 'Rite of Binding', '184', COMMON, 'Glory + Occult vs. spirit’s Power', '',
    'Bind a spirit to a place, object, or person for one week plus one per point of margin. A very friendly spirit consents without a test.'),
  rite('shame', 'Rite of Shame', '184', COMMON, '', '',
    'Raise the subject’s chagrin penalty to 2 and mark them until they atone. Removing the mark early incurs a 3-die Social penalty until it is restored.'),
  rite('patronage', 'Rite of Patronage', '184–185', COMMON, 'New patron’s Renown + Etiquette', '4 minus sessions since the last patron was chosen, minimum 1',
    'Ask a spirit to become the pack’s Patron. With the whole pack participating, a win grants its Favor alongside each member’s tribal Favor.'),
  rite('celebration', 'Rite of Celebration', '185', COMMON, 'Honor + Performance', 'Amount of Superficial Willpower damage chosen for recovery',
    'After a victory, attempt once per story to heal the chosen amount of Willpower damage for each pack member. Healing 1 Aggravated costs 2 points of that recovery.'),
  rite('caern-building', 'Rite of Caern Building', '185–186', COMMON, 'Wisdom + Craft', '5 to create, or 4 + current Caern Value to improve',
    'Prepare through a lunar cycle, then open a Caern Value 1 site or raise an existing caern by 1. Apply the caern XP rules for the pack’s own caern.'),
  rite('wolf-reborn', 'Rite of the Wolf Reborn', '186', COMMON, 'Target’s highest Renown + Leadership', '3',
    'The pack contributes 3 Rage to restore 1 Rage to a packmate who Lost the Wolf. The contribution is returned on an ordinary failure.'),
  rite('whispering-field', 'Rite of the Whispering Field', '186', COMMON, 'Wisdom + Survival', '2 + participants other than the Rite master',
    'For one lunar month, participants get two regular dice pinned to successes when detecting or tracking trespassers on the caern’s bawn.'),
  rite('shrouded-glen', 'Rite of the Shrouded Glen', '186', COMMON, 'Wisdom + Craft', '2 + Caern Value',
    'For one lunar month, add 2 dice to efforts to hide a caern and subtract 2 dice from tests to discover it accidentally.'),
  rite('passage', 'Rite of Passage', '187', CORE_SOCIAL, '', '',
    'A sept formally brings a young or newly changed Garou into its adult community.'),
  rite('satire', 'Satire Rite', '187', CORE_SOCIAL, '', '',
    'Perform a public satire that records a slight or offense in the community’s memory.'),
  rite('accomplishment', 'Rite of Accomplishment', '187', CORE_SOCIAL, '', '',
    'Tell the story of a Garou’s deeds and formally recognize what they have achieved.'),
  rite('gathering-for-the-departed', 'Gathering for the Departed', '187', CORE_SOCIAL, '', '',
    'Honor a Garou who has died with a ceremony suited to their pack and sept.'),
  rite('winter-wolf', 'Rite of the Winter Wolf', '187', CORE_SOCIAL, '', '',
    'Accompany a Garou who has chosen a final farewell by means of this rare solemn ceremony.'),
  rite('broken-sun', 'Rite of the Broken Sun', '72', MYSTICAL, 'Honor + Occult', 'Target’s highest Renown rating',
    'During an eclipse, prevent a present Garou from changing form or benefiting from mystical Rites until they complete the Rite of Contrition.'),
  rite('chiminage', 'Rite of Chiminage', '72', MYSTICAL, 'Wisdom + Etiquette', '2–6, by the spirit’s power',
    'Learn what an uncommunicative spirit wants. Deliver the offering to reduce the Difficulty of further Social tests with it by 1, or by 2 on a critical win.'),
  rite('grim-reach', 'Rite of the Grim Reach', '72', MYSTICAL, 'Glory + Survival', 'Local Gauntlet',
    'Make a 500-meter area hostile for a lunar month. Physical and Mental tests there are one step harder for intruders, and failures become total failures.'),
  rite('moons-fickle-grace', 'Rite of the Moon’s Fickle Grace', '73', MYSTICAL, 'Glory + Performance', '3',
    'Invoke the full moon’s favor until the next moonrise. Critical wins gain 2 successes, failures become total failures, and rerolls are unavailable.'),
  rite('renunciation', 'Rite of Renunciation', '73', MYSTICAL, '', '',
    'Leave your tribe and become Forsworn. Keep learned Gifts and Rites, lose tribal Favor and Ban, and learn only Native and Auspice Gifts while Forsworn.'),
  rite('borne-word', 'Rite of the Borne Word', '73', MYSTICAL, 'Honor + Etiquette if the spirit does not favor the pack', '3 or higher if the spirit is hostile',
    'Spend 3 Willpower across the participants so a swift spirit can carry a brief message and find the recipient if necessary.'),
  rite('shared-fury', 'Rite of Shared Fury', '74', MYSTICAL, 'Honor + Politics', 'Participants, minimum 3',
    'The participants pool and redistribute their Rage under the Rite master’s direction. Everyone must finish with at least 1 Rage.'),
  rite('caging', 'Rite of Caging', '74', MYSTICAL, 'Wisdom + Awareness', 'Local Gauntlet. Also meet the target’s current Willpower in successes.',
    'Use a meaningful item from a physical subject to obstruct their passage into the Umbra. They need one extra success on tasks involving spirits or the Umbra.'),
  rite('living-tale', 'Rite of the Living Tale', '75', MYSTICAL, 'Wisdom + Survival to recreate a specific scent', '3+, by scent complexity',
    'Perform alone to add scent to a story. Copying a specific scent requires a test and gives 1 die to Survival tests tracking the original in Lupus.'),
  rite('sacred-scar', 'Rite of the Sacred Scar', '75', MYSTICAL, 'Relevant Renown + Craft', 'Recipient’s matching Renown, minimum 2',
    'The recipient spends 5 XP to gain an effective dot of the Rite’s Renown on Gifts and Rites relevant to the glyph. They cannot assist the ceremony.'),
  rite('ban-shared', 'Rite of the Ban Shared', '75', SOCIAL, '', '',
    'Publicly pledge to follow another tribe’s Ban. Treat the pledge as a roleplaying commitment.'),
  rite('pledging', 'Pledging Rite', '75', SOCIAL, '', '',
    'Swear to accomplish a specific objective beyond a general victory. On fulfillment, the Storyteller can award Glory or soften chagrin.')
]

const identityGifts = GAROU_IDENTITY_GIFTS.map((gift) => ({ ...gift, source: CORE, meta: 'Renown ' + gift.level }))
const giftsById = new Map(identityGifts.map((gift) => [gift.id, gift]))

export function garouGiftEntries(slot, identityId) {
  if (slot === 'native') return GAROU_GIFTS
  if (slot === 'auspice') return identityGifts.filter((gift) => gift.giftType === identityId)
  if (slot !== 'tribe') return []
  return (GAROU_TRIBE_GIFT_ROUTES[identityId] ?? []).map(([id, level, page]) => ({
    ...giftsById.get(id), giftType: identityId, level, page, meta: 'Renown ' + level
  }))
}

export function garouEntryForItem(item) {
  if (garouPowerKind(item) === 'rite') return GAROU_RITES.find((entry) => garouPowerMatches(item, entry))
  const type = item.system.giftType
  const knownType = garouGiftEntries(type === "native" ? "native" : "auspice", type)
  const route = knownType.length ? knownType : garouGiftEntries('tribe', type)
  const id = item.getFlag(MODULE_ID, "garouPowerId")
  return route.find((entry) => garouPowerMatches(item, entry)) ?? giftsById.get(id)
}

export function giftCostLabel(entry) {
  if (entry.costText || entry.specialCost) return entry.costText || entry.specialCost
  return [
    entry.rage ? entry.rage + (entry.rage === 1 ? ' Rage Check' : ' Rage Checks') : '',
    entry.rageSpend ? entry.rageSpend + ' Rage' : '',
    entry.willpower ? entry.willpower + ' Willpower' : ''
  ].filter(Boolean).join(' + ')
}

function sameName(name) {
  return String(name ?? '').trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
}

export function garouPowerKind(item) {
  if (item.type === 'gift') return item.system.giftType === 'rite' ? 'rite' : 'gift'
  if (item.type === 'customRoll' && item.getFlag(MODULE_ID, 'garouRite')) return 'rite'
  return null
}

export function garouPowerMatches(item, entry) {
  return (entry.id && item.getFlag(MODULE_ID, 'garouPowerId') === entry.id) || sameName(item.name) === sameName(entry.name)
}

function fixedDicePool(actor, pool) {
  if (!/^[a-z]+ \+ [a-z]+$/i.test(pool ?? '')) return {}
  const traits = pool.toLowerCase().split(' + ')
  const paths = traits.map((trait) => {
    const group = ['attributes', 'skills', 'renown'].find((key) => Object.hasOwn(actor.system[key] ?? {}, trait))
    return group && group + '.' + trait
  })
  return paths.every(Boolean) ? Object.fromEntries(paths.map((path, index) => [index, { path }])) : {}
}

export function garouPowerData(actor, kind, entry) {
  const giftType = kind === 'gift' ? (entry?.giftType ?? 'native') : 'rite'
  if (!entry) return { name: 'New ' + (kind === 'gift' ? 'Gift' : 'Rite'), type: 'gift', system: { giftType } }
  return {
    name: entry.name,
    type: 'gift',
    system: {
      giftType,
      description: entry.summary,
      source: { book: entry.source, page: entry.page.split('–')[0] },
      dicepool: fixedDicePool(actor, entry.pool),
      ...(kind === 'gift' ? { level: entry.level, renown: entry.renown.toLowerCase(), cost: entry.rage ?? 0, willpowercost: entry.willpower ?? 0 } : {})
    },
    flags: { [MODULE_ID]: { garouPowerId: entry.id } }
  }
}
