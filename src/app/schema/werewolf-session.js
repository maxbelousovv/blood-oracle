import { MODULE_ID } from '../../constants.js'
import { garouStateUpdate } from './werewolf.js'

const PERIOD_SETTINGS = { session: 'garouSession', story: 'garouStory', scene: 'garouScene' }
const SESSION_SETTING = PERIOD_SETTINGS.session
const USES_FLAG = 'garouSessionUses'
const SESSION_CHANGED = MODULE_ID + '.garouSessionChanged'

export const GAROU_BALANCE_ACTIONS = {
  harano: { name: 'Desperate Rage', description: 'Mark 1 Harano to raise Rage to 5. Once per session.' },
  hauglosk: { name: 'Merciless Willpower', description: 'Mark 1 Hauglosk to heal all Willpower damage. Once per session.' }
}

export function registerGarouSession() {
  for (const key of Object.values(PERIOD_SETTINGS)) {
    game.settings.register(MODULE_ID, key, {
      scope: 'world',
      config: false,
      type: String,
      default: 'first',
      onChange: () => Hooks.callAll(SESSION_CHANGED)
    })
  }
}

export function garouPeriod(kind) {
  const key = game.settings.get(MODULE_ID, PERIOD_SETTINGS[kind])
  return kind === 'scene' ? garouSession() + ':' + key : key
}

export const garouSession = () => game.settings.get(MODULE_ID, SESSION_SETTING)

export function startGarouPeriod(kind) {
  if (game.user.isGM && Object.hasOwn(PERIOD_SETTINGS, kind)) {
    return game.settings.set(MODULE_ID, PERIOD_SETTINGS[kind], foundry.utils.randomID())
  }
}

export function subscribeGarouSession(callback) {
  const id = Hooks.on(SESSION_CHANGED, callback)
  return () => Hooks.off(SESSION_CHANGED, id)
}

export function startGarouSession() {
  return startGarouPeriod('session')
}

export function usedBalanceAction(actor, track, session = garouSession()) {
  return actor.getFlag(MODULE_ID, USES_FLAG)?.[track] === session
}

export async function applyBalanceAction(actor, track) {
  if (actor.type !== 'werewolf' || !actor.isOwner || !Object.hasOwn(GAROU_BALANCE_ACTIONS, track)) return
  const session = garouSession()
  const rating = actor.system.balance?.[track]?.value ?? 0
  if (rating >= 5 || usedBalanceAction(actor, track, session)) return
  const effect = track === 'harano'
    ? garouStateUpdate(actor, { rage: 5 })
    : { 'system.willpower.superficial': 0, 'system.willpower.aggravated': 0 }

  await actor.update({
    ...effect,
    ['system.balance.' + track + '.value']: rating + 1,
    ['flags.' + MODULE_ID + '.' + USES_FLAG + '.' + track]: session
  })
}
