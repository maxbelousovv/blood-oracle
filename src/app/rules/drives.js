// Drive summaries for the character sheet and character creator.
export const DRIVES = [
  {
    name: 'Curiosity',
    description: 'Every discovery about the quarry drives the Hunter to dig deeper.',
    redemption: 'The cell learns something new about the quarry.'
  },
  {
    name: 'Vengeance',
    description: 'The Hunter wants payback for harm the quarry or its kind inflicted on them or someone close to them.',
    redemption: 'The cell harms the quarry or a similar creature, directly or through a proxy.'
  },
  {
    name: 'Oath',
    description: 'The Hunter has sworn to oppose the creatures of the night and means to keep that promise.',
    redemption: 'The cell helps the Hunter act on their oath or take a step toward fulfilling it.'
  },
  {
    name: 'Greed',
    description: 'The Hunter covets the quarry’s gains and sees them as ill-gotten.',
    redemption: 'Obtain resources from the quarry or a creature like it.'
  },
  {
    name: 'Pride',
    description: 'The Hunter wants to prove their worth by overcoming foes with supernatural gifts.',
    redemption: 'Outdo the quarry in a challenge, directly or indirectly.'
  },
  {
    name: 'Envy',
    description: 'The Hunter covets the quarry’s gifts and will risk everything to become like it.',
    redemption: 'Win the quarry’s favor or obtain a sample of whatever gives it power.'
  },
  {
    name: 'Atonement',
    description: 'The Hunter once helped a monster, knowingly or otherwise, and now takes risks to make amends for the harm to innocents.',
    redemption: 'The cell shields someone from the quarry or a similar creature by putting itself in danger, directly or through a proxy. The Hunter can also take that risk to protect a cellmate.'
  },
  {
    name: 'Guilt',
    description: 'The Hunter hunts because of loss. No matter how desperately they fight, they cannot escape the feeling that they owe a debt to the fallen.',
    redemption: 'The Hunter must make specific amends for their real or imagined wrongs. This could mean an act of repentance, succeeding in a situation that recalls a past failure, or keeping a promise against all odds. When Redemption is needed, the player and Storyteller decide what it requires.'
  },
  {
    name: 'Duty',
    description: 'The Hunter feels obligated to the Hunt and keeps going because others are counting on them.',
    redemption: 'The Hunter must reach a goal or complete a task expected of them by their lineage guide, their cell, or another authority they feel answerable to.'
  }
]

export function findDrive(name) {
  const key = name?.trim().toLowerCase()
  return DRIVES.find((drive) => drive.name.toLowerCase() === key)
}
