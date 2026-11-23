import { SUPPLEMENT_EDGES, SUPPLEMENT_PERKS, SUPPLEMENT_VARIANTS } from './hunter-supplements.js'

// Original summaries keyed by the native wod5e Edge identifiers.
const CORE_EDGES = {
  arsenal: {
    category: 'Assets',
    pool: 'Intelligence + Craft (own arsenal) or Manipulation + Streetwise (contacts)',
    summary: 'At the start of a scene, test at Difficulty 4 to obtain one mundane firearm or melee weapon for that scene. One attempt per scene, with access to your cache or contact.',
    perks: [
      ['Team Requisition', 'Provide one extra copy per point of margin. All copies share the same perks and duration.'],
      ['Special Features', 'Add one approved feature per point of margin.'],
      ['Exotics', 'Source rare weapons or ammunition that exploit a weakness. Exceptional requests may raise Difficulty.'],
      ['Untraceable', 'The weapons themselves cannot lead anyone back to the Hunters.']
    ]
  },
  fleet: {
    category: 'Assets',
    pool: 'Intelligence + Technology (own fleet) or Manipulation + Persuasion (contacts)',
    summary: 'At the start of a scene, test at Difficulty 4 to obtain one civilian or commercial vehicle for that scene. One attempt per scene, with access to your garage or contact. Driving or piloting still requires the appropriate Skill.',
    perks: [
      ['Armor', 'Protect ground vehicles from small arms; aircraft passengers gain two dice against ranged attacks.'],
      ['Performance', 'Add the margin to pursuit Driving tests, capped at three dice.'],
      ['Surveillance', 'Add the margin to stakeout tests from the vehicle, capped at three dice.'],
      ['Untraceable', 'The vehicles themselves cannot lead anyone back to the Hunters.']
    ]
  },
  ordnance: {
    category: 'Assets',
    pool: 'Composure + Science (self-made) or Composure + Streetwise (contacts)',
    summary: 'At the start of a scene, test at Difficulty 4 to obtain one mine or timed or remote explosive for that scene. One attempt per scene, with access to your cache or contact.',
    perks: [
      ['Multiple Payloads', 'Provide one extra matching charge per point of margin.'],
      ['Non-Lethal Munitions', 'Use options such as flashbangs or gas. A typical penalty to affected targets is the margin, capped at three dice.'],
      ['Exotics', 'Weaponize rare substances to exploit a weakness. The Storyteller may increase Difficulty.'],
      ['Disguised Delivery', 'Hide a device in an everyday object. Detection gets harder by the margin, capped at three.']
    ]
  },
  library: {
    category: 'Assets',
    pool: 'Resolve + Academics',
    summary: 'Research the quarry for about a day, then test for a clue. Higher margin yields better information. One attempt per scene; after a win, wait until the next session.',
    perks: [
      ['Where They Hide', 'Add the margin to one attempt to locate the quarry’s lair, capped at three dice.'],
      ['Who They Are', 'Add the margin to one attempt to identify quarry that can pass as mundane, capped at three dice.'],
      ['How to Halt Them', 'Add the margin to one attempt to hide or protect someone or somewhere from the quarry, capped at three dice.'],
      ['How to Harm Them', 'Add the margin to one attempt to exploit the quarry’s supernatural weakness, capped at three dice.']
    ]
  },
  improvisedgear: {
    category: 'Aptitudes',
    pool: 'Intelligence + Craft, Technology, or Science, depending on the tool',
    summary: 'Test at Difficulty 4 to make one temporary tool from available materials. It lasts through the scene and grants two dice to one Skill or makes an otherwise impossible action feasible. Normally requires time and room to work.',
    perks: [
      ['Frugal', 'With a bag of spare parts, you can make tools even where there are few materials.'],
      ['Mass Production', 'Make one extra identical tool per point of margin.'],
      ['Specialization', 'Tools for one chosen Skill add three dice. Repeat for a different Skill.', true],
      ['Speed Crafting', 'Craft under pressure in three turns minus margin, to a minimum of one.']
    ]
  },
  globalaccess: {
    category: 'Aptitudes',
    pool: 'Intelligence + Technology',
    summary: 'Spend a scene and test at Difficulty 4 to read data from a secure system. Offline systems require local access. Editing records requires a Perk.',
    perks: [
      ['Watching Big Brother', 'Alter surveillance footage to add or remove people.'],
      ['All-Access Pass', 'Bypass locks and manipulate electronic security, typically at Difficulty 3–5.'],
      ['Money Tap', 'Move funds or alter financial records. Against a target, reduce Resources by the margin for a month. Personal gain can raise Danger.'],
      ['The Letter of the Law', 'Plant or erase criminal records. Difficulty starts at 3 for local offenses and can reach 5 or more internationally.']
    ]
  },
  dronejockey: {
    category: 'Aptitudes',
    pool: 'Wits + Technology to operate; Intelligence + Craft to repair',
    summary: 'Choose a drone model and two Skills. Use the control pool for those Skills and one die for others. The drone has five Health. A Difficulty 3 repair test restores Health by margin. A Difficulty 2 Intelligence + Science test can extend its one-day runtime by the margin in days.',
    perks: [
      ['Autonomous', 'Program simple behavior. Complex routines need Resolve + Technology. The drone rolls five dice on autopilot.'],
      ['Variants', 'Add another model with two Skills. Extra active drones require Autonomous.', true],
      ['Specialist Skill', 'Give one drone model another Skill, with equipment if approved.', true],
      ['Armaments', 'Fit a taser or SMG to a drone variant. Roll five dice, or the control pool with the matching Specialist Skill.'],
      ['Payload', 'Carry unusually large cargo. Loads bigger than the drone slow it down and give observers two extra dice to spot it.']
    ]
  },
  beastwhisperer: {
    category: 'Aptitudes',
    pool: 'Charisma + Animal Ken for commands; Composure + Animal Ken to train',
    summary: 'Choose an animal type and its key pools. A loyal animal obeys simple commands; dangerous orders and training a replacement each call for a Difficulty 4 test using the relevant pool.',
    perks: [
      ['Incorruptible', 'Supernatural influence cannot turn the animal against its handler.'],
      ['Menagerie', 'Add another animal type to your options. Bringing multiple animals can draw attention.'],
      ['Complex Commands', 'Issue detailed orders with Charisma + Animal Ken; use Intelligence + Animal Ken to interpret reports.'],
      ['Incognito', 'The animal stays unnoticed until someone actively looks for it, where plausible.']
    ]
  },
  sensetheunnatural: {
    category: 'Endowments',
    pool: 'Wits + Occult or Science',
    summary: 'Hold a focus and test at Difficulty 3–5 to sense nearby supernatural presence without identifying its source. Further attempts in the same scene cost one Willpower each.',
    perks: [
      ['Creature Specialization', 'Gain two dice to sense one chosen creature type. Repeat for other types.', true],
      ['Range', 'Sense across roughly a city block and tell whether the source is in the room or farther away.'],
      ['Precision', 'Identify which individual in the room is supernatural. A matching specialization can reveal its type.'],
      ['Handsfree', 'Use this Edge without holding a focus.']
    ]
  },
  repeltheunnatural: {
    category: 'Endowments',
    pool: 'Resolve + Occult or Science',
    summary: 'Brandish a focus and win a test to keep a creature from approaching or engaging you in close combat. Retest each turn you move. A failed test ends the effect and prevents another attempt against that creature this scene.',
    perks: [
      ['Ward', 'Protect everyone within about two metres plus one metre per point of margin.'],
      ['Damage', 'Strike the repelled creature with the focus for +0 Aggravated damage, then retest immediately to keep the protection.'],
      ['Creature Specialization', 'Gain two dice to repel one chosen creature type. Repeat for other types.', true],
      ['Handsfree', 'Use this Edge without holding a focus.']
    ]
  },
  thwarttheunnatural: {
    category: 'Endowments',
    pool: 'Composure + Occult or Science',
    summary: 'Hold a focus and spend one Willpower to negate a targeted supernatural effect you could normally resist, or to roll against one that normally takes effect automatically. Purely physical attacks are outside its scope.',
    perks: [
      ['Creature Specialization', 'Gain two dice to resist one chosen creature type. Repeat for other types.', true],
      ['Ward', 'Protect others within about two metres plus one metre per point of margin. You spend the Willpower and make the resistance tests.'],
      ['Recognition', 'After resisting, learn that you were targeted and get a hint about what the power would have done.'],
      ['Handsfree', 'Use this Edge without holding a focus.']
    ]
  },
  artifact: {
    category: 'Endowments',
    pool: 'Intelligence + Occult or Science',
    summary: 'Using the artifact grants one die to a single associated Skill. The bonus never applies to its own Edge tests. A suitable artifact can serve as a focus; recovering a lost one may take an entire story.',
    perks: [
      ['Empower', 'Once per scene, test at Difficulty 4 to raise the bonus to three dice. On failure, take Superficial Willpower damage equal to the shortfall.'],
      ['Attraction', 'Use the artifact as bait for two dice on an ambush. It may draw supernatural parties or the organization that lost it.'],
      ['Detection', 'Hold the artifact and test at Difficulty 3–5 to sense a nearby supernatural presence. Further attempts in the scene cost one Willpower each.'],
      ['Shield', 'While carrying it, halve physical damage from supernatural sources. Superficial damage is halved again.']
    ]
  }
}

export const HUNTER_EDGES = Object.fromEntries(
  Object.entries({ ...CORE_EDGES, ...SUPPLEMENT_EDGES }).map(([id, edge]) => [
    id, {
      ...edge,
      perks: [...(edge.perks ?? []), ...(SUPPLEMENT_PERKS[id] ?? [])],
      variants: SUPPLEMENT_VARIANTS[id] ?? []
    }
  ])
)
