import { SHATTERED_LORESHEETS } from './garou-shattered-loresheets.js'

const source = (page) => 'Werewolf: The Apocalypse Core Rulebook · p. ' + page
const lore = (id, name, page, summary, levels) => ({
  id: 'w5-' + id, name, source: source(page), summary,
  levels: levels.map(([name]) => name), summaries: levels.map(([, text]) => text)
})

export const GAROU_LORESHEETS = [
  ...SHATTERED_LORESHEETS,
  lore('monkeywrenchers', 'Monkeywrenchers', 295, 'A loose network of Garou that shares leads on Pentex fronts and coordinates opposition to them.', [
    ['Demagogue', 'Once per story, add 2 dice to incite a human crowd to violent action.'],
    ['Firebug', 'After preparation agreed with the Storyteller, you can time a fictional fire for a chosen scene. Security sets the preparation time.'],
    ['Blowout Bash', 'Once per story, organize a public event that draws attention to your cause. Gain 3 local Fame for the rest of the session.'],
    ['Delegator', 'Add 2 dice to shift blame for your own action. Lose 1 die on Social tests with Garou in a scene where you use it.'],
    ['Paper Trail', 'Once per chronicle, obtain existing documentary evidence of a Pentex front’s misconduct. Pentex learns about you unless you expose another member.']
  ]),
  lore('project-twilight', 'Project Twilight', 296, 'You have contacts or leverage inside a government operation that hunts werewolves.', [
    ['Improper Procedure', 'Once per story, make a minor piece of relevant evidence disappear for a small benefit chosen by the Storyteller.'],
    ['Airtight Alibi', 'Once per story, turn up false evidence that places you elsewhere, on classified and redacted federal paperwork.'],
    ['Stolen Valor', 'Once per story, claim credit for a past kill to add 3 dice to a relevant Social test. Further Social tests that scene lose 1 die.'],
    ['Heads Up', 'Once per chronicle, get advance details of a planned Project Twilight action against the pack.'],
    ['The Red Phone', 'Once per chronicle, distribute 5 bonus dice among tests involving hunter organizations. Any failure attracts a systemic enemy.']
  ]),
  lore('umbral-traveler', 'Umbral Traveler', 297, 'Experience in the Spirit Wilds gives you unusual ways to navigate them and recognize their inhabitants.', [
    ['Silver Steps', 'As Rite master, lower Difficulty by 1 when returning to the physical world via Shadow Passage.'],
    ['Web Music', 'Once per scene, use an existing web to reliably draw one nearby pattern spider’s attention.'],
    ['Underworld Initiate', 'See ghosts in the Umbra or haunting the physical world, unless hidden by a supernatural power. Communication still depends on the ghost.'],
    ['Spirit Sustenance', 'Skipping the Willpower cost to remain in the Umbra deals Superficial Health damage in place of Aggravated.'],
    ['Chthonic Secret', 'Safeguard an important Umbral secret agreed with the Storyteller. The relevant powerful spirit knows you have it.']
  ]),
  lore('renunciate-of-fenris', 'Renunciate of Fenris', 298, 'You broke with Fenris and joined another tribe. Your time under Wolf still shapes how Garou see you and how you handle Rage.', [
    ['Bootlicker', 'Once per session, recover 1 Willpower after a higher-Renown Garou orders you into a conflict in which you spent Willpower to reroll.'],
    ['Repudiated Cultist', 'Treat Renown as 1 lower in moot Social interactions. An extra successful Rage Check can leave you at Rage 1 when a failed check would otherwise cost you the Wolf.'],
    ['Unbroken', 'Add 2 dice to resist supernatural fear if resistance is possible. Doing so costs 1 die to resist frenzy for the rest of the scene.'],
    ['Channeled Fury', 'Once per scene, succeed on one Rage Check to activate a Gift with a pool, and add a Brutal result to its activation test.'],
    ['Last Howl', 'Once per chronicle, make a Rage Check as your final Hauglosk box is marked. On a failed check, clear that final box.']
  ]),
  lore('the-black-spiral', 'The Black Spiral', 299, 'You know unwholesome secrets associated with the Black Spiral Dancers and their Wyrm-aligned patrons.', [
    ['Black Spiral Glyph', 'You know the genuine glyph. Lose 2 dice on Social tests with Garou who know you can draw it, except for your pack.'],
    ['Bad Company', 'Once per story, consult a Wyrm-connected contact. Your Renown then drops by 2 for Social interaction for the session set by the Storyteller.'],
    ['Spiral Cyst', 'Hide in a known Wyrm-aligned refuge that temporarily acts as a Secure Safe House and leaves you Zeroed while there.'],
    ['Inviolate', 'One agreed Wyrm spirit refuses to harm you. Anyone who notices can draw their own conclusions.'],
    ['Solving the Labyrinth', 'Once per story, isolate a Black Spiral Dancer from their patron’s influence. Test Intelligence or Charisma + Insight once every 3 nights until you reach twice the subject’s Willpower in successes.']
  ])
]
