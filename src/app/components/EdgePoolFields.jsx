import Select from './Select.jsx'
import { getAttributeGroups, getSkillGroups } from '../traits.js'
import { hunterEdgePools, poolSelection } from '../schema/hunter-edges.js'

export default function EdgePoolFields({ edge, selections, onChange }) {
  const pools = hunterEdgePools(edge)
  if (!pools.length) return null
  const traits = new Map([...getAttributeGroups(), ...getSkillGroups()]
    .flatMap(({ entries }) => entries.map(({ id, label }) => [id, label])))

  return (
    <div className="bo-edge-pool-fields">
      {pools.map(({ choices, name }, index) => (
        <label className="bo-field-label" key={index}>
          <span>{name ? 'Edge Pool · ' + name : 'Edge Pool'}</span>
          <Select value={poolSelection(choices, selections?.[index]) ?? ''}
            placeholder="Choose a dice pool…" disabled={choices.length === 1}
            options={choices.map((pair) => ({
              value: pair.join('+'), label: pair.map((id) => traits.get(id) ?? id).join(' + ')
            }))}
            onChange={(value) => onChange(index, value)} />
        </label>
      ))}
    </div>
  )
}
