// Core Rulebook pp. 149–179. The first Ahroun and last Silver Fang tiers use the published errata.
export const GAROU_IDENTITY_GIFTS = [
  {
    id: "gift-blissful-ignorance", name: "Blissful Ignorance", giftType: "ragabash", page: "149",
    level: 2, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Minor", duration: "One scene",
    summary: "Vanish while motionless and quiet."
  },
  {
    id: "gift-crows-laughter", name: "Crow’s Laughter", giftType: "ragabash", page: "149",
    level: 2, renown: "Honor", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Manipulation + Honor vs. Composure + Insight", duration: "One scene or until resisted.", naturalForms: ["homid"],
    summary: "Taunt a visible foe into turning their attention and attacks on you."
  },
  {
    id: "gift-gremlins", name: "Gremlins", giftType: "ragabash", page: "149",
    level: 2, renown: "Glory", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Charisma + Glory", duration: "One scene or permanent", naturalForms: ["lupus"],
    summary: "Disable a nearby device for the scene, or ruin it on a critical win."
  },
  {
    id: "gift-spiders-song", name: "Spider’s Song", giftType: "ragabash", page: "150",
    level: 2, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Resolve + Wisdom", duration: "One scene", naturalForms: ["homid"],
    summary: "Listen to a phone call through its line or a visible handset."
  },
  {
    id: "gift-blur-of-the-milky-eye", name: "Blur of the Milky Eye", giftType: "ragabash", page: "150",
    level: 5, renown: "Wisdom", rage: 1, costText: "1 Rage Check",
    action: "Minor", duration: "One scene",
    summary: "Add Wisdom to stealth and physical defense until you engage someone."
  },
  {
    id: "gift-open-seal", name: "Open Seal", giftType: "ragabash", page: "150",
    level: 5, renown: "Honor", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Manipulation + Honor", naturalForms: ["homid"], optionalTest: true,
    summary: "Open mechanical locks automatically and test against unusual security."
  },
  {
    id: "gift-pulse-of-the-prey", name: "Pulse of the Prey", giftType: "ragabash", page: "150",
    level: 5, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Intelligence + Wisdom", duration: "One session", naturalForms: ["lupus"],
    optionalTest: true,
    summary: "Find the direction of a person you have previously encountered."
  },
  {
    id: "gift-scent-of-running-water", name: "Scent of Running Water", giftType: "ragabash", page: "151",
    level: 5, renown: "Wisdom", variableCost: {"resource":"willpower","min":0,"max":1,"label":"Extend protection to the pack"}, costText: "Free / 1 Willpower",
    action: "Minor", duration: "One scene", naturalForms: ["lupus"],
    summary: "Leave no physical trail and resist supernatural tracking with Wisdom."
  },
  {
    id: "gift-lunas-blessing", name: "Luna’s Blessing", giftType: "ragabash", page: "151",
    level: 8, renown: "Wisdom", rage: 1, willpower: 1,
    costText: "1 Rage Check + 1 Willpower", action: "Full", duration: "One night", restriction: "The moon must be visible.",
    summary: "Under the visible moon, convert some incoming silver damage to Superficial."
  },
  {
    id: "gift-thieving-talons-of-the-magpie", name: "Thieving Talons of the Magpie", giftType: "ragabash", page: "151",
    level: 8, renown: "Honor", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Intelligence + Honor", duration: "One turn for each Willpower spent",
    summary: "Temporarily take a learned supernatural power from someone you can see."
  },
  {
    id: "gift-the-thousand-forms", name: "The Thousand Forms", giftType: "ragabash", page: "152",
    level: 8, renown: "Glory", rage: 1, costText: "1 or more Rage Checks",
    action: "Minor", pool: "Dexterity + Glory", duration: "One scene", naturalForms: ["homid","lupus"],
    summary: "Take the shape of another creature, retaining your mind."
  },
  {
    id: "gift-whelp-body", name: "Whelp Body", giftType: "ragabash", page: "152",
    level: 8, renown: "Honor", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Resolve + Honor vs. Stamina + Occult", duration: "One story",
    summary: "Wither a target's Physical Attributes by the margin of your contest."
  },
  {
    id: "gift-ensnare-spirit", name: "Ensnare Spirit", giftType: "theurge", page: "152",
    level: 2, renown: "Honor", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Wits + Honor vs. Power", duration: "One scene",
    summary: "Pin a neutral spirit in place and make it easier to deal with."
  },
  {
    id: "gift-mothers-touch", name: "Mother’s Touch", giftType: "theurge", page: "153",
    level: 2, renown: "Glory", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Intelligence + Glory", naturalForms: ["homid","lupus"],
    summary: "Heal Superficial Health, with a chance to mend one Aggravated mark."
  },
  {
    id: "gift-shadow-sense", name: "Shadow Sense", giftType: "theurge", page: "153",
    level: 2, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Free", pool: "Wits + Wisdom", duration: "One turn", difficulty: "2; concealment may raise it",
    summary: "Sense a nearby supernatural presence without locating or identifying it."
  },
  {
    id: "gift-sight-from-beyond", name: "Sight from Beyond", giftType: "theurge", page: "153",
    level: 2, renown: "Wisdom", willpower: 1, variableCost: {"resource":"willpower","min":0,"max":1,"label":"Deliberately seek a vision"},
    costText: "1 Willpower or free", action: "Full or free", pool: "Intelligence + Wisdom", optionalTest: true,
    summary: "Seek a vision for clues, or receive one unbidden."
  },
  {
    id: "gift-banish-spirit", name: "Banish Spirit", giftType: "theurge", page: "153",
    level: 5, renown: "Glory", rageSpend: 1, costText: "1 Rage",
    action: "Full", pool: "Resolve + Glory vs. Power", duration: "One scene",
    summary: "Drive a possessing spirit back into the Umbra."
  },
  {
    id: "gift-grasp-from-beyond", name: "Grasp from Beyond", giftType: "theurge", page: "154",
    level: 5, renown: "Wisdom", willpower: 1, variableCost: {"resource":"willpower","min":1,"max":3,"label":"Willpower by object size"},
    costText: "1–3 Willpower", action: "Free", pool: "Resolve + Wisdom",
    summary: "Carry a grasped physical object across the Gauntlet."
  },
  {
    id: "gift-mindspeak", name: "Mindspeak", giftType: "theurge", page: "154",
    level: 5, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Resolve + Wisdom", duration: "One scene or until contact is broken.", naturalForms: ["homid","lupus"],
    optionalTest: true,
    summary: "Exchange deliberate thoughts with another willing person."
  },
  {
    id: "gift-umbral-tether", name: "Umbral Tether", giftType: "theurge", page: "154",
    level: 5, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Free", duration: "Until exiting the Umbra", naturalForms: ["homid","lupus"],
    summary: "Trace your return route through the Umbra and add Wisdom to navigation."
  },
  {
    id: "gift-command-spirit", name: "Command Spirit", giftType: "theurge", page: "154",
    level: 8, renown: "Honor", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Charisma + Honor vs. Power", duration: "One scene",
    summary: "Compel a present spirit to obey individual commands."
  },
  {
    id: "gift-drain-spirit", name: "Drain Spirit", giftType: "theurge", page: "155",
    level: 8, renown: "Glory", rageSpend: 1, costText: "1 Rage",
    action: "Full", pool: "Resolve + Glory vs. Power",
    summary: "Drain a spirit to heal your own Superficial Willpower."
  },
  {
    id: "gift-feral-regression", name: "Feral Regression", giftType: "theurge", page: "155",
    level: 8, renown: "Glory", rageSpend: 1, costText: "1 Rage",
    action: "Full", pool: "Intelligence + Glory vs. Resolve + Occult", duration: "One story",
    summary: "Lower a visible target's Mental Attributes for the story."
  },
  {
    id: "gift-living-ward", name: "Living Ward", giftType: "theurge", page: "155",
    level: 8, renown: "Honor", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Resolve + Honor vs. Power", duration: "One scene unless lowered earlier",
    summary: "Hold spirits outside a three-meter radius while you concentrate."
  },
  {
    id: "gift-ancestral-conviction", name: "Ancestral Conviction", giftType: "philodox", page: "155",
    level: 2, renown: "Honor", willpower: 1, costText: "1 Willpower",
    action: "Free", duration: "One scene", naturalForms: ["homid","lupus"],
    summary: "Add Honor to Persuasion tests against another Garou."
  },
  {
    id: "gift-gaias-candor", name: "Gaia’s Candor", giftType: "philodox", page: "156",
    level: 2, renown: "Glory", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Charisma + Glory vs. Composure + Subterfuge", duration: "One question", optionalTest: true,
    summary: "Ask a question that compels the subject to acknowledge the truth."
  },
  {
    id: "gift-porcupines-reprisal", name: "Porcupine’s Reprisal", giftType: "philodox", page: "156",
    level: 2, renown: "Glory", rage: 1, costText: "1 Rage Check",
    action: "Free",
    summary: "Retaliate with Superficial damage when a melee or brawl attack injures you."
  },
  {
    id: "gift-sense-the-true-form", name: "Sense the True Form", giftType: "philodox", page: "156",
    level: 2, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Free", pool: "Wits + Wisdom", naturalForms: ["homid","lupus"],
    summary: "Recognize a supernatural creature for what it is."
  },
  {
    id: "gift-beasts-fealty", name: "Beast’s Fealty", giftType: "philodox", page: "156",
    level: 5, renown: "Honor", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Charisma + Honor", duration: "Until lapsed", difficulty: "3",
    summary: "Gain the obedience of one animal you can see."
  },
  {
    id: "gift-command-the-gathering", name: "Command the Gathering", giftType: "philodox", page: "156",
    level: 5, renown: "Glory", rage: 1, costText: "1 Rage Check",
    action: "Free", duration: "One scene or until effect is broken or lapses", restriction: "Unavailable while fighting.",
    summary: "Draw an audience and add Glory to speaking or performance in public."
  },
  {
    id: "gift-fangs-of-judgment", name: "Fangs of Judgment", giftType: "philodox", page: "157",
    level: 5, renown: "Honor", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Resolve + Honor", duration: "Until the death of the selected enemy or the sentence is revoked", difficulty: "3",
    summary: "Mark one enemy so the pack's natural weapons do extra damage."
  },
  {
    id: "gift-scent-of-the-past", name: "Scent of the Past", giftType: "philodox", page: "157",
    level: 5, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Intelligence + Wisdom", duration: "One turn", naturalForms: ["lupus"],
    summary: "Read impressions of past events from a place or object."
  },
  {
    id: "gift-geas", name: "Geas", giftType: "philodox", page: "157",
    level: 8, renown: "Glory", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Manipulation + Glory vs. Composure + Resolve", duration: "Until completion of the act, the scene ends, or the geas is lifted", optionalTest: true,
    summary: "Give a spoken command the subject tries to carry out."
  },
  {
    id: "gift-oathbreakers-bane", name: "Oathbreaker’s Bane", giftType: "philodox", page: "158",
    level: 8, renown: "Honor", willpower: 1, costText: "1 Willpower",
    action: "Full", duration: "Indefinitely or until oath is broken",
    summary: "Bind a willing oath and sense it being broken at any distance."
  },
  {
    id: "gift-strength-of-purpose", name: "Strength of Purpose", giftType: "philodox", page: "158",
    level: 8, renown: "Honor", rage: 1, costText: "1 Rage Check",
    action: "Minor", pool: "Honor", naturalForms: ["homid","lupus"], period: "session",
    summary: "Roll Honor to recover damaged Willpower."
  },
  {
    id: "gift-take-the-true-form", name: "Take the True Form", giftType: "philodox", page: "158",
    level: 8, renown: "Honor", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Manipulation + Honor vs. Stamina + Resolve", duration: "Margin number of turns or the user changes form", naturalForms: ["homid","lupus"],
    summary: "Force a shapechanger into their natural form and hold them there."
  },
  {
    id: "gift-animal-magnetism", name: "Animal Magnetism", giftType: "galliard", page: "158",
    level: 2, renown: "Glory", rage: 1, costText: "1 Rage Check",
    action: "Free", duration: "One scene", naturalForms: ["homid"],
    summary: "Bring Glory into Social Skill tests with human subjects."
  },
  {
    id: "gift-howl-of-assembly", name: "Howl of Assembly", giftType: "galliard", page: "159",
    level: 2, renown: "Honor", rage: 1, costText: "1 Rage Check",
    action: "Minor", pool: "Charisma + Honor", difficulty: "2", naturalForms: ["lupus"],
    summary: "Call Garou to gather and heal Willpower."
  },
  {
    id: "gift-song-of-rage", name: "Song of Rage", giftType: "galliard", page: "159",
    level: 2, renown: "Glory", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Charisma + Glory", difficulty: "3",
    summary: "Raise the Rage of packmates who hear your song."
  },
  {
    id: "gift-song-of-serenity", name: "Song of Serenity", giftType: "galliard", page: "159",
    level: 2, renown: "Honor", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Composure + Honor", difficulty: "3",
    summary: "Calm the pack's Rage and give frenzied members a chance to regain control."
  },
  {
    id: "gift-call-the-ridden", name: "Call the Ridden", giftType: "galliard", page: "159",
    level: 5, renown: "Honor", willpower: 1, costText: "1 Willpower",
    action: "Minor", pool: "Composure + Honor vs. Resolve + Insight", duration: "One scene",
    summary: "Draw nearby possessed creatures toward your call."
  },
  {
    id: "gift-eyes-of-the-cobra", name: "Eyes of the Cobra", giftType: "galliard", page: "159",
    level: 5, renown: "Glory", willpower: 1, costText: "1 Willpower",
    action: "Minor", pool: "Charisma + Glory vs. Composure + Resolve", duration: "One scene or until effect is broken, such as by the victim reaching the user", optionalTest: true,
    summary: "Lure a subject toward you with eye contact."
  },
  {
    id: "gift-song-of-valor", name: "Song of Valor", giftType: "galliard", page: "160",
    level: 5, renown: "Honor", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Charisma + Honor", duration: "One scene", difficulty: "3",
    period: "session",
    summary: "Let the pack reroll more dice with Willpower for the scene."
  },
  {
    id: "gift-song-of-inspiration", name: "Song of Inspiration", giftType: "galliard", page: "160",
    level: 5, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Manipulation + Wisdom", duration: "One scene", difficulty: "3, or 2 if your chosen Skill has at least two dots",
    summary: "Inspire the pack in a chosen Social or Mental Skill."
  },
  {
    id: "gift-against-the-odds", name: "Against the Odds", giftType: "galliard", page: "160",
    level: 8, renown: "Glory", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Glory", period: "story",
    summary: "Help the whole pack recover Superficial Willpower by rolling Glory."
  },
  {
    id: "gift-break-the-shackles", name: "Break the Shackles", giftType: "galliard", page: "160",
    level: 8, renown: "Glory", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Resolve + Glory", difficulty: "3 by default", restriction: "Meet the subject’s eyes. The Storyteller sets the Difficulty.",
    summary: "Break supernatural control with eye contact and a sharp roar."
  },
  {
    id: "gift-defy-death", name: "Defy Death", giftType: "galliard", page: "160",
    level: 8, renown: "Honor", costText: "Free", action: "Free",
    pool: "Honor", naturalForms: ["homid","lupus"], period: "session", restriction: "Use when every box of your Health is marked Aggravated.",
    summary: "When Aggravated damage fills Health, roll Honor immediately to survive."
  },
  {
    id: "gift-dreamwalk", name: "Dreamwalk", giftType: "galliard", page: "161",
    level: 8, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Full scene", pool: "Wits + Wisdom", duration: "One scene", difficulty: "2 to observe, 3 to leave a message, or 4+ to reshape a dream",
    naturalForms: ["homid","lupus"],
    summary: "Enter a known subject's dream to observe, communicate, or reshape it."
  },
  {
    id: "gift-halt-the-cowards-flight", name: "Halt the Coward’s Flight", giftType: "ahroun", page: "161",
    level: 2, renown: "Honor", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Resolve + Honor vs. Composure + Survival", duration: "One scene", optionalTest: true,
    summary: "Slow a fleeing target within sight to a walk."
  },
  {
    id: "gift-rapid-shift", name: "Rapid Shift", giftType: "ahroun", page: "161",
    level: 2, renown: "Glory", costText: "Free (Shift cost still applies)", action: "Free",
    pool: "Dexterity + Glory", difficulty: "1 for Homid or Lupus, 2 for Glabro or Hispo, 3 for Crinos", naturalForms: ["homid","lupus"],
    summary: "Shift without losing dice for the minor action."
  },
  {
    id: "gift-razor-claws", name: "Razor Claws", giftType: "ahroun", page: "162",
    level: 2, renown: "Glory", rage: 1, freeInCrinos: true,
    costText: "Free/ 1 Rage Check", action: "Free / minor", duration: "One scene",
    summary: "Sharpen claws to add half Glory, rounded up, to damage."
  },
  {
    id: "gift-sense-danger", name: "Sense Danger", giftType: "ahroun", page: "162",
    level: 2, renown: "Wisdom", action: "Free", naturalForms: ["homid","lupus"],
    passive: true,
    summary: "Add Wisdom when sensing an immediate trap, ambush or surprise attack."
  },
  {
    id: "gift-primal-anger", name: "Primal Anger", giftType: "ahroun", page: "162",
    level: 5, renown: "Glory", action: "Minor", pool: "Glory",
    period: "session", restriction: "You take 1 Aggravated Health on activation.", healthCost: "aggravated",
    summary: "Trade one Aggravated Health for a burst of Rage."
  },
  {
    id: "gift-snarl-of-challenge", name: "Snarl of Challenge", giftType: "ahroun", page: "162",
    level: 5, renown: "Honor", rage: 1, costText: "1 Rage Check",
    action: "Minor", pool: "Charisma + Honor vs. Composure + Insight", duration: "One scene",
    summary: "Challenge nearby enemies and gain temporary protection if they submit."
  },
  {
    id: "gift-true-fear", name: "True Fear", giftType: "ahroun", page: "162",
    level: 5, renown: "Glory", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Charisma + Glory vs. Composure + Resolve", duration: "One scene", optionalTest: true,
    summary: "Freeze one nearby target in terror or drive them to flee."
  },
  {
    id: "gift-wind-claws", name: "Wind Claws", giftType: "ahroun", page: "163",
    level: 5, renown: "Wisdom", willpower: 1, freeInCrinos: true,
    costText: "Free/ 1 Willpower", action: "Free / minor", pool: "Wits + Wisdom", duration: "One scene",
    optionalTest: true,
    summary: "Cut through an amount of ordinary armor or damage reduction equal to Wisdom."
  },
  {
    id: "gift-closing-the-gap", name: "Closing the Gap", giftType: "ahroun", page: "163",
    level: 8, renown: "Glory", rage: 1, costText: "1 Rage Check",
    action: "Minor", duration: "One turn",
    summary: "Cross up to three meters per Glory to engage an enemy this turn."
  },
  {
    id: "gift-kiss-of-helios", name: "Kiss of Helios", giftType: "ahroun", page: "163",
    level: 8, renown: "Glory", rage: 1, costText: "1 Rage Check",
    action: "Minor", duration: "One scene",
    summary: "Ignore ordinary fire and burn targets who strike you barehanded."
  },
  {
    id: "gift-lunas-armor", name: "Luna’s Armor", giftType: "ahroun", page: "163",
    level: 8, renown: "Honor", willpower: 1, costText: "1 Willpower",
    action: "Minor", duration: "One scene",
    summary: "Convert part of Aggravated fire or silver damage to Superficial."
  },
  {
    id: "gift-silver-claws", name: "Silver Claws", giftType: "ahroun", page: "164",
    level: 8, renown: "Honor", willpower: 1, freeInCrinos: true,
    costText: "Free/ 1 Willpower", action: "Free / minor", duration: "One scene", restriction: "To maintain: take normal silver damage and test Resolve + Honor at Difficulty 3 each turn.",
    summary: "Coat claws in silver so they cause Aggravated damage to Garou."
  },
  {
    id: "gift-curse-of-aeolus", name: "Curse of Aeolus", giftType: "blackfury", page: "164",
    level: 3, renown: "Glory", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Resolve + Glory", duration: "One scene", difficulty: "2",
    naturalForms: ["homid","lupus"],
    summary: "Blanket an area in fog that hinders Awareness and Firearms."
  },
  {
    id: "gift-coup-de-grace", name: "Coup De Grâce", giftType: "blackfury", page: "164",
    level: 6, renown: "Glory", willpower: 1, costText: "1 Willpower",
    action: "Full", duration: "Next brawl or melee attack, or the scene ends",
    summary: "Prepare a finishing blow that can add Glory to damage."
  },
  {
    id: "gift-kalis-scar", name: "Kali’s Scar", giftType: "blackfury", page: "164",
    level: 6, renown: "Glory", rage: 1, costText: "1 Rage Check",
    action: "Minor", duration: "A night and a day",
    summary: "Prevent supernatural or ordinary healing of claw and bite wounds you inflict."
  },
  {
    id: "gift-wasp-talons", name: "Wasp Talons", giftType: "blackfury", page: "164",
    level: 6, renown: "Glory", action: "Full", pool: "Dexterity + Glory",
    restriction: "You take 1 Superficial Health on activation, and cannot use claws until it heals.", healthCost: "superficial",
    summary: "Make one ranged claw attack by flinging your talons."
  },
  {
    id: "gift-gorgons-visage", name: "Gorgon’s Visage", giftType: "blackfury", page: "165",
    level: 9, renown: "Glory", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Charisma + Glory vs. Wits + Occult", duration: "One scene",
    summary: "Paralyze onlookers who fail to look away or resist."
  },
  {
    id: "gift-odious-aroma", name: "Odious Aroma", giftType: "bonegnawer", page: "166",
    level: 3, renown: "Honor", rage: 1, costText: "1 Rage Check",
    action: "Minor", duration: "One scene", naturalForms: ["homid","lupus"], restriction: "Use outside combat.",
    summary: "Keep noncombatants from approaching through your overpowering scent."
  },
  {
    id: "gift-face-in-the-crowd", name: "Face in the Crowd", giftType: "bonegnawer", page: "166",
    level: 6, renown: "Honor", willpower: 1, costText: "1 Willpower",
    action: "Minor", duration: "One scene", onlyForms: ["homid","lupus"], period: "scene",
    restriction: "Homid in a human crowd or Lupus in a crowd of canids.",
    summary: "Disappear into a crowd and raise Difficulty to spot or follow you by Honor."
  },
  {
    id: "gift-streets-tell-stories", name: "Streets Tell Stories", giftType: "bonegnawer", page: "166",
    level: 6, renown: "Honor", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Resolve + Honor", duration: "One scene", naturalForms: ["homid","lupus"],
    summary: "Listen to living speech elsewhere along a street."
  },
  {
    id: "gift-a-thousand-eyes", name: "A Thousand Eyes", giftType: "bonegnawer", page: "166",
    level: 9, renown: "Honor", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Wits + Honor", duration: "One scene",
    summary: "View the surroundings through a nearby animal's eyes."
  },
  {
    id: "gift-between-the-cracks", name: "Between the Cracks", giftType: "bonegnawer", page: "167",
    level: 9, renown: "Honor", rage: 1, costText: "1 Rage Check",
    action: "Full", duration: "One turn",
    summary: "Slip into one crack and emerge from another a turn later."
  },
  {
    id: "gift-brothers-scent", name: "Brother’s Scent", giftType: "childrenofgaia", page: "167",
    level: 3, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Full", duration: "One scene", naturalForms: ["homid","lupus"], restriction: "Use Homid except at a gathering of Garou.",
    summary: "Pass as part of a gathering of strangers while you blend in."
  },
  {
    id: "gift-calm-the-furious-beast", name: "Calm the Furious Beast", giftType: "childrenofgaia", page: "167",
    level: 6, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Composure + Wisdom", difficulty: "Target’s current Rage, or 3 for other supernaturals", naturalForms: ["homid","lupus"],
    summary: "End another creature's frenzy."
  },
  {
    id: "gift-reveal-trauma", name: "Reveal Trauma", giftType: "childrenofgaia", page: "168",
    level: 6, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Intelligence + Wisdom", difficulty: "2 living, 3 spirit, 4 device, or test against Composure + Subterfuge", naturalForms: ["homid","lupus"],
    summary: "Identify the most serious current trauma and gain two dice to address it."
  },
  {
    id: "gift-lifes-presence", name: "Life’s Presence", giftType: "childrenofgaia", page: "168",
    level: 9, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Composure + Wisdom", duration: "One scene", optionalTest: true,
    summary: "Sense life within an area about the size of a home."
  },
  {
    id: "gift-share-the-pain", name: "Share the Pain", giftType: "childrenofgaia", page: "168",
    level: 9, renown: "Wisdom", rage: 1, costText: "1 Rage Check",
    action: "Free", duration: "One scene",
    summary: "Take half the physical damage dealt to a chosen set of packmates."
  },
  {
    id: "gift-camouflage", name: "Camouflage", giftType: "galestalker", page: "168",
    level: 3, renown: "Honor", variableCost: {"resource":"willpower","min":0,"max":1,"label":"Extend protection to the pack"}, costText: "Free / 1 Willpower",
    action: "Free / Full", duration: "One scene", naturalForms: ["homid","lupus"],
    summary: "Become much harder to see while still and silent."
  },
  {
    id: "gift-lacerating-wind", name: "Lacerating Wind", giftType: "galestalker", page: "169",
    level: 3, renown: "Honor", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Resolve + Honor vs. Stamina + Survival or Dexterity + Athletics", duration: "Margin",
    summary: "Chill several nearby opponents, or knock one unprepared foe down."
  },
  {
    id: "gift-chill-cloak", name: "Chill Cloak", giftType: "galestalker", page: "169",
    level: 6, renown: "Honor", variableCost: {"resource":"willpower","min":0,"max":1,"label":"Extend protection to the pack"}, costText: "Free / 1 Willpower",
    action: "Free / Full", duration: "One scene",
    summary: "Add Honor to avoiding electronic surveillance."
  },
  {
    id: "gift-blood-of-the-wastes", name: "Blood of the Wastes", giftType: "galestalker", page: "169",
    level: 9, renown: "Honor", costText: "Free", action: "Full",
    naturalForms: ["homid","lupus"],
    summary: "Weather harsh conditions and find food or water with Honor."
  },
  {
    id: "gift-claws-of-frozen-death", name: "Claws of Frozen Death", giftType: "galestalker", page: "169",
    level: 9, renown: "Honor", rageSpend: 1, freeInCrinos: true,
    costText: "Free/ 1 Rage", action: "Free / minor", pool: "Wits + Honor vs. Stamina + Survival", duration: "One scene",
    summary: "Chill foes wounded by your claws so they defend with fewer dice."
  },
  {
    id: "gift-augur", name: "Augur", giftType: "ghostcouncil", page: "170",
    level: 3, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Intelligence + Wisdom", duration: "One scene", naturalForms: ["homid","lupus"],
    summary: "Look through reflections in a chosen distant place."
  },
  {
    id: "gift-blackout", name: "Blackout", giftType: "ghostcouncil", page: "170",
    level: 3, renown: "Wisdom", rage: 1, costText: "1 Rage Check",
    action: "Full", duration: "One scene", naturalForms: ["homid","lupus"],
    summary: "Extinguish one visible light source per Wisdom."
  },
  {
    id: "gift-serpents-coil", name: "Serpent’s Coil", giftType: "ghostcouncil", page: "170",
    level: 6, renown: "Wisdom", rage: 1, costText: "1 Rage Check",
    action: "Minor", pool: "Wits + Wisdom", duration: "One scene or until ended or destroyed",
    summary: "Grapple at up to 10 meters with coils of mist."
  },
  {
    id: "gift-hands-of-the-earth", name: "Hands of the Earth", giftType: "ghostcouncil", page: "170",
    level: 6, renown: "Wisdom", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Resolve + Wisdom, Wits + Wisdom", duration: "Up to one scene",
    summary: "Move or throw visible objects by concentrating on them."
  },
  {
    id: "gift-shrouded-aspect", name: "Shrouded Aspect", giftType: "ghostcouncil", page: "171",
    level: 9, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Full", duration: "A number of turns (or roughly ten seconds in a longer scene) equal to the Wisdom of the user.",
    summary: "Evade visual observation and cameras while moving slowly."
  },
  {
    id: "gift-skinbind", name: "Skinbind", giftType: "glasswalker", page: "171",
    level: 3, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Full / minor", duration: "Indefinitely", naturalForms: ["homid","lupus"],
    summary: "Store carried objects as marks on your skin and draw them back out."
  },
  {
    id: "gift-energize", name: "Energize", giftType: "glasswalker", page: "171",
    level: 6, renown: "Wisdom", rage: 1, variableCost: {"resource":"rage","min":1,"max":5,"label":"Rage Checks required"},
    costText: "1+ Rage Checks", action: "Full", pool: "Resolve + Wisdom", duration: "One scene / Margin number of turns",
    optionalTest: true,
    summary: "Supply power to a device and briefly run damaged equipment."
  },
  {
    id: "gift-control-machine", name: "Control Machine", giftType: "glasswalker", page: "171",
    level: 9, renown: "Wisdom", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Manipulation + Wisdom", duration: "Up to one scene", difficulty: "3 or higher",
    summary: "Issue a command to a visible machine within 10 meters."
  },
  {
    id: "gift-doppelganger", name: "Doppelgänger", giftType: "glasswalker", page: "172",
    level: 9, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Manipulation + Wisdom", duration: "One scene", difficulty: "3",
    naturalForms: ["homid","lupus"],
    summary: "Take on the likeness of someone you know by sight."
  },
  {
    id: "gift-recover-memory", name: "Recover Memory", giftType: "glasswalker", page: "172",
    level: 9, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Intelligence + Wisdom", naturalForms: ["homid","lupus"],
    summary: "Recover what a damaged or erased object once contained."
  },
  {
    id: "gift-sacred-boundary", name: "Sacred Boundary", giftType: "hartwarden", page: "172",
    level: 3, renown: "Glory", costText: "Free", action: "Full",
    pool: "Wits + Glory against supernatural concealment", duration: "A day or a night or until broken (see above)", naturalForms: ["homid","lupus"], optionalTest: true,
    summary: "Mark a boundary and sense creatures who cross it, even at a distance."
  },
  {
    id: "gift-blessed-brew", name: "Blessed Brew", giftType: "hartwarden", page: "173",
    level: 3, renown: "Glory", willpower: 1, costText: "1 Willpower",
    action: "Full", duration: "Up to one session", naturalForms: ["homid","lupus"], period: "session",
    summary: "Prepare a drink that helps resist supernatural mental influence or fear."
  },
  {
    id: "gift-territorial-dominance", name: "Territorial Dominance", giftType: "hartwarden", page: "173",
    level: 6, renown: "Glory", rage: 1, costText: "1 Rage Check",
    duration: "A number of nights equal to the user’s Glory", restriction: "Mark the territory by the light of a full moon.",
    summary: "Bind yourself to territory and gain a die on physical tests within it."
  },
  {
    id: "gift-balors-gaze", name: "Balor’s Gaze", giftType: "hartwarden", page: "173",
    level: 9, renown: "Glory", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Charisma + Glory vs. Composure + Occult", duration: "One scene",
    summary: "Wrack one target with pain through your gaze."
  },
  {
    id: "gift-the-living-wood", name: "The Living Wood", giftType: "hartwarden", page: "173",
    level: 9, renown: "Glory", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Manipulation + Glory", duration: "One scene",
    summary: "Have nearby plants grapple someone who attacks you."
  },
  {
    id: "gift-hidden-killer", name: "Hidden Killer", giftType: "redtalon", page: "174",
    level: 3, renown: "Honor", willpower: 1, costText: "1 Willpower",
    action: "Full",
    summary: "Supernaturally erase obvious wounds and traces from a murder scene."
  },
  {
    id: "gift-render-down", name: "Render Down", giftType: "redtalon", page: "174",
    level: 3, renown: "Honor", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Resolve + Honor",
    summary: "Break down an object you keep touching for several minutes."
  },
  {
    id: "gift-gaias-embrace", name: "Gaia’s Embrace", giftType: "redtalon", page: "174",
    level: 6, renown: "Honor", rage: 1, costText: "1 Rage Check",
    action: "Full", duration: "Up to one scene",
    summary: "Pull low-flying creatures and objects toward the ground."
  },
  {
    id: "gift-quicksand", name: "Quicksand", giftType: "redtalon", page: "175",
    level: 6, renown: "Honor", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Intelligence + Honor", duration: "One scene", difficulty: "2 within 10 meters; add 1 per additional 10 meters",
    restriction: "Requires natural ground.",
    summary: "Turn a patch of natural ground into a bog that hinders movement and defense."
  },
  {
    id: "gift-shield-of-the-wyld", name: "Shield of the Wyld", giftType: "redtalon", page: "175",
    level: 9, renown: "Honor", willpower: 1, costText: "1 Willpower",
    action: "Minor", duration: "One scene",
    summary: "Ignore some damage from ordinary manufactured weapons."
  },
  {
    id: "gift-fatal-flaw", name: "Fatal Flaw", giftType: "shadowlord", page: "175",
    level: 3, renown: "Glory", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Intelligence + Glory vs. Composure + Subterfuge", naturalForms: ["homid","lupus"],
    summary: "Study a target to uncover an unknown source of Aggravated damage against them."
  },
  {
    id: "gift-icy-chill-of-despair", name: "Icy Chill of Despair", giftType: "shadowlord", page: "175",
    level: 3, renown: "Glory", rage: 1, costText: "1 Rage Check",
    action: "Minor", duration: "One scene",
    summary: "Add Glory to Intimidation and suppress ordinary Willpower use nearby."
  },
  {
    id: "gift-dire-distraction", name: "Dire Distraction", giftType: "shadowlord", page: "176",
    level: 6, renown: "Glory", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Composure + Glory vs. Wits + Occult (or Wisdom)", duration: "One action", naturalForms: ["homid","lupus"],
    optionalTest: true,
    summary: "Subtract Glory from a target's next quick action."
  },
  {
    id: "gift-thunderclap", name: "Thunderclap", giftType: "shadowlord", page: "176",
    level: 9, renown: "Glory", rage: 1, costText: "1 Rage Check",
    action: "Full", pool: "Strength + Glory vs. Stamina + Wits", duration: "One turn/ one scene",
    summary: "Knock nearby targets down with a thunderous pulse."
  },
  {
    id: "gift-under-the-gun", name: "Under the Gun", giftType: "shadowlord", page: "177",
    level: 9, renown: "Glory", willpower: 1, costText: "1 Willpower",
    action: "Full", duration: "One day per dot of Glory of the user", naturalForms: ["homid","lupus"],
    summary: "Curse a target so ranged attacks against them gain two dice."
  },
  {
    id: "gift-fetch-bounty", name: "Fetch Bounty", giftType: "silentstrider", page: "177",
    level: 3, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Wits + Wisdom", duration: "One scene", naturalForms: ["homid","lupus"],
    summary: "Find the closest available example of an ordinary kind of item."
  },
  {
    id: "gift-speech-of-the-world", name: "Speech of the World", giftType: "silentstrider", page: "177",
    level: 3, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Full", pool: "Intelligence + Wisdom", duration: "One scene", naturalForms: ["homid","lupus"],
    restriction: "Speaking intelligibly requires Homid or Glabro.",
    summary: "Make sense of an unfamiliar language."
  },
  {
    id: "gift-whispered-passage", name: "Whispered Passage", giftType: "silentstrider", page: "178",
    level: 3, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Minor", duration: "One scene", naturalForms: ["homid","lupus"],
    summary: "Suppress your own sound and muffle other sounds nearby."
  },
  {
    id: "gift-burrow", name: "Burrow", giftType: "silentstrider", page: "178",
    level: 6, renown: "Wisdom", rage: 1, costText: "1 Rage check",
    action: "Full", pool: "Strength + Wisdom", duration: "One scene",
    summary: "Make a temporary tunnel through earth."
  },
  {
    id: "gift-the-golden-path", name: "The Golden Path", giftType: "silentstrider", page: "178",
    level: 9, renown: "Wisdom", willpower: 1, costText: "1 Willpower",
    action: "Full", duration: "One scene", naturalForms: ["homid","lupus"],
    summary: "Add Wisdom to navigation through static hazards and obstacles."
  },
  {
    id: "gift-pack-instinct", name: "Pack Instinct", giftType: "silverfang", page: "178",
    level: 3, renown: "Honor", variableCost: {"resource":"willpower","min":0,"max":1,"label":"Seek a precise reading"}, costText: "Free / 1 Willpower",
    action: "Free", pool: "Composure + Honor", duration: "One scene", difficulty: "2 for a precise reading",
    naturalForms: ["homid","lupus"], optionalTest: true,
    summary: "Sense how packmates are doing, or find one and read their condition precisely."
  },
  {
    id: "gift-the-silver-compact", name: "The Silver Compact", giftType: "silverfang", page: "179",
    level: 3, renown: "Honor", rage: 1, costText: "1 Rage Check",
    action: "Minor", duration: "One scene", naturalForms: ["homid","lupus"],
    summary: "Turn the attention of spirits away and shrug off some of their damage."
  },
  {
    id: "gift-blood-of-the-pack", name: "Blood of the Pack", giftType: "silverfang", page: "179",
    level: 6, renown: "Honor", rage: 1, costText: "1 Rage Check",
    action: "Free", duration: "One turn", naturalForms: ["homid","lupus"],
    summary: "Let packmates make Rage Checks for each other for one turn."
  },
  {
    id: "gift-unity-of-the-pack", name: "Unity of the Pack", giftType: "silverfang", page: "179",
    level: 6, renown: "Honor", willpower: 1, costText: "1 Willpower",
    action: "Free", duration: "One turn", naturalForms: ["homid","lupus"],
    summary: "Let the pack pay Willpower costs for each other for one turn."
  },
  {
    id: "gift-lunas-avenger", name: "Luna’s Avenger", giftType: "silverfang", page: "179",
    level: 9, renown: "Honor", rage: 1, costText: "1 Rage Check",
    action: "Free", duration: "One scene",
    summary: "Gain physical attack and defense dice as packmates are injured."
  }
]

