import { birthForm, formOf, GAROU_FORMS, garouHealth, garouHealthUpdate, garouStateUpdate, rageOf, setRage, addWillpowerDamage } from '../schema/werewolf.js'
import { willpowerPool } from './checks.js'

const activeResults = (term) => (term?.results ?? []).filter((die) => die.active !== false && !die.discarded)
const termOf = (roll, type) => roll.terms?.find((term) => term.dieType === type)
const checkMarker = 'bo-rage-check'
const rageBeforeCheck = /<span class="bo-rage-check" data-rage="([1-5])"><\/span>/
const testMarker = '<span class="bo-garou-test"></span>'
const brutalMarker = '<span class="bo-brutal-aids"></span>'
const riteBrutalMarker = '<span class="bo-brutal-rite"></span>'
const noWillpowerMarker = '<span class="bo-no-willpower"></span>'

export async function garouRollMode(title, requested) {
  let rollMode = requested ?? game.settings.get('core', 'rollMode') ?? 'publicroll'
  if (rollMode === 'blindroll') {
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      classes: ['blood-oracle', 'bo-dialog', 'bo-splat-werewolf'],
      window: { title },
      content: '<p>This roll can change visible character trackers. Make a private roll visible to you and the Storyteller?</p>',
      rejectClose: false
    })
    if (!confirmed) return null
    rollMode = 'gmroll'
  }
  return rollMode
}

export async function runGarouRoll(actor, options) {
  const rollMode = await garouRollMode(options.title, options.rollMode)
  if (rollMode === null) return null
  let result
  await WOD5E.api.Roll({
    actor, data: actor.system, quickRoll: true, ...options, rollMode,
    callback: (error, roll) => {
      if (error) throw error
      result = roll
    }
  })
  if (!result) throw new Error('WoD5e did not return a roll')
  return result
}

export async function rollRageCost(actor, count, title, { rollMode, startingRage = rageOf(actor) } = {}) {
  const roll = await runGarouRoll(actor, {
    title, advancedDice: count, disableBasicDice: true, rollMode,
    flavor: `<span class="${checkMarker}" data-rage="${startingRage}"></span>`
  })
  if (!roll) return null
  const results = activeResults(termOf(roll, 'advanced'))
  if (results.length !== count) throw new Error('WoD5e returned an incomplete Rage check')
  return results.filter((die) => die.result < 6).length
}

export async function checkRage(actor) {
  if (rageOf(actor) < 1) return
  const loss = await rollRageCost(actor, 1, 'Rage Check')
  if (loss === null) return
  return setRage(actor, Math.max(0, rageOf(actor) - loss))
}

export async function shiftGarou(actor, target, maintain = false) {
  const current = formOf(actor)
  const form = GAROU_FORMS.find(({ id }) => id === target)
  if (!form || (current.id === target) !== maintain || actor.system.frenzyActive) return
  if (form.checks && !rageOf(actor)) return
  const loss = form.checks ? await rollRageCost(actor, form.checks, (maintain ? 'Maintain ' : 'Shift to ') + form.name) : 0
  if (loss === null) return
  const rage = Math.max(0, rageOf(actor) - loss)
  if (form.checks && !rage) return setRage(actor, 0)
  return actor.update(garouStateUpdate(actor, { form: target, rage: current.id === 'crinos' && !maintain && rage ? 1 : rage }))
}

export async function regenerateGarou(actor, aggravated = false) {
  const form = formOf(actor)
  const health = garouHealth(actor)
  const key = aggravated ? 'aggravated' : 'superficial'
  if (!form.checks || !rageOf(actor) || !health[key]) return
  const loss = await rollRageCost(actor, aggravated ? 2 : 1, aggravated ? 'Regenerate Aggravated Health' : 'Regenerate Superficial Health')
  if (loss === null) return
  const current = garouHealth(actor)
  const amount = !aggravated && form.id === 'crinos' ? 2 : 1
  const healed = { ...current, [key]: Math.max(0, current[key] - amount) }
  await setRage(actor, Math.max(0, rageOf(actor) - loss), garouHealthUpdate(actor, healed, loss >= rageOf(actor)))
}

async function beginFrenzy(actor, rollMode) {
  const loss = formOf(actor).id === 'crinos' ? 0 : await rollRageCost(actor, 2, 'Frenzy · Shift to Crinos', { rollMode, startingRage: 5 })
  if (loss === null) return
  await actor.update(garouStateUpdate(actor, { form: 'crinos', rage: 5 - loss, frenzy: true }))
}

export function endFrenzy(actor) {
  return actor.update(garouStateUpdate(actor, { form: birthForm(actor), rage: 0, frenzy: false }))
}

export async function resistGarouFrenzy(actor) {
  if (actor.system.frenzyActive) return
  const roll = await runGarouRoll(actor, {
    title: 'Resist Frenzy', basicDice: Math.max(1, willpowerPool(actor)), disableAdvancedDice: true,
    difficulty: formOf(actor).id === 'crinos' ? 3 : 2, flavor: noWillpowerMarker
  })
  if (roll && !roll.rollSuccessful) return beginFrenzy(actor, roll.rollMode)
}

export async function leaveFrenzy(actor) {
  if (!actor.system.frenzyActive) return
  const roll = await runGarouRoll(actor, {
    title: 'End Frenzy · Willpower', basicDice: Math.max(1, willpowerPool(actor)), difficulty: 2,
    disableAdvancedDice: true, flavor: noWillpowerMarker
  })
  if (roll?.rollSuccessful) await endFrenzy(actor)
}

