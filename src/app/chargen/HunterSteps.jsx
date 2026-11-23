import { useState } from 'react'
import { HunterEdgePicker, HunterPerkPicker } from '../components/HunterEdgePicker.jsx'
import Select from '../components/Select.jsx'
import { GhostButton, LabelledValue } from '../components/primitives.jsx'
import { getAttributeGroups, getSkillGroups } from '../traits.js'
import { CREEDS, findCreed } from '../rules/creeds.js'
import { DRIVES, findDrive } from '../rules/drives.js'
import { HUNTER_EDGES } from '../rules/hunter-edges.js'
import { availablePerks } from '../schema/hunter-edges.js'
import { LORESHEET_BY_ID } from '../schema/loresheets.js'
import { advantageSpend, attributeValue } from './draft.js'
import { hunterEdgeOptions } from './hunter.js'
import EdgePoolFields from '../components/EdgePoolFields.jsx'

export function HunterBasics({ draft, setDraft }) {
  const setTouchstone = (index, patch) => setDraft((current) => ({
    touchstones: current.touchstones.map((entry, i) => i === index ? { ...entry, ...patch } : entry)
  }))

  return (
    <>
      <div className="bo-cg-heading"><h2>Character</h2><p>Give your Hunter a reason to fight and people to fight for.</p></div>
      <div className="bo-pair-grid">
        {['name', 'concept', 'ambition', 'desire'].map((key) => (
          <label className="bo-field-label" key={key}>
            <span>{key[0].toUpperCase() + key.slice(1)}</span>
            <input className="bo-field" value={draft.basics[key] ?? ''}
              onChange={(event) => {
                const value = event.target.value
                setDraft((current) => ({ basics: { ...current.basics, [key]: value } }))
              }} />
          </label>
        ))}
      </div>
      <div className="bo-cg-block">
        <div className="bo-label">Touchstones</div>
        {draft.touchstones.map((entry, index) => (
          <div className="bo-cg-row" key={entry.id ?? index}>
            <input className="bo-field" aria-label={'Touchstone ' + (index + 1)} placeholder="Name and relationship"
              value={entry.touchstone} onChange={(event) => setTouchstone(index, { touchstone: event.target.value })} />
            <button className="bo-portrait-slot" type="button" aria-label="Choose Touchstone portrait" onClick={async () => {
              const picker = new foundry.applications.apps.FilePicker.implementation({
                type: 'image', current: entry.portrait, callback: (portrait) => {
                  setDraft((current) => ({
                    touchstones: current.touchstones.map((saved) => saved.id === entry.id ? { ...saved, portrait } : saved)
                  }))
                }
              })
              await picker.browse()
            }}>{entry.portrait ? <img src={entry.portrait} alt="" /> : 'Portrait'}</button>
            <GhostButton disabled={draft.touchstones.length === 1} onClick={() => setDraft((current) => ({
              touchstones: current.touchstones.filter((_, i) => i !== index)
            }))}>Remove</GhostButton>
          </div>
        ))}
        <GhostButton tone="accent" disabled={draft.touchstones.length >= 3}
          onClick={() => setDraft((current) => ({ touchstones: [...current.touchstones, { id: foundry.utils.randomID(8), touchstone: '', portrait: '' }] }))}>+ Touchstone</GhostButton>
      </div>
    </>
  )
}

export function HunterDrive({ draft, setDraft }) {
  const creed = findCreed(draft.creed)
  const drive = findDrive(draft.drive)
  return (
    <>
      <div className="bo-cg-heading"><h2>Creed &amp; Drive</h2><p>Choose how you Hunt and what keeps you going.</p></div>
      <div className="bo-cg-two">
        {[
          ['creed', 'Creed', CREEDS, creed, 'Desperation Dice Field', creed?.field],
          ['drive', 'Drive', DRIVES, drive, 'Redemption', drive?.redemption]
        ].map(([key, label, choices, entry, rule, text]) => (
          <section className="bo-panel" key={key}>
            <div className="bo-label">{label}</div>
            <Select value={draft[key]} placeholder={'Choose ' + label + '…'}
              options={choices.map(({ name }) => ({ value: name, label: name }))}
              onChange={(name) => setDraft({ [key]: name })} />
            {entry ? <p className="bo-prose">{entry.description}</p> : null}
            {text ? <LabelledValue label={rule} value={text} /> : null}
          </section>
        ))}
      </div>
    </>
  )
}

