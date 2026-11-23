import { useRef, useState, useSyncExternalStore } from 'react'
import DotTracker from '../components/DotTracker.jsx'
import InfoIcon from '../components/InfoIcon.jsx'
import GarouCombatControls from '../components/GarouCombatControls.jsx'
import { crinosTurnPending } from '../roll/garou-combat.js'
import GarouPowerAction from '../components/GarouPowerAction.jsx'
import GarouPowerPicker, { PowerDetails } from '../components/GarouPowerPicker.jsx'
import WerewolfReference from '../components/WerewolfReference.jsx'
import Select from '../components/Select.jsx'
import RichText from '../components/RichText.jsx'
import { GhostButton, SectionTitle } from '../components/primitives.jsx'
import { MODULE_ID } from '../../constants.js'
import { addWillpowerDamage, birthForm, formOf, GAROU_FORMS, GAROU_RENOWN, garouHealth, rageOf, setRage, totalRenownOf } from '../schema/werewolf.js'
import { checkRage, endFrenzy, leaveFrenzy, regenerateGarou, resistGarouFrenzy, shiftGarou, testBalance } from '../roll/werewolf.js'
import { applyBalanceAction, GAROU_BALANCE_ACTIONS, garouSession, startGarouSession, subscribeGarouSession, usedBalanceAction } from '../schema/werewolf-session.js'
import { garouEntryForItem, garouPowerKind } from '../rules/garou-powers.js'
import { buildGarouChoiceData, garouIdentities, GAROU_POWER_SLOTS, powerChoiceProblem } from '../schema/garou-advancement.js'
import { RENOWN_DESCRIPTIONS, RENOWN_HELP } from '../rules/garou-identity.js'

function useGarouAction() {
  const [busy, setBusy] = useState(false)
  const pending = useRef(false)
  const run = async (action) => {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    try {
      await action()
    } catch (error) {
      console.error('Blood Oracle | Garou action failed', error)
      ui.notifications.error('The Garou action could not be completed.')
    } finally {
      pending.current = false
      setBusy(false)
    }
  }
  return { busy, run }
}

export function GarouRage({ actor, editable }) {
  const { busy, run } = useGarouAction()
  const rage = rageOf(actor)
  return (
    <div className="bo-tracker">
      <div className="bo-tracker-label">Rage <InfoIcon size={17} accent={rage === 0}
        text={(rage === 0 ? 'Lost the Wolf. ' : 'At Rage 0, you lose the Wolf. ') +
          'You return to a natural form and cannot use Gifts, perform Rites, or make Rage Checks. Howling at the moon for the first time that night restores the Wolf. Supernatural effects can also restore it.'} /></div>
      <div className="bo-garou-actions bo-rage-controls">
        <DotTracker value={rage} color="var(--bo-accent)" disabled={!editable || busy}
          onChange={(value) => run(() => setRage(actor, value))} />
        {editable ? <GhostButton tone="accent" disabled={!rage || busy} onClick={() => run(() => checkRage(actor))}>Check</GhostButton> : null}
        {editable ? <GhostButton disabled={busy} title={rage
          ? 'Gain 1 Rage. At Rage 5, mark 1 Superficial Willpower damage instead.'
          : 'Howl at the moon for the first time tonight to regain the Wolf.'}
          onClick={() => run(() => rage === 5 ? actor.update(addWillpowerDamage(actor)) : setRage(actor, rage + 1))}>
          {rage ? '+ Rage' : 'Howl'}
        </GhostButton> : null}
      </div>
    </div>
  )
}

