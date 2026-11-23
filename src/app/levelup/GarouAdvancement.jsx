import { useState } from 'react'
import GarouPowerPicker from '../components/GarouPowerPicker.jsx'
import { GhostButton } from '../components/primitives.jsx'
import { GAROU_RENOWN, totalRenownOf } from '../schema/werewolf.js'
import { garouPowerKind } from '../rules/garou-powers.js'
import { GAROU_POWER_SLOTS, garouIdentities, giftPurchaseCost, RITE_XP } from '../schema/garou-advancement.js'
import { stepCost } from './costs.js'

export const GAROU_COST_TABLE = [
  ['Attribute', 'New level × 5'], ['Skill', 'New level × 3'], ['Specialty', '3'],
  ['Renown', 'New level × 5'], ['Advantage', '3 per dot'], ['Gift', 'Total Gifts after purchase × 2'],
  ['Rite', RITE_XP], ['Caern Value', 'New level × 5 (Pack sheet)']
]

export default function GarouAdvancement({ actor, plan, setPlan, Stepper, Section }) {
  const [slot, setSlot] = useState(null)
  const identities = garouIdentities(actor)
  const known = actor.items.filter((item) => garouPowerKind(item) === 'gift').length
  const ratings = GAROU_RENOWN.map(([id, label]) => {
    const from = Number(actor.system.renown?.[id]?.value) || 0
    return { id, label, from, to: plan.renown[id] ?? from }
  })
  const renown = ratings.reduce((sum, row) => sum + row.to, 0)
  let giftIndex = 0
  return <>
    <Section title="Renown" sub="Buy each dot separately. Take increases when the Storyteller confirms a deed worthy of that Renown.">
      {ratings.map(({ id, label, from, to }) => <Stepper key={id}
        label={label} from={from} to={to} max={5} cost={stepCost(from, to, 5)}
        onChange={(value) => setPlan((current) => ({ renown: { ...current.renown, [id]: value } }))} />)}
      <p className="bo-lu-sub">Total Renown · {totalRenownOf(actor)}{renown !== totalRenownOf(actor) ? ' → ' + renown : ''}</p>
    </Section>
    <Section title="Gifts & Rites" sub="Choose a teacher with the Storyteller. Gift cost uses the number of Gifts you will own after each purchase.">
      <div className="bo-cg-adv-actions">
        {GAROU_POWER_SLOTS.map((entry) => <GhostButton key={entry.id} tone="accent"
          disabled={['auspice', 'tribe'].includes(entry.id) && !identities[entry.id]}
          onClick={() => setSlot(entry)}>+ {entry.label}</GhostButton>)}
      </div>
      {plan.garouPicks.map((pick, i) => <div className="bo-cg-adv" key={i}>
        <span className="bo-cg-adv-name">{pick.name}</span>
        <span className="bo-lu-cost">{pick.slot === 'rite' ? RITE_XP : giftPurchaseCost(known, giftIndex++)} XP</span>
        <GhostButton onClick={() => setPlan((current) => ({ garouPicks: current.garouPicks.filter((_, index) => index !== i) }))}>Remove</GhostButton>
      </div>)}
      {slot ? <GarouPowerPicker slot={slot} identities={identities} renown={renown} items={actor.items} others={plan.garouPicks}
        onClose={() => setSlot(null)} onPick={(pick) => {
          setPlan((current) => ({ garouPicks: [...current.garouPicks, pick] }))
          setSlot(null)
        }} /> : null}
    </Section>
  </>
}
