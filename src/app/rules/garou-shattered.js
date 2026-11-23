const source = (page) => 'Shattered Nation · p. ' + page

const personal = (id, name, kind, group, dots, description, detailsPlaceholder) => ({
  id: 'adv-' + id, name, kind, group, dots, description, source: source(130),
  ...(detailsPlaceholder ? { hasDetails: true, detailsPlaceholder } : {})
})

export const SHATTERED_ADVANTAGES = [
  personal('stench', 'Stench', 'flaw', 'Looks', '1', 'Lose 1 die to seduction and similar tests and 2 to Stealth against foes who can smell you, except when upwind.'),
  personal('transparent', 'Transparent', 'flaw', 'Looks', '1', 'Lose 1 die on Subterfuge tests and cannot gain dots in Subterfuge.'),
  personal('improviser', 'Improviser', 'merit', 'Rites', '1', 'Reduce dice penalties for poor conditions when performing a Rite by up to 2.'),
  personal('moot-caller', 'Moot Caller', 'merit', 'Rites', '2', 'Master five social Rites. You can assist at a moot when its organizers permit it.', 'The five social Rites'),
  personal('rite-master', 'Rite Master', 'merit', 'Rites', '3', 'Gain 1 die on tests to recall or perform Rites.'),
  personal('knowledge-hungry', 'Knowledge Hungry', 'flaw', 'Other', '1', 'Pass Difficulty 3 Willpower to resist pursuing a chance to study your chosen subject.', 'Subject of study'),
  personal('additional-ban', 'Additional Ban', 'flaw', 'Mythic Flaws', '2', 'Observe a second tribe’s Ban alongside your own.', 'Other tribe and Ban')
]

const packTrait = (id, name, kind, dots, summary) => ({
  id: 'pack-' + id, name, kind, dots, summary, source: source(131),
  group: kind === 'merit' ? 'Merits' : 'Flaws', meta: dots + ' dots'
})

export const SHATTERED_PACK_TRAITS = [
  packTrait('bolt-holes', 'Bolt Holes', 'merit', '1–3', 'Gain one die per dot to avoid discovery or escape pursuit in the pack’s territory.'),
  packTrait('bullies', 'Bullies', 'flaw', '1', 'Lose one die on most Social tests with local Garou due to a reputation for enforcing a former ruler’s will.'),
  packTrait('custodians', 'Custodians', 'flaw', '2', 'The pack owes the sept a thankless duty. Failure or refusal exposes every member to chagrin.'),
  packTrait('under-siege', 'Under Siege', 'flaw', '2', 'Once per story, rivals can reduce Territory to one dot or deny one shared Merit or Background.')
]

const type = (id, name, page, [territory, community, spirit], advantages, flaws, extras, summary) => ({
  id: 'pack-type-' + id, name, source: source(page), ratings: { territory, community, spirit }, advantages, flaws, extras, summary
})

export const SHATTERED_PACK_TYPES = [
  type('activists', 'Activists', 20, [2, 3, 1], ['Allies 3'], ['Enemies 4'], 'Contacts, Fame, Resources',
    'Push for political or social change with support from people who share the cause. A well-organized faction stands in the pack’s way.'),
  type('avengers', 'Avengers', 21, [2, 1, 3], ['Spirit Pact 3 · Power 2, Companion'], ['Enemies or Adversaries 4'], 'Allies, Contacts, Mentor',
    'Brought together by a loss, the pack works to punish those responsible, with a spirit that shares its purpose.'),
  type('banishers', 'Banishers', 21, [1, 2, 3], ['Mentor 2'], ['Adversaries 4'], 'Allies, Spirit Pact, Talisman',
    'Investigate possession and drive dangerous spirits away. A hostile Garou or spirit wants repayment for a past conflict.'),
  type('caern-guard', 'Caern Guard', 21, [2, 1, 3], ['Talisman 2'], ['Adversaries 4'], 'Local Allies or Contacts, Mentor',
    'Hold a caern on the sept’s behalf against a dangerous pack or spirit.'),
  type('couriers', 'Couriers', '21–22', [1, 3, 2], ['Contacts 2'], ['Enemies 4'], 'Allies, Resources, Spirit Pact',
    'Move people, goods, or information between septs and caerns. Mundane authorities are suspicious of the pack’s travels.'),
  type('diplomats', 'Diplomats', 22, [3, 1, 2], ['Mentor 2'], ['Adversaries 4'], 'Contacts, Spirit Pact, Talisman',
    'Mediate disputes and make agreements with spirits. A powerful loser from an earlier settlement holds a grudge.'),
  type('evangelists-for-luna', 'Evangelists for Luna', 22, [2, 1, 3], ['Spirit Pact 3 · Power 2, Host'], ['Pact Condition 1', 'Adversaries 2'], 'Unaware human Allies, Mentor, Resources',
    'Serve a lunar cult with a pact tied to its teachings. An opposing cult or orthodox pack challenges its doctrine.'),
  type('hell-raisers', 'Hell Raisers', 22, [2, 3, 1], ['Fame 1'], ['Stalkers 1', 'Enemies 2'], 'Allies, Contacts, Resources',
    'Make connections through a counterculture scene. Fans, rivals, and an obsessive follower complicate the pack’s ability to keep secrets.'),
  type('monkeywrenchers', 'Monkeywrenchers', 23, [2, 3, 1], ['Allies 2'], ['Person of Interest 2'], 'Contacts, Fame, Mask',
    'Direct action against ecological damage earns allies and unwanted official attention.'),
  type('occultists', 'Occultists', 23, [1, 2, 3], ['Talisman 2'], ['Dark Secret 1', 'Enemies 2'], 'Allies, Mentor, Spirit Pact',
    'Investigate the overlap between the mundane and the spirit world. A dangerous research secret and suspicious investigators create pressure.'),
  type('penitents', 'Penitents', 23, [1, 3, 2], ['Mentor 2'], ['Infamy 2'], 'Allies, Contacts, Spirit Pact',
    'The sept requires these Garou to work together under a supervisor. The pack’s alleged or actual offenses follow it.'),
  type('reformers', 'Reformers', 25, [3, 1, 2], ['Talisman 2'], ['Adversaries 4'], 'Mentor, Resources, Spirit Pact',
    'Seek a new direction for Garou society. A powerful Garou or pack is committed to stopping the reforms.'),
  type('scavengers', 'Scavengers', 25, [1, 3, 2], ['Allies 2'], ['Adversaries 4'], 'Contacts, Mentor, Spirit Pact',
    'Find resources and territory in places people abandon. Another pack contests their claim.'),
  type('veil-keepers', 'Veil Keepers', 25, [2, 3, 1], ['Allies 2'], ['Enemies 4'], 'Contacts, Mask, Resources',
    'Protect the Veil and cover up supernatural incidents. Human allies help, and investigators are beginning to connect the incidents.'),
  type('watchers', 'Watchers', 26, [3, 1, 2], ['Talisman 2'], ['Adversaries 4'], 'Contacts among relatives and friends of sept members, Mask, Mentor',
    'Watch septs for signs of corruption. An exposed former insider seeks revenge.')
]