export function HunterEdges({ actor, draft, setDraft }) {
  const [picking, setPicking] = useState(null)
  const options = hunterEdgeOptions(actor)
  const nameOf = (key) => options.find(({ value }) => value === key)?.label ?? key

  return (
    <>
      <div className="bo-cg-heading"><h2>Edges &amp; Perks</h2><p>Take two Edges and one Perk, or one Edge and two Perks.</p></div>
      {draft.edges.length < 2 ? (
        <GhostButton tone="accent" onClick={() => setPicking({ kind: 'edge' })}>+ Edge</GhostButton>
      ) : null}
      {draft.edges.map((edge) => {
        const entry = HUNTER_EDGES[edge]
        const perks = availablePerks({ items: [] }, edge, draft.perks)
        return (
          <div className="bo-panel bo-cg-block" key={edge}>
            <div className="bo-row">
              <div className="bo-label">{nameOf(edge)}</div>
              <GhostButton tone="danger" onClick={() => setDraft((current) => ({
                edges: current.edges.filter((id) => id !== edge),
                perks: current.perks.filter((pick) => pick.edge !== edge)
              }))}>Remove</GhostButton>
            </div>
            {entry ? <p className="bo-prose">{entry.summary}</p> : null}
            <EdgePoolFields edge={edge} selections={draft.edgePools[edge]} onChange={(index, value) => setDraft((current) => ({
              edgePools: { ...current.edgePools, [edge]: { ...current.edgePools[edge], [index]: value } }
            }))} />
            {draft.perks.map((pick, index) => pick.edge === edge ? (
              <div className="bo-row" key={index}>
                <span>{pick.name}</span>
                <GhostButton onClick={() => setDraft((current) => ({ perks: current.perks.filter((_, i) => i !== index) }))}>Remove Perk</GhostButton>
              </div>
            ) : null)}
            {draft.perks.length < 3 - draft.edges.length && perks.length ? (
              <GhostButton tone="accent" onClick={() => setPicking({ kind: 'perk', edge })}>+ Perk</GhostButton>
            ) : null}
          </div>
        )
      })}
      {picking?.kind === 'edge' ? (
        <HunterEdgePicker options={options.filter(({ value }) => !draft.edges.includes(value))}
          onClose={() => setPicking(null)} onPick={(edge) => {
            setDraft((current) => ({ edges: [...current.edges, edge] }))
            setPicking(null)
          }} />
      ) : null}
      {picking?.kind === 'perk' ? (
        <HunterPerkPicker edge={picking.edge} label={nameOf(picking.edge)}
          perks={availablePerks({ items: [] }, picking.edge, draft.perks)}
          onClose={() => setPicking(null)} onPick={(name) => {
            setDraft((current) => ({ perks: [...current.perks, { edge: picking.edge, name }] }))
            setPicking(null)
          }} />
      ) : null}
    </>
  )
}

export function HunterSummary({ actor, draft, review = false }) {
  const spent = advantageSpend(draft)
  const options = hunterEdgeOptions(actor)
  const lines = [
    ['Creed', draft.creed || '—'],
    ['Drive', draft.drive || '—'],
    ['Health', attributeValue(draft, 'stamina') ? attributeValue(draft, 'stamina') + 3 : '—'],
    ['Willpower', attributeValue(draft, 'composure') && attributeValue(draft, 'resolve')
      ? attributeValue(draft, 'composure') + attributeValue(draft, 'resolve') : '—'],
    ['Advantage dots', spent.advantages],
    ['Flaw dots', spent.flaws],
    ['Edges', draft.edges.length],
    ['Perks', draft.perks.length]
  ]
  return (
    <div className="bo-cg-summary">
      <div className="bo-label">{review ? draft.basics.name : 'So far'}</div>
      {lines.map(([label, value]) => <div className="bo-cg-sum-line" key={label}><span>{label}</span><b>{value}</b></div>)}
      {review ? (
        <>
          <div className="bo-cg-block bo-cg-two">
            <div>
              <div className="bo-label">Identity</div>
              <LabelledValue label="Concept" value={draft.basics.concept} />
              <LabelledValue label="Ambition" value={draft.basics.ambition} />
              <LabelledValue label="Desire" value={draft.basics.desire} />
              <LabelledValue label="Touchstones" value={draft.touchstones.map(({ touchstone }) => touchstone).join(' · ')} />
            </div>
            <div>
              <div className="bo-label">Edges &amp; Perks</div>
              {draft.edges.map((key) => (
                <LabelledValue key={key} label={options.find(({ value }) => value === key)?.label ?? key}
                  value={draft.perks.filter(({ edge }) => edge === key).map(({ name }) => name).join(' · ') || '—'} />
              ))}
              <div className="bo-label">Advantages &amp; Flaws</div>
              <p className="bo-prose">{[
                ...draft.advantages.map(({ entry, dots }) => entry.name + ' ' + '●'.repeat(dots)),
                ...draft.loresheets.map(({ id, level }) => LORESHEET_BY_ID[id]?.levels[level - 1] + ' ' + '●'.repeat(level))
              ].join(' · ')}</p>
            </div>
          </div>
          <div className="bo-cg-two">
            <div><div className="bo-label">Attributes</div>
              {getAttributeGroups().flatMap(({ entries }) => entries).map(({ id, label }) => (
                <div className="bo-cg-sum-line" key={id}><span>{label}</span><b>{attributeValue(draft, id)}</b></div>
              ))}
            </div>
            <div><div className="bo-label">Skills &amp; Specialties</div>
              {getSkillGroups().flatMap(({ entries }) => entries).filter(({ id }) => draft.skills[id]).map(({ id, label }) => {
                const names = [draft.specialties.required[id], draft.specialties.free.skill === id ? draft.specialties.free.text : null].filter(Boolean)
                return <div className="bo-cg-sum-line" key={id}><span>{label}{names.length ? ' · ' + names.join(', ') : ''}</span><b>{draft.skills[id]}</b></div>
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
