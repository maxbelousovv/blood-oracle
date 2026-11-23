import { useRef, useState, useSyncExternalStore } from 'react'
import { MODULE_ID } from '../../constants.js'
import Select from '../components/Select.jsx'
import WerewolfReference from '../components/WerewolfReference.jsx'
import ShatteredPack from '../components/ShatteredPack.jsx'
import { GhostButton, Modal, SectionTitle } from '../components/primitives.jsx'
import { TRIBES } from '../rules/garou-identity.js'
import { garouIdentities } from '../schema/garou-advancement.js'
import { experienceTotals } from '../schema/journal.js'
import { garouPeriod, startGarouPeriod, subscribeGarouSession } from '../schema/werewolf-session.js'
import { applyCaernRecovery, caernUseAvailable, garouPackContext } from '../schema/pack-effects.js'
import { garouHealth } from '../schema/werewolf.js'
import {
  buyCaernDot, caernCost, CAERN_TRAITS, canTakeCaernTrait, packMembers, packPatronName,
  caernShare, finishCaernDot, payCaernShare, patronPreset, pendingCaernPurchase, proposeCaernDot, readCaern, readPackPatron, unpaidCaernMembers
} from '../schema/pack.js'

function PackField({ label, value = '', disabled, onSave, multiline = false }) {
  const control = {
    className: 'bo-field',
    defaultValue: value,
    disabled,
    onBlur: (event) => {
      if (event.target.value.trim() !== value) void onSave(event.target.value.trim())
    }
  }
  return <label className="bo-field-label" key={value}><span>{label}</span>
    {multiline ? <textarea {...control} rows={3} /> : <input {...control} />}
  </label>
}

function Patron({ actor, canEdit, members }) {
  const patron = readPackPatron(actor)
  const eligible = new Set(members.map((member) => garouIdentities(member).tribe?.id))
  const choices = TRIBES.filter(({ id }) => eligible.has(id) || patron.id === id)
  const preset = patronPreset(patron.id)
  const save = (key, value) => actor.update({ ['flags.' + MODULE_ID + '.packPatron.' + key]: value })
  return <section className="bo-block">
    <SectionTitle info="After a successful Rite of Patronage, each member gains the Patron’s Favor alongside their tribal Favor. Members of the Patron’s tribe double their Favor bonus.">Pack Patron</SectionTitle>
    <label className="bo-field-label"><span>Patron Spirit</span>
      <Select value={patron.id ?? ''} disabled={!canEdit} options={[
        { value: '', label: 'No Pack Patron' },
        ...choices.map(({ id, patron, name }) => ({ value: id, label: patron + ' · ' + name })),
        { value: 'custom', label: 'Other spirit…' }
      ]} onChange={(value) => save('id', value)} />
    </label>
    {preset ? <p className="bo-prose">{preset.favor}</p> : null}
    {patron.id === 'custom' ? <div className="bo-pair-grid">
      <PackField label="Name" value={patron.name} disabled={!canEdit} onSave={(value) => save('name', value)} />
      <PackField label="Favor" value={patron.favor} disabled={!canEdit} onSave={(value) => save('favor', value)} />
      <label className="bo-field-label"><span>Dice bonus when the Favor applies</span>
        <Select value={String(patron.dice ?? 0)} disabled={!canEdit} options={[0, 1, 2, 3, 4, 5].map((value) => ({ value: String(value), label: String(value) }))}
          onChange={(value) => save('dice', Number(value))} /></label>
    </div> : null}
    {patron.id ? <div className="bo-block"><WerewolfReference id="rite-patronage" inline /></div> : null}
  </section>
}

