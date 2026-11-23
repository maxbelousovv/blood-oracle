import LibraryPicker from './LibraryPicker.jsx'
import RulesReference from './RulesReference.jsx'
import { HUNTER_EDGES } from '../rules/hunter-edges.js'
import { getHunterEdgeText, getHunterPerkText } from '../rules/catalog.js'
import { edgeRuleBlocks } from '../rules/edge-reference.js'

export function HunterEdgeReference({ title, text, source, inline }) {
  return text ? (
    <RulesReference title={title} source={source} inline={inline}>
      {edgeRuleBlocks(text, title).map(({ heading, paragraphs, perks }, index) => (
        <section className="bo-block" key={index}>
          {heading ? <h4 className="bo-label">{heading}</h4> : null}
          {paragraphs.map((paragraph, i) => <p className="bo-prose" key={i}>{paragraph}</p>)}
          {perks.length ? (
            <ul className="bo-prose">
              {perks.map(({ name, description }, i) => (
                <li key={i}><strong>{name}</strong>{description ? ': ' + description : ''}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </RulesReference>
  ) : null
}

export function HunterEdgePicker({ options, onPick, onClose, custom }) {
  const entries = options.map(({ value, label, group, disabled }) => ({
    id: value, name: label, group: group ?? 'Custom', disabled, summary: HUNTER_EDGES[value]?.summary
  }))
  return (
    <LibraryPicker title="Choose an Edge" entries={entries} onAdd={({ id }) => onPick(id)} onClose={onClose} custom={custom}
      renderDetails={({ id }) => HUNTER_EDGES[id]?.pool ? <p className="bo-prose"><strong>Edge Pool</strong> · {HUNTER_EDGES[id].pool}</p> : null}
      renderRules={({ id, name }) => <HunterEdgeReference inline key={id} title={name} text={getHunterEdgeText(id)}
        source={HUNTER_EDGES[id]?.source ?? 'Core Rulebook'} />} />
  )
}

export function HunterPerkPicker({ edge, label, perks, onPick, onClose, custom }) {
  const entries = perks.map(([name, summary]) => ({ id: name, name, summary, group: label }))
  return (
    <LibraryPicker title="Choose a Perk" entries={entries} onAdd={({ id }) => onPick(id)} onClose={onClose} custom={custom}
      renderRules={({ id }) => <HunterEdgeReference inline key={id} title={id} text={getHunterPerkText(edge, id)} />} />
  )
}
