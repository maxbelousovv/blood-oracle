import { useState } from 'react'
import PickerModal from './PickerModal.jsx'
import LibraryPicker from './LibraryPicker.jsx'
import WerewolfReference from './WerewolfReference.jsx'
import Select from './Select.jsx'
import { GhostButton } from './primitives.jsx'
import { GAROU_RENOWN } from '../schema/werewolf.js'
import { cataloguePower, powerChoiceProblem, powerEntries } from '../schema/garou-advancement.js'
import { giftCostLabel } from '../rules/garou-powers.js'

export function PowerDetails({ entry, totalRenown }) {
  const { action, difficulty, duration, level, page, pool, renown, source, restriction } = entry
  const cost = giftCostLabel(entry)
  return <>
    {level ? <p className="bo-prose"><strong>Total Renown</strong> · {level} minimum · {renown} Gift</p> : null}
    {level > totalRenown ? <p className="bo-roll-note">Requires Total Renown {level}. Current total · {totalRenown}</p> : null}
    {cost ? <p className="bo-prose"><strong>Cost</strong> · {cost}</p> : null}
    {action ? <p className="bo-prose"><strong>Action</strong> · {action}</p> : null}
    <p className="bo-prose"><strong>Pool</strong> · {pool || 'No test'}</p>
    {difficulty ? <p className="bo-prose"><strong>Difficulty</strong> · {difficulty}</p> : null}
    {duration ? <p className="bo-prose"><strong>Duration</strong> · {duration}</p> : null}
    {restriction ? <p className="bo-roll-note">{restriction}</p> : null}
    <p className="bo-roll-note">{source} · p. {page}</p>
  </>
}

export default function GarouPowerPicker({ slot, slots = [slot], identities, renown, items, others, onPick, onClose, title }) {
  const [route, setRoute] = useState(slots[0].id)
  const [manual, setManual] = useState({ name: '', level: '', renown: '', description: '' })
  const choice = slots.find(({ id }) => id === route) ?? slots[0]
  const identity = identities[choice.id]
  const rite = choice.id === 'rite'
  const custom = {
    ...manual,
    name: manual.name.trim(),
    level: rite ? 0 : Number(manual.level),
    slot: choice.id,
    giftType: identity?.id
  }
  const problemFor = (pick) => powerChoiceProblem({ pick, identities, renown, items, others })
  const entries = slots.flatMap((routeSlot) => {
    const routeIdentity = identities[routeSlot.id]
    return powerEntries(routeSlot.id, routeIdentity?.id).map((entry) => {
      const pick = cataloguePower(routeSlot.id, entry)
      const problem = problemFor(pick)
      return {
        ...entry, pick, ruleId: entry.id,
        id: slots.length > 1 ? routeSlot.id + ':' + entry.id : entry.id,
        group: routeIdentity?.name ?? entry.group,
        blocked: !!problem, disabled: problem === 'Already learned or selected.'
      }
    })
  })
  const manualProblem = problemFor(custom)
  const change = (key) => (event) => setManual((current) => ({ ...current, [key]: event.target.value }))

  const heading = title ?? (identity ? 'Choose a Gift · ' + identity.name : 'Choose a ' + choice.label)
  const customForm = <div className="bo-block bo-garou-manual-picker">
    <div className="bo-label">Custom {rite ? 'Rite' : 'Gift'}</div>
    <div className="bo-cg-two">
      {slots.length > 1 ? <label className="bo-field-label"><span>Learning path</span>
        <Select value={choice.id} options={slots.map(({ id, label }) => ({
          value: id, label: identities[id]?.name ?? label
        }))} onChange={setRoute} />
      </label> : null}
      <label className="bo-field-label"><span>{choice.label} name</span>
        <input className="bo-field" value={manual.name} onChange={change('name')} /></label>
      {!rite ? <label className="bo-field-label"><span>Total Renown required</span>
        <input className="bo-field" type="number" min="1" max="15" value={manual.level} onChange={change('level')} /></label> : null}
      {!rite ? <label className="bo-field-label"><span>Associated Renown</span>
        <Select value={manual.renown} options={[{ value: '', label: 'Choose Renown…' }, ...GAROU_RENOWN.map(([value, label]) => ({ value, label }))]}
          onChange={(renown) => setManual((current) => ({ ...current, renown }))} /></label> : null}
      <label className="bo-field-label"><span>Notes</span>
        <input className="bo-field" value={manual.description} onChange={change('description')} /></label>
    </div>
    {manual.name && manualProblem ? <p className="bo-roll-note">{manualProblem}</p> : null}
    <div className="bo-library-actions">
      <GhostButton tone="accent" disabled={!!manualProblem || (!rite && !manual.renown)} onClick={() => onPick(custom)}>Add by name</GhostButton>
    </div>
  </div>

  if (!entries.length) return <PickerModal title={heading} onClose={onClose}>{customForm}</PickerModal>
  return <LibraryPicker title={heading} entries={entries} onClose={onClose} custom={customForm}
    onAdd={(entry) => onPick(entry.pick)}
    renderDetails={(entry) => <>
      <PowerDetails entry={entry} totalRenown={renown} />
      {entry.blocked && !entry.disabled && entry.level <= renown ? <p className="bo-roll-note">{problemFor(entry.pick)}</p> : null}
    </>}
    renderRules={(entry) => <WerewolfReference id={entry.ruleId} inline />}
  />
}