export function GarouRatings({ actor, editable, locked }) {
  const { busy, run } = useGarouAction()
  const session = useSyncExternalStore(subscribeGarouSession, garouSession)
  const totalRenown = totalRenownOf(actor)
  async function newSession() {
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      classes: ['blood-oracle', 'bo-dialog', 'bo-splat-werewolf'],
      window: { title: 'New session' },
      content: '<p>Make Desperate Rage and Merciless Willpower available again for all Garou in this world?</p>',
      rejectClose: false
    })
    if (confirmed) await startGarouSession()
  }

  async function balanceTest(track) {
    const difficulty = await foundry.applications.api.DialogV2.prompt({
      classes: ['blood-oracle', 'bo-dialog', 'bo-splat-werewolf'],
      window: { title: track === 'harano' ? 'Harano Test' : 'Hauglosk Test' },
      content: '<label>Difficulty <input type="number" name="difficulty" min="1" value="1" required></label>',
      ok: { label: 'Roll', callback: (_event, button) => button.form.elements.difficulty.valueAsNumber },
      rejectClose: false
    })
    if (Number.isInteger(difficulty) && difficulty >= 1) await testBalance(actor, track, difficulty)
  }
  return (
    <section className="bo-garou-section">
      <SectionTitle info="Test Harano after a major setback or when your actions endanger a Touchstone. Test Hauglosk after breaking a chronicle Tenet. Roll the total marks on both tracks, with at least one die. On a failure, mark the tested track."
        actions={game.user.isGM && editable ? <GhostButton disabled={busy} onClick={() => run(newSession)}>New session</GhostButton> : null}>
        Renown &amp; Balance
      </SectionTitle>
      <div className="bo-pair-grid">
        <div>
          <div className="bo-label">Total Renown · {totalRenown} <InfoIcon text={RENOWN_HELP} /></div>
          {GAROU_RENOWN.map(([key, label]) => (
            <div className="bo-stat-row bo-garou-rating" key={key}>
              <span>{label} <InfoIcon text={RENOWN_DESCRIPTIONS[key]} size={15} /></span>
              <DotTracker value={actor.system.renown?.[key]?.value ?? 0} disabled={!editable} locked={locked}
                onChange={(value) => actor.update({ ['system.renown.' + key + '.value']: value })} />
            </div>
          ))}
        </div>
        <div>
          <div className="bo-label">Harano &amp; Hauglosk</div>
          {[['harano', 'Harano'], ['hauglosk', 'Hauglosk']].map(([key, label]) => (
            <div className="bo-stat-row bo-garou-rating" key={key}>
              <span>{label}</span>
              <div role="group" aria-label={label} className={'bo-garou-balance ' + key}>
                {[1, 2, 3, 4, 5].map((position) => {
                  const rating = actor.system.balance?.[key]?.value ?? 0
                  return <button type="button" key={position} aria-label={label + ' ' + position}
                    aria-pressed={rating >= position} disabled={!editable || busy}
                    onClick={() => run(() => actor.update({ ['system.balance.' + key + '.value']: rating === position ? position - 1 : position }))} />
                })}
              </div>
              {editable ? <GhostButton tone="accent" disabled={busy || (actor.system.balance?.[key]?.value ?? 0) >= 5}
                onClick={() => run(() => balanceTest(key))}>Test</GhostButton> : null}
            </div>
          ))}
          {editable ? <div className="bo-garou-actions bo-garou-balance-actions">
            {Object.entries(GAROU_BALANCE_ACTIONS).map(([track, { name, description }]) => {
              const used = usedBalanceAction(actor, track, session)
              return <GhostButton key={track} title={description}
                disabled={busy || used || actor.system.balance?.[track]?.value >= 5}
                onClick={() => run(() => applyBalanceAction(actor, track))}>
                {name}{used ? ' · Used' : ''}
              </GhostButton>
            })}
          </div> : null}
          {['harano', 'hauglosk'].some((key) => actor.system.balance?.[key]?.value >= 5) ? (
            <p className="bo-roll-note is-red">A full tracker ends this Garou’s role as a player character.</p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default function GarouTab({ actor, editable }) {
  const { busy, run } = useGarouAction()
  const current = formOf(actor)
  const rage = rageOf(actor)
  const frenzy = actor.system.frenzyActive
  const resolvingTurn = crinosTurnPending(actor)
  const health = garouHealth(actor)
  const naturalForms = GAROU_FORMS.filter(({ checks }) => !checks)
  return (
    <div>
      <SectionTitle info="Shift once per turn when declaring actions. Shifting costs a two-dice minor action. Pay the form’s Rage checks again to keep it in a new scene.">Forms of the Garou</SectionTitle>
      <div className="bo-garou-form-status">
        <div className="bo-label">Active form · {current.name}{frenzy ? ' · Frenzy' : ''}</div>
        <label className="bo-field-label">
          <span>Birth form</span>
          <Select value={birthForm(actor)} disabled={!editable} options={naturalForms.map(({ id, name }) => ({ value: id, label: name }))}
            onChange={(value) => actor.setFlag(MODULE_ID, 'birthForm', value)} />
        </label>
      </div>
      {current.checks ? (
        <p className="bo-roll-note">Skin contact with silver causes 1 Aggravated Health damage per turn and gives 1 Rage for each level suffered.</p>
      ) : null}
      <div className="bo-garou-forms">
        {GAROU_FORMS.map((form) => (
          <section key={form.id} className={'bo-panel' + (form.id === current.id ? ' is-active' : '')}>
            <h3 className="bo-detail-title">{form.name}</h3>
            <p className="bo-detail-sub">{form.checks ? form.checks + (form.checks === 1 ? ' Rage Check' : ' Rage Checks') : 'Free'}</p>
            <p className="bo-prose">{form.summary}</p>
            {editable && form.id !== current.id ? <GhostButton tone="accent" disabled={busy || frenzy || resolvingTurn || Boolean(form.checks && !rage)}
              onClick={() => run(() => shiftGarou(actor, form.id))}>Shift</GhostButton> : null}
            {editable && form.id === current.id && form.checks ? <GhostButton tone="accent" disabled={busy || frenzy || resolvingTurn || !rage}
              onClick={() => run(() => shiftGarou(actor, form.id, true))}>Maintain · New scene</GhostButton> : null}
          </section>
        ))}
      </div>
      {editable ? <div className="bo-garou-section">
        <SectionTitle>Regeneration &amp; Frenzy</SectionTitle>
        <div className="bo-garou-actions">
          {current.checks ? <>
            <GhostButton tone="accent" disabled={busy || !rage || !health.superficial}
              onClick={() => run(() => regenerateGarou(actor))}>Regenerate Superficial</GhostButton>
            <GhostButton tone="accent" disabled={busy || !rage || !health.aggravated}
              onClick={() => run(() => regenerateGarou(actor, true))}>Regenerate Aggravated</GhostButton>
          </> : null}
          {frenzy ? <>
            <GhostButton disabled={busy} onClick={() => run(() => leaveFrenzy(actor))}>Test to End Frenzy</GhostButton>
            <GhostButton tone="danger" title="End of scene, only the Garou remains standing, or an ability ends Frenzy."
              disabled={busy} onClick={() => run(() => endFrenzy(actor))}>End Frenzy</GhostButton>
          </> : <GhostButton tone="danger" disabled={busy} onClick={() => run(() => resistGarouFrenzy(actor))}>Resist Frenzy</GhostButton>}
        </div>
        <GarouCombatControls actor={actor} busy={busy} run={run} />
      </div> : null}
    </div>
  )
}

const POWER_SECTIONS = [{ kind: 'gift', name: 'Gift' }, { kind: 'rite', name: 'Rite' }]

export function GarouPowersTab({ actor, editable }) {
  const { busy, run } = useGarouAction()
  const [picker, setPicker] = useState(null)
  const [using, setUsing] = useState(null)
  const totalRenown = totalRenownOf(actor)

  const identities = garouIdentities(actor)

  async function add(pick) {
    const problem = powerChoiceProblem({ pick, identities: garouIdentities(actor), renown: totalRenownOf(actor), items: actor.items })
    if (problem) throw new Error(problem)
    const [item] = await actor.createEmbeddedDocuments('Item', [buildGarouChoiceData(actor, pick)])
    if (item) setPicker(null)
  }

  const power = actor.items.find((item) => item.id === using)
  return (
    <div className="bo-pair-grid">
      {editable && power ? <GarouPowerAction key={power.id} actor={actor} item={power} onClose={() => setUsing(null)} /> : null}
      {POWER_SECTIONS.map(({ kind, name }) => {
        const items = actor.items.filter((item) => garouPowerKind(item) === kind)
        const slots = GAROU_POWER_SLOTS.filter(({ id }) => kind === "rite" ? id === "rite" : id === "native" || !!identities[id])
        return (
          <section key={kind}>
            <SectionTitle actions={editable ? (
              <GhostButton tone="accent" disabled={busy} onClick={() => setPicker(kind)}>+ Add {name}</GhostButton>
            ) : null}>{name}s</SectionTitle>
            {items.map((item) => {
              const entry = garouEntryForItem(item)
              return (
                <details className="bo-panel" key={item.id}>
                  <summary className="bo-trait-name">{item.name}</summary>
                  <RichText content={item.system.description || entry?.summary || ''} />
                  {entry ? <PowerDetails entry={entry} /> : (
                    <>
                      {item.system.cost > 0 ? <p className="bo-roll-note">Rage Checks · {item.system.cost}</p> : null}
                      {item.system.willpowercost > 0 ? <p className="bo-roll-note">Willpower cost · {item.system.willpowercost}</p> : null}
                    </>
                  )}
                  <div className="bo-library-actions">
                    {entry ? <WerewolfReference id={entry.id} inline /> : null}
                    {editable ? <>
                      {!entry?.passive ? <GhostButton tone="accent" onClick={() => setUsing(item.id)}>{kind === 'gift' ? 'Use Gift' : 'Perform Rite'}</GhostButton> : null}
                      <GhostButton onClick={() => item.sheet.render({ force: true })}>Edit</GhostButton>
                    </> : null}
                  </div>
                </details>
              )
            })}
            {!items.length ? <p className="bo-empty">None recorded.</p> : null}
            {kind === 'rite' ? (
              <div className="bo-library-actions bo-block">
                <span className="bo-label">Performing Rites</span>
                <WerewolfReference id="rite-systems" inline />
              </div>
            ) : null}
            {editable && picker === kind ? (
              <GarouPowerPicker title={'Choose a ' + name} slots={slots} identities={identities}
                renown={totalRenown} items={actor.items} onPick={(pick) => run(() => add(pick))} onClose={() => setPicker(null)} />
            ) : null}
          </section>
        )
      })}
    </div>
  )
}
