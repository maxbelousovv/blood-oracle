import { useRef, useState, useSyncExternalStore } from 'react'
import Select from './Select.jsx'
import { GhostButton, Modal } from './primitives.jsx'
import WerewolfReference from './WerewolfReference.jsx'
import { garouPowerKind } from '../rules/garou-powers.js'
import {
  canAssistRite, garouPowerCosts, garouPowerEntry, garouPowerProblem, knowsRite, performGarouPower, powerAssistants,
  powerCanSkipTest, powerDifficulty, powerPoolOptions, powerRollPool
} from '../roll/garou-power.js'
import { caernUseAvailable, garouPackContext, packFavorPart } from '../schema/pack-effects.js'
import { garouPeriod, subscribeGarouSession } from '../schema/werewolf-session.js'
import { willpowerPool } from '../roll/checks.js'
import { planRiteExpense, riteExpenseRule, riteRecipients } from '../roll/garou-rite-expenses.js'
import { rageOf } from '../schema/werewolf.js'

const sceneKey = () => garouPeriod('scene')
const assistLabel = (member, item) => knowsRite(member, item) ? '1 Rage + 1 regular' : '1 Rage'
const option = (on, label, change, disabled = false) => <label className="bo-picker-toggle">
  <input type="checkbox" checked={Boolean(on)} disabled={disabled} onChange={(event) => change(event.target.checked)} /> {label}
</label>

