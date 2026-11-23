import { useState } from 'react'
import { GhostButton } from './primitives.jsx'
import LibraryPicker from './LibraryPicker.jsx'
import { PowerReference } from './CatalogPicker.jsx'

export default function PowerSelection({ entries, chosen, onChange, blocks, experience = false }) {
  const [open, setOpen] = useState(false)
  const choices = entries.map((entry) => ({
    id: entry.name,
    name: entry.name,
    group: 'Level ' + entry.level,
    meta: experience ? entry.level * 3 + ' XP' : '●'.repeat(entry.level),
    summary: entry.effect,
    disabled: chosen.includes(entry.name),
    blocked: blocks?.(entry),
    entry
  }))

  return (
    <>
      {chosen.map((name) => (
        <div className="bo-row bo-cg-adv" key={name}>
          <span className="bo-cg-adv-name">{name}</span>
          <GhostButton onClick={() => onChange(chosen.filter((other) => other !== name))}>Remove</GhostButton>
        </div>
      ))}
      <GhostButton tone="accent" onClick={() => setOpen(true)}>Browse the reference</GhostButton>
      {open ? (
        <LibraryPicker title="Choose from the reference" entries={choices} onClose={() => setOpen(false)}
          onAdd={({ name }) => { onChange([...chosen, name]); setOpen(false) }}
          renderDetails={({ entry, blocked }) => (
            <>
              {entry.amalgam ? <p className="bo-picker-note">Amalgam · {entry.amalgam}</p> : null}
              {blocked ? <p className="bo-picker-note">This power does not fit the remaining dots.</p> : null}
            </>
          )}
          renderRules={({ entry }) => <PowerReference key={entry.name} entry={entry} />} />
      ) : null}
    </>
  )
}
