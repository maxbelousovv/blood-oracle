import { MODULE_ID } from '../../constants.js'
import { addWillpowerDamage, formOf, garouHealth, garouHealthUpdate, garouStateUpdate, rageOf, setRage } from '../schema/werewolf.js'
import { storyCharacterType } from '../splats.js'
import { willpowerPool } from './checks.js'
import { garouCombatTurn } from './garou-power.js'

export const NATURAL_ATTACKS = {
  claws: { id: 'claws', name: 'Claws', bonus: 3, forms: ['crinos'] },
  bite: { id: 'bite', name: 'Bite', bonus: 1, forms: ['crinos', 'hispo'] }
}

export function availableNaturalAttacks(actor, slots) {
  if (!slots.some((slot) => slot.kind === 'skill' && slot.id === 'brawl')) return []
  return Object.values(NATURAL_ATTACKS).filter(({ forms }) => forms.includes(formOf(actor).id))
}

export function targetedActors() {
  return [...new Map([...(game.user.targets ?? [])].map((token) => token.actor).filter(Boolean).map((actor) => [actor.uuid, actor])).values()]
}

const splat = (actor) => storyCharacterType(actor) ?? actor?.type
const resistant = (actor) => ['vampire', 'werewolf', 'spirit'].includes(splat(actor))
export function attackDamageType(attack, target) {
  return attack.id === 'bite' ? 'aggravated' : !target ? 'conditional' : resistant(target) ? 'superficial' : 'aggravated'
}

export function naturalDamage(total, difficulty, attack) {
  return Number.isFinite(total) && difficulty > 0 && total >= difficulty ? total - difficulty + attack.bonus : 0
}

export function damageHealth(track, levels, aggravated) {
  const superficial = Number(track.superficial) || 0
  const severe = Number(track.aggravated) || 0
  const open = Math.max(0, (Number(track.max) || 0) - superficial - severe)
  const fresh = Math.min(open, levels)
  const convert = Math.min(superficial + (aggravated ? 0 : fresh), levels - fresh)

  return {
    ...track,
    superficial: superficial + (aggravated ? 0 : fresh) - convert,
    aggravated: severe + (aggravated ? fresh : 0) + convert
  }
}

function healthUpdate(actor, levels, aggravated) {
  const garou = actor.type === 'werewolf'
  const track = garou ? garouHealth(actor) : actor.system.health ?? {}
  const next = damageHealth(track, levels, aggravated)
  return garou ? garouHealthUpdate(actor, next) : {
    'system.health.superficial': next.superficial, 'system.health.aggravated': next.aggravated
  }
}

export function naturalAttackFlavor(attack, target, choice = 'auto') {
  const uuid = encodeURIComponent(target?.uuid ?? '')
  const damage = ['aggravated', 'superficial'].includes(choice) ? choice : 'auto'
  return '<span class="bo-garou-attack" data-attack="' + attack.id + '" data-target="' + uuid + '" data-damage="' + damage + '"></span>'
}

