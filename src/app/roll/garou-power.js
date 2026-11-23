import { MODULE_ID } from '../../constants.js'
import { garouEntryForItem as garouPowerEntry, garouPowerKind, garouPowerMatches } from '../rules/garou-powers.js'
import { getAttributeGroups, getSkillGroups } from '../traits.js'
import { addWillpowerDamage, formModifiers, formOf, GAROU_RENOWN, fitGarouDamage, garouHealth, garouHealthUpdate, rageOf, setRage } from '../schema/werewolf.js'
import { caernUseAvailable, caernUseUpdate, garouPackContext, packFavorPart } from '../schema/pack-effects.js'
import { packMembers } from '../schema/pack.js'
import { willpowerPool } from './checks.js'
import { garouPeriod } from '../schema/werewolf-session.js'
import { payRiteExpense, planRiteExpense, recordRiteExpense, riteExpenseDue, riteRecipients } from './garou-rite-expenses.js'
import { garouRollMode, rollRageCost, runGarouRoll, werewolfRollFlavor } from './werewolf.js'

const anyForm = ['gift-catfeet', 'gift-staredown', 'gift-sharpened-senses']
const optionalTest = ['gift-catfeet', 'gift-staredown', 'gift-tongue-of-the-beasts', 'rite-borne-word', 'rite-living-tale', 'rite-binding']
const soloRites = ['rite-living-tale']
const brutalComplications = [
  'rite-rage', 'rite-living-caern', 'rite-shadow-passage', 'rite-patronage', 'rite-caern-building',
  'rite-broken-sun', 'rite-grim-reach', 'rite-moons-fickle-grace'
]
const naturalForms = ['homid', 'lupus']

export function garouCombatTurn(actor, combat = game.combat) {
  if (!combat?.started) return null
  const entry = combat.combatant
  if (entry?.actor?.uuid !== actor.uuid) return null
  return { combat, entry, key: [combat.id, combat.round, entry.id].join(':'), round: combat.round }
}

export { garouPowerEntry }

export function garouPowerProblem(actor, item, entry = garouPowerEntry(item)) {
  if (actor.type !== 'werewolf' || !actor.isOwner) return 'This action requires edit access to the Garou.'
  if (!rageOf(actor)) return 'Lost the Wolf · recover Rage first.'
  if (actor.system.frenzyActive) return 'Unavailable during Frenzy.'
  const turn = garouCombatTurn(actor)
  if (turn && actor.getFlag(MODULE_ID, 'crinosTurn') === 'pending:' + turn.key) return 'Resolve the start of the turn in Crinos first.'
  if (garouPowerKind(item) === 'rite') return ''
  if (entry?.passive) return 'This Gift is passive.'
  if (entry?.period && actor.getFlag(MODULE_ID, 'garouGiftUses')?.[entry.id] === garouPeriod(entry.period)) {
    return 'This Gift was already used this ' + entry.period + '.'
  }

  const current = formOf(actor).id
  if (entry?.id === 'gift-thwarting-the-arrow' && current !== 'crinos') return 'This Gift requires Crinos.'
  const noNatural = entry ? !anyForm.includes(entry.id) : !item.getFlag(MODULE_ID, 'giftAnyForm')
  if (noNatural && naturalForms.includes(current)) return 'This Gift requires a supernatural form.'
  if (turn && actor.getFlag(MODULE_ID, 'giftTurn') === turn.key) return 'You have already used a Gift this turn.'
  return ''
}

const traitKey = (value) => String(value ?? '').toLowerCase().replace(/[^a-z]/g, '')

