import { useRef, useState } from 'react'
import { GhostButton, SectionTitle } from '../components/primitives.jsx'
import RichText from '../components/RichText.jsx'
import { HunterEdgePicker, HunterEdgeReference, HunterPerkPicker } from '../components/HunterEdgePicker.jsx'
import HunterEdgeForm from '../components/HunterEdgeForm.jsx'
import { getAttributeGroups, getSkillGroups } from '../traits.js'
import { getHunterEdgeText, getHunterEdgeVariantText, getHunterPerkText } from '../rules/catalog.js'
import { HUNTER_EDGES } from '../rules/hunter-edges.js'
import { addCustomEdge, edgeOptions, edgeLabel, edgeItems, availablePerks, edgePoolSlots, perkData } from '../schema/hunter-edges.js'
import StoryRating from '../components/StoryRating.jsx'
import { rollStoryPool } from '../roll/story-character.js'

export default function EdgesTab({ actor, editable, onRoll, locked }) {
  const [selection, setSelection] = useState(null)
  const [form, setForm] = useState(null)
  const [addingEdge, setAddingEdge] = useState(false)
  const [perkEdge, setPerkEdge] = useState('')
  const [customName, setCustomName] = useState('')
  const pending = useRef(new Set())
  const entries = Object.entries(actor.system.edges ?? {}).filter(([, edge]) => edge.visible && !edge.hidden)
  const options = edgeOptions(actor, { includeOwned: true })
  const item = selection?.item ? actor.items.get(selection.item) : null
  const id = selection?.edge
  const edge = entries.find(([key]) => key === id)?.[1]
  const catalogue = HUNTER_EDGES[id]
  const perk = item?.type === 'perk' ? catalogue?.perks.find(([name]) => name === item.name) : null
  const perkChoices = availablePerks(actor, perkEdge)
  const groups = [...getAttributeGroups(), ...getSkillGroups()]
  const poolSlots = (entry) => edgePoolSlots(entry, groups)
  const selectedClass = (active) => active ? 'bo-trait-name is-selected' : 'bo-trait-name'
  const story = actor.type === 'spc'

  const rollPerk = (perk) => rollStoryPool(actor, {
    label: perk.name,
    dice: Number(actor.system.edges?.[perk.system.edge]?.value) || 0,
    selectors: ['edges', 'edges.' + perk.system.edge],
    macro: perk.system.macroid
  })

  async function save(key, action) {
    if (pending.current.has(key)) return
    pending.current.add(key)
    try {
      await action()
    } catch (error) {
      console.error('Blood Oracle | Could not save Hunter Edge', error)
      ui.notifications.error('Blood Oracle: could not save the Edge or Perk.')
    } finally {
      pending.current.delete(key)
    }
  }

  function addPerk(key, name) {
    return save(JSON.stringify([key, name]), async () => {
      const [created] = await actor.createEmbeddedDocuments('Item', [
        perkData(key, name)
      ])
      if (!created) return
      setSelection({ edge: key, item: created.id })
      setPerkEdge((current) => current === key ? '' : current)
    })
  }

  function activateEdge(key) {
    return actor.update({ ['system.edges.' + key + '.visible']: true }).then(() => {
      setSelection({ edge: key })
      setCustomName('')
      setAddingEdge(false)
    })
  }

  function addExisting(key) {
    if (!options.some(({ value, disabled }) => value === key && !disabled)) return
    return save('activate:' + key, () => activateEdge(key))
  }

  function addCustom() {
    const name = customName.trim()
    if (!name) return
    return save('create-edge', async () => {
      const key = await addCustomEdge(name)
      if (key) await activateEdge(key)
    })
  }

  function remove() {
    return save('remove:' + (item?.id ?? id), async () => {
      const name = item?.name ?? edgeLabel(id, edge)
      const confirmed = await foundry.applications.api.DialogV2.confirm({
        classes: ['blood-oracle', 'bo-dialog', 'bo-dialog-remove'],
        window: { title: 'Remove ' + name },
        content: item ? '<p>Remove this item?</p>' : '<p>Remove this Edge and all its Perks and Pools?</p>'
      })
      if (!confirmed) return
      if (item) await item.delete()
      else {
        const ids = edgeItems(actor, id).map((entry) => entry.id)
        if (ids.length) await actor.deleteEmbeddedDocuments('Item', ids)
        await actor.update({ ['system.edges.' + id + '.visible']: false })
      }
      setSelection(item ? { edge: id } : null)
    })
  }

  return (
    <div>
      <SectionTitle actions={editable ? (
        <GhostButton tone="accent" onClick={() => setAddingEdge(true)}>
          + Add Edge
        </GhostButton>
      ) : null}>Edges</SectionTitle>

      {editable && addingEdge ? (
        <HunterEdgePicker options={options} onPick={addExisting} onClose={() => setAddingEdge(false)}
          custom={
            <div className="bo-row">
              <input className="bo-field" placeholder="Name of the custom Edge" aria-label="Custom Edge name"
                value={customName} onChange={(event) => setCustomName(event.target.value)} />
              <GhostButton disabled={!customName.trim()} onClick={addCustom}>Create custom Edge</GhostButton>
            </div>
          } />
      ) : null}

      <div className="bo-master-detail">
        <div>
          {entries.length ? entries.map(([key, data]) => (
            <div className={id === key && !item ? 'bo-tree-node is-selected' : 'bo-tree-node'} key={key}>
              <button type="button" className={selectedClass(id === key && !item)} onClick={() => setSelection({ edge: key })}>
                {edgeLabel(key, data)}
              </button>
              <div className="bo-tree-powers">
                {edgeItems(actor, key).map((entry) => (
                  <div className="bo-row" key={entry.id}>
                    <button type="button" className={selectedClass(item?.id === entry.id)}
                      onClick={() => setSelection({ edge: key, item: entry.id })}>{entry.name}</button>
                    {editable && story && entry.type === 'perk' ? (
                      <button type="button" className="bo-mini bo-spc-roll" title={'Roll ' + entry.name}
                        disabled={Number(data.value) < 1} onClick={() => rollPerk(entry)}>⚀</button>
                    ) : editable && poolSlots(entry).length ? (
                      <button type="button" className="bo-mini" title={'Roll ' + entry.name} onClick={() => onRoll(entry)}>⚀</button>
                    ) : null}
                  </div>
                ))}
                {editable ? (
                  <div>
                    <GhostButton onClick={() => setPerkEdge(key)}>+ Add Perk</GhostButton>
                    <GhostButton onClick={() => setForm({ edge: key, type: 'edgepool' })}>+ Pool</GhostButton>
                  </div>
                ) : null}
              </div>
            </div>
          )) : <p className="bo-empty">No Edges recorded.</p>}
        </div>
        <div className="bo-panel">
          {edge ? (
            <>
              <div className="bo-row">
                <h3 className="bo-detail-title">{item?.name ?? edgeLabel(id, edge)}</h3>
                {editable ? <GhostButton tone="danger" onClick={remove}>Remove</GhostButton> : null}
              </div>
              {item ? (
                <>
                  <p className="bo-detail-sub">{edgeLabel(id, edge)} · {item.type === 'perk' ? 'Perk' : 'Edge Pool'}</p>
                  {item.system.description ? <RichText content={item.system.description} /> : <p className="bo-prose">{perk?.[1]}</p>}
                  <HunterEdgeReference key={item.id} title={item.name} text={perk ? getHunterPerkText(id, item.name) : null} />
                  {poolSlots(item).length ? <p className="bo-prose">{poolSlots(item).map(({ label }) => label).join(' + ')}</p> : null}
                  {editable ? <div className="bo-block bo-row">
                    {story && item.type === 'perk' ? <GhostButton tone="accent" disabled={Number(edge.value) < 1} onClick={() => rollPerk(item)}>Roll</GhostButton> : null}
                    {poolSlots(item).length ? <GhostButton tone="accent" onClick={() => onRoll(item)}>Roll</GhostButton> : null}
                    <GhostButton onClick={() => setForm({ edge: id, item, type: item.type })}>Edit</GhostButton>
                  </div> : null}
                </>
              ) : (
                <>
                  <p className="bo-detail-sub">{catalogue?.category}</p>
                  {story ? (
                    <StoryRating actor={actor} path={'system.edges.' + id + '.value'} label="NPC Edge pool" editable={editable && !locked}
                      onRoll={editable ? (dice) => rollStoryPool(actor, { label: edgeLabel(id, edge), dice, selectors: ['edges', 'edges.' + id] }) : null} />
                  ) : null}
                  <p className="bo-prose">{catalogue?.summary}</p>
                  {catalogue?.pool ? <p className="bo-prose"><strong>Edge Pool</strong> · {catalogue.pool}</p> : null}
                  <RichText content={edge.description} />
                  <HunterEdgeReference key={id} title={edgeLabel(id, edge)} text={getHunterEdgeText(id)} source={catalogue?.source ?? 'Core Rulebook'} />
                  {catalogue?.variants.length ? (
                    <section className="bo-block">
                      <SectionTitle>Edge Variants</SectionTitle>
                      {catalogue.variants.map(([name, summary]) => (
                        <div key={name} className="bo-block">
                          <strong>{name}</strong>
                          <p className="bo-prose">{summary}</p>
                          <HunterEdgeReference title={name} text={getHunterEdgeVariantText(id, name)} />
                        </div>
                      ))}
                    </section>
                  ) : null}
                </>
              )}
            </>
          ) : <p className="bo-empty">Select an Edge, Perk or Pool to view its details.</p>}
        </div>
      </div>
      {form ? (
        <HunterEdgeForm actor={actor} edge={form.edge} label={edgeLabel(form.edge, actor.system.edges[form.edge])}
          item={form.item} type={form.type} summary={perk?.[1]} onClose={() => setForm(null)}
          onSaved={(saved) => {
            setSelection({ edge: form.edge, item: saved.id })
            setForm(null)
          }} />
      ) : null}
      {perkEdge ? (
        <HunterPerkPicker edge={perkEdge} label={edgeLabel(perkEdge, actor.system.edges[perkEdge])}
          perks={perkChoices} onPick={(name) => addPerk(perkEdge, name)} onClose={() => setPerkEdge('')}
          custom={<GhostButton onClick={() => { setForm({ edge: perkEdge, type: 'perk' }); setPerkEdge('') }}>+ Custom Perk</GhostButton>} />
      ) : null}
    </div>
  )
}
