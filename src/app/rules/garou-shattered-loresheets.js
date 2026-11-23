const make = (id, name, page, summary, levels, restriction) => ({
  id: 'w5-' + id, name, source: 'Shattered Nation · p. ' + page, summary,
  levels: levels.map(([title]) => title), summaries: levels.map(([, detail]) => detail),
  ...(restriction ? { restriction } : {})
})

export const SHATTERED_LORESHEETS = [
  make('aino-metsala', 'Aino “Lil Gaia” Metsälä', 132, 'Take a role in Gaia First and reckon with the demands of Aino’s environmental cause.', [
    ['A Gaia First Member', 'Add 1 die to work against the Weaver. Flying, littering, polluting, or consuming industrial meat costs 1 die on all tests for the session.'],
    ['Networked', 'In a city, call on Allies 2 for a night of shelter or local insight. Authorities and enemies have −1 die to find you. You also take Dark Secret 1.'],
    ['Devotion to the Cause', 'Cancel a commitment to oppose the Weaver or Wyrm and get +2 dice for the scene, with the consequences of missing it. The level-one conduct restrictions cost 2 dice for the session and stack.'],
    ['Committed Activist', 'The network provides urban shelter, introductions, information, and favors as Allies 3. Authorities and enemies take −2 dice to find you, and you gain Infamy 2.'],
    ['Fanaticism', 'Sit on Gaia First’s board and influence its campaigns. Forsake time-consuming commitments. Driving or flying, littering, polluting, or industrial meat incurs a stacking −3 dice until session end.']
  ]),
  make('alejandro-mendoza', 'Alejandro “Vaporfang” Mendoza', 133, 'Put underground online contacts and the help of machine spirits to use.', [
    ['/access', 'Once per session add 2 Rage dice to a digital Technology test or an online Investigation test.'],
    ['/join', 'Once per session call on an underground online network as Allies 3 to mount an in-story campaign or recover inaccessible information. Requires internet access.'],
    ['/whois', 'Once per story add 4 dice to an online Investigation test. You also have Mask 2.'],
    ['/override', 'Once per story request a non-destructive task from a digital machine spirit, with the scope of Control Machine and no test. The Storyteller decides whether it can do it.'],
    ['/chmod', 'Once per session propel any claim through the media, true or false. The Storyteller judges the consequences.']
  ], { skill: 'technology', minimum: 2, text: 'Technology 2+. You cannot work for the government or a Pentex front.' }),
  make('jonas-albrecht', 'Jonas Albrecht', 134, 'Carry the memory of the old Garou Nation and decide what rebuilding it costs you.', [
    ['Memories of a Broken Nation', 'Once per session add your Harano rating to a dice pool.'],
    ['Sharing the Dream', 'Once per session take 1 Harano from someone else onto your own track. When assisting with a Skill test, add 2 dice.'],
    ['A Slim Chance', 'Once per story test Harano and take 1 Aggravated Willpower per failure to heal 1 Harano. Add 1 die when defending Albrecht or the old Nation’s ideals.'],
    ['Fighting Spirit', 'Once per session move 1 mark from Harano to Hauglosk. Add 2 dice when defending Albrecht or the Nation’s ideals, replacing A Slim Chance’s bonus. Gain local Allies 2.'],
    ['Mended Nation', 'Once per session mark 1 Harano or Hauglosk to add 4 dice to a test. Garou who share the cause look to you for leadership.']
  ]),
  make('liu-aihan', 'Liu “Returning Maiden” Aihan', 135, 'Learn to see auspice and lunar spirits through the teachings of the Returning Maiden.', [
    ['Moon Cultist', 'Learn one Gift of another auspice in place of the starting Native Gift or by spending XP later.'],
    ['Constant Flux', 'Count as a different auspice for a Rite or ceremony. Related tests take +1 Difficulty.'],
    ['Lune Speaker', 'Add 2 dice to tests concerning Luna or her spirits, provided you are not in conflict with them.'],
    ['Mercurial', 'You may learn three Gifts from other auspices. They may replace the starting Native or Tribal Gifts or be bought later with XP.'],
    ['Moon Path', 'During a full moon in the Umbra, travel between caerns in about a day and night. Roll Composure + Occult at Difficulty 3 plus each companion. Carry an object from destinations you have never visited. Failure brings hazards and a Brutal Outcome brings a guardian.']
  ]),
  make('oba-makinde', 'Oba “Trailblazer” Makinde', 136, 'Gain access to Omniscent’s work and contacts as your loyalty to the company comes under pressure.', [
    ['Loved Me as a Loser', 'As a freelancer, add 1 die to tests to monitor or infiltrate Pentex fronts or the relevant associates of Vaporfang and Aino.'],
    ['I Don’t Like What Happened', 'Gain Resources 1 and leads on Wyrm organizations. Once per story add 3 dice to locate a person with a digital footprint through Omniscent’s service.'],
    ['Now You’re Worried That I Just Might Win', 'Gain Resources 2 through the company. Add 2 dice to Finance tests targeting Wyrm organizations, their workers, or fomori.'],
    ['Twenty Years of Boredom', 'Gain Resources 3 and a Contact 2 at the company. Lose 2 dice on attempts to harm Weaver spirits, Omniscent, or Trailblazer.'],
    ['Guided by the Beauty of Your Weapons', 'Gain Resources 4 and two Contacts at 3 dots. Trailblazer is a friend. Lose 4 dice on attempts to harm Omniscent, Trailblazer, or their partners, including Pentex.']
  ]),
  make('ross-the-she-wolf-jackson', 'Ross the She-Wolf Jackson', 137, 'Follow Ross’s example in protecting the environment and standing with your community.', [
    ['Pollution Down to Zero', 'Once per session use scent to gauge the degree and source of local pollution affecting the environment or wildlife.'],
    ['Change Is in the Air', 'Gain 1 die on your first test after you shift into Glabro, Crinos, or Hispo.'],
    ['The Power is Yours', 'Once per session add 4 dice to a test that directly prevents pollution.'],
    ['Trans wolf', 'Make one additional Rage Check and spend 1 Willpower while shifting to change your sex. The change persists through later shifts until you use this again.'],
    ['Pride', 'Once per story spend a scene with your minority community to restore all lost Willpower. Refusing a call for help from a member costs 3 Aggravated Willpower and suspends this benefit until you help.']
  ]),
  make('vandana-puri', 'Vandana “The Impresario” Puri', 138, 'Borrow the Impresario’s reach as a host, organizer, and hunter of Stolen Moons.', [
    ['Killer Organizer', 'Add 2 dice to arranging or promoting events and negotiating rates, wages, or rents.'],
    ['Find the Thief', 'Add 2 dice to recognize or find Stolen Moons.'],
    ['Preferred Partner', 'Gain three Contacts 1 in hospitality or performance, Fame 2 as an organizer, and Adversary 2 from a rival Garou.'],
    ['Catch the Thief', 'You can sense Stolen Moons from up to ten miles away. Add 3 dice to locate or follow one.'],
    ['Protégé', 'Gain Fame 4. Invitations can reach almost anyone in human or Garou society. They will try to attend if free and safe enough, and may take precautions if they suspect danger.']
  ])
]
