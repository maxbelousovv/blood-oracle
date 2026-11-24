import { useState } from 'react'
import LibraryPicker from './LibraryPicker.jsx'
import WerewolfReference from './WerewolfReference.jsx'
import { GhostButton } from './primitives.jsx'
import { GAROU_ADVANTAGES } from '../rules/garou-advantages.js'

const isBackground = (entry) => entry.group === 'Backgrounds'
const matches = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase()

export default function GarouAdvantagePicker({ type, taken = [], onPick, onClose }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dots, setDots] = useState('')
  const kind = type === 'flaw' ? 'flaw' : 'merit'
  const options = GAROU_ADVANTAGES.filter((entry) => entry.kind === kind && isBackground(entry) === (type === 'background'))
  const unavailable = (title, repeatable) => !repeatable && taken.some((other) => matches(other, title))

  return <LibraryPicker title={'Choose a ' + type} onClose={onClose}
    entries={options.map((entry) => ({
      ...entry, group: entry.rubric || entry.group, meta: entry.dots, summary: entry.description,
      disabled: unavailable(entry.name, entry.repeatable)
    }))}
    renderDetails={(entry) => <>
      {entry.requires ? <p className="bo-roll-note">Requires {entry.requires}.</p> : null}
      <p className="bo-roll-note">{entry.source}</p>
    </>}
    renderRules={(entry) => <WerewolfReference id={entry.id} inline />}
    onAdd={(entry) => onPick(options.find(({ id }) => id === entry.id))}
    custom={<div className="bo-block">
      <div className="bo-label">Enter a {type} from your source</div>
      <div className="bo-cg-two">
        <label className="bo-field-label"><span>Name</span><input className="bo-field" value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="bo-field-label"><span>Dot rating</span><input className="bo-field" type="number" min="1" max="5" value={dots} onChange={(event) => setDots(event.target.value)} /></label>
      </div>
      <label className="bo-field-label"><span>Description</span><textarea className="bo-field" rows="2" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <div className="bo-library-actions">
        <GhostButton tone="accent" disabled={!name.trim() || !/^[1-5]$/.test(dots) || unavailable(name, type === 'background') || options.some((entry) => matches(entry.name, name))}
          onClick={() => onPick({
            name: name.trim(), kind, dots, custom: true, group: type === 'background' ? 'Backgrounds' : 'Custom',
            description: foundry.utils.escapeHTML(description.trim())
          })}>Add by name</GhostButton>
      </div>
    </div>}
  />
}
