/**
 * Clan facts the character creator needs and the rules reference does not
 * carry: each clan's three disciplines and a one-line description in our own
 * words. Names match the reference's clan names, so the two join up.
 *
 * Caitiff and Thin-blood have no clan disciplines: the Caitiff choose any
 * three; thin-bloods have none, and reach Thin-Blood Alchemy through a merit.
 */
export const CLANS = [
  { name: 'Banu Haqim', disciplines: ['sorcery', 'celerity', 'obfuscate'], blurb: 'Judges and assassins who hunt the blood of the guilty.' },
  { name: 'Brujah', disciplines: ['celerity', 'potence', 'presence'], blurb: 'Rebels with short tempers and long grudges.' },
  { name: 'Gangrel', disciplines: ['animalism', 'fortitude', 'protean'], blurb: 'Wanderers who live close to the Beast and the wild.' },
  { name: 'Hecata', disciplines: ['auspex', 'fortitude', 'oblivion'], blurb: 'Necromancer families bound by blood and the dead.' },
  { name: 'Lasombra', disciplines: ['dominate', 'oblivion', 'potence'], blurb: 'Climbers who wield shadow and cast no reflection.' },
  { name: 'Malkavian', disciplines: ['auspex', 'dominate', 'obfuscate'], blurb: 'Seers whose insight comes wrapped in madness.' },
  { name: 'The Ministry', disciplines: ['obfuscate', 'presence', 'protean'], blurb: 'Tempters who preach liberation through vice.' },
  { name: 'Nosferatu', disciplines: ['animalism', 'obfuscate', 'potence'], blurb: 'Hideous keepers of secrets in the dark.' },
  { name: 'Ravnos', disciplines: ['animalism', 'obfuscate', 'presence'], blurb: 'Illusionists always one step from the next town.' },
  { name: 'Salubri', disciplines: ['auspex', 'dominate', 'fortitude'], blurb: 'Healers and seekers, hunted for their blood.' },
  { name: 'Toreador', disciplines: ['auspex', 'celerity', 'presence'], blurb: 'Lovers of beauty, fashion and artifice.' },
  { name: 'Tremere', disciplines: ['auspex', 'dominate', 'sorcery'], blurb: 'Blood sorcerers of a broken pyramid.' },
  { name: 'Tzimisce', disciplines: ['animalism', 'dominate', 'protean'], blurb: 'Possessive lords who shape flesh and hold domain.' },
  { name: 'Ventrue', disciplines: ['dominate', 'fortitude', 'presence'], blurb: 'Rulers who must command, and must own.' },
  { name: 'Caitiff', disciplines: [], blurb: 'The clanless: unclaimed, distrusted, free to learn anything.' },
  { name: 'Thin-blood', disciplines: [], blurb: 'Duskborn on the edge of mortality, scorned by true vampires.' }
]

export const CLAN_BY_NAME = Object.fromEntries(CLANS.map((clan) => [clan.name, clan]))

/** The disciplines a Caitiff may choose among: every clan discipline. */
export const ALL_CLAN_DISCIPLINES = ['animalism', 'auspex', 'celerity', 'dominate', 'fortitude', 'obfuscate', 'oblivion', 'potence', 'presence', 'protean', 'sorcery']
