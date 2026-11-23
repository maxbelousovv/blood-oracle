import { useState } from 'react'
import { GhostButton, Modal } from './primitives.jsx'
import { holdCrinos } from '../roll/werewolf.js'
import { formOf } from '../schema/werewolf.js'
import {
  crinosTurnPending, deliriumOf, deliriumResult, markCrinosKill, markSilverContact, resolveCrinosTurn, silverContact, takeSilver, targetedActors
} from '../roll/garou-combat.js'
import { garouCombatTurn } from '../roll/garou-power.js'
import { MODULE_ID } from '../../constants.js'

const classes = ['blood-oracle', 'bo-dialog', 'bo-splat-werewolf']

function Delirium({ onClose }) {
  const [witnesses] = useState(targetedActors)
  const [score, setScore] = useState(2)
  const manual = deliriumResult(score)
  return <Modal title="Delirium" wide onClose={onClose}>
    <p className="bo-prose">Choose witnesses who saw the revelation in person. The Storyteller sets exceptions and decides how they react.</p>
    {witnesses.length ? <div className="bo-block">{witnesses.map((witness) => {
      const result = deliriumOf(witness)
      return <div className="bo-stat-row" key={witness.uuid}><span>{witness.name}</span>
        <span>{result ? result.score + ' · ' + result.response + ' · ' + result.memory : 'Usually unaffected'}</span>
      </div>
    })}</div> : null}
    <div className="bo-block">
      <label className="bo-field-label"><span>Composure + Resolve</span>
        <input type="number" className="bo-field bo-caern-share" min="1" max="10" value={score}
          onChange={(event) => setScore(Math.max(1, Math.min(10, Number(event.target.value) || 1)))} />
      </label>
      <p className="bo-prose">{manual.response} · {manual.memory}</p>
    </div>
  </Modal>
}

export default function GarouCombatControls({ actor, busy, run }) {
  const [delirium, setDelirium] = useState(false)
  const form = formOf(actor)
  const turn = garouCombatTurn(actor)
  const pending = crinosTurnPending(actor, turn)
  const killed = Boolean(turn && actor.getFlag(MODULE_ID, 'crinosKill') === turn.key)
  const inCombat = Boolean(turn || (game.combat?.started && game.combat.getCombatantsByActor?.(actor)?.length))
  const contact = silverContact(actor)
  const frenzy = actor.system.frenzyActive

  const resolve = (spend) => run(() => pending ? resolveCrinosTurn(actor, spend, turn) : holdCrinos(actor, spend))
  const silver = () => run(async () => {
    const levels = await foundry.applications.api.DialogV2.prompt({
      classes, window: { title: 'Silver injury' },
      content: '<label>Aggravated Health damage <input type="number" name="levels" min="1" max="50" value="1" required></label>',
      ok: { label: 'Apply', callback: (_event, button) => button.form.elements.levels.valueAsNumber },
      rejectClose: false
    })
    if (Number.isInteger(levels)) await takeSilver(actor, levels)
  })

  return <>
    {form.id === 'crinos' ? <div className="bo-block">
      {pending ? <p className="bo-roll-note is-red">Choose how to hold Crinos at the start of this turn.</p> : null}
      {!inCombat && !frenzy ? <p className="bo-roll-note">At the start of a turn, spend 1 Willpower if you made no kill on your previous turn, or enter Frenzy.</p> : null}
      <div className="bo-garou-actions">
        {!frenzy && (pending || !inCombat) ? <>
          <GhostButton tone="accent" disabled={busy} onClick={() => resolve(true)}>Spend Willpower</GhostButton>
          <GhostButton tone="danger" disabled={busy} onClick={() => resolve(false)}>Enter Frenzy</GhostButton>
        </> : null}
        {turn ? <GhostButton disabled={busy || killed || pending} onClick={() => run(() => markCrinosKill(actor, turn))}>
          {killed ? 'Kill recorded' : 'Record kill this turn'}
        </GhostButton> : null}
      </div>
    </div> : null}
    <div className="bo-block">
      <div className="bo-garou-actions">
        <label className="bo-picker-toggle">
          <input type="checkbox" checked={contact} disabled={busy} onChange={(event) => run(() => markSilverContact(actor, event.target.checked))} /> Silver contact
        </label>
        <GhostButton disabled={busy || !form.checks || (inCombat && !turn)} onClick={() => run(() => takeSilver(actor, 1, { contact: true, turn }))}>
          Apply contact now
        </GhostButton>
        <GhostButton disabled={busy} onClick={silver}>Silver injury</GhostButton>
        <GhostButton disabled={busy} onClick={() => setDelirium(true)}>Check Delirium</GhostButton>
      </div>
      {contact ? <p className="bo-roll-note">Active contact applies at the start of each combat turn in Glabro, Crinos or Hispo.</p> : null}
    </div>
    {delirium ? <Delirium onClose={() => setDelirium(false)} /> : null}
  </>
}
