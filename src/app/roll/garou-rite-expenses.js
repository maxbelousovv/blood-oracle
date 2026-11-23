import { MODULE_ID } from '../../constants.js'
import { experienceTotals, readExperiences } from '../schema/journal.js'
import { garouStateUpdate, formOf, birthForm, addWillpowerDamage, rageOf } from '../schema/werewolf.js'
import { willpowerPool } from './checks.js'
import { garouRollResult } from './werewolf.js'

const EXPENSES = {
  'rite-wolf-reborn': { label: 'Rage', amount: 3, target: 'Garou who Lost the Wolf', outcome: 'win-or-brutal' },
  'rite-borne-word': { label: 'Willpower', amount: 3 },
  'rite-sacred-scar': { label: 'XP', amount: 5, target: 'Recipient of the glyph', outcome: 'win' }
}
export const riteExpenseRule = (entry) => EXPENSES[entry?.id]

export function riteRecipients(actor, entry, candidates) {
  if (!riteExpenseRule(entry)?.target) return []
  return candidates.filter((recipient) => recipient.uuid !== actor.uuid &&
    (entry.id !== 'rite-wolf-reborn' || rageOf(recipient) === 0))
}

const available = (actor, label) => {
  if (label === 'Rage') return rageOf(actor)
  if (label === 'Willpower') return willpowerPool(actor)
  return experienceTotals(actor).remaining
}

export function planRiteExpense(actor, entry, recipient, assistants, shares = {}) {
  const rule = riteExpenseRule(entry)
  if (!rule) return {}
  if (rule.target && !recipient) return { problem: 'Choose the ' + rule.target.toLowerCase() + '.' }
  const participants = [actor, ...assistants]
  if (recipient && participants.some((member) => member.uuid === recipient.uuid)) {
    return { problem: 'The recipient cannot contribute dice to this Rite.' }
  }
  const payers = rule.label === 'XP' ? [[recipient, rule.amount]] : participants
    .map((member) => [member, Number(shares[member.uuid] ?? 0)]).filter(([, amount]) => amount !== 0)
  if (new Set(participants.map(({ uuid }) => uuid)).size !== participants.length ||
      payers.some(([, amount]) => !Number.isInteger(amount) || amount < 1) ||
      payers.reduce((sum, [, amount]) => sum + amount, 0) !== rule.amount) {
    return { problem: 'Assign exactly ' + rule.amount + ' ' + rule.label + '.' }
  }
  const unauthorized = payers.find(([member]) => !member.isOwner)
  if (unauthorized) return { problem: 'Ask the Storyteller to perform this Rite from the master’s sheet. Edit access to ' + unauthorized[0].name + ' is needed.' }
  const short = payers.find(([member, amount]) => available(member, rule.label) < amount)
  if (short) return { problem: short[0].name + ' has insufficient ' + rule.label + '.' }
  return { rule: { ...rule, id: entry.id }, payers }
}

const settling = new Set()
const receiptPath = (id) => 'flags.' + MODULE_ID + '.ritePayments.' + id

function expenseUpdate(actor, label, amount, name, id) {
  const receipt = { [receiptPath(id)]: amount }
  if (label === 'Willpower') return { ...addWillpowerDamage(actor, amount), ...receipt }
  if (label === 'XP') return {
    'system.experiences': [...readExperiences(actor), { id, name, value: -amount, timestamp: Date.now() }],
    ...receipt
  }
  const rage = rageOf(actor) - amount
  const form = formOf(actor)
  return { ...garouStateUpdate(actor, rage ? { rage } : { rage: 0, form: form.checks ? birthForm(actor) : form.id, frenzy: false }), ...receipt }
}

export function riteExpenseDue(rule, roll, difficulty) {
  if (!rule?.outcome) return true
  if (!roll) return false
  const resolved = garouRollResult(roll)
  const won = (resolved?.total ?? roll.total) >= difficulty
  return won || (rule.outcome === 'win-or-brutal' && resolved?.brutal === true)
}