// Each tribal route keeps its own Total Renown requirement and book page.
export const GAROU_TRIBE_GIFT_ROUTES = {
  blackfury: [
    ["gift-curse-of-aeolus",3,"164"],
    ["gift-halt-the-cowards-flight",3,"164"],
    ["gift-porcupines-reprisal",3,"164"],
    ["gift-coup-de-grace",6,"164"],
    ["gift-kalis-scar",6,"164"],
    ["gift-wasp-talons",6,"164"],
    ["gift-break-the-shackles",9,"165"],
    ["gift-drain-spirit",9,"165"],
    ["gift-gorgons-visage",9,"165"],
    ["gift-whelp-body",9,"166"]
  ],
  bonegnawer: [
    ["gift-blissful-ignorance",3,"166"],
    ["gift-rapid-shift",3,"166"],
    ["gift-sight-from-beyond",3,"166"],
    ["gift-odious-aroma",3,"166"],
    ["gift-face-in-the-crowd",6,"166"],
    ["gift-scent-of-the-past",6,"166"],
    ["gift-streets-tell-stories",6,"166"],
    ["gift-a-thousand-eyes",9,"166"],
    ["gift-between-the-cracks",9,"167"],
    ["gift-defy-death",9,"167"]
  ],
  childrenofgaia: [
    ["gift-brothers-scent",3,"167"],
    ["gift-mothers-touch",3,"167"],
    ["gift-sense-the-true-form",3,"167"],
    ["gift-song-of-serenity",3,"167"],
    ["gift-calm-the-furious-beast",6,"167"],
    ["gift-open-seal",6,"168"],
    ["gift-reveal-trauma",6,"168"],
    ["gift-lunas-armor",9,"168"],
    ["gift-lifes-presence",9,"168"],
    ["gift-share-the-pain",9,"168"]
  ],
  galestalker: [
    ["gift-camouflage",3,"168"],
    ["gift-ensnare-spirit",3,"168"],
    ["gift-lacerating-wind",3,"169"],
    ["gift-chill-cloak",6,"169"],
    ["gift-call-the-ridden",6,"169"],
    ["gift-pulse-of-the-prey",6,"169"],
    ["gift-wind-claws",6,"169"],
    ["gift-blood-of-the-wastes",9,"169"],
    ["gift-claws-of-frozen-death",9,"169"],
    ["gift-oathbreakers-bane",9,"169"]
  ],
  ghostcouncil: [
    ["gift-augur",3,"170"],
    ["gift-sense-danger",3,"170"],
    ["gift-blackout",3,"170"],
    ["gift-serpents-coil",6,"170"],
    ["gift-hands-of-the-earth",6,"170"],
    ["gift-mindspeak",6,"170"],
    ["gift-dreamwalk",9,"171"],
    ["gift-shrouded-aspect",9,"171"],
    ["gift-take-the-true-form",9,"171"],
    ["gift-thieving-talons-of-the-magpie",9,"171"]
  ],
  glasswalker: [
    ["gift-animal-magnetism",3,"171"],
    ["gift-gaias-candor",3,"171"],
    ["gift-skinbind",3,"171"],
    ["gift-spiders-song",3,"171"],
    ["gift-grasp-from-beyond",6,"171"],
    ["gift-energize",6,"171"],
    ["gift-snarl-of-challenge",6,"171"],
    ["gift-control-machine",9,"171"],
    ["gift-doppelganger",9,"172"],
    ["gift-recover-memory",9,"172"]
  ],
  hartwarden: [
    ["gift-crows-laughter",3,"172"],
    ["gift-sacred-boundary",3,"172"],
    ["gift-blessed-brew",3,"173"],
    ["gift-beasts-fealty",6,"173"],
    ["gift-song-of-inspiration",6,"173"],
    ["gift-territorial-dominance",6,"173"],
    ["gift-balors-gaze",9,"173"],
    ["gift-the-living-wood",9,"173"],
    ["gift-kiss-of-helios",9,"174"],
    ["gift-living-ward",9,"174"]
  ],
  redtalon: [
    ["gift-hidden-killer",3,"174"],
    ["gift-razor-claws",3,"174"],
    ["gift-render-down",3,"174"],
    ["gift-song-of-rage",3,"174"],
    ["gift-fangs-of-judgment",6,"174"],
    ["gift-gaias-embrace",6,"174"],
    ["gift-quicksand",6,"175"],
    ["gift-feral-regression",9,"175"],
    ["gift-shield-of-the-wyld",9,"175"],
    ["gift-the-thousand-forms",9,"175"]
  ],
  shadowlord: [
    ["gift-fatal-flaw",3,"175"],
    ["gift-icy-chill-of-despair",3,"175"],
    ["gift-shadow-sense",3,"176"],
    ["gift-blur-of-the-milky-eye",6,"176"],
    ["gift-dire-distraction",6,"176"],
    ["gift-eyes-of-the-cobra",6,"176"],
    ["gift-true-fear",6,"176"],
    ["gift-geas",9,"176"],
    ["gift-thunderclap",9,"176"],
    ["gift-under-the-gun",9,"177"]
  ],
  silentstrider: [
    ["gift-fetch-bounty",3,"177"],
    ["gift-speech-of-the-world",3,"177"],
    ["gift-whispered-passage",3,"178"],
    ["gift-burrow",6,"178"],
    ["gift-scent-of-running-water",6,"178"],
    ["gift-umbral-tether",6,"178"],
    ["gift-against-the-odds",9,"178"],
    ["gift-closing-the-gap",9,"178"],
    ["gift-the-golden-path",9,"178"],
    ["gift-strength-of-purpose",9,"178"]
  ],
  silverfang: [
    ["gift-howl-of-assembly",3,"178"],
    ["gift-pack-instinct",3,"178"],
    ["gift-the-silver-compact",3,"179"],
    ["gift-blood-of-the-pack",6,"179"],
    ["gift-command-the-gathering",6,"179"],
    ["gift-unity-of-the-pack",6,"179"],
    ["gift-command-spirit",9,"179"],
    ["gift-lunas-avenger",9,"179"],
    ["gift-lunas-blessing",9,"179"],
    ["gift-silver-claws",9,"179"]
  ]
}
