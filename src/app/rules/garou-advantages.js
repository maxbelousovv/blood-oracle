import { SHATTERED_ADVANTAGES } from './garou-shattered.js'

const core = 'Werewolf: The Apocalypse Core Rulebook'
const trait = (id, name, group, dots, kind, page, description, options = {}) => ({
  id: 'adv-' + id, garouId: 'adv-' + id, name, group, dots, kind, page,
  description, source: core + ' · p. ' + page, ...options
})
const merit = (id, name, group, dots, page, description, options) => trait(id, name, group, dots, 'merit', page, description, options)
const flaw = (id, name, group, dots, page, description, options) => trait(id, name, group, dots, 'flaw', page, description, options)
const background = (id, name, dots, page, description, options) => merit(id, name, 'Backgrounds', dots, page, description, options)
const details = (detailsPlaceholder) => ({ hasDetails: true, detailsPlaceholder })
const repeat = (placeholder) => ({ ...details(placeholder), repeatable: true })

export const GAROU_ADVANTAGES = [
  ...SHATTERED_ADVANTAGES,
  merit('caern-access', 'Caern Access', 'Caern', '1', '98', 'Use an agreed caern belonging to another sept as long as your activity respects its safety and the sept’s work.', details('Caern and sept')),
  merit('awakened-caern', 'Awakened Caern', 'Caern', '5', '98', 'Add 1 to the Caern Value of the first caern you join or discover. The Storyteller can let pack members split the five dots. The bonus applies once.'),
  flaw('caern-pariah', 'Caern Pariah', 'Caern', '1', '98', 'Nearby caerns bar you or demand a high price for entry. The caern of your own sept is exempt.', details('Territory')),
  merit('day-job', 'Day Job', 'Day Job', '1', '98', 'Add 1 die to relevant tests when your job provides cover for being Garou.', details('Job')),
  merit('corroborated-day-job', 'Corroborated Day Job', 'Day Job', '2', '98', 'Add 2 dice when your job covers your Garou activities and people at work can vouch for you.', details('Job and colleagues')),
  merit('linguistics', 'Linguistics', 'Linguistics', '1 per language', '98', 'Read, write, and speak one additional language per dot.', details('Languages')),
  flaw('illiterate', 'Illiterate', 'Linguistics', '2', '98', 'You cannot read or write. Academics and Science are capped at 1, and their Specialties cannot cover modern knowledge.'),
  merit('clement-lupus', 'Clement Lupus', 'Looks', '1', '98', 'People usually take your Lupus form for a dog unless given a reason to suspect otherwise.'),
  merit('beautiful', 'Beautiful', 'Looks', '2', '98', 'Add 1 die to applicable Social pools when you can be seen.'),
  merit('stunning', 'Stunning', 'Looks', '4', '98', 'Add 2 dice to applicable Social pools when you can be seen.'),
  flaw('repulsive', 'Repulsive', 'Looks', '2', '98', 'Lose 2 dice from applicable Social pools when you can be seen.'),
  flaw('ugly', 'Ugly', 'Looks', '1', '98', 'Lose 1 die from applicable Social pools when you can be seen.'),
  merit('obscure-safe-house', 'Obscure Safe House', 'Safe House', '2', '99', 'Attempts to locate you and others at your safe house lose 2 dice.', details('Location')),
  merit('secure-safe-house', 'Secure Safe House', 'Safe House', '2', '99', 'Add 2 dice to detect or prevent an unauthorized entry into your safe house.', details('Location')),
  flaw('hopeless-addiction', 'Hopeless Addiction', 'Substance Abuse', '2', '99', 'Lose 2 dice if you did not use the substance last scene, except when trying to obtain it immediately.', details('Substance')),
  flaw('addiction', 'Addiction', 'Substance Abuse', '1', '99', 'Lose 1 die if you did not use the substance last scene, except when trying to obtain it immediately.', details('Substance')),
  merit('moon-quickened', 'Moon-Quickened', 'Supernatural Situations', '1', '100', 'Your first howl at the moon each night can heal 1 Superficial Willpower damage.'),
  merit('moon-riled', 'Moon-Riled', 'Supernatural Situations', '3', '100', 'Gain 1 extra Rage the first time you howl at the moon each night.'),
  flaw('folkloric-bane', 'Folkloric Bane', 'Supernatural Situations', '1', '100', 'Take Aggravated damage from a folkloric weakness chosen with the Storyteller.', details('Bane and its effect')),
  flaw('folkloric-block', 'Folkloric Block', 'Supernatural Situations', '1', '100', 'Withdraw from the chosen block or spend 1 Willpower to overcome it. Each block is a separate Flaw.', repeat('Block')),
  flaw('folkloric-tell', 'Folkloric Tell', 'Supernatural Situations', '1', '100', 'Anyone who notices your tell mistrusts you. Lose 1 die on Social tests with them except Intimidation. Each tell is a separate Flaw.', repeat('Tell')),
  flaw('crones-curse', 'Crone’s Curse', 'Supernatural Situations', '2', '100', 'Reduce your Health maximum by 1.'),
  flaw('moon-thrall', 'Moon-Thrall', 'Supernatural Situations', '2', '100', 'On first seeing the moon each night, shift to Glabro or Hispo and make the usual Rage Check.'),

  background('allies', 'Allies', '1-6', '101–102', 'Buy Effectiveness 1–4 plus Reliability 0–3, up to 6 dots total per Ally. An Ally typically helps about once per story.', repeat('Ally · Effectiveness and Reliability')),
  flaw('enemies', 'Enemies', 'Allies', '1-2', '101–102', 'An opposing mortal or group has Effectiveness equal to the Flaw rating +2 and usually causes trouble at least once per story.', repeat('Enemy or group')),
  flaw('stalker', 'Stalker', 'Allies', '1', '101', 'Someone pursues an unwanted relationship with you. Removing one stalker can invite another.', details('Stalker')),
  background('contacts', 'Contacts', '1-3', '102', 'One source of specialized, privileged, or critical information, depending on rating.', repeat('Contact and field')),
  background('fame', 'Fame', '1-5', '102–103', 'Reduce the Difficulty of relevant Social tests with your audience by 1 per dot. The Storyteller can let Fame stand in for another Trait.', repeat('Audience or reputation')),
  flaw('infamy', 'Infamy', 'Fame', '2', '103', 'An infamous reputation raises the Difficulty of most reactions by 2 and can bring authorities down on you.', details('What people know')),
  flaw('dark-secret', 'Dark Secret', 'Fame', '1', '103', 'A damaging secret known to very few can bring the consequences of Infamy if exposed.', details('Secret')),
  flaw('infamous-partner', 'Infamous Partner', 'Fame', '1', '103', 'Someone close to you has Infamy that can damage your reputation by association.', details('Partner')),
  background('mask', 'Mask', '1-2', '103–104', 'Use a false identity. One dot passes regional checks. Two dots can survive national police checks.', repeat('Name and identity')),
  background('zeroed', 'Zeroed', '1', '103', 'With a two-dot Mask, buy this upgrade to erase the official records of your real identity.', { requires: 'Mask 2', rubric: 'Mask' }),
  background('cobbler', 'Cobbler', '1', '103–104', 'With a two-dot Mask, you can make a Mask in 3 days per dot or source one in 1 day per dot at a price.', { requires: 'Mask 2', rubric: 'Mask' }),
  flaw('person-of-interest', 'Person of Interest', 'Mask', '2', '104', 'Intelligence records link you, your associates, and your aliases to suspicious activity.'),
  flaw('serial-error', 'Serial Error', 'Mask', '1', '104', 'Database checks turn up a serious error about your identity that can get you detained or investigated.'),
  background('mentor', 'Mentor', '1-5', '104', 'A Garou or spirit offers guidance, warnings, and occasional influence. Rating measures their Renown or spiritual standing.', repeat('Mentor')),
  flaw('adversary', 'Adversary', 'Mentor', '1-3', '104', 'A hostile Garou or pack has standing two dots above this Flaw. The Storyteller uses its actual Traits in tests.', repeat('Rival or pack')),
  background('resources', 'Resources', '1-5', '104–105', 'Once per session, add your Resources rating to a relevant pool for acquiring something, negotiating, or leveraging wealth.', repeat('Source of resources')),
  flaw('destitute', 'Destitute', 'Resources', '1', '105', 'You have neither money nor a home.'),
  background('spirit-pact', 'Spirit Pact', '1-5', '105', 'A lesser spirit with Power equal to the rating aids you when summoned and can teach Gifts it knows.', repeat('Spirit and terms')),
  background('companion', 'Companion', '2', '105', 'Your pact spirit can accompany you. Without a physical Host, communication still usually requires the Umbra or special senses.', { ...repeat('Linked Spirit Pact'), rubric: 'Spirit Pact', requires: 'Spirit Pact' }),
  background('host', 'Host', '1', '105', 'Your pact spirit has a persistent physical host or a recurring object it can inhabit and interact through.', { ...repeat('Linked Spirit Pact and host'), rubric: 'Spirit Pact', requires: 'Spirit Pact' }),
  flaw('pact-condition', 'Pact Condition', 'Spirit Pact', '1', '105', 'Break the spirit’s terms and lose its help until you make amends.', repeat('Pact and condition')),
  background('talisman', 'Talisman', '1-5', '105, 188–190', 'Record a custom supernatural object and the cost the Storyteller assigns.', { ...repeat('Object and effect'), rubric: 'Talismans' }),

  background('apeskin', 'Apeskin', '4', '188', 'While worn against your skin in Glabro or Hispo, ignore contact burns from silver. Regeneration is suppressed while worn and for a full day and night afterward.', { rubric: 'Talismans' }),
  background('apeskin-talen', 'Apeskin Talen', '2', '188', 'Single-use Apeskin. Treat silver as in natural forms while protected in Glabro or Hispo. The regeneration loss still applies.', { rubric: 'Talismans' }),
  background('harmony-flute', 'Harmony Flute', '3', '188', 'Spend 2 turns and 1 Willpower, then test Composure + Performance against the target’s current Rage, or Difficulty 3 for other creatures, to end frenzy.', { rubric: 'Talismans' }),
  background('klaive', 'Klaive', '3', '188–189', 'A silver weapon dealing margin +2 Aggravated damage. Use it in Homid or Glabro.', { rubric: 'Talismans' }),
  background('klaive-talen', 'Klaive Talen', '1', '188–189', 'A single-use klaive. It deals its silver damage and shatters on a successful attack.', { rubric: 'Talismans' }),
  background('partridge-wing', 'Partridge Wing', '2', '189', 'One person carrying it is protected against Delirium. Losing it restores vulnerability and erodes memories of protected encounters.', { rubric: 'Talismans' }),
  background('shadowshard', 'Shadowshard', '1', '189', 'Single use. Spend a full action to cross into the Umbra at Gauntlet 3 or less. Only the Garou using it crosses.', { rubric: 'Talismans' }),
  background('shadowshard-pack', 'Pack Shadowshard', '3', '189', 'Single use. A full action takes your Garou pack into the Umbra where the Gauntlet is 3 or less.', { rubric: 'Talismans' }),
  background('spirit-catcher', 'Spirit-Catcher', '1-5', '189–190', 'Hold one spirit per scene in the same realm unless it wins a Power test against the catcher’s rating or is harmed. Discounts apply to a specialized model or a talen.', { ...repeat('Rating, type, and whether it is a talen'), rubric: 'Talismans' }),
  background('wind-whistle', 'Wind Whistle', '3', '190', 'Once per session outdoors, test Wits + Occult. Raise Difficulty to track the pack near that location by half the successes, rounded up.', { rubric: 'Talismans' }),
  background('wind-whistle-talen', 'Wind Whistle Talen', '1', '190', 'Single-use Wind Whistle, with the same outdoor test and tracking effect.', { rubric: 'Talismans' })
]

export function garouAdvantageFor(item, meta) {
  return GAROU_ADVANTAGES.find((entry) => entry.id === meta.garouId) ??
    GAROU_ADVANTAGES.find((entry) => entry.name.toLowerCase() === item.name.toLowerCase() &&
      (entry.kind === 'flaw' ? 'flaw' : entry.group === 'Backgrounds' ? 'background' : 'merit') === item.system.featuretype)
}
