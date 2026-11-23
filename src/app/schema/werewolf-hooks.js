import { birthForm, fitGarouDamage, formOf, GAROU_FORMS, garouHealth, garouHealthUpdate, rageOf, setRage } from './werewolf.js'

const usesGarouSheet = (actor) => actor?.type === 'werewolf' && actor._getSheetClass()?.name === 'BloodOracleSheet'

function readChange(changes, path) {
  return Object.hasOwn(changes, path) ? changes[path] : foundry.utils.getProperty(changes, path)
}

function writeChange(changes, path, value) {
  if (Object.hasOwn(changes, path)) changes[path] = value
  else foundry.utils.setProperty(changes, path, value)
}

export function initializeGarouBalance(actor, data) {
  if (actor.type !== 'werewolf') return
  const initial = {}
  for (const track of ['harano', 'hauglosk']) {
    const path = 'system.balance.' + track + '.value'
    if (readChange(data, path) === undefined) initial[path] = 0
  }
  if (Object.keys(initial).length) actor.updateSource(initial)
}

export function reconcileGarouState(actor, changes) {
  if (!usesGarouSheet(actor)) return
  const rageChange = readChange(changes, 'system.rage.value')
  const formChange = readChange(changes, 'system.activeForm')
  const frenzyChange = readChange(changes, 'system.frenzyActive')
  if (rageChange == null && formChange == null && frenzyChange == null) return

  const current = formOf(actor)
  let rage = Math.max(0, Math.min(5, Number(rageChange ?? rageOf(actor)) || 0))
  let form = GAROU_FORMS.find(({ id }) => id === formChange) ?? current
  let frenzy = frenzyChange ?? actor.system.frenzyActive
  if (!rage || (actor.system.frenzyActive && frenzyChange === false)) {
    if (form.checks || actor.system.frenzyActive) form = GAROU_FORMS.find(({ id }) => id === birthForm(actor))
    rage = 0
    frenzy = false
  }

  if (current.id === 'crinos' && form.id !== 'crinos') {
    const health = actor.system.health
    const max = readChange(changes, 'system.health.max') ?? health.max
    const total = {}
    for (const damage of ['superficial', 'aggravated']) {
      const normal = readChange(changes, 'system.health.' + damage) ?? health[damage]
      const extra = readChange(changes, 'system.crinosHealth.' + damage) ?? actor.system.crinosHealth[damage]
      total[damage] = (Number(normal) || 0) + (Number(extra) || 0)
      writeChange(changes, 'system.crinosHealth.' + damage, 0)
    }
    for (const [damage, value] of Object.entries(fitGarouDamage(total, max))) {
      writeChange(changes, 'system.health.' + damage, value)
    }
    if (rage) rage = 1
  }

  writeChange(changes, 'system.rage.value', rage)
  writeChange(changes, 'system.activeForm', form.id)
  writeChange(changes, 'system.frenzyActive', Boolean(frenzy))
  writeChange(changes, 'system.lostTheWolf', rage === 0)
}

export function repairGarouState(actor) {
  if (actor.type !== 'werewolf' || !actor.isOwner || rageOf(actor)) return
  if (formOf(actor).checks || actor.system.frenzyActive) return setRage(actor, 0)
}

function availableHealth(health) {
  return Math.max(0, health.max - health.superficial - health.aggravated)
}

function tokenHealthUpdate(actor, value, isDelta) {
  const health = garouHealth(actor)
  const current = availableHealth(health)
  const target = Math.round(Math.min(health.max, isDelta ? current + value : Math.max(0, value)))
  const difference = target - current
  let next
  if (difference < 0) {
    next = fitGarouDamage({ ...health, superficial: health.superficial - difference }, health.max)
  } else {
    next = {
      superficial: Math.max(0, health.superficial - difference),
      aggravated: health.aggravated - Math.max(0, difference - health.superficial)
    }
  }
  return difference ? garouHealthUpdate(actor, next) : null
}

export function registerGarouTokenHealth() {
  const prototype = CONFIG.Token.documentClass.prototype
  const nativeGetBar = prototype.getBarAttribute
  prototype.getBarAttribute = function (bar, options) {
    const data = nativeGetBar.call(this, bar, options)
    if (data?.attribute !== 'health' || !usesGarouSheet(this.actor)) return data
    const health = garouHealth(this.actor)
    return { ...data, max: health.max, value: availableHealth(health) }
  }

  const actorPrototype = CONFIG.Actor.documentClass.prototype
  const nativeModifyAttribute = actorPrototype.modifyTokenAttribute
  actorPrototype.modifyTokenAttribute = async function (attribute, value, isDelta = false, isBar = true) {
    if (!isBar || attribute !== 'health' || !usesGarouSheet(this)) {
      return nativeModifyAttribute.call(this, attribute, value, isDelta, isBar)
    }
    if (!Number.isFinite(value)) return this
    const updates = tokenHealthUpdate(this, value, isDelta)
    if (!updates || Hooks.call('modifyTokenAttribute', { attribute, value, isDelta, isBar }, updates, this) === false) return this
    return this.update(updates)
  }
}

export function refreshGarouTokenHealth(canvas) {
  for (const token of canvas?.tokens?.placeables ?? []) {
    if (!usesGarouSheet(token.actor)) continue
    token.document._prepareBars()
    token.renderFlags.set({ refreshBars: true })
  }
}
