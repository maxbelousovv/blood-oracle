export const AUSPICES = [
  { id: 'ragabash', name: 'Ragabash', moon: 'New moon', page: 56, giftsPage: 149, summary: 'Tricksters who challenge habits and traditions, find unconventional solutions, and make stronger opponents look foolish.' },
  { id: 'theurge', name: 'Theurge', moon: 'Crescent moon', page: 56, giftsPage: 152, summary: 'Mystics who interpret the spirit world, negotiate with its inhabitants, and keep the pack’s pacts and rituals.' },
  { id: 'philodox', name: 'Philodox', moon: 'Half moon', page: 57, giftsPage: 155, summary: 'Judges and mediators who weigh evidence, settle disputes, and decide how the Litany applies when duties conflict.' },
  { id: 'galliard', name: 'Galliard', moon: 'Gibbous moon', page: 57, giftsPage: 158, summary: 'Storytellers who keep Garou history alive and use songs, praise, or wit to move their packmates to action.' },
  { id: 'ahroun', name: 'Ahroun', moon: 'Full moon', page: 58, giftsPage: 161, summary: 'Warriors the Garou look to in a fight. Their strengths can range from ferocity to the discipline to strike at the right moment.' }
]

const banConsequence = 'At the start of the next session, recover only 1 Willpower in place of the normal recovery based on Composure or Resolve.'