const attackMarker = /<span class="bo-garou-attack" data-attack="(claws|bite)" data-target="([%a-z0-9_.-]*)" data-damage="(aggravated|superficial|auto)"><\/span>/i
const applyingDamage = new Set()
export function renderGarouAttack(message, html) {
  if (!message.isContentVisible) return
  const roll = message.rolls?.[0]
  const match = roll?.options?.flavor?.match(attackMarker)
  const result = html.querySelector('.roll-result-label')
  if (!match || !result || html.querySelector('.bo-garou-damage')) return
  const attack = NATURAL_ATTACKS[match[1]]
  if (!attack) return
  const target = match[2] ? fromUuidSync(decodeURIComponent(match[2])) : null
  const type = attack.id === 'bite' || match[3] === 'auto' ? attackDamageType(attack, target) : match[3]
  const difficulty = Number(roll.options.difficulty) || 0
  const raw = naturalDamage(Number(roll.total), difficulty, attack)
  const tag = type === 'conditional' ? 'Aggravated against ordinary targets · Superficial against resistant targets'
    : type === 'superficial' ? 'Superficial' : 'Aggravated'
  const div = html.ownerDocument.createElement('div')
  div.className = 'bo-garou-damage'
  div.textContent = !difficulty ? attack.name + ' · on a win, margin +' + attack.bonus + ' · ' + tag
    : attack.name + (raw ? ' · ' + raw + ' ' + tag + ' damage' : ' · No damage')
  result.after(div)
  if (!raw || !target?.isOwner || !target.system.health?.max || type === 'conditional') return
  const applied = target.getFlag(MODULE_ID, 'garouDamageRolls') ?? []
  const button = html.ownerDocument.createElement('button')
  const damage = type === 'superficial' ? Math.ceil(raw / 2) : raw
  button.type = 'button'
  button.textContent = applied.includes(message.id) ? 'Damage applied' : 'Apply ' + damage + ' to ' + target.name
  button.disabled = applied.includes(message.id)
  button.onclick = async () => {
    const key = target.uuid
    if (applyingDamage.has(key) || !target.isOwner) return
    applyingDamage.add(key)
    try {
      const yes = await foundry.applications.api.DialogV2.confirm({
        classes: ['blood-oracle', 'bo-dialog', 'bo-splat-werewolf'],
        window: { title: 'Apply Health damage' },
        content: '<p>' + foundry.utils.escapeHTML(target.name) + ' will mark ' + damage + ' ' + tag + ' damage. Confirm any protection first.</p>',
        rejectClose: false
      })
      const current = target.getFlag(MODULE_ID, 'garouDamageRolls') ?? []
      if (!yes || current.includes(message.id)) return
      await target.update({
        ...healthUpdate(target, damage, type === 'aggravated'),
        ['flags.' + MODULE_ID + '.garouDamageRolls']: [...current.slice(-99), message.id]
      })
      button.disabled = true
      button.textContent = 'Damage applied'
    } catch (error) {
      console.error('Blood Oracle | Natural weapon damage failed', error)
      ui.notifications.error('Could not apply the damage.')
    } finally {
      applyingDamage.delete(key)
    }
  }
  div.append(button)
}

export function deliriumOf(witness) {
  if (resistant(witness)) return null
  const { composure, resolve } = witness.system.attributes ?? {}
  const score = Math.max(1, Math.min(10, (Number(composure?.value) || 0) + (Number(resolve?.value) || 0)))
  return { score, ...deliriumResult(score) }
}

export function deliriumResult(score) {
  if (score >= 10) return { response: 'Resignation', memory: 'Remembers' }
  if (score >= 6) return { response: 'Controlled fear', memory: 'Usually forgets' }
  return { response: 'Fear', memory: 'Forgets' }
}

const combatStamp = 'crinosTurn'
const silverFlag = 'silverContact'
const checkFlag = 'silverTurn'
export const silverContact = (actor) => Boolean(actor.getFlag(MODULE_ID, silverFlag))
export function markSilverContact(actor, yes) {
  return actor.setFlag(MODULE_ID, silverFlag, Boolean(yes))
}

const applyingSilver = new Set()
export async function takeSilver(actor, damage = 1, { contact = false, turn } = {}) {
  const key = actor.uuid ?? actor.id
  if (!actor.isOwner || actor.type !== 'werewolf' || applyingSilver.has(key) ||
      !Number.isInteger(damage) || damage < 1 || damage > 50) return false

  const rage = rageOf(actor)
  if (contact && (!formOf(actor).checks || (turn && actor.getFlag(MODULE_ID, checkFlag) === turn.key))) return false
  const changes = healthUpdate(actor, contact ? 1 : damage, true)
  if (turn && contact) changes['flags.' + MODULE_ID + '.' + checkFlag] = turn.key

  applyingSilver.add(key)
  try {
    if (contact) {
      if (rage === 5) Object.assign(changes, addWillpowerDamage(actor))
      await setRage(actor, Math.min(5, rage + 1), changes)
    } else await actor.update(changes)
    return true
  } finally {
    applyingSilver.delete(key)
  }
}