export async function payRiteExpense({ rule, payers }, name, id) {
  const outstanding = payers.filter(([payer]) => !payer.getFlag(MODULE_ID, 'ritePayments')?.[id])
  const keys = outstanding.map(([payer]) => payer.uuid)
  if (keys.some((key) => settling.has(key))) throw new Error('A Rite payment is already in progress.')
  for (const [payer, amount] of outstanding) {
    if (!payer.isOwner || available(payer, rule.label) < amount) {
      throw new Error('Cannot spend ' + amount + ' ' + rule.label + ' from ' + payer.name + '.')
    }
  }
  for (const key of keys) settling.add(key)
  try {
    const world = outstanding.filter(([payer]) => !payer.isToken)
    const tokenActors = outstanding.filter(([payer]) => payer.isToken)
    if (world.length > 1 && globalThis.CONFIG?.Actor?.documentClass?.updateDocuments) {
      await CONFIG.Actor.documentClass.updateDocuments(world.map(([payer, amount]) => ({
        _id: payer.id, ...expenseUpdate(payer, rule.label, amount, name, id)
      })))
    } else {
      for (const [payer, amount] of world) await payer.update(expenseUpdate(payer, rule.label, amount, name, id))
    }
    for (const [payer, amount] of tokenActors) await payer.update(expenseUpdate(payer, rule.label, amount, name, id))
    return true
  } finally {
    for (const key of keys) settling.delete(key)
  }
}

// Conditional expenses are settled on the chat card after optional Willpower rerolls.
export async function recordRiteExpense(id, name, expense, difficulty) {
  const marker = 'bo-rite-expense-' + id
  const message = Array.from(game.messages ?? []).find((entry) =>
    entry.rolls?.some((roll) => roll.options?.flavor?.includes(marker)))
  if (!message) return false
  await message.setFlag(MODULE_ID, 'riteExpense', {
    id, name, difficulty, rule: expense.rule.id,
    payers: expense.payers.map(([payer, amount]) => [payer.uuid, amount])
  })
  return true
}

export function renderRiteExpense(message, html) {
  const draft = message.getFlag(MODULE_ID, 'riteExpense')
  const rule = EXPENSES[draft?.rule]
  if (!rule || !message.isContentVisible || html.querySelector('.bo-rite-expense')) return
  const bar = document.createElement('div')
  bar.className = 'bo-rite-expense bo-roll-note'
  if (draft.settled) {
    bar.textContent = draft.settled === 'paid' ? 'Rite cost paid.' : 'No Rite cost due.'
  } else {
    const label = document.createElement('p')
    label.textContent = rule.amount + ' ' + rule.label + ' · Confirm after any Willpower rerolls.'
    bar.append(label)
    if (game.user.isGM || message.author?.id === game.user.id) {
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = 'Confirm Rite cost'
      button.addEventListener('click', async () => {
        button.disabled = true
        try {
          const current = game.messages.get(message.id)
          if (!current || current.getFlag(MODULE_ID, 'riteExpense')?.settled) return
          const roll = current.rolls?.[0]
          const due = riteExpenseDue(rule, roll, draft.difficulty)
          if (due) {
            const payers = draft.payers.map(([uuid, amount]) => [fromUuidSync(uuid), amount])
            if (payers.some(([payer]) => !payer?.isOwner || payer.type !== 'werewolf')) {
              throw new Error('The Storyteller must confirm this cost.')
            }
            await payRiteExpense({ rule, payers }, draft.name, draft.id)
          }
          await current.setFlag(MODULE_ID, 'riteExpense', { ...draft, settled: due ? 'paid' : 'released' })
        } catch (error) {
          console.error('Blood Oracle | Could not settle the Rite cost', error)
          ui.notifications.error(error.message)
          button.disabled = false
        }
      })
      bar.append(button)
    }
  }
  const content = html.querySelector('.message-content') ?? html
  content.append(bar)
}
