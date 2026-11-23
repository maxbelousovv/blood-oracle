import { packFavorPart } from '../schema/pack-effects.js'

const choiceList = [
  { id: 'abundance', name: 'Abundance', condition: 'Survival at the caern or on its bawn', skill: 'survival' },
  { id: 'security', name: 'Security', condition: 'Notice danger at the caern or on its bawn' },
  { id: 'gauntlet', name: 'Permissive Gauntlet', condition: 'Cross the Gauntlet from the caern' },
  { id: 'prestigious', name: 'Prestigious', condition: 'Renown used for status among Garou', kind: 'renown' },
  { id: 'well-hidden', name: 'Well-Hidden', condition: 'Difficulty to actively search for this caern' }
]

export function packRollOptions(actor, context, slots) {
  if (!context) return []
  const favor = packFavorPart(actor, slots.filter(({ id }) => id))
  const choices = favor ? [{ ...favor, id: 'favor', name: favor.label, condition: favor.detail }] : []
  for (const { id, name, condition, skill, kind } of choiceList) {
    const value = context.traits[id]
    if (!value || (skill && !slots.some((slot) => slot.kind === 'skill' && slot.id === skill)) ||
        (kind && !slots.some((slot) => slot.kind === kind))) continue
    choices.push({ id, name, label: name, value, condition })
  }
  return choices
}

export default function GarouRollOptions({ group, options, choice, onChange, difficulty }) {
  if (!group || !options.length) return null
  return <div className="bo-block">
    <div className="bo-label">Pack · {group.name}</div>
    {options.map(({ id, name, condition, value }) => <label key={id} className="bo-toggle">
      <input type="checkbox" checked={Boolean(choice[id])} disabled={id === 'well-hidden' && !difficulty}
        onChange={(event) => onChange(id, event.target.checked)} />
      <span>{name} · +{value} {id === 'well-hidden' ? 'Difficulty' : 'dice'}</span>
      <span className="bo-toggle-note">{condition}</span>
    </label>)}
  </div>
}
