import { useRef, useState, useSyncExternalStore } from 'react'
import { PortraitSlot } from './PrinciplesEditor.jsx'
import { GhostButton, SectionTitle } from './primitives.jsx'
import { garouPeriod, startGarouPeriod, subscribeGarouSession } from '../schema/werewolf-session.js'
import { applyTouchstoneBenefit, garouTouchstones, touchstoneBenefitProblem, TOUCHSTONE_BENEFITS, writeGarouTouchstones } from '../schema/garou-touchstones.js'
import { testBalance } from '../roll/werewolf.js'

const currentPeriod = () => garouPeriod('story') + ':' + garouPeriod('session')
export default function GarouTouchstones({ actor, editable }) {
  useSyncExternalStore(subscribeGarouSession, currentPeriod)
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const entries = garouTouchstones(actor)
  const dialog = foundry.applications.api.DialogV2
  const classes = ['blood-oracle', 'bo-dialog', 'bo-splat-werewolf']

  async function act(action) {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    try {
      await action()
    } catch (error) {
      console.error('Blood Oracle | Touchstone action failed', error)
      ui.notifications.error('Could not update the Touchstone.')
    } finally {
      pending.current = false
      setBusy(false)
    }
  }

  const change = (id, key, value) => act(() => writeGarouTouchstones(actor, garouTouchstones(actor).map((row) =>
    row.id === id ? { ...row, [key]: value } : row)))

  async function lose(id) {
    const result = await dialog.wait({
      classes, window: { title: 'Remove Touchstone' },
      content: '<p>If the Touchstone was lost through the Garou’s actions, agree with the Storyteller which track to mark.</p>',
      buttons: [
        { action: 'remove', label: 'Remove' }, { action: 'harano', label: 'Mark Harano' },
        { action: 'hauglosk', label: 'Mark Hauglosk' }, { action: 'cancel', label: 'Cancel', default: true }
      ],
      rejectClose: false
    })
    if (!result || result === 'cancel') return
    const updates = { 'flags.blood-oracle.garouTouchstones': garouTouchstones(actor).filter((row) => row.id !== id) }
    if (result !== 'remove') updates['system.balance.' + result + '.value'] = Math.min(5, (actor.system.balance?.[result]?.value ?? 0) + 1)
    await actor.update(updates)
  }

  async function threatened() {
    const difficulty = await dialog.prompt({
      classes, window: { title: 'Threatened Touchstone · Harano' },
      content: '<label>Difficulty <input type="number" name="difficulty" min="1" value="1" required></label>',
      ok: { label: 'Roll', callback: (_event, button) => button.form.elements.difficulty.valueAsNumber }, rejectClose: false
    })
    if (Number.isInteger(difficulty) && difficulty >= 1) await testBalance(actor, 'harano', difficulty)
  }

  async function confirmBenefit(id, choice) {
    const yes = await dialog.confirm({
      classes, window: { title: 'Spend time with your Touchstone' },
      content: '<p>Confirm a scene or downtime spent with this Touchstone.</p>',
      rejectClose: false
    })
    if (yes) await applyTouchstoneBenefit(actor, id, choice)
  }

  const add = () => act(() => writeGarouTouchstones(actor, [
    ...garouTouchstones(actor), { id: foundry.utils.randomID(), touchstone: '', portrait: '' }
  ]))
  return <>
    <SectionTitle info="Spend a scene or part of downtime with a Touchstone for a benefit. Each benefit is available once per story, and you can use only one of them per session."
      actions={editable ? <div className="bo-garou-actions">
        {game.user.isGM ? <GhostButton disabled={busy} onClick={() => act(async () => {
          const yes = await dialog.confirm({ classes, window: { title: 'New story' },
            content: '<p>Reset the once-per-story Touchstone limits for this world?</p>', rejectClose: false })
          if (yes) await startGarouPeriod('story')
        })}>New story</GhostButton> : null}
        <GhostButton tone="accent" disabled={busy} onClick={add}>+ Add Touchstone</GhostButton>
      </div> : null}>Touchstones</SectionTitle>
    {entries.length ? <div className="bo-touchstone-list">{entries.map(({ id, touchstone, portrait }, index) => <div className="bo-panel" key={id}>
      <div className="bo-row"><div className="bo-label">Touchstone {index + 1}</div>
        {editable ? <GhostButton tone="danger" disabled={busy} onClick={() => act(() => lose(id))}>Remove</GhostButton> : null}
      </div>
      <div className="bo-touchstone-fields">
        <label className="bo-field-label"><span>Touchstone</span>
          <textarea key={touchstone} className="bo-field" defaultValue={touchstone} disabled={!editable || busy}
            onBlur={(event) => { if (event.target.value !== touchstone) change(id, 'touchstone', event.target.value) }} /></label>
        <PortraitSlot path={portrait} editable={editable && !busy} onPick={(value) => change(id, 'portrait', value)} />
      </div>
      {editable && touchstone.trim() ? <div className="bo-garou-actions bo-garou-balance-actions">
        {TOUCHSTONE_BENEFITS.map(({ id: choice, label }) => {
          const problem = touchstoneBenefitProblem(actor, choice)
          return <GhostButton key={choice} disabled={busy || !!problem} title={problem || label}
            onClick={() => act(() => confirmBenefit(id, choice))}>{label}</GhostButton>
        })}
        <GhostButton tone="danger" disabled={busy || actor.system.balance?.harano?.value >= 5}
          onClick={() => act(threatened)}>Threatened · Test Harano</GhostButton>
      </div> : null}
    </div>)}</div> : <p className="bo-empty">No Touchstones recorded.</p>}
  </>
}