export const TRIBES = [
  {
    id: 'blackfury', name: 'Black Furies', singular: 'Black Fury', renown: 'Glory', patron: 'Gorgon', page: 60, giftsPage: 164,
    summary: 'Black Furies confront abuses of power and stand with people who cannot challenge them alone.',
    favor: 'Add 1 die to a pool to oppose or get around someone or something that holds power over you or someone in your care.',
    ban: 'Letting an injustice continue when you could have stopped it or done something about it.'
  },
  {
    id: 'bonegnawer', name: 'Bone Gnawers', singular: 'Bone Gnawer', renown: 'Honor', patron: 'Rat', page: 62, giftsPage: 166,
    summary: 'Bone Gnawers draw on contacts and resources that others dismiss, and look out for the people those others overlook.',
    favor: 'Add 1 die to a pool to find something that was lost or went unnoticed.',
    ban: 'Passing up a significant chance to improve the lot of someone disadvantaged.'
  },
  {
    id: 'childrenofgaia', name: 'Children of Gaia', renown: 'Wisdom', patron: 'Unicorn', page: 64, giftsPage: 167,
    summary: 'Children of Gaia look for ways to restore damaged relationships between the physical world, spirits, and the people around them.',
    favor: 'Add 1 die to Awareness or Insight when learning something about a particular person, animal, or spirit.',
    ban: 'Lying or misleading others, or concealing the truth for personal gain.'
  },
  {
    id: 'galestalker', name: 'Galestalkers', singular: 'Galestalker', renown: 'Honor', patron: 'North Wind', page: 66, giftsPage: 168,
    summary: 'Galestalkers are relentless hunters who take pride in keeping their word and seeing a pursuit through.',
    favor: 'Add 1 die to a pool directly connected to pursuing your prey.',
    ban: 'Going a day without eating from a fresh kill, regardless of who made it.'
  },
  {
    id: 'ghostcouncil', name: 'Ghost Council', renown: 'Wisdom', patron: 'Horned Serpent', page: 68, giftsPage: 170,
    summary: 'Ghost Council Garou seek hidden knowledge and are willing to consider methods their peers would leave alone.',
    favor: 'Add 1 die to Investigation, Occult, or Subterfuge when working to uncover a deliberately kept secret.',
    ban: 'Letting a scene pass in which you had a chance to satisfy your curiosity and chose to leave it unanswered.'
  },
  {
    id: 'glasswalker', name: 'Glass Walkers', singular: 'Glass Walker', renown: 'Wisdom', patron: 'Spider', page: 70, giftsPage: 171,
    summary: 'Glass Walkers learn how human systems and technologies work so they can turn them toward the Garou’s goals.',
    favor: 'Add 1 die to Technology or Science when building or repairing something.',
    ban: 'Destroying a complex machine, such as a computer, vehicle, or piece of assembly equipment.'
  },
  {
    id: 'hartwarden', name: 'Hart Wardens', singular: 'Hart Warden', renown: 'Glory', patron: 'Stag', page: 72, giftsPage: 172,
    summary: 'Hart Wardens protect places they have taken responsibility for and treat sheltering others as a duty.',
    favor: 'Add 1 die to Survival, Animal Ken, or Craft when the Craft test concerns nature.',
    ban: 'Someone comes to harm while under your hospitality.'
  },
  {
    id: 'redtalon', name: 'Red Talons', singular: 'Red Talon', renown: 'Honor', patron: 'Griffin', page: 74, giftsPage: 174,
    summary: 'Red Talons put animals and wild places first and answer threats to them with direct action.',
    favor: 'Add 1 die to Brawl tests while your Health is below half.',
    ban: 'In a session, using Academics, Driving, Finance, Firearms, Science, or Technology to use or repair something. Using those Skills to subvert or destroy it is permitted.'
  },
  {
    id: 'shadowlord', name: 'Shadow Lords', singular: 'Shadow Lord', renown: 'Glory', patron: 'Thunder', page: 76, giftsPage: 175,
    summary: 'Shadow Lords value results and seek openings where pressure, fear, or deception can turn a conflict.',
    favor: 'Add 1 die to Animal Ken, Intimidation, or Subterfuge when threatening others or exploiting a weakness.',
    ban: 'Losing a conflict to a Garou whose Total Renown is lower than yours.'
  },
  {
    id: 'silentstrider', name: 'Silent Striders', singular: 'Silent Strider', renown: 'Wisdom', patron: 'Owl', page: 78, giftsPage: 177,
    summary: 'Silent Striders travel between Garou communities, bring news across long distances, and observe rites for the dead.',
    favor: 'Add 1 die to Athletics or Stealth for getting through an area, escaping, or infiltrating.',
    ban: 'Causing, taking part in, or witnessing a death and then failing to observe it with a commemorative rite.'
  },
  {
    id: 'silverfang', name: 'Silver Fangs', singular: 'Silver Fang', renown: 'Honor', patron: 'Falcon', page: 80, giftsPage: 178,
    summary: 'Silver Fangs take on leadership and try to earn loyalty through the example they set.',
    favor: 'Add 1 die to Persuasion or Leadership when getting others to follow your advice, suggestions, or orders.',
    ban: 'Taking an action that risks bringing you shame or costing you Renown.'
  }
].map((tribe) => ({ ...tribe, ban: tribe.ban + ' ' + banConsequence }))

const identityKey = (value) => String(value ?? '').trim().toLowerCase()

export function findGarouIdentity(entries, name) {
  const key = identityKey(name)
  return key ? entries.find((entry) => [entry.id, entry.name, entry.singular].some((candidate) => identityKey(candidate) === key)) : undefined
}

export function garouIdentityData(type, entry) {
  if (type === 'auspice') return { description: entry?.summary ?? '' }
  return {
    description: entry?.summary ?? '',
    patronSpirit: {
      name: entry?.patron ?? '',
      description: '',
      favor: entry?.favor ?? '',
      ban: entry?.ban ?? ''
    }
  }
}

export const RENOWN_DESCRIPTIONS = {
  glory: 'Glory rewards decisive action, courage in the face of danger, and sacrifice or generosity that others remember.',
  honor: 'Honor records justice, duties kept, and the trust earned by keeping promises to Garou, spirits, and others.',
  wisdom: 'Wisdom reflects careful judgment, insight, and choosing an action with its consequences in mind.'
}

export const RENOWN_HELP = 'Total Renown adds Glory, Honor, and Wisdom. It sets the threshold for learning Gifts and can establish rank. Each Gift can use a specific Renown in its pool or effect. The Storyteller can allow Renown to help in a social test with Garou or spirits.'