export function powerPoolOptions(actor, item, entry = garouPowerEntry(item), recipient = null) {
  const attributes = getAttributeGroups().flatMap(({ entries }) => entries)
  const skills = getSkillGroups().flatMap(({ entries }) => entries)
  const renown = GAROU_RENOWN.map(([id, label]) => ({ id, label, path: 'system.renown.' + id + '.value' }))
  const traits = [
    ...attributes.map((entry) => ({ ...entry, kind: 'attribute' })),
    ...skills.map((entry) => ({ ...entry, kind: 'skill' })),
    ...renown.map((entry) => ({ ...entry, kind: 'renown' }))
  ]
  const labelOf = (group) => group.map(({ label }) => label).join(' + ')
  const poolOf = (value, category) => {
    const key = traitKey(value)
    return traits.find((trait) => (!category || trait.path.startsWith('system.' + category + '.')) &&
      [traitKey(trait.label), traitKey(trait.id), ...(trait.id === 'driving' ? ['drive'] : [])].includes(key))
  }
  const stored = Object.values(item.system.dicepool ?? {}).map(({ path = '' } = {}) => {
    const [category, id] = path.replace(/^system\./, '').split('.')
    return poolOf(id, category)
  }).filter(Boolean)
  const first = entry?.pool?.split(/ vs\.?| for | if | when | to /)[0] || ''
  const options = []
  if (stored.length && entry?.id !== 'rite-wolf-reborn') options.push({ label: labelOf(stored), parts: stored })

  for (const choice of first.split(', ')) {
    const [left, right] = choice.split(' + ')
    const secondary = poolOf(right)
    const contextual = /[Rr]enown/.test(left) || left === 'Relevant'
    const firstOptions = contextual ? traits.filter(({ kind }) => kind === 'renown') : [poolOf(left)].filter(Boolean)
    if (entry?.id === 'rite-wolf-reborn') {
      if (recipient && secondary) {
        const highest = Math.max(...firstOptions.map(({ id }) => Number(recipient.system.renown?.[id]?.value) || 0))
        options.push({ label: recipient.name + ' · highest Renown (' + highest + ') + ' + secondary.label,
          parts: [{ ...firstOptions[0], label: 'Target’s highest Renown', value: highest }, secondary] })
      }
      continue
    }
    if (!secondary && right) continue
    for (const firstTrait of firstOptions) {
      const parts = [firstTrait, secondary].filter(Boolean)
      if (!options.some(({ label }) => label === labelOf(parts))) options.push({ label: labelOf(parts), parts })
    }
  }
  if (entry?.id === 'gift-tongue-of-the-beasts') {
    const parts = [poolOf('Charisma'), poolOf('Wisdom')].filter(Boolean)
    if (parts.length === 2) options.push({ label: labelOf(parts) + ' · Request', parts })
  }
  return options
}

export function powerAssistants(actor, item) {
  if (garouPowerKind(item) !== 'rite' || soloRites.includes(garouPowerEntry(item)?.id)) return []
  const pack = garouPackContext(actor)?.group
  const targets = [...(game.user.targets ?? [])].map((token) => token.actor)
  return [...new Map([...(pack ? packMembers(pack) : []), ...targets]
    .filter((member) => member?.type === 'werewolf' && member.uuid !== actor.uuid)
    .map((member) => [member.uuid, member])).values()]
}

export const canAssistRite = (actor) => rageOf(actor) > 0 && !actor.system.frenzyActive
export const knowsRite = (actor, item) => actor.items.some((known) => garouPowerKind(known) === 'rite' && garouPowerMatches(known, {
  id: item.getFlag(MODULE_ID, 'garouPowerId'), name: item.name
}))

export function garouPowerCosts(actor, item, entry, extra) {
  const rage = entry?.id === 'gift-spirit-of-the-fray'
    ? Math.max(0, Math.min(actor.system.renown?.glory?.value ?? 0, Number(extra) || 0))
    : entry?.id === 'gift-the-howl-carries' ? (extra ? 1 : 0) : entry?.rage ?? item.system.cost ?? 0
  const costs = { rage, rageSpend: entry?.rageSpend ?? 0, willpower: entry?.willpower ?? item.system.willpowercost ?? 0 }
  if (entry?.variableCost) {
    const { resource, min, max } = entry.variableCost
    costs[resource] = Math.max(min, Math.min(max, Number(extra ?? costs[resource]) || 0))
  }
  if (entry?.freeInCrinos && formOf(actor).id === 'crinos') return { rage: 0, rageSpend: 0, willpower: 0 }
  return costs
}

export function powerCanSkipTest(item, entry) {
  return !entry?.pool && !Object.keys(item.system.dicepool ?? {}).length || optionalTest.includes(entry?.id) || Boolean(entry?.optionalTest)
}

export function powerDifficulty(entry, caern, count, { returning = false, stronger = false, recipient, parts = [] } = {}) {
  const id = entry?.id
  if (id === 'rite-sacred-scar') return Math.max(2, Number(recipient?.system.renown?.[parts[0]?.id]?.value) || 0)
  if (['rite-rage', 'rite-tranquility', 'rite-shared-fury'].includes(id)) return Math.max(3, count) + (id === 'rite-rage' && stronger ? 2 : 0)
  if (id === 'rite-forgetful-record') return count
  if (id === 'rite-whispering-field') return count + 1
  if (id === 'rite-shadow-passage' && caern) return Math.max(1, caern.gauntlet - (returning ? 2 : 0))
  if (['gift-penumbral-senses', 'rite-grim-reach', 'rite-caging'].includes(id) && caern) return caern.gauntlet
  if (['rite-living-caern', 'rite-shrouded-glen'].includes(id) && caern) return 2 + caern.value
  if (id === 'rite-caern-building' && caern) return caern.value ? 4 + caern.value : 5
  return Number(entry?.difficulty?.match(/^\d+(?=\W|$)/)?.[0]) || (id === 'rite-borne-word' || id === 'rite-living-tale' ? 3 : 0)
}

