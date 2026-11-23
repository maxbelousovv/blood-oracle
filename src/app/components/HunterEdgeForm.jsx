import { useRef, useState } from 'react'
import { GhostButton, Modal } from './primitives.jsx'
import Select from './Select.jsx'
import { getAttributeGroups, getSkillGroups } from '../traits.js'
import { edgePoolData, edgePoolSlots } from '../schema/hunter-edges.js'

export default function HunterEdgeForm({ actor, edge, label, item, type, summary, onClose, onSaved }) {
  const attributes = getAttributeGroups()
  const skills = getSkillGroups()
  const pool = type === 'edgepool'
  const originalSlots = edgePoolSlots(item, [...attributes, ...skills])
  const [name, setName] = useState(item?.name ?? '')
  const [description, setDescription] = useState(item?.system.description || summary || '')
  const [attribute, setAttribute] = useState(originalSlots.find(({ kind }) => kind === 'attribute')?.id ?? '')
  const [skill, setSkill] = useState(originalSlots.find(({ kind }) => kind === 'skill')?.id ?? '')
  const [busy, setBusy] = useState(false)
  const saving = useRef(false)
  const ready = name.trim() && (!pool || (attribute && skill))
  const kind = pool ? 'Edge Pool' : 'Perk'
  const choices = (groups) => groups.flatMap((group) => group.entries.map(({ id, label }) => ({ value: id, label, group: group.label })))

  async function save() {
    if (!ready || saving.current) return
    saving.current = true
    setBusy(true)
    try {
      if (item) {
        const changes = { name: name.trim(), 'system.description': description }
        if (pool) {
          const replacement = edgePoolData(edge, name.trim(), description, attribute, skill).system.dicepool
          for (const key of Object.keys(item.system.dicepool ?? {})) {
            if (!Object.hasOwn(replacement, key)) changes['system.dicepool.-=' + key] = null
          }
          for (const [key, value] of Object.entries(replacement)) changes['system.dicepool.' + key] = value
        }
        await item.update(changes)
        onSaved(item)
      } else {
        const data = pool ? edgePoolData(edge, name.trim(), description, attribute, skill)
          : { name: name.trim(), type: 'perk', system: { edge, description } }
        const [created] = await actor.createEmbeddedDocuments('Item', [data])
        if (!created) throw new Error('No item was created')
        onSaved(created)
      }
    } catch (error) {
      console.error('Blood Oracle | Could not save Hunter ability', error)
      ui.notifications.error('Blood Oracle: could not save the ' + kind + '.')
    } finally {
      saving.current = false
      setBusy(false)
    }
  }

  return (
    <Modal title={(item ? 'Edit ' : 'Add ') + kind} subtitle={label} onClose={busy ? undefined : onClose}>
      <label className="bo-field-label">
        <span>Name</span>
        <input className="bo-field" value={name} disabled={busy} onChange={(event) => setName(event.target.value)} />
      </label>
      {pool ? (
        <div className="bo-pair-grid bo-block">
          <label className="bo-field-label">
            <span>Attribute</span>
            <Select value={attribute} options={choices(attributes)} disabled={busy} onChange={setAttribute} />
          </label>
          <label className="bo-field-label">
            <span>Skill</span>
            <Select value={skill} options={choices(skills)} disabled={busy} onChange={setSkill} />
          </label>
        </div>
      ) : null}
      <label className="bo-field-label bo-block">
        <span>Description</span>
        <textarea className="bo-field" rows={4} value={description} disabled={busy} onChange={(event) => setDescription(event.target.value)} />
      </label>
      <div className="bo-roll-footer">
        <div className="bo-roll-actions">
          <GhostButton onClick={onClose} disabled={busy}>Cancel</GhostButton>
          <button type="button" className="bo-solid" disabled={!ready || busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </Modal>
  )
}
