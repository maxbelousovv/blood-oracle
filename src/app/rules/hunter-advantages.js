import { SUPPLEMENT_ADVANTAGES } from './hunter-supplements.js'

// Only named traits and their purchase ratings. No descriptions of rating tiers.
const entries = (kind, group, rows) => rows.map(([name, dots, summary, detailsPlaceholder, source]) => ({
  kind, group, name, dots, summary, description: summary,
  hunterId: name.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-'),
  hasDetails: Boolean(detailsPlaceholder), detailsPlaceholder, source
}))

export const HUNTER_ADVANTAGES = [
  ...entries('merit', 'Linguistics', [
    ['Linguistics', '1 per language', 'Speak, read and write one extra language per dot. Old texts and obscure dialects may still raise Difficulty.', 'Languages']
  ]),
  ...entries('merit', 'Looks', [
    ['Beautiful', '2', 'Gain one die on relevant Social tests when people can see you.'],
    ['Stunning', '4', 'Gain two dice on relevant Social tests when people can see you.']
  ]),
  ...entries('merit', 'Nutritionist', [
    ['Solo Cooking', '1', 'Recover one extra Superficial Health at session start if you had time to cook beforehand.'],
    ['Cell Chef', '2', 'Cell members who shared the meal you prepared before the session recover one extra Superficial Health at session start.']
  ]),
  ...entries('merit', 'Supernatural', [
    ['Unseemly Aura', '2', 'Some monsters mistake you for a supernatural creature. You still count as human for Endowments.']
  ]),
  ...entries('merit', 'Backgrounds', [
    ['Allies', '2-6', 'People outside the cell who can help, usually about once per story. Build each Ally from Effectiveness and Reliability.', 'Who are they and why do they help?'],
    ['Contacts', '1-3', 'Sources of information and occasional favors in a specific field.', 'Name and field'],
    ['Fame', '1-5', 'Public recognition opens doors but makes discretion harder. Each dot lowers Difficulty by one on appropriate Social tests with fans.', 'Audience or field'],
    ['Influence', '1-5', 'Pull within a mortal group or region. It drops by one dot citywide and may fall further outside the city. Calling on it can draw attention.', 'Group or region'],
    ['Mask', '1-2', 'A false identity that can survive official scrutiny. A two-dot Mask qualifies you for Zeroed and Cobbler.', 'Alias'],
    ['Mentor', '1-5', 'A Hunter or cell that gives guidance, warnings and occasional cover. A group usually costs one extra dot.', 'Who mentors you?'],
    ['Resources', '1-5', 'Income and assets sustain your standard of living. Record their source and what form they take.', 'Source and assets'],
    ['Retainers', '1-3', 'Loyal assistants who can act for you but retain their own goals and limits.', 'Who helps you and why?'],
    ['Safe House', '1-3', 'A secure base. Each base dot improves resistance to intrusion or surveillance and adds a die to notice danger inside. It can be shared by the cell.', 'Location and purpose'],
    ['Status', '1-5', 'Standing in one Hunter faction. It can enter relevant Social pools where that faction recognizes your reputation.', 'Faction']
  ]),
  ...entries('merit', 'Mask', [
    ['Zeroed', '1', 'Your real records were purged. Requires a two-dot Mask.'],
    ['Cobbler', '1', 'Make or source false identities. Creating one takes three days per dot and may expose you; sourcing takes one day per dot and costs a favor or other price. Requires a two-dot Mask.']
  ]),
  ...entries('merit', 'Safe House', [
    ['Hidden Armory', '1+', 'Each dot stocks a pistol and a long gun with ammunition. Lost stock does not replenish on its own.'],
    ['Panic Room', '1+', 'Protects or confines two people at Difficulty 5. Each extra dot doubles capacity or raises Difficulty by one. Maximum capacity is 32 and requires a very large Safe House. Unavailable in small Safe Houses.'],
    ['Watchmen', '1+', 'Each dot provides four Average guards and one Gifted leader. They are generally unfamiliar with the supernatural.'],
    ['Laboratory', '1+', 'Each dot adds one die for tests involving a chosen Science or Technology specialty. Unavailable in small Safe Houses.', 'Science or Technology specialty'],
    ['Luxury', '1', 'Gain two dice on Social tests with guests. With fewer than three dots in Resources, the furnishings were obtained illegally.'],
    ['Postern', '1+', 'A discreet exit adds one die per dot to evade surveillance near the Safe House.'],
    ['Security System', '1+', 'Gain one die per dot to resist or detect unauthorized entry.'],
    ['Surgery', '1', 'Gain two dice on applicable medical tests at the Safe House. Unavailable in small Safe Houses.']
  ]),
  ...entries('flaw', 'Linguistics', [
    ['Illiterate', '2', 'You cannot read or write. Academics and Science are capped at one, with no specialties in modern knowledge.']
  ]),
  ...entries('flaw', 'Looks', [
    ['Repulsive', '2', 'Lose two dice on relevant Social tests when people can see you.'],
    ['Ugly', '1', 'Lose one die on relevant Social tests when people can see you.']
  ]),
  ...entries('flaw', 'Psychological', [
    ['Living on the Edge', '2', 'An unfamiliar risky temptation imposes a two-dice penalty until you try it or the scene ends. This does not compel suicidal acts.'],
    ['Weak-Willed', '2', 'You cannot actively resist supernatural attempts to sway you mentally or emotionally.']
  ]),
  ...entries('flaw', 'Substance Use', [
    ['Severe Addiction', '2', 'Lose two dice if you did not use the substance last scene, except on actions that immediately obtain it.', 'Substance'],
    ['Addiction', '1', 'Lose one die if you did not use the substance last scene, except on actions that immediately obtain it.', 'Substance']
  ]),
  ...entries('flaw', 'Supernatural', [
    ['Stigmata', '1', 'Taking your chosen type of damage makes you bleed conspicuously and may penalize tests. Spending Willpower does not trigger it. May be taken once for Health and once for Willpower.', 'Health or Willpower damage'],
    ['Crone’s Curse', '2', 'A supernatural affliction makes you look at least a decade older and removes one Health box.']
  ]),
  ...entries('flaw', 'Backgrounds', [
    ['Enemies', '1-2', 'Opponents show up when the Storyteller sees fit, usually at least once per story. Rate them at Effectiveness minus two.', 'Who opposes you?'],
    ['Infamy', '2', 'Your public notoriety raises the Difficulty of most reactions and can put authorities or enemies on your trail.'],
    ['Dark Secret', '1', 'A few motivated people know something that could turn into public Infamy.'],
    ['Infamous Partner', '1', 'Someone close to you is notorious, and their reputation sometimes harms yours by association.'],
    ['Despised', '2', 'A local group actively obstructs the cell. Lose two dice when asking neutral people for political support or favors.', 'Group or region'],
    ['Disliked', '1', 'Lose one die on Social tests with city groups other than your Contacts, Allies and explicitly loyal supporters.'],
    ['Person of Interest', '2', 'Intelligence databases flag you, your aliases and your associates, giving investigators a trail to follow.'],
    ['Serial Error', '1', 'A false entry makes database checks flag you as dead, wanted or otherwise grounds for detention.'],
    ['Adversary', '1-3', 'A rival Hunter wishes you, your cell or your Mentor harm. Use their Status or another suitable Trait for opposition pools.', 'Who is the rival?'],
    ['Destitute', '1', 'You have neither money nor a home.'],
    ['Stalkers', '1', 'Former retainers keep trying to reconnect, and another may appear after you drive one off.'],
    ['No Safe House', '1', 'Your usual home offers no dependable security.'],
    ['Shunned', '2', 'A Hunter faction loathes you and works against you when it can.', 'Faction'],
    ['Suspect', '2', 'Lose two dice on Social tests involving the offended Hunter faction until you make amends.', 'Faction']
  ]),
  ...entries('flaw', 'Safe House', [
    ['Compromised', '2', 'Your base is already on someone’s radar. Intruders and spies gain two dice to enter or watch it.'],
    ['Creepy', '1', 'The base attracts suspicion. Lose two dice on tests to seduce or reassure human guests there.'],
    ['Haunted', '1+', 'An uncontrolled supernatural presence can compromise security. The Storyteller assigns at least one relevant bonus or penalty die per dot.']
  ]),
  ...SUPPLEMENT_ADVANTAGES.flatMap(([kind, group, name, dots, summary, source]) =>
    entries(kind, group, [[name, dots, summary, undefined, source]]))
]