export function powerRollPool(actor, item, { parts = [], customDice, modifier, assistants, favor, atCaern, attune, minorAction }) {
  const rite = garouPowerKind(item) === 'rite'
  const context = garouPackContext(actor)
  const entry = garouPowerEntry(item)
  const base = parts.length ? parts.reduce((sum, trait) => sum + (trait.value ?? (Number(foundry.utils.getProperty(actor, trait.path)) || 0)), 0) : Number(customDice) || 0
  const form = !rite && entry?.id !== 'gift-staredown' ? formModifiers(actor, parts, false) : { parts: [], blocked: false }
  const bonuses = [...form.parts]
  if (minorAction) bonuses.push({ label: 'Shapeshifting', value: -2 })
  if (Number(modifier)) bonuses.push({ label: 'Modifier', value: Number(modifier) })
  const patron = favor ? packFavorPart(actor, parts) : null
  if (patron) bonuses.push(patron)
  if (atCaern && rite && entry?.id === 'rite-shadow-passage' && context?.traits.gauntlet) {
    bonuses.push({ label: 'Permissive Gauntlet', value: context.traits.gauntlet })
  }
  const attuned = !rite && atCaern && attune && context?.traits.attunement && caernUseAvailable(actor, 'attunement', 'scene')
  if (attuned) bonuses.push({ label: 'Spiritual Attunement', value: context.traits.attunement })
  const health = garouHealth(actor)
  const healthImpaired = !actor.system.frenzyActive && parts.some((part) => part.kind === 'attribute' && ['strength', 'dexterity', 'stamina'].includes(part.id)) &&
    health.max > 0 && health.superficial + health.aggravated >= health.max
  const willpowerImpaired = parts.some((part) => part.kind === 'attribute' && !['strength', 'dexterity', 'stamina'].includes(part.id)) && willpowerPool(actor) === 0
  if (healthImpaired || willpowerImpaired) bonuses.push({ label: 'Impairment', value: -2 })

  const total = base > 0 ? Math.max(1, Math.trunc(base + bonuses.reduce((sum, part) => sum + part.value, 0))) : 0
  const leaderRage = Math.min(total, rageOf(actor))
  const focus = rite && atCaern ? Number(context?.traits['rite-focus']) || 0 : 0
  const helpers = rite ? assistants : []
  const learned = helpers.filter((member) => knowsRite(member, item)).length
  return {
    base, bonuses, blocked: form.blocked, attuned: Boolean(attuned), focus, learned,
    basicDice: total - leaderRage + focus + learned,
    advancedDice: leaderRage + helpers.length
  }
}

function healthCostUpdate(actor, type) {
  const health = garouHealth(actor)
  const next = { ...health, [type]: health[type] + 1 }
  return garouHealthUpdate(actor, fitGarouDamage(next, health.max))
}

const running = new Set()
const postAction = async (actor, title, text, rollMode) => {
  const escape = foundry.utils.escapeHTML
  const data = { speaker: ChatMessage.getSpeaker({ actor }), content: '<b>' + escape(title) + '</b><p>' + escape(text) + '</p>' }
  await ChatMessage.create(ChatMessage.applyRollMode(data, rollMode) ?? data)
}

