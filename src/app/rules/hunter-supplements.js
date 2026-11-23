// Short rules for supplemental Hunter catalogue entries. Full translations live in the private reference.
export const SUPPLEMENT_ADVANTAGES = [
  ["merit","Franchise Office","Bureaucratic Smokescreen","1","You and accompanying cellmates gain one die to avoid local police and press attention.","Apostates"],
  ["merit","Mental","Always Prepared","2","Gain two dice on Preparedness tests.","Alma Maters"],
  ["merit","Academia","Thesis","2","Choose an academic Specialty that can apply to any Skill used for research.","Alma Maters"],
  ["flaw","Resources","Debts","1-2","Raising Resources costs double XP. At two dots, creditors may answer concealed income with threats or violence.","Apostates"],
  ["merit","Franchise Office","Database Access","1","Gain one die to research monsters or supernatural phenomena using Monster-X’s databases.","Apostates"],
  ["merit","Mentor","Spirit Guide","2","A spectral Mentor provides ordinary guidance and reliable information about ghosts, but little earthly influence.","Apostates"],
  ["merit","Academia","Forbidden Texts","2","Choose a creature type and gain two dice on research about it. The subjects want their books back.","Alma Maters"],
  ["flaw","Safe House","Isolated","2","An out-of-the-way Safe House is slow to reach and has unreliable communications.","Apostates"],
  ["merit","Mask","Faked Death","2","Your former org stops looking if you stay hidden. Apply Serial Error unless you buy a separate Mask.","Apostates"],
  ["flaw","Nutritionist","Malnourished","2","Your maximum Health is Stamina + 2.","Alma Maters"],
  ["flaw","Linguistics","El Mala Educación","1","A total failure or critical when translating an extinct language raises Danger by one. Requires Dead Tongues.","Alma Maters"],
  ["merit","Linguistics","Dead Tongues","2","Gain two dice when translating an extinct language.","Alma Maters"],
  ["flaw","Safe House","Interfering Roommate","1","A watchful co-occupant reports suspicious activity at the Safe House.","Alma Maters"],
  ["flaw","Mental","Disordered Sleep","2","Roll one die when waiting, studying, or keeping watch. On a failure you fall asleep.","Alma Maters"],
  ["merit","Franchise Office","New Hire","1","Once per story, recruit a junior Monster-X operative for the Hunt. Their loyalty stays with Monster-X.","Apostates"],
  ["merit","Safe House","Bolt Hole","1","Gain two dice to hide or move unnoticed on campus.","Alma Maters"],
  ["flaw","Franchise Office","Location of Interest","1","Lose access to one random Franchise Office Advantage per story. Requires at least two.","Apostates"],
  ["flaw","Academia","Dangerous Knowledge","2","For a creature type chosen by the Storyteller, a critical or total failure on related research or perception raises Danger by one.","Alma Maters"],
  ["flaw","Mentor","Credit Hungry","1","When called on during a Hunt, your Mentor claims your successes and at least half the pay.","Apostates"],
  ["flaw","Academia","Failing Grades","1","Lose two dice on Social pools involving campus staff.","Alma Maters"],
  ["flaw","Franchise Office","Poorly Maintained Equipment","1","A total failure while using your equipment puts it out of action until repaired.","Apostates"],
  ["flaw","Resources","Gig Economy","1-2","Work interrupts a Hunt. Lose one Resources for the story, delay the job, or owe a favor to get out of the shift.","Apostates"],
  ["merit","Safe House","Rural Hideaway","1-3","Each dot adds one Difficulty to finding, entering, or watching the Safe House. Without directions it takes at least one extra day to reach.","Apostates"],
  ["flaw","Resources","Freelance","1","Roll one die at story start to raise or lower Resources by one for that story. Restricted by your Resources rating.","Apostates"],
  ["merit","Academia","Part of the Furniture","3","Once per session, add two dice to one pool on campus or when dealing with university staff.","Alma Maters"],
  ["merit","Mentor","Generous","1-3","Each dot lets you ask your Mentor for one valuable favor per story without the usual risk of losing dots.","Apostates"],
  ["merit","Mental","Eidetic Memory","2","Gain two dice on recall tests, such as remembering codes, faces, formulas, or directions.","Alma Maters"]
]

