import { GhostButton } from './primitives.jsx'
import RichText from './RichText.jsx'
import { rollStoryPool } from '../roll/story-character.js'

export default function StoryAbility({ actor, item, dice, selectors, editable, canRoll }) {
  async function remove() {
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      classes: ['blood-oracle', 'bo-dialog', 'bo-dialog-remove'],
      window: { title: 'Remove ' + item.name },
      content: '<p>Remove <strong>' + foundry.utils.escapeHTML(item.name) + '</strong>?</p>'
    })
    if (confirmed) await item.delete()
  }

  return (
    <div className="bo-stat-row bo-spc-ability">
      <details className="bo-stat-name">
        <summary className="bo-trait-name">{item.name}</summary>
        <RichText content={item.system.description} />
      </details>
      {canRoll && dice > 0 ? (
        <GhostButton tone="accent" aria-label={'Roll ' + item.name}
          onClick={() => rollStoryPool(actor, { label: item.name, dice, selectors, macro: item.system.macroid })}>
          Roll {dice}
        </GhostButton>
      ) : null}
      {editable ? <GhostButton onClick={() => item.sheet.render({ force: true })}>Edit</GhostButton> : null}
      {editable ? <button type="button" className="bo-mini" onClick={remove}
        aria-label={'Remove ' + item.name} title={'Remove ' + item.name}>×</button> : null}
    </div>
  )
}
