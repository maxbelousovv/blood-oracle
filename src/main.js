import { renderRiteExpense } from './app/roll/garou-rite-expenses.js'
import { registerGarouCombat, renderGarouAttack } from './app/roll/garou-combat.js'
import { packOf } from './app/schema/pack.js'
import { renderCellDangerRequest } from './app/roll/cell-danger.js'
import { registerGarouRollTotals, renderWerewolfRoll } from './app/roll/werewolf.js'
import { initializeGarouBalance, reconcileGarouState, refreshGarouTokenHealth, registerGarouTokenHealth } from './app/schema/werewolf-hooks.js'
import { registerGarouSession } from './app/schema/werewolf-session.js'
import { guardHunterWillpowerRecovery } from './app/schema/touchstones.js'
import { BloodOracleSheet } from './sheet/blood-oracle-sheet.js'
import { BloodOracleBoardSheet } from './sheet/board-sheet.js'
import { MODULE_ID } from './constants.js'
import { loadRules, getRules, RULES_PATH_SETTING, DEFAULT_RULES_PATH } from './app/rules/catalog.js'
import { registerStatuses, registerStatusHooks, syncStatuses } from './statuses.js'
import { registerLockSetting } from './app/lock.js'
import { registerTrackHooks, syncTracks } from './app/schema/derived.js'
import './styles/blood-oracle.css'

export { MODULE_ID }

Hooks.once('init', () => {
  // wod5e registers its own sheets with `makeDefault: true`. We register
  // alongside them with `makeDefault: false`, so nothing changes until a user
  // picks Blood Oracle in an actor's Sheet Configuration dialog.
  foundry.applications.apps.DocumentSheetConfig.registerSheet(Actor, MODULE_ID, BloodOracleSheet, {
    // Mortals and ghouls share the vampire's data model, so the same sheet
    // serves all three; what differs is which tabs it shows.
    types: ['vampire', 'ghoul', 'mortal', 'hunter', 'werewolf', 'spc', 'group'],
    makeDefault: false,
    label: 'Blood Oracle'
  })

  // Any journal can become a detective board by picking this sheet. That gives
  // the table as many boards as it wants, in folders, with Foundry's own
  // permissions deciding who can open a private investigation.
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    JournalEntry,
    MODULE_ID,
    BloodOracleBoardSheet,
    {
      types: ['base'],
      makeDefault: false,
      label: 'Blood Oracle — Detective board'
    }
  )

  // Path to the rules reference, relative to Foundry's Data directory. Empty
  // disables the reference entirely; the sheet still works by hand.
  game.settings.register(MODULE_ID, RULES_PATH_SETTING, {
    name: 'Rules reference file',
    hint:
      'Path within the Foundry Data directory to a rules JSON produced by tools/extract-rules.mjs. ' +
      'Leave empty to run without a reference. The file is never bundled with this module.',
    scope: 'world',
    config: true,
    type: String,
    default: DEFAULT_RULES_PATH,
    requiresReload: false,
    onChange: () => loadRules({ force: true })
  })

  // A member's sheet shows what their coterie holds, so a change to the
  // coterie's backgrounds redraws its members' open sheets.
  const redrawMembers = (item) => {
    const group = item?.parent
    if (group?.documentName !== 'Actor' || group.type !== 'group') return
    for (const uuid of group.system?.members ?? []) {
      const member = fromUuidSync(uuid)
      if (member?.sheet?.rendered) member.sheet.render()
    }
  }
  Hooks.on('createItem', redrawMembers)
  Hooks.on('updateItem', redrawMembers)
  Hooks.on('deleteItem', redrawMembers)
  // The group itself changing — its domain, who keeps membership secret —
  // matters to members' sheets as well.
  Hooks.on('updateActor', (actor, changes) => {
    if (actor?.type === 'group') redrawMembers({ parent: actor })
    if (actor?.type === 'werewolf' && (changes?.system?.experiences || changes?.['system.experiences'])) {
      const pack = packOf(actor)
      if (pack?.sheet?.rendered) pack.sheet.render()
    }
  })

  registerGarouSession()
  registerGarouCombat()
  if (game.system.id === 'wod5e') registerGarouTokenHealth()
  registerLockSetting()
  Hooks.on('renderChatMessageHTML', renderCellDangerRequest)
  Hooks.on('renderChatMessageHTML', renderWerewolfRoll)
  Hooks.on('renderChatMessageHTML', renderRiteExpense)
  Hooks.on('renderChatMessageHTML', renderGarouAttack)
  Hooks.on('preUpdateActor', guardHunterWillpowerRecovery)
  Hooks.on('preCreateActor', initializeGarouBalance)
  Hooks.on('preUpdateActor', reconcileGarouState)
  Hooks.on('canvasReady', refreshGarouTokenHealth)
  registerTrackHooks()
  registerStatuses()
  registerStatusHooks()

  console.log('Blood Oracle | Sheets registered.')
})

Hooks.once('ready', async () => {
  if (game.system.id !== 'wod5e') {
    ui.notifications.error(
      'Blood Oracle requires the World of Darkness 5e system and will not function here.'
    )
    return
  }

  if (!globalThis.WOD5E?.api?.Roll) {
    ui.notifications.error(
      'Blood Oracle could not find the WOD5E roll API. The system may have changed its public interface.'
    )
  }

  registerGarouRollTotals()
  refreshGarouTokenHealth(globalThis.canvas)

  // Loaded once per client. A missing file is a supported state, so failure
  // here is logged rather than surfaced as an error.
  // Bring existing actors in line once, so statuses are correct on first load
  // rather than only after the next edit.
  for (const actor of game.actors) {
    if (actor.isOwner) syncStatuses(actor)
  }

  // Existing characters predate derived maximums. One client corrects them —
  // the GM's, so several connected owners do not all write the same change.
  if (game.user.isGM) {
    for (const actor of game.actors) syncTracks(actor)
  }

  await loadRules()
  const rules = getRules()
  if (rules) {
    console.log(`Blood Oracle | Rules reference loaded: ${rules.entries.length} entries.`)
  }
})