export const SUPPLEMENT_EDGES = {
  greatdestiny: {
    name: "Great Destiny",
    category: "Endowments",
    source: "Apostates",
    pool: "No activation test",
    summary: "Choose a destiny and start each session with two bonus dice to spend on rolls that directly advance it."
  },
  unnaturalchanges: {
    name: "Unnatural Changes",
    category: "Endowments",
    source: "Incognito Report",
    pool: "Stamina, Composure, or Resolve + Insight",
    summary: "Use a focus and test at Difficulty 4 for +2 dice with one chosen Attribute for the scene. Failure deals Aggravated damage by the shortfall."
  },
  cleansetheunnatural: {
    name: "Cleanse the Unnatural",
    category: "Endowments",
    source: "Apostates",
    pool: "Charisma + Persuasion, Resolve + Science, or Manipulation + Occult",
    summary: "Free a victim from supernatural control for 24 hours. Difficulty depends on duration; the victim takes three Aggravated minus margin."
  },
  turncoat: {
    name: "Turncoat",
    category: "Aptitudes",
    source: "Apostates",
    pool: "Manipulation + Subterfuge",
    summary: "Convince the quarry you defected. Each plausible rebuttal after contrary evidence requires a new test at +1 cumulative Difficulty."
  },
  experimentalmedicine: {
    name: "Experimental Medicine",
    category: "Assets",
    source: "Apostates",
    pool: "Stamina + Medicine (Health) or Composure + Insight (Willpower)",
    summary: "Monster-X treats Aggravated damage at Difficulty equal to half the current Aggravated damage, rounded up. A failure leaves damage in place and raises Danger."
  }
}

