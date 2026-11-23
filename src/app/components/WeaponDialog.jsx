import { useState } from 'react'
import LibraryPicker from './LibraryPicker.jsx'
import { LabelledValue } from './primitives.jsx'
import { WEAPON_CLASSES } from '../schema/inventory.js'

export default function WeaponDialog({ initial, initialRange, onSubmit, onClose }) {
  const [name, setName] = useState(initial?.name ?? '')
  const entries = WEAPON_CLASSES.filter(({ range }) => !initialRange || range === initialRange).map((entry) => ({
    ...entry,
    name: entry.label,
    group: entry.range === 'melee' ? 'Melee' : 'Ranged',
    summary: entry.examples,
    meta: '+' + entry.bonus
  }))
  return (
    <LibraryPicker title={initial ? 'Edit weapon' : 'Add a weapon'} action={initial ? 'Save' : 'Add'}
      entries={entries} initialId={initial?.classId} requireSelection canAdd={Boolean(name.trim())} onClose={onClose}
      onAdd={async ({ id }) => { await onSubmit({ name: name.trim(), classId: id }); onClose() }}
      renderDetails={({ bonus }) => <LabelledValue label="Damage" value={'+' + bonus} />}
      beforeList={
        <label className="bo-field-label bo-library-name">
          <span>Name</span>
          <input type="text" className="bo-field" value={name} placeholder="Grandfather’s sabre"
            onChange={(event) => setName(event.target.value)} />
        </label>
      } />
  )
}
