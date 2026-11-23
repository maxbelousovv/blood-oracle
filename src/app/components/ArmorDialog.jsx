import { useState } from 'react'
import LibraryPicker from './LibraryPicker.jsx'
import { LabelledValue } from './primitives.jsx'
import { ARMOR_VALUES } from '../schema/inventory.js'

export default function ArmorDialog({ initial, onSubmit, onClose }) {
  const [name, setName] = useState(initial?.name ?? '')
  const entries = ARMOR_VALUES.map((entry) => ({
    ...entry,
    name: entry.label,
    summary: entry.examples,
    meta: String(entry.dice)
  }))
  return (
    <LibraryPicker title={initial ? 'Edit armour' : 'Add armour'} action={initial ? 'Save' : 'Add'}
      entries={entries} initialId={initial?.classId} requireSelection canAdd={Boolean(name.trim())} onClose={onClose}
      onAdd={async ({ id }) => { await onSubmit({ name: name.trim(), classId: id }); onClose() }}
      renderDetails={({ dice, note }) => (
        <>
          <LabelledValue label="Armour" value={dice} />
          {note ? <p className="bo-prose">{note}</p> : null}
        </>
      )}
      beforeList={
        <label className="bo-field-label bo-library-name">
          <span>Name</span>
          <input type="text" className="bo-field" value={name} placeholder="Bikers’ leathers"
            onChange={(event) => setName(event.target.value)} />
        </label>
      } />
  )
}
