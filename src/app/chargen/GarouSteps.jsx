import { useState } from 'react'
import Select from '../components/Select.jsx'
import GarouPowerPicker from '../components/GarouPowerPicker.jsx'
import { GhostButton } from '../components/primitives.jsx'
import { AUSPICES, TRIBES } from '../rules/garou-identity.js'
import { GAROU_POWER_SLOTS } from '../schema/garou-advancement.js'
import { GAROU_RENOWN } from '../schema/werewolf.js'
import { attributeValue, advantageSpend } from './draft.js'
import { draftGarouIdentities } from './garou.js'

export function GarouBasics({ draft, setDraft }) {
  const basics = draft.basics
  const update = (key, value) => setDraft((current) => ({ basics: { ...current.basics, [key]: value } }))

  const portrait = () => new foundry.applications.apps.FilePicker.implementation({
    type: 'image', current: basics.portrait || '', callback: (path) => update('portrait', path)
  }).browse()

  return <>
    <div className="bo-cg-heading"><h2>Who are you?</h2><p>Choose a concept and people or wolves who keep your Garou grounded.</p></div>
    <div className="bo-cg-two">
      {['Name', 'Concept', 'Chronicle'].map((label) => <label className="bo-field-label" key={label}><span>{label}</span>
        <input className="bo-field" value={basics[label.toLowerCase()] ?? ''} onChange={(event) => update(label.toLowerCase(), event.target.value)} />
      </label>)}
      <label className="bo-field-label"><span>Birth form</span><Select value={draft.birthForm}
        options={[{ value: 'homid', label: 'Homid · human-born' }, { value: 'lupus', label: 'Lupus · wolf-born' }]}
        onChange={(birthForm) => setDraft({ birthForm })} /></label>
    </div>
    <div className="bo-cg-block">
      <div className="bo-label">Touchstones</div>
      {draft.touchstones.map((text, index) => <div className="bo-cg-row" key={index}>
        <input className="bo-field" aria-label={'Touchstone ' + (index + 1)} value={text} onChange={(event) =>
          setDraft((current) => ({ touchstones: current.touchstones.map((value, i) => i === index ? event.target.value : value) }))} />
        <GhostButton disabled={draft.touchstones.length === 1}
          onClick={() => setDraft((current) => ({ touchstones: current.touchstones.filter((_, i) => i !== index) }))}>Remove</GhostButton>
      </div>)}
      <GhostButton disabled={draft.touchstones.length === 3}
        onClick={() => setDraft((current) => ({ touchstones: [...current.touchstones, ''] }))}>+ Touchstone</GhostButton>
    </div>
    <div className="bo-cg-block"><div className="bo-label">Portrait</div>
      <button type="button" className="bo-portrait-slot bo-garou-portrait" onClick={portrait}>{basics.portrait ? <img src={basics.portrait} alt="" /> : 'Choose portrait'}</button>
    </div>
  </>
}

export function GarouIdentity({ draft, setDraft }) {
  const { auspice, tribe } = draftGarouIdentities(draft)
  return <>
    <div className="bo-cg-heading"><h2>Auspice, Tribe &amp; Renown</h2><p>Your tribe’s Patron sets two dots of Renown. Put the third dot in another category.</p></div>
    <div className="bo-cg-two">
      {[['auspice', 'Auspice', AUSPICES], ['tribe', 'Tribe', TRIBES]].map(([id, label, entries]) =>
        <label key={id} className="bo-field-label"><span>{label}</span>
          <Select value={draft[id]} options={[{ value: '', label: 'Select…' }, ...entries.map(({ id, name }) => ({ value: id, label: name }))]} onChange={(value) =>
            setDraft((current) => ({
              [id]: value,
              garouPicks: { ...current.garouPicks, [id]: undefined },
              ...(id === 'tribe' && entries.find((entry) => entry.id === value)?.renown.toLowerCase() === current.otherRenown ? { otherRenown: '' } : {})
            }))} /></label>)}
      {auspice ? <p className="bo-prose">{auspice.moon} · {auspice.summary}</p> : null}
      {tribe ? <p className="bo-prose">Patron · {tribe.patron}. Starts with 2 {tribe.renown}.</p> : null}
    </div>
    {tribe ? <label className="bo-field-label bo-cg-block"><span>Additional Renown</span>
      <Select value={draft.otherRenown} options={[{ value: '', label: 'Select…' }, ...GAROU_RENOWN
        .filter(([, label]) => label !== tribe.renown).map(([value, label]) => ({ value, label }))]}
        onChange={(otherRenown) => setDraft({ otherRenown })} /></label> : null}
  </>
}

export function GarouPowers({ draft, setDraft }) {
  const [slot, setSlot] = useState(null)
  const identities = draftGarouIdentities(draft)
  const others = Object.values(draft.garouPicks).filter((pick) => pick && pick.slot !== slot?.id)
  return <>
    <div className="bo-cg-heading"><h2>Gifts &amp; Rites</h2><p>Learn one Gift from each category and one Rite. Your starting Total Renown is 3.</p></div>
    {GAROU_POWER_SLOTS.map((entry) => <div className="bo-cg-row" key={entry.id}>
      <span className="bo-cg-row-label">{entry.label}</span>
      <span>{draft.garouPicks[entry.id]?.name || '—'}</span>
      <GhostButton tone="accent" disabled={['auspice', 'tribe'].includes(entry.id) && !identities[entry.id]} onClick={() => setSlot(entry)}>Choose</GhostButton>
    </div>)}
    {slot ? <GarouPowerPicker slot={slot} identities={identities} renown={3} others={others} onClose={() => setSlot(null)}
      onPick={(pick) => {
        setDraft((current) => ({ garouPicks: { ...current.garouPicks, [slot.id]: pick } }))
        setSlot(null)
      }} /> : null}
  </>
}

export function GarouSummary({ draft, review }) {
  const { auspice, tribe } = draftGarouIdentities(draft)
  const spent = advantageSpend(draft)
  const stamina = attributeValue(draft, 'stamina')
  const composure = attributeValue(draft, 'composure')
  const resolve = attributeValue(draft, 'resolve')
  const rows = [
    ['Auspice', auspice?.name], ['Tribe', tribe?.name], ['Patron', tribe?.patron],
    ['Health', stamina && stamina + 3], ['Willpower', composure && resolve && composure + resolve],
    ['Advantage dots', spent.advantages + '/7'], ['Flaw dots', spent.flaws + '/2']
  ]
  if (review) rows.push(...GAROU_POWER_SLOTS.map(({ id, label }) => [label, draft.garouPicks[id]?.name]))
  return <div className="bo-cg-summary">
    <div className="bo-label">{review ? draft.basics.name : 'So far'}</div>
    {rows.map(([label, value]) => <div className="bo-cg-sum-line" key={label}><span>{label}</span><b>{value || '—'}</b></div>)}
  </div>
}