export const SUPPLEMENT_PERKS = {
  arsenal: [
    ["Backup Piece","Once per scene, produce a concealed light firearm even after failing Arsenal."]
  ],
  artifact: [
    ["Feature Unlocked","A Re:Venge Apostate at Danger 5 may spend one Willpower once per story to reroll any number of dice. A win becomes a critical win."]
  ],
  library: [
    ["How to Silence Them","Add the margin, up to three dice, to one attempt to damage the quarry in Social Conflict."],
    ["Pattern Analysis","Find earlier or analogous incidents and potentially someone alive who studied them."],
    ["Where They Go","Add the margin, up to three dice, to one test to identify preferred victims, hunting grounds, or the next target."],
    ["Who They Were","Treat margin as two higher for other Library Perks when researching quarry at least two centuries old."]
  ],
  globalaccess: [
    ["Intranet Insertion","Use Global Access and its Perks on isolated systems without visiting them. An exposed intrusion may raise Danger."],
    ["Digital Cannon Fodder","A Re:Venge Apostate subtracts two successes from attempts to track or surveil them digitally."],
    ["Spoof","Falsify logs to blame someone else or a nonexistent person. Difficulty 3–5."]
  ],
  beastwhisperer: [
    ["Supernatural Scent","Train the animal to detect and track one creature type. Scent trails must be no older than 12 hours.",true]
  ],
  dronejockey: [
    ["Electronic Shield","Remote interference normally fails. An ability that can bypass the shield faces Difficulty 2 plus the operator’s margin."]
  ],
  repeltheunnatural: [
    ["Rite of Blessed Ammunition","Test at Difficulty 4 for one blessed round plus margin. Ranged hits deal Aggravated to supernatural targets."],
    ["Under the Radar","Use Repel to become imperceptible to a chosen creature that is not already sensing you. Direct interaction breaks it."]
  ],
  thwarttheunnatural: [
    ["Redirection","After resisting, take one Superficial Willpower damage to turn the ability back on its user."]
  ],
  improvisedgear: [
    ["Made to Last","The device lasts extra scenes equal to the margin, minimum one, even into another session."]
  ],
  fleet: [
    ["Wagon Train","If you lose the vehicle, retest in the same scene. Its replacement loses one Perk or raises related Difficulties by one."],
    ["Hidden Cache","A concealed compartment is two Difficulty harder to search and can preserve access to Arsenal and Ordnance."]
  ],
  sensetheunnatural: [
    ["Horrid Detail","See through supernatural disguises and sense the quarry’s true or nonphysical form."],
    ["Network","Use Wits + Insight to sense supernatural influence or recent sustained contact. If both parties are visible, see their connection."]
  ],
  greatdestiny: [
    ["Divine Protection","Reduce Health damage suffered while pursuing your destiny by two, minimum zero."],
    ["Heavenly Resolve","Heal one Aggravated Willpower after taking Social Conflict damage while defending your destiny."],
    ["Influence Fate","Once per session, contest Charisma + Occult against Resolve + Occult to influence an SPC to take one helpful action."],
    ["Sacred Insight","Once per story, ask the Storyteller for a clue that advances your destiny."]
  ],
  unnaturalchanges: [
    ["Breadth","Gain one die with another chosen Attribute while active. May be taken twice.",2],
    ["Maximized Neuropathways","Activating the Edge takes no action."],
    ["Handsfree","Use Unnatural Changes without a focus."],
    ["Neuropathway Practice","Activation Difficulty drops from 4 to 3."]
  ],
  cleansetheunnatural: [
    ["Bedside Manner","Damage from this Edge becomes Superficial. Round down after halving."],
    ["Inflict Stigmata","Lower Difficulty by two. The subject suffers one extra Aggravated Health damage and permanent stigmata."],
    ["Psychic Backlash","On a win, inflict one Aggravated Health or Willpower on the controller per two points of margin."],
    ["Trace the Threads","On a win, ask one question about the controller’s whereabouts per point of margin."]
  ],
  turncoat: [
    ["Deathbed Confession","Use Turncoat in combat as your whole action to pause the fight."],
    ["Poker Face","Gain two dice on Turncoat tests prompted by the quarry’s followers. A win convinces both follower and quarry."],
    ["Stick to the Plan","Your cell understands your intentions without communication, however long you are apart."],
    ["We Come as a Team","Bring one consenting cellmate per point of margin. You can later retest to vouch for them."]
  ],
  experimentalmedicine: [
    ["Improved Resilience","Gain one point of natural armor until the end of the next story. It stacks with worn armor."],
    ["Monstrous Enhancement","Raise one Attribute by two (max 5) and gain a vulnerability until story end. If you die, your corpse becomes a monster."],
    ["Phoenix Protocol","Next story, heal Health twice as fast and treat most Aggravated damage as Superficial. Desperation dice are unavailable, and Willpower suffers when it ends."],
    ["Unstable Steroids","Raise one Attribute by one until the end of the next story. Entering Despair during that time deals one Aggravated damage."]
  ]
}

export const SUPPLEMENT_VARIANTS = {
  artifact: [
    ["Amulet of Isis","The Cult of Isis uses amulets in many forms, from carved images of Isis to symbols from other pagan traditions."],
    ["Fennel Sword","A bundle of long fennel stalks bound together with a leather grip."],
    ["The Grimoire App","The Children of the Sorbonne use a digital copy of the Grimoire Fantomatique. Its spells still work, and the grimoire may have a mind of its own."],
    ["Mask of the Unnoticed","Rare supernatural masks of disputed origin, associated with the Li family."],
    ["Sanguine Flask","An occult flask made by the Blood Hunters preserves vampire blood for later use."],
    ["Sympathetic Bindings","Ancient bloodstained bandages whose method of manufacture has been lost."]
  ],
  sensetheunnatural: [
    ["Ekstasis","Benandanti use their preserved birth caul as a focus and often use Occult in the pool."]
  ]
}