function CaernUpgrade({ group, caern, pending, members, onClose }) {
  const [trait, setTrait] = useState('')
  const [shares, setShares] = useState({})
  const [riteCompleted, setRiteCompleted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const saving = useRef(false)
  const level = pending?.level ?? caern.value + 1
  const cost = caernCost(level)
  const total = Object.values(shares).reduce((sum, amount) => sum + amount, 0)
  const fullCost = caern.stewardship === 'pack'
  const available = CAERN_TRAITS.filter(({ id }) => canTakeCaernTrait(caern, id))
  const unpaid = pending ? unpaidCaernMembers(group, pending) : []
  const canPay = pending ? unpaid.length === 0 : (riteCompleted && trait && (fullCost ? total === cost : total <= cost) &&
    members.every((member) => {
      const amount = shares[member.id] ?? 0
      return Number.isInteger(amount) && amount >= 0 && (!amount || !member.isOwner || amount <= experienceTotals(member).remaining)
    }))

  async function buy(coverShares = false) {
    if (saving.current) return
    saving.current = true
    setError('')
    setBusy(true)
    try {
      if (coverShares) await buyCaernDot(group)
      else if (pending) await finishCaernDot(group)
      else {
        const purchase = await proposeCaernDot(group, { trait, shares, riteCompleted })
        if (!Object.keys(purchase.shares).length) await finishCaernDot(group)
      }
      onClose()
    } catch (error) {
      console.error('Blood Oracle | Could not improve the caern', error)
      setError(error.message)
    } finally {
      saving.current = false
      setBusy(false)
    }
  }

  return <Modal title={'Raise Caern Value to ' + level} wide onClose={busy ? undefined : onClose}>
    <div>
      {pending ? <>
        <p className="bo-prose">Members can pay from Auspice &amp; Tribe. Once all shares are paid, confirm the upgrade here.</p>
        {members.map((member) => {
          const share = caernShare(group, member)
          return share ? <div className="bo-stat-row" key={member.id}><span>{member.name}</span>
            <span>{share.amount} XP · {share.paid ? 'Paid' : 'Due'}</span></div> : null
        })}
      </> : <>
        <p className="bo-prose">{fullCost ? cost + ' XP from the pack.' : 'Sept caern. Record up to ' + cost + ' XP from the pack as agreed with the Storyteller.'}</p>
        <label className="bo-field-label"><span>Caern Trait</span><Select value={trait} disabled={busy}
          options={[{ value: '', label: 'Choose a trait…' }, ...available.map(({ id, name, group }) => ({ value: id, label: name + ' · ' + group }))]}
          onChange={setTrait} /></label>
        {trait ? <p className="bo-prose">{available.find(({ id }) => id === trait)?.summary}</p> : null}
        <SectionTitle>Member contributions</SectionTitle>
        {members.map((member) => <div className="bo-stat-row" key={member.id}>
          <span>{member.name} · {member.isOwner ? experienceTotals(member).remaining + ' XP available' : 'pays from their sheet'}</span>
          <input className="bo-field bo-caern-share" type="number" aria-label={member.name + ' contribution'} min="0" max={cost}
            value={shares[member.id] ?? ''} disabled={busy}
            onChange={(event) => setShares((current) => ({ ...current, [member.id]: Number(event.target.value) }))} />
        </div>)}
        <p className="bo-prose">Total · {total} / {cost} XP</p>
        <label className="bo-picker-toggle"><input type="checkbox" checked={riteCompleted} disabled={busy}
          onChange={(event) => setRiteCompleted(event.target.checked)} /> The required Rite succeeded.</label>
      </>}
      {error ? <p className="bo-cg-problem" role="alert">{error}</p> : null}
      <div className="bo-roll-actions bo-block">
        <GhostButton onClick={onClose} disabled={busy}>Close</GhostButton>
        {pending && unpaid.some((id) => members.some((member) => member.id === id && member.isOwner)) ? (
          <GhostButton disabled={busy} onClick={() => buy(true)}>Pay shares I control</GhostButton>
        ) : null}
        <button type="button" className="bo-solid" disabled={!canPay || busy} onClick={() => buy()}>
          {pending || (total === 0 && !fullCost) ? 'Confirm upgrade' : 'Request contributions'}
        </button>
      </div>
    </div>
  </Modal>
}

export default function PackTab({ actor, editable, locked }) {
  const [upgrading, setUpgrading] = useState(false)
  const members = packMembers(actor)
  const caern = readCaern(actor)
  const pending = pendingCaernPurchase(actor)
  const canEdit = editable && !locked
  const save = (key, value) => actor.update({ ['flags.' + MODULE_ID + '.packCaern.' + key]: value })
  const choices = CAERN_TRAITS.filter(({ id }) => caern.traits[id] > 0)
  return <>
    {game.user.isGM && canEdit ? <div className="bo-garou-actions bo-block">
      <GhostButton title="Reset once-per-scene Garou benefits." onClick={() => startGarouPeriod('scene')}>New scene</GhostButton>
    </div> : null}
    <ShatteredPack actor={actor} canEdit={canEdit} />
    <Patron actor={actor} canEdit={canEdit} members={members} />
    <SectionTitle info="Caern Value ranges from 1 to 5. A higher value grants another Caern Trait. Use the associated Rite before raising it."
      actions={canEdit && (pending || caern.value < 5) ? <GhostButton tone="accent" onClick={() => setUpgrading(true)}>{pending ? 'View contributions' : 'Raise Caern Value'}</GhostButton> : null}>Caern</SectionTitle>
    <div className="bo-pair-grid">
      <PackField label="Caern name" value={caern.name} disabled={!canEdit} onSave={(value) => save('name', value)} />
      <PackField label="Sept" value={caern.sept} disabled={!canEdit} onSave={(value) => save('sept', value)} />
      <label className="bo-field-label"><span>Stewardship</span><Select value={caern.stewardship} disabled={!canEdit || !!pending}
        options={[{ value: 'pack', label: 'Pack caern' }, { value: 'sept', label: 'Sept caern' }]}
        onChange={(value) => save('stewardship', value)} /></label>
      <label className="bo-field-label"><span>Local Gauntlet</span><Select value={String(caern.gauntlet)} disabled={!canEdit}
        options={[1, 2, 3, 4, 5, 6].map((rating) => ({ value: String(rating), label: String(rating) }))}
        onChange={(value) => save('gauntlet', Number(value))} /></label>
    </div>
    <div className="bo-block">
      <PackField label="Bawn and boundaries" value={caern.bawn} disabled={!canEdit} multiline onSave={(value) => save('bawn', value)} />
    </div>
    <div className="bo-row bo-block">
      <div className="bo-label">Caern Value · {caern.value || 'Unawakened'}</div>
      {canEdit && !pending ? <label className="bo-field-label"><span>Record current value</span>
        <Select value={String(caern.value)} options={[0, 1, 2, 3, 4, 5].map((rating) => ({ value: String(rating), label: String(rating) }))}
          onChange={(value) => save('value', Number(value))} /></label> : null}
    </div>
    <SectionTitle sub="Core Rulebook · pp. 190–195">Caern Traits</SectionTitle>
    {!caern.value && choices.length ? <p className="bo-roll-note">The caern is dormant. Its recorded traits confer no benefits at Caern Value 0.</p> : null}
    {choices.length ? choices.map(({ id, name, summary }) => <div className="bo-stat-row" key={id}>
      <div><div className="bo-label">{name} · {caern.traits[id]}</div><p className="bo-prose">{summary}</p></div>
    </div>) : <p className="bo-empty">No Caern Traits recorded.</p>}
    {canEdit && !pending ? <ExistingCaernTraits caern={caern} onSave={(id, value) => save('traits.' + id, value)} /> : null}
    {upgrading ? <CaernUpgrade group={actor} caern={caern} pending={pending} members={members} onClose={() => setUpgrading(false)} /> : null}
  </>
}

function ExistingCaernTraits({ caern, onSave }) {
  const [trait, setTrait] = useState('')
  const selected = CAERN_TRAITS.find(({ id }) => id === trait)
  return <details className="bo-block">
    <summary className="bo-trait-name">Record existing traits</summary>
    <div className="bo-pair-grid">
      <Select value={trait} options={[{ value: '', label: 'Choose a trait…' }, ...CAERN_TRAITS.map(({ id, name }) => ({ value: id, label: name }))]}
        onChange={setTrait} />
      {selected ? <Select value={String(caern.traits[trait] ?? 0)} options={Array.from({ length: selected.repeatable ? 6 : 2 }, (_, rating) =>
        ({ value: String(rating), label: String(rating) }))} onChange={(value) => onSave(trait, Number(value))} /> : null}
    </div>
  </details>
}

export function PackBonds({ actor, editable }) {
  const members = packMembers(actor)
  const bonds = actor.getFlag(MODULE_ID, 'packBonds') ?? {}
  if (members.length < 2) return null
  return <div className="bo-block">
    <SectionTitle info="At creation each character draws a positive and a negative connection with two different packmates. Put the pack’s shared map in the journal if you want a visual version.">Pack Relationships</SectionTitle>
    {members.map((member) => <section className="bo-block" key={member.id}>
      <div className="bo-label">{member.name}</div>
      <div className="bo-pair-grid">{['Positive', 'Negative'].map((label) => {
        const key = label.toLowerCase()
        const relationship = bonds[member.id]?.[key]
        const other = bonds[member.id]?.[key === 'positive' ? 'negative' : 'positive']?.target
        const path = 'flags.' + MODULE_ID + '.packBonds.' + member.id + '.' + key
        return <div key={key}>
          <label className="bo-field-label"><span>{label} connection</span>
            <Select value={relationship?.target ?? ''} disabled={!editable} options={[
              { value: '', label: 'Choose a packmate…' },
              ...members.filter(({ id }) => id !== member.id).map(({ id, name }) => ({ value: id, label: name, disabled: id === other }))
            ]} onChange={(target) => actor.update({ [path]: { target, note: relationship?.note ?? '' } })} />
          </label>
          <PackField label="Notes" value={typeof relationship === 'string' ? relationship : relationship?.note} disabled={!editable}
            onSave={(note) => actor.update({ [path]: { target: relationship?.target ?? '', note } })} />
        </div>
      })}</div>
    </section>)}
  </div>
}

export function PackFavor({ actor, pack }) {
  useSyncExternalStore(subscribeGarouSession, () => garouPeriod('session'))
  const [busy, setBusy] = useState(false)
  const doing = useRef(false)
  const share = caernShare(pack, actor)
  const traits = garouPackContext(actor)?.traits ?? {}
  const health = garouHealth(actor)
  const patron = readPackPatron(pack)
  const name = packPatronName(patron)
  const preset = patronPreset(patron.id)
  const double = preset?.id === garouIdentities(actor).tribe?.id && !!preset
  async function act(action) {
    if (doing.current) return
    doing.current = true
    setBusy(true)
    try {
      await action()
    } catch (error) {
      console.error('Blood Oracle | Pack action failed', error)
      ui.notifications.error(error.message)
    } finally {
      doing.current = false
      setBusy(false)
    }
  }

  const recover = (choice) => act(() => applyCaernRecovery(actor, choice))
  async function pay() {
    const yes = await foundry.applications.api.DialogV2.confirm({
      classes: ['blood-oracle', 'bo-dialog', 'bo-splat-werewolf'],
      window: { title: 'Pay your caern contribution' },
      content: '<p>Spend ' + share.amount + ' XP from this character?</p>',
      rejectClose: false
    })
    if (yes) await payCaernShare(pack, actor)
  }
  return <section className="bo-block">
    <SectionTitle actions={<GhostButton onClick={() => pack.sheet.render({ force: true })}>Open Pack</GhostButton>}>Pack · {pack.name}</SectionTitle>
    {patron.id && name ? <p className="bo-prose">Patron · {name}. {preset?.favor || patron.favor}
      {double ? ' Double your Favor bonus when it applies.' : ' This Favor applies alongside your tribal Favor.'}</p> : null}
    {actor.isOwner ? <div className="bo-garou-actions bo-garou-balance-actions">
      {share ? <GhostButton tone="accent" disabled={busy || share.paid || experienceTotals(actor).remaining < share.amount}
        onClick={() => act(pay)}>{share.paid ? 'Contribution paid · ' + share.amount + ' XP' : 'Pay ' + share.amount + ' XP'}</GhostButton> : null}
      {traits.ikon ? <GhostButton disabled={busy || !caernUseAvailable(actor, 'ikon', 'session') || !actor.system.willpower?.superficial}
        title="Once per session when spending time at the caern" onClick={() => recover('ikon')}>Ikon · Heal 1 Willpower</GhostButton> : null}
      {traits.balm ? <>
        <GhostButton disabled={busy || !caernUseAvailable(actor, 'balm', 'session') || !health.aggravated}
          title="Use at the start of the session if you have access to the caern" onClick={() => recover('balm-aggravated')}>Balm · Heal 1 Aggravated</GhostButton>
        <GhostButton disabled={busy || !caernUseAvailable(actor, 'balm', 'session') || !health.superficial}
          title="Use at the start of the session if you have access to the caern" onClick={() => recover('balm-superficial')}>Balm · Heal 3 Superficial</GhostButton>
      </> : null}
    </div> : null}
  </section>
}
