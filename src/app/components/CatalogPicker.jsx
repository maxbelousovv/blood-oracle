import LibraryPicker from './LibraryPicker.jsx'
import RulesReference from './RulesReference.jsx'
import { LabelledValue, Block } from './primitives.jsx'
import { entriesForDiscipline } from '../rules/catalog.js'
import { entryShortfalls } from '../schema/requirements.js'

export default function CatalogPicker({ actor, discipline, onPick, onClose, ownedNames = [], custom, action = 'Add' }) {
  const owned = new Set(ownedNames.map((name) => name.toLowerCase()))
  const entries = entriesForDiscipline(discipline).map((entry) => ({
    id: entry.name,
    name: entry.name,
    group: entry.level ? 'Level ' + entry.level : '',
    summary: entry.effect,
    disabled: owned.has(entry.name.toLowerCase()),
    shortfalls: actor && actor.type !== 'spc' ? entryShortfalls(actor, discipline, entry) : [],
    entry
  }))

  return (
    <LibraryPicker title="Choose a power" action={action} entries={entries} onClose={onClose}
      onAdd={({ entry }) => onPick(entry)} custom={custom}
      renderDetails={({ entry, shortfalls }) => (
        <>
          {entry.cost ? <LabelledValue label="Cost" value={entry.cost} /> : null}
          {entry.dicePool ? <LabelledValue label="Dice pool" value={entry.dicePool} /> : null}
          {shortfalls.length ? <p className="bo-picker-note">Out of reach · {shortfalls.join(' · ')}</p> : null}
        </>
      )}
      renderRules={({ entry }) => <PowerReference key={entry.name} entry={entry} />} />
  )
}

export function PowerReference({ entry }) {
  return (
    <RulesReference key={entry.name} inline title={entry.name} source={entry.source}>
      {[
        ['Effect', entry.effect], ['Cost', entry.cost], ['Dice pool', entry.dicePool],
        ['Opposing pool', entry.opposingPool], ['Amalgam', entry.amalgam], ['Prerequisite', entry.prerequisite],
        ['Duration', entry.duration], ['System', entry.system], ['Process', entry.process],
        ['Ingredients', entry.ingredients], ['Special', entry.special], ['Example', entry.example]
      ].map(([label, value]) => value ? <Block key={label} label={label}>{value}</Block> : null)}
    </RulesReference>
  )
}