export async function performGarouPower(actor, item, settings) {
  const key = actor.uuid ?? actor.id
  if (running.has(key)) throw new Error('An action is already in progress.')
  const liveItem = actor.items.get?.(item.id) ?? actor.items.find((candidate) => candidate.id === item.id)
  if (!liveItem) throw new Error('This item is no longer on the character.')
  const entry = garouPowerEntry(liveItem)
  const problem = garouPowerProblem(actor, liveItem, entry)
  if (problem) throw new Error(problem)
  const rite = garouPowerKind(liveItem) === 'rite'
  const turn = rite ? null : garouCombatTurn(actor)
  const candidates = rite ? powerAssistants(actor, liveItem) : []
  const recipient = riteRecipients(actor, entry, candidates).find((member) => member.uuid === settings.recipient)
  if (entry?.id === 'rite-wolf-reborn') settings = { ...settings, parts: powerPoolOptions(actor, liveItem, entry, recipient)[0]?.parts ?? [], difficulty: 3 }
  if (entry?.id === 'rite-sacred-scar') settings = {
    ...settings, difficulty: powerDifficulty(entry, null, 1, { recipient, parts: settings.parts })
  }
  const assistants = (settings.assistants ?? []).map((uuid) => candidates.find((member) => member.uuid === uuid))
  if (assistants.some((member) => !member || !canAssistRite(member))) throw new Error('One of the participants can no longer assist.')
  const expense = planRiteExpense(actor, entry, recipient, assistants, settings.shares)
  if (expense.problem) throw new Error(expense.problem)
  const costs = garouPowerCosts(actor, liveItem, entry, settings.extra)
  if (entry?.id === 'gift-spirit-of-the-fray' && costs.rage < 1) throw new Error('Choose at least one additional opponent.')
  if (willpowerPool(actor) < costs.willpower) throw new Error('Not enough unmarked Willpower.')
  if (rageOf(actor) < costs.rageSpend) throw new Error('Not enough Rage.')
  if (settings.skip && !powerCanSkipTest(liveItem, entry)) throw new Error('This power needs an activation test.')
  const pool = settings.skip ? null : powerRollPool(actor, liveItem, { ...settings, assistants })
  if (pool && (pool.blocked || pool.basicDice + pool.advancedDice <= 0)) throw new Error('No valid dice pool in this form.')
  const title = liveItem.name
  const difficulty = Number(settings.difficulty) || 0

  running.add(key)
  try {
    const mode = await garouRollMode(title)
    if (mode === null) return false
    const startingRage = rageOf(actor)
    const loss = costs.rage ? await rollRageCost(actor, costs.rage, title + ' · Rage Cost', { rollMode: mode, startingRage }) : 0
    if (loss === null) return false
    const receipt = expense.rule && 'rite' + foundry.utils.randomID()
    let result
    try {
      if (pool) {
        const dice = [
          ...pool.bonuses.map(({ label, value }) => label + ' ' + (value > 0 ? '+' : '') + value),
          ...(assistants.length ? ['Assistance · +' + assistants.length + ' Rage / +' + pool.learned + ' regular'] : []),
          ...(pool.focus ? ['Rite Focus · +' + pool.focus + ' regular'] : []),
          entry?.summary || ''
        ].filter(Boolean)
        result = await runGarouRoll(actor, {
          title, basicDice: pool.basicDice, advancedDice: pool.advancedDice,
          difficulty: settings.opposed && difficulty > 0 ? difficulty + 1 : difficulty, rollMode: mode,
          flavor: werewolfRollFlavor({
            flavor: foundry.utils.escapeHTML(dice.join(' · ')) +
              (expense.rule?.outcome ? ('<span class="bo-rite-expense-' + receipt + '"></span>') : ''),
            riteBrutal: brutalComplications.includes(entry?.id)
          }),
          selectors: [rite ? 'rites' : 'gifts', ...(settings.parts ?? []).map(({ id }) => id)]
        })
      }
    } finally {
      const changes = {
        ...(costs.willpower ? addWillpowerDamage(actor, costs.willpower) : {}),
        ...(entry?.healthCost ? healthCostUpdate(actor, entry.healthCost) : {}),
        ...(entry?.period ? { ['flags.' + MODULE_ID + '.garouGiftUses.' + entry.id]: garouPeriod(entry.period) } : {}),
        ...(turn ? { ['flags.' + MODULE_ID + '.giftTurn']: turn.key } : {}),
        ...(pool?.attuned && result ? caernUseUpdate(actor, 'attunement', 'scene') : {})
      }
      if (loss || costs.rageSpend || Object.keys(changes).length) await setRage(actor, Math.max(0, rageOf(actor) - loss - costs.rageSpend), changes)
    }
    if (!pool) await postAction(actor, title, entry?.summary || 'Used without an activation test.', mode)
    if (expense.rule?.outcome && result && await recordRiteExpense(receipt, title, expense, difficulty)) return true
    if (expense.rule && riteExpenseDue(expense.rule, result, difficulty)) {

      try {
        await payRiteExpense(expense, title, receipt)
      } catch (error) {
        error.retryPayment = () => payRiteExpense(expense, title, receipt)
        throw error
      }
    }
    return true
  } finally {
    running.delete(key)
  }
}