const resolver = (actor) => {
  const players = Array.from(game.users ?? []).filter((user) => user.active && !user.isGM && actor.testUserPermission?.(user, 'OWNER'))
    .sort((a, b) => Number(b.character?.id === actor.id) - Number(a.character?.id === actor.id) || a.id.localeCompare(b.id))
  return players[0] ?? game.users?.activeGM ?? (game.user.isGM ? game.user : null)
}

const handling = new Set()
export function crinosTurnPending(actor, turn = garouCombatTurn(actor)) {
  return Boolean(turn && formOf(actor).id === 'crinos' && !actor.system.frenzyActive &&
    actor.getFlag(MODULE_ID, combatStamp) === 'pending:' + turn.key)
}

export async function resolveCrinosTurn(actor, spend, turn = garouCombatTurn(actor)) {
  if (!actor.isOwner || !turn || garouCombatTurn(actor, turn.combat)?.key !== turn.key || !crinosTurnPending(actor, turn)) return
  const updates = spend && willpowerPool(actor) > 0 ? addWillpowerDamage(actor) : garouStateUpdate(actor, { form: 'crinos', frenzy: true, rage: 5 })
  await actor.update({ ...updates, ['flags.' + MODULE_ID + '.' + combatStamp]: turn.key })
}

export function markCrinosKill(actor, turn = garouCombatTurn(actor)) {
  if (!turn || formOf(actor).id !== 'crinos' || !actor.isOwner ||
      garouCombatTurn(actor, turn.combat)?.key !== turn.key || crinosTurnPending(actor, turn)) return
  return actor.setFlag(MODULE_ID, 'crinosKill', turn.key)
}

export async function prepareGarouTurn(combat) {
  const actor = combat?.combatant?.actor
  if (!actor?.isOwner || actor.type !== 'werewolf' || actor._getSheetClass?.()?.name !== 'BloodOracleSheet' ||
      resolver(actor)?.id !== game.user.id) return
  const turn = garouCombatTurn(actor, combat)
  if (!turn || handling.has(turn.key)) return

  handling.add(turn.key)
  try {
    if (silverContact(actor)) await takeSilver(actor, 1, { contact: true, turn })
    if (formOf(actor).id !== 'crinos' || actor.system.frenzyActive) return
    const flag = actor.getFlag(MODULE_ID, combatStamp)
    if (flag === turn.key || flag === 'pending:' + turn.key) return
    const previous = [combat.id, turn.round - 1, turn.entry.id].join(':')
    if (actor.getFlag(MODULE_ID, 'crinosKill') === previous) {
      await actor.setFlag(MODULE_ID, combatStamp, turn.key)
      return
    }
    await actor.setFlag(MODULE_ID, combatStamp, 'pending:' + turn.key)
    if (!willpowerPool(actor)) {
      await resolveCrinosTurn(actor, false, turn)
      return
    }
    const choice = await foundry.applications.api.DialogV2.wait({
      classes: ['blood-oracle', 'bo-dialog', 'bo-splat-werewolf'],
      window: { title: 'Hold Crinos · ' + actor.name },
      content: '<p>Your turn began in Crinos. Spend 1 Willpower or enter Frenzy.</p>',
      buttons: [
        { action: 'spend', label: 'Spend Willpower', default: true },
        { action: 'frenzy', label: 'Enter Frenzy' }
      ],
      rejectClose: false
    })
    if (choice) await resolveCrinosTurn(actor, choice === 'spend', turn)
  } finally {
    handling.delete(turn.key)
  }
}

export function registerGarouCombat() {
  Hooks.on('updateCombat', (combat, changes, options) => {
    if ((!Object.hasOwn(changes, 'round') && !Object.hasOwn(changes, 'turn')) || options?.direction < 0) return
    void prepareGarouTurn(combat).catch((error) => {
      console.error('Blood Oracle | Could not start Garou combat turn', error)
      ui.notifications.error('Could not start the Garou turn. Use the Forms tab to resolve it.')
    })
  })
}
