import { HunterEdgePicker, HunterPerkPicker } from '../components/HunterEdgePicker.jsx'
import { useState } from 'react'
import Select from '../components/Select.jsx'
import { GhostButton } from '../components/primitives.jsx'
import EdgePoolFields from '../components/EdgePoolFields.jsx'
import { availablePerks, edgeLabel, edgeOptions, EDGE_COST, PERK_COST } from '../schema/hunter-edges.js'

export default function HunterAdvancement({ actor, plan, setPlan }) {
  const [edge, setEdge] = useState('')
  const [picking, setPicking] = useState(null)
  const [custom, setCustom] = useState('')
  const newEdges = edgeOptions(actor)
  const owned = Object.entries(actor.system.edges ?? {}).filter(([, data]) => data.visible && !data.hidden)
  const perkEdges = [
    ...owned.map(([value, data]) => ({ value, label: edgeLabel(value, data) })),
    ...newEdges.filter(({ value }) => plan.edges.includes(value))
  ]
  const perks = availablePerks(actor, edge, plan.perks)
  const nameOf = (id) => perkEdges.find(({ value }) => value === id)?.label ?? id

  return (
    <>
      <GhostButton tone="accent" onClick={() => setPicking('edge')}>+ Edge</GhostButton>
      {plan.edges.map((id) => (
        <div key={id} className="bo-panel bo-block">
          <div className="bo-row">
            <span>{nameOf(id)} · {EDGE_COST} XP</span>
            <GhostButton onClick={() => {
              setPlan((current) => {
                const edgePools = { ...current.edgePools }
                delete edgePools[id]
                return { edgePools, edges: current.edges.filter((value) => value !== id), perks: current.perks.filter((pick) => pick.edge !== id) }
              })
              if (edge === id) { setEdge(''); setCustom('') }
            }}>Remove</GhostButton>
          </div>
          <EdgePoolFields edge={id} selections={plan.edgePools[id]} onChange={(index, value) => setPlan((current) => ({
            edgePools: { ...current.edgePools, [id]: { ...current.edgePools[id], [index]: value } }
          }))} />
        </div>
      ))}
      {perkEdges.length ? (
        <div className="bo-block">
          <Select value={edge} options={perkEdges} placeholder="Choose an Edge for its Perk…"
            onChange={(id) => { setEdge(id); setCustom('') }} />
          {edge ? (
            <div className="bo-row bo-block">
              <GhostButton tone="accent" disabled={!perks.length} onClick={() => setPicking('perk')}>+ Perk</GhostButton>
            </div>
          ) : null}
          {edge ? (
            <div className="bo-row bo-block">
              <input className="bo-field" aria-label="Custom Perk name" placeholder="Custom Perk name" value={custom}
                onChange={(event) => setCustom(event.target.value)} />
              <GhostButton disabled={!custom.trim()} onClick={() => {
                setPlan({ perks: [...plan.perks, { edge, name: custom.trim(), custom: true }] })
                setCustom('')
              }}>+ Custom Perk</GhostButton>
            </div>
          ) : null}
        </div>
      ) : null}
      {plan.perks.map((pick, index) => (
        <div key={index} className="bo-row bo-block">
          <span>{pick.name} · {nameOf(pick.edge)} · {PERK_COST} XP</span>
          <GhostButton onClick={() => setPlan({ perks: plan.perks.filter((_, i) => i !== index) })}>Remove</GhostButton>
        </div>
      ))}
      {picking === 'edge' ? (
        <HunterEdgePicker options={newEdges.filter(({ value }) => !plan.edges.includes(value))} onClose={() => setPicking(null)}
          onPick={(id) => { setPlan({ edges: [...plan.edges, id] }); setPicking(null) }} />
      ) : null}
      {picking === 'perk' ? (
        <HunterPerkPicker edge={edge} label={nameOf(edge)} perks={perks} onClose={() => setPicking(null)}
          onPick={(name) => { setPlan({ perks: [...plan.perks, { edge, name }] }); setPicking(null) }} />
      ) : null}
    </>
  )
}
