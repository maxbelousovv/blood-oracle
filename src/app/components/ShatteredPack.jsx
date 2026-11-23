import { useRef, useState } from 'react'
import { MODULE_ID } from '../../constants.js'
import { SHATTERED_PACK_TYPES, SHATTERED_PACK_TRAITS } from '../rules/garou-shattered.js'
import LibraryPicker from './LibraryPicker.jsx'
import Select from './Select.jsx'
import { GhostButton, SectionTitle } from './primitives.jsx'
import WerewolfReference from './WerewolfReference.jsx'

const ELEMENTS = [['territory', 'Territory'], ['community', 'Community'], ['spirit', 'Spirit']]

function PackTypeDetails({ entry, ratings = entry.ratings }) {
  return <>
    <div className="bo-garou-actions">
      {ELEMENTS.map(([key, label]) => <span className="bo-label" key={key}>{label} · {ratings[key]}</span>)}
    </div>
    <p className="bo-prose">Starting Backgrounds · {entry.advantages.join(', ')}</p>
    <p className="bo-prose">Starting Flaws · {entry.flaws.join(', ')}</p>
    <p className="bo-prose">Possible extras · {entry.extras}</p>
    <p className="bo-roll-note">{entry.source}</p>
  </>
}

export default function ShatteredPack({ actor, canEdit }) {
  const [picker, setPicker] = useState('')
  const [busy, setBusy] = useState(false)
  const saving = useRef(false)
  const template = actor.getFlag(MODULE_ID, 'packTemplate')
  const selected = SHATTERED_PACK_TYPES.find(({ id }) => id === template?.id)
  const traits = actor.getFlag(MODULE_ID, 'shatteredPackTraits') ?? {}
  const availability = SHATTERED_PACK_TRAITS.map((entry) => ({ ...entry, disabled: !!traits[entry.id] }))
  const entries = picker === 'type' ? SHATTERED_PACK_TYPES.map((entry) => ({ ...entry, disabled: entry.id === selected?.id })) : availability

  async function save(action) {
    if (saving.current || !canEdit || !actor.isOwner || actor.system.groupType !== 'pack') return
    saving.current = true
    setBusy(true)
    try {
      await action()
      setPicker('')
    } catch (error) {
      console.error('Blood Oracle | Could not save the Pack catalogue entry', error)
      ui.notifications.error(error.message)
    } finally {
      setBusy(false)
      saving.current = false
    }
  }

  function pick(entry) {
    if (picker === 'type') return save(() => actor.setFlag(MODULE_ID, 'packTemplate', {
      id: entry.id, ratings: { ...entry.ratings }
    }))
    const rating = Number(entry.dots[0])
    return save(() => actor.update({ ['flags.' + MODULE_ID + '.shatteredPackTraits.' + entry.id]: rating }))
  }

  return <>
    <section className="bo-block">
      <SectionTitle actions={canEdit ? <GhostButton tone="accent" disabled={busy}
        onClick={() => setPicker('type')}>{selected ? 'Change type' : '+ Pack type'}</GhostButton> : null}>Pack Type</SectionTitle>
      {selected ? <>
        <h3 className="bo-detail-title">{selected.name}</h3>
        <p className="bo-prose">{selected.summary}</p>
        <PackTypeDetails entry={selected} ratings={template.ratings ?? selected.ratings} />
        <div className="bo-library-actions">
          <WerewolfReference id={selected.id} inline />
          {canEdit ? <GhostButton disabled={busy} onClick={() => save(() => actor.unsetFlag(MODULE_ID, 'packTemplate'))}>Clear type</GhostButton> : null}
        </div>
      </> : <p className="bo-empty">No pack type chosen.</p>}
    </section>
    <section className="bo-block">
      <SectionTitle actions={canEdit ? <GhostButton tone="accent" disabled={busy}
        onClick={() => setPicker('trait')}>+ Pack trait</GhostButton> : null}>Pack Merits & Flaws</SectionTitle>
      {SHATTERED_PACK_TRAITS.filter(({ id }) => traits[id]).map((entry) => <div className="bo-stat-row" key={entry.id}>
        <div>
          <div className="bo-trait-name">{entry.name} · {traits[entry.id]}</div>
          <p className="bo-prose">{entry.summary}</p>
        </div>
        <div className="bo-library-actions">
          {entry.id === 'pack-bolt-holes' && canEdit ? <Select value={String(traits[entry.id])} ariaLabel="Bolt Holes rating"
            options={[1, 2, 3].map((value) => ({ value: String(value), label: String(value) }))}
            onChange={(rating) => save(() => actor.update({ ['flags.' + MODULE_ID + '.shatteredPackTraits.' + entry.id]: Number(rating) }))} /> : null}
          <WerewolfReference id={entry.id} inline />
          {canEdit ? <GhostButton disabled={busy}
            onClick={() => save(() => actor.update({ ['flags.' + MODULE_ID + '.shatteredPackTraits.-=' + entry.id]: null }))}>Remove</GhostButton> : null}
        </div>
      </div>)}
      {!availability.some(({ disabled }) => disabled) ? <p className="bo-empty">No Pack Merits or Flaws recorded.</p> : null}
    </section>
    {picker ? <LibraryPicker title={picker === 'type' ? 'Choose a Pack Type' : 'Choose a Pack Merit or Flaw'}
      entries={entries} canAdd={!busy} onClose={() => setPicker('')} onAdd={pick}
      renderDetails={(entry) => picker === 'type' ? <PackTypeDetails entry={entry} /> : <p className="bo-roll-note">{entry.source}</p>}
      renderRules={(entry) => <WerewolfReference id={entry.id} inline />} /> : null}
  </>
}