export async function holdCrinos(actor, spend) {
  if (formOf(actor).id !== 'crinos' || actor.system.frenzyActive) return
  return spend && willpowerPool(actor) > 0 ? actor.update(addWillpowerDamage(actor)) : beginFrenzy(actor)
}

export async function testBalance(actor, track, difficulty) {
  const balance = actor.system.balance
  const roll = await runGarouRoll(actor, {
    title: track === 'harano' ? 'Harano Test' : 'Hauglosk Test',
    basicDice: Math.max(1, (balance?.harano?.value ?? 0) + (balance?.hauglosk?.value ?? 0)),
    disableAdvancedDice: true, difficulty, flavor: noWillpowerMarker
  })
  if (!roll || roll.rollSuccessful) return
  const path = 'system.balance.' + track + '.value'
  await actor.update({ [path]: Math.min(5, (actor.system.balance?.[track]?.value ?? 0) + 1) })
}

export function werewolfRollFlavor({ flavor, rageAids, frenzy, riteBrutal }) {
  return flavor + testMarker + (rageAids ? brutalMarker : '') + (riteBrutal ? riteBrutalMarker : '') + (frenzy ? noWillpowerMarker : '')
}

export function garouRollResult(roll) {
  const flavor = roll.options?.flavor ?? ''
  if (roll.system !== 'werewolf' || !flavor.includes(testMarker)) return null
  const rageDice = activeResults(termOf(roll, 'advanced'))
  const dice = [...activeResults(termOf(roll, 'basic')), ...rageDice]
  if (!dice.length) return null
  const brutal = rageDice.filter(({ result }) => result <= 2).length >= 2
  const aids = brutal && flavor.includes(brutalMarker)
  const ritual = brutal && flavor.includes(riteBrutalMarker)
  if (brutal && !aids && !ritual) return { total: 0, brutal, aids, ritual }

  const successes = dice.filter(({ result }) => result >= 6).length
  const criticals = Math.floor(dice.filter(({ result }) => result === 10).length / 2)
  return { total: successes + criticals * 2 + (aids ? 4 : 0), brutal, aids, ritual }
}

export function registerGarouRollTotals() {
  const RollClass = CONFIG.Dice.rolls.find((RollType) => RollType.name === 'WOD5eRoll')
  if (!RollClass) return
  const prototype = RollClass.prototype
  const nativeTotal = Object.getOwnPropertyDescriptor(prototype, 'total')?.get
  const inherited = Object.getPrototypeOf(prototype)
  const nativeToJSON = prototype.toJSON

  // WoD5e creates its own Roll class even when called through WOD5E.api.Roll.
  // Resolve Blood Oracle's marked tests from the current dice, including rerolls.
  Object.defineProperty(prototype, 'total', {
    configurable: true,
    get() {
      return garouRollResult(this)?.total ?? (nativeTotal ? nativeTotal.call(this) : Reflect.get(inherited, 'total', this))
    }
  })
  prototype.toJSON = function (...args) {
    const data = nativeToJSON.apply(this, args)
    const result = garouRollResult(this)
    if (result) data.total = result.total
    return data
  }
}

export function renderWerewolfRoll(message, html) {
  if (!message.isContentVisible) return
  const roll = message.rolls?.[0]
  const advanced = roll && termOf(roll, 'advanced')
  if (!roll || roll.system !== 'werewolf') return
  const flavor = roll.options?.flavor ?? ''
  const check = flavor.includes(checkMarker)
  if (check || flavor.includes(noWillpowerMarker)) {
    for (const die of html.querySelectorAll('.rerollable')) die.classList.remove('rerollable')
  }
  if (!check && !flavor.includes(testMarker)) return
  const result = html.querySelector('.roll-result-label')
  const total = html.querySelector('.roll-total .total-contents')
  if (!result) return
  const rageDice = activeResults(advanced)
  if (check) {
    const failures = rageDice.filter(({ result }) => result < 6).length
    const startingRage = flavor.match(rageBeforeCheck)?.[1]
    result.textContent = failures
      ? startingRage ? 'Rage lost: ' + Math.min(failures, Number(startingRage)) : 'Failed Rage checks: ' + failures
      : 'Rage retained'
    if (total) total.textContent = String(rageDice.length - failures)
    result.classList.remove('success', 'failure', 'rage-failure')
    return
  }
  const outcome = garouRollResult(roll)
  if (!outcome?.brutal) return
  const { aids, ritual, total: adjusted } = outcome
  if (ritual) {
    if (total) total.textContent = String(adjusted)
    result.textContent += ' · Brutal complication'
    return
  }
  if (!aids) {
    if (total) total.textContent = '0'
    result.classList.remove('success', 'failure')
    result.classList.add('rage-failure')
    result.textContent = 'Brutal Outcome · Failure'
    return
  }
  const difficulty = Number(roll.options?.difficulty) || 0
  if (total) total.textContent = String(adjusted)
  result.classList.remove('success', 'failure', 'rage-failure')
  if (difficulty) result.classList.add(adjusted >= difficulty ? 'success' : 'failure')
  result.textContent = 'Brutal Outcome · ' + (total ? '+4 successes' : `${adjusted} successes (+4)`) +
    (difficulty ? (adjusted >= difficulty ? ` · Success by ${adjusted - difficulty}` : ` · Failure by ${difficulty - adjusted}`) : '')
}
