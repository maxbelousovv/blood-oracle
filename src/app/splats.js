/**
 * What each kind of character has, and what it looks like.
 *
 * wod5e gives mortals, ghouls and vampires the same data model, so the
 * difference is entirely in what is worth showing. A mortal has no Blood and no
 * Disciplines; a ghoul has borrowed Disciplines and a Humanity to lose, but no
 * Hunger of its own — the system forces that to zero — and no Blood Potency,
 * clan Bane or Resonance, all of which belong to the Blood it does not have.
 */

export const SPLATS = {
  vampire: {
    label: 'Vampire',
    tabs: ['bio', 'stats', 'blood', 'disciplines', 'merits', 'inventory', 'notes'],
    hunger: true,
    potency: true,
    resonance: true,
    clanBane: true,
    rouse: true,
    resistFrenzy: true,
    remorse: true
  },
  ghoul: {
    label: 'Ghoul',
    // Disciplines stay: a ghoul's domitor grants them, usually at one dot.
    tabs: ['bio', 'stats', 'blood', 'disciplines', 'merits', 'inventory', 'notes'],
    hunger: false,
    potency: false,
    resonance: false,
    clanBane: false,
    rouse: false,
    // Ghouls can frenzy, and it is one of the reasons they are dangerous.
    resistFrenzy: true,
    // The system gives ghouls a Remorse roll too.
    remorse: true
  },
  spc: {
    label: 'Story character',
    tabs: ['bio', 'stats', 'merits', 'inventory', 'notes']
  },
  hunter: {
    label: 'Hunter',
    tabs: ['bio', 'stats', 'creed', 'edges', 'merits', 'inventory', 'notes']
  },
  werewolf: {
    label: 'Werewolf',
    tabs: ['bio', 'stats', 'garou-identity', 'forms', 'garou-powers', 'merits', 'inventory', 'notes']
  },
  mortal: {
    label: 'Mortal',
    tabs: ['bio', 'stats', 'merits', 'inventory', 'notes'],
    hunger: false,
    potency: false,
    resonance: false,
    clanBane: false,
    rouse: false,
    resistFrenzy: false
  }
}

export const STORY_CHARACTER_TYPES = [
  { value: 'mortal', label: 'Mortal' },
  { value: 'ghoul', label: 'Ghoul' },
  { value: 'vampire', label: 'Vampire' },
  { value: 'hunter', label: 'Hunter' },
  { value: 'werewolf', label: 'Werewolf' },
  { value: 'spirit', label: 'Spirit' }
]

export function storyCharacterType(actor) {
  return actor?.type === 'spc' ? actor.system?.spcType || 'mortal' : null
}

/** A ghoul shares the vampire gamesystem, including when it is an SPC. */
export function usesHunger(actor) {
  const type = storyCharacterType(actor)
  if (type) return type === 'vampire'
  return actor?.system?.gamesystem === 'vampire' && actor.type !== 'ghoul'
}

export function splatOf(actor) {
  const type = storyCharacterType(actor)
  if (type) {
    const vampire = type === 'vampire'
    const ghoul = type === 'ghoul'
    const tabs = [...SPLATS.spc.tabs]
    if (vampire || ghoul) tabs.push('disciplines')
    if (type === 'hunter') tabs.push('edges')
    if (type === 'werewolf' || (type === 'spirit' && actor.system.settings?.enableGifts)) tabs.push('gifts')
    return { ...SPLATS.spc, tabs, resistFrenzy: vampire || ghoul, remorse: vampire || ghoul }
  }
  return SPLATS[actor?.type] ?? SPLATS.mortal
}

/** Class applied to the sheet root so the palette can shift per splat. */
export function splatClass(actor) {
  return `bo-splat-${actor?.type ?? 'mortal'}`
}