export default function GarouPowerAction({ actor, item, onClose }) {
  useSyncExternalStore(subscribeGarouSession, sceneKey)
  const rite = garouPowerKind(item) === 'rite'
  const entry = garouPowerEntry(item)
  const initialOptions = powerPoolOptions(actor, item, entry)
  const expenseRule = riteExpenseRule(entry)
  const canSkip = powerCanSkipTest(item, entry)
  const [settings, update] = useState(() => ({
    pool: initialOptions.length || expenseRule?.target ? '0' : 'manual',
    skip: canSkip && !initialOptions.length,
    customDice: 0, modifier: 0, extra: entry?.variableCost ? (entry[entry.variableCost.resource] ?? entry.variableCost.min) : 0,
    assistants: [], difficulty: '', recipient: '', shares: {}
  }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false)
  const retryPayment = useRef(null)
  const change = (key, value) => update((previous) => ({ ...previous, [key]: value }))
  const changeNumber = (key) => (event) => change(key, Number(event.target.value) || 0)
  const candidates = powerAssistants(actor, item)
  const recipients = riteRecipients(actor, entry, candidates)
  const recipient = recipients.find(({ uuid }) => uuid === settings.recipient)
  const helperChoices = candidates.filter(({ uuid }) => uuid !== recipient?.uuid)
  const assistants = helperChoices.filter((member) => settings.assistants.includes(member.uuid) && canAssistRite(member))
  const expense = planRiteExpense(actor, entry, recipient, assistants, settings.shares)
  const options = powerPoolOptions(actor, item, entry, recipient)
  const fixedPool = entry?.id === 'rite-wolf-reborn'
  const fixedDifficulty = fixedPool || entry?.id === 'rite-sacred-scar'
  const context = garouPackContext(actor)
  const atCaern = Boolean(settings.atCaern && context)
  const parts = options[settings.pool]?.parts ?? []
  const favor = packFavorPart(actor, parts)
  const problem = garouPowerProblem(actor, item, entry)
  const { rage, rageSpend, willpower } = garouPowerCosts(actor, item, entry, settings.extra)
  const opposed = Boolean(entry?.pool?.includes(' vs.') || entry?.id === 'gift-staredown')
  const difficulty = settings.difficulty === '' ? powerDifficulty(entry, atCaern ? context.caern : null, assistants.length + 1, { ...settings, recipient, parts }) : settings.difficulty
  const pool = settings.skip ? null : powerRollPool(actor, item, { ...settings, parts, assistants, atCaern })
  const attackerChoices = entry?.id === 'gift-spirit-of-the-fray'
  const canUse = !problem && !expense.problem && rageSpend <= rageOf(actor) && willpower <= willpowerPool(actor) && (!attackerChoices || rage > 0) &&
    (!pool || !pool.blocked && pool.basicDice + pool.advancedDice > 0)

  async function execute() {
    if (inFlight.current || (!canUse && !retryPayment.current)) return
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      const paid = retryPayment.current
        ? await retryPayment.current()
        : await performGarouPower(actor, item, { ...settings, assistants: assistants.map(({ uuid }) => uuid), parts, difficulty, atCaern, opposed })
      if (paid) onClose()
    } catch (error) {
      if (error.retryPayment) retryPayment.current = error.retryPayment
      setError(error.message)
      console.error('Blood Oracle | Could not use Garou power', error)
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  const heading = rite ? 'Perform ' : 'Use '
  return <Modal title={heading + item.name} subtitle={entry?.action && entry.action + ' action'} wide onClose={busy ? undefined : onClose}>
    <div>
      {entry ? <p className="bo-prose">{entry.summary}</p> : null}
      {entry?.pool ? <p className="bo-prose"><strong>Pool</strong> · {entry.pool}</p> : null}
      {entry?.difficulty ? <p className="bo-roll-note">{entry.difficulty}</p> : null}
      {entry?.specialCost ? <p className="bo-roll-note">{entry.specialCost}</p> : null}
      {entry?.restriction ? <p className="bo-roll-note">{entry.restriction}</p> : null}
      {entry?.variableCost ? <label className="bo-field-label"><span>{entry.variableCost.label}</span>
        <Select value={String(settings.extra)} options={Array.from({ length: entry.variableCost.max - entry.variableCost.min + 1 }, (_, index) => {
          const value = entry.variableCost.min + index
          return { value: String(value), label: String(value) }
        })} onChange={(extra) => change('extra', Number(extra))} />
      </label> : null}
      {expenseRule?.target ? <label className="bo-field-label"><span>{expenseRule.target}</span>
        <Select value={settings.recipient} options={[{ value: '', label: 'Choose…' }, ...recipients.map(({ uuid, name }) => ({ value: uuid, label: name }))]}
          onChange={(recipient) => update((current) => ({ ...current, recipient, assistants: current.assistants.filter((uuid) => uuid !== recipient) }))} />
      </label> : null}
      {expenseRule ? <div className="bo-block">
        <div className="bo-label">Rite cost · {expenseRule.amount} {expenseRule.label}</div>
        {expenseRule.label === 'XP' ? <p className="bo-roll-note">The recipient pays on a win.</p> : <>
          {expenseRule.label === 'Rage' ? <p className="bo-roll-note">Lose the pledged Rage on a win or Brutal Outcome. Keep it on an ordinary failure.</p> : null}
          {[actor, ...assistants].map(({ uuid, name, isOwner }) => <label className="bo-stat-row" key={uuid}>
            <span>{name}{!isOwner ? ' · requires Storyteller' : ''}</span>
            <input type="number" aria-label={name + ' ' + expenseRule.label + ' contribution'} min="0" max={expenseRule.amount}
              className="bo-field bo-caern-share" value={settings.shares[uuid] ?? ''}
              onChange={(event) => {
                const amount = Number(event.target.value)
                update((current) => ({ ...current, shares: { ...current.shares, [uuid]: amount } }))
              }} />
          </label>)}
        </>}
        {expense.problem ? <p className="bo-roll-note" role="status">{expense.problem}</p> : null}
      </div> : null}
      {entry?.id === 'gift-the-howl-carries' ? option(settings.extra, 'Restrict the howl to your bawn · +1 Rage Check', (value) => change('extra', value)) : null}
      {attackerChoices ? <label className="bo-field-label"><span>Additional opponents</span>
        <input className="bo-field bo-caern-share" type="number" min="1" max={actor.system.renown?.glory?.value ?? 0}
          value={settings.extra || ''} onChange={changeNumber('extra')} /></label> : null}
      {context ? option(atCaern, 'At ' + (context.caern.name || 'the pack’s caern'), (value) => change('atCaern', value)) : null}
      {entry?.id === 'rite-shadow-passage' ? option(settings.returning, 'Returning to the physical world', (value) => change('returning', value)) : null}
      {entry?.id === 'rite-rage' ? option(settings.stronger, 'Seek 2 Rage per participant · +2 Difficulty', (value) => change('stronger', value)) : null}
      {canSkip ? option(settings.skip, 'Resolve without a test', (value) => change('skip', value)) : null}

      {!settings.skip ? <div className="bo-block">
        {favor ? option(settings.favor, favor.label + ' · +' + favor.value + ' dice (' + favor.detail + ')', (value) => change('favor', value)) : null}
        {!rite && atCaern && context?.traits.attunement ? option(settings.attune && caernUseAvailable(actor, 'attunement', 'scene'),
          'Spiritual Attunement · +' + context.traits.attunement + ' dice once per scene',
          (value) => change('attune', value), !caernUseAvailable(actor, 'attunement', 'scene')) : null}
        {!rite && entry?.action === 'Minor' ? option(settings.minorAction, 'Shifted this turn · −2 dice', (value) => change('minorAction', value)) : null}
        <div className="bo-pair-grid">
          <label className="bo-field-label"><span>Dice pool</span>
            <Select value={settings.pool} disabled={fixedPool} options={[
              ...options.map(({ label }, index) => ({ value: String(index), label })),
              ...(!fixedDifficulty ? [{ value: 'manual', label: 'Enter pool size' }] : [])
            ]} onChange={(value) => change('pool', value)} /></label>
          {settings.pool === 'manual' ? <label className="bo-field-label"><span>Base dice</span>
            <input className="bo-field" type="number" min="0" max="100" value={settings.customDice} onChange={changeNumber('customDice')} /></label> : null}
          <label className="bo-field-label"><span>{opposed ? 'Opposing successes · 0 to roll your side only' : 'Difficulty · 0 to count successes only'}</span>
            <input className="bo-field" type="number" min="0" max="100" value={difficulty || ''} disabled={fixedDifficulty} placeholder="0" onChange={(event) =>
              change('difficulty', event.target.value === '' ? '' : Number(event.target.value))} /></label>
          <label className="bo-field-label"><span>Dice modifier</span>
            <input className="bo-field" type="number" min="-20" max="20" value={settings.modifier} onChange={changeNumber('modifier')} /></label>
        </div>
      </div> : null}

      {helperChoices.length && rite ? <div className="bo-block">
        <div className="bo-label">Rite participants</div>
        {helperChoices.map((member) => <div key={member.uuid}>{option(settings.assistants.includes(member.uuid) && canAssistRite(member),
          member.name + ' · ' + (canAssistRite(member) ? assistLabel(member, item) : 'cannot assist'),
          (on) => change('assistants', on ? [...settings.assistants, member.uuid] : settings.assistants.filter((id) => id !== member.uuid)),
          busy || !canAssistRite(member))}</div>)}
      </div> : null}

      <div className="bo-block">
        {pool ? <p className="bo-prose">{pool.basicDice} regular · {pool.advancedDice} Rage
          {pool.focus ? ' · includes ' + pool.focus + ' from Rite Focus' : ''}</p> : null}
        {rage || rageSpend || willpower ? <p className="bo-prose">Cost · {[rage ? rage + ' Rage Check' + (rage === 1 ? '' : 's') : '', rageSpend ? rageSpend + ' Rage' : '', willpower ? willpower + ' Willpower' : ''].filter(Boolean).join(' + ')}</p> : null}
        {problem || error || rageSpend > rageOf(actor) || willpower > willpowerPool(actor) ? <p className="bo-cg-problem" role="alert">
          {error || problem || (rageSpend > rageOf(actor) ? 'Not enough Rage.' : 'Not enough unmarked Willpower.')}
        </p> : null}
        <div className="bo-library-actions">
          {entry ? <WerewolfReference id={entry.id} inline /> : null}
          <GhostButton onClick={onClose} disabled={busy}>Cancel</GhostButton>
          <button className="bo-solid" type="button" onClick={execute} disabled={busy || (!canUse && !retryPayment.current)}>{retryPayment.current ? 'Retry payment' : pool ? 'Roll' : 'Use'}</button>
        </div>
      </div>
    </div>
  </Modal>
}
