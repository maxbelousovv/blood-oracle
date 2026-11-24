import { useState } from 'react'
import DotTracker from '../components/DotTracker.jsx'
import { SectionTitle, LabelledValue, GhostButton, Modal } from '../components/primitives.jsx'
import { isLoaded } from '../rules/catalog.js'
import { garouAdvantageFor } from '../rules/garou-advantages.js'
import WerewolfReference from '../components/WerewolfReference.jsx'
import GarouAdvantagePicker from '../components/GarouAdvantagePicker.jsx'
import AdvantagePicker from '../components/AdvantagePicker.jsx'
import HunterAdvantageReference from '../components/HunterAdvantageReference.jsx'
import {
  FEATURE_TYPES,
  featuresOfType,
  readAdvantageMeta,
  addFeature,
  dotsRange,
  isCustomAdvantage,
  parseAdvantageRating,
  saveAdvantageInstance
} from '../schema/advantages.js'
import { featureOrigin } from '../schema/predator-grants.js'
import { LoresheetCard, LoresheetDetail } from '../components/Loresheets.jsx'
import LoresheetPicker from '../components/LoresheetPicker.jsx'
import { SharedFromCoterie, clanCoterieEntries } from '../components/Coterie.jsx'
import { groupOf } from '../schema/coterie.js'
import { canSee, isLoresheetItem, ownedLoresheets, takeLevel } from '../schema/loresheets.js'

const SECTIONS = [
  { type: FEATURE_TYPES.merit, title: 'Merits', kind: 'merit' },
  { type: FEATURE_TYPES.flaw, title: 'Flaws', kind: 'flaw' },
  { type: FEATURE_TYPES.background, title: 'Backgrounds', kind: 'merit' }
]

/* ------------------------------------------------------------- detail */

function FeatureRating({ item, editable, locked }) {
  const points = item.system.points ?? 0
  const meta = readAdvantageMeta(item)
  const max = Math.min(6, Math.max(5, dotsRange(meta.bookDots ?? meta.dots).max, points))
  return (
    <div className="bo-library-actions" style={{ marginTop: 0 }}>
      <DotTracker
        value={points}
        max={max}
        disabled={!editable}
        locked={locked}
        onChange={(next) => item.update({ 'system.points': next })}
      />
      {points > max ? <span className="bo-catalog-meta">{points}</span> : null}
    </div>
  )
}

function FeatureEditor({ item, duplicate, locked, onSaved, onClose }) {
  const meta = readAdvantageMeta(item)
  const custom = isCustomAdvantage(item)
  const [initial] = useState(() => ({
    name: item.name,
    description: item.system.description ?? '',
    points: String(item.system.points ?? 0),
    details: meta.details ?? ''
  }))
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const field = (key) => ({
    value: form[key],
    onChange: (event) => {
      const value = event.target.value
      setForm((current) => ({ ...current, [key]: value }))
      setError('')
    }
  })

  const save = async () => {
    if (saving) return
    const ratingChanged = !locked && form.points !== initial.points
    const points = parseAdvantageRating(form.points)
    if (ratingChanged && points === null) {
      setError('Enter a whole number of dots, starting at zero.')
      return
    }
    if (custom && !form.name.trim()) {
      setError('Give the advantage a name.')
      return
    }

    setSaving(true)
    try {
      const changes = {}
      const details = form.details.trim()
      if (details !== initial.details) changes.details = details
      if (ratingChanged) changes.points = points
      if (custom && form.name.trim() !== initial.name) changes.name = form.name.trim()
      if (custom && form.description !== initial.description) changes.description = form.description
      const saved = duplicate || Object.keys(changes).length
        ? await saveAdvantageInstance(item, changes, { duplicate })
        : item
      if (!saved) throw new Error('The advantage was not created.')
      onSaved(saved.id)
    } catch (failure) {
      setError(failure.message || 'Could not save the advantage.')
      setSaving(false)
    }
  }

  return (
    <Modal title={duplicate ? 'Duplicate advantage' : 'Edit advantage'} subtitle={custom ? undefined : item.name}
      onClose={saving ? undefined : onClose}>
      <div>
        {custom ? (
          <label className="bo-field-label">
            <span>Name</span>
            <input className="bo-field" type="text" autoFocus disabled={saving} {...field('name')} />
          </label>
        ) : null}
        <label className="bo-field-label">
          <span>Details</span>
          <textarea className="bo-field" rows={3} autoFocus={!custom} disabled={saving}
            placeholder={meta.detailsPlaceholder || 'Who or what this refers to'} {...field('details')} />
        </label>
        <label className="bo-field-label">
          <span>Rating</span>
          <input className="bo-field" type="text" inputMode="numeric" disabled={locked || saving} {...field('points')} />
          {locked ? <span className="bo-roll-note">Unlock ratings on the sheet to change the dots.</span> : null}
        </label>
        {custom ? (
          <label className="bo-field-label">
            <span>Description</span>
            <textarea className="bo-field" rows={4} disabled={saving} {...field('description')} />
          </label>
        ) : null}
        {error ? <p className="bo-roll-note" role="alert">{error}</p> : null}
        <div className="bo-library-actions">
          <GhostButton onClick={onClose} disabled={saving}>Cancel</GhostButton>
          <GhostButton tone="accent" onClick={save} disabled={saving}>Save</GhostButton>
        </div>
      </div>
    </Modal>
  )
}

function FeatureDetail({ item, editable, locked, onEdit, onDuplicate, onDelete }) {
  const meta = readAdvantageMeta(item)
  const garou = item.parent?.type === 'werewolf' ? garouAdvantageFor(item, meta) : null
  const origin = item.parent ? featureOrigin(item.parent, item.id) : null
  const bookDots = isCustomAdvantage(item) ? null : (meta.bookDots ?? meta.dots)

  return (
    <div className="bo-panel">
      <div className="bo-row" style={{ alignItems: 'flex-start' }}>
        <div>
          <h3 className="bo-detail-title">{item.name}</h3>
          <p className="bo-detail-sub">
            {meta.group ? `${meta.group} · ` : ''}
            {item.system.featuretype}
            {origin ? ` · granted by ${origin}` : ''}
          </p>
        </div>
        {editable ? (
          <div className="bo-library-actions">
            <GhostButton tone="accent" onClick={onEdit}>Edit</GhostButton>
            <GhostButton onClick={onDuplicate}>Duplicate</GhostButton>
            <GhostButton tone="danger" onClick={onDelete}>Remove</GhostButton>
          </div>
        ) : null}
      </div>

      <div className="bo-row" style={{ margin: '4px 0 14px' }}>
        <span style={{ color: 'var(--bo-text-muted)', fontSize: '15px' }}>Rating</span>
        <FeatureRating item={item} editable={editable} locked={locked} />
      </div>

      {item.system.description ? (
        <p className="bo-prose">{item.system.description}</p>
      ) : (
        <p className="bo-value is-empty">No description recorded.</p>
      )}
      {meta.hunterId ? <HunterAdvantageReference key={meta.hunterId} id={meta.hunterId} source={meta.source} /> : null}
      {garou ? <WerewolfReference id={garou.id} /> : null}

      {meta.details ? (
        <div className="bo-block">
          <div className="bo-label">Details</div>
          <p className="bo-prose" style={{ whiteSpace: 'pre-wrap' }}>{meta.details}</p>
        </div>
      ) : null}

      {bookDots ? (
        <div className="bo-scalars">
          <LabelledValue label="Rating in the book" value={bookDots} />
        </div>
      ) : null}
    </div>
  )
}

/* ---------------------------------------------------------------- tab */

export default function MeritsFlawsTab({ actor, editable, locked }) {
  const [selectedId, setSelectedId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [picking, setPicking] = useState(null) // { kind, backgroundsOnly, type }
  // Loresheets are selected by loresheet, not by item: one card holds several.
  const [selectedLore, setSelectedLore] = useState(null)
  const [pickingLore, setPickingLore] = useState(false)

  const hunter = actor.type === 'hunter'
  const werewolf = actor.type === 'werewolf'
  const selected = selectedId ? actor.items.get(selectedId) : null
  const editingItem = editing ? actor.items.get(editing.id) : null
  const loresheets = ownedLoresheets(actor).filter((group) => canSee(actor, group.entry.id))
  const selectedLoreGroup = selectedLore
    ? loresheets.find((group) => group.entry.id === selectedLore) ?? null
    : null

  const selectItem = (id) => {
    setSelectedLore(null)
    setSelectedId(id)
  }
  const selectLore = (id) => {
    setSelectedId(null)
    setSelectedLore(selectedLore === id ? null : id)
  }

  const takeFromPicker = async (entry, level) => {
    await takeLevel(actor, entry, level)
    setPickingLore(false)
    setSelectedId(null)
    setSelectedLore(entry.id)
  }

  const remove = async (item) => {
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      classes: ['blood-oracle', 'bo-dialog', 'bo-dialog-remove'],
      window: { title: 'Remove feature' },
      content: `<p>Remove <strong>${foundry.utils.escapeHTML(item.name)}</strong> from this character?</p>`
    })
    if (!confirmed) return
    setSelectedId(null)
    await item.delete()
  }

  const addBlank = async (featuretype) => {
    const created = await addFeature(actor, { featuretype })
    if (!created) return
    selectItem(created.id)
    setEditing({ id: created.id, duplicate: false })
  }

  const pickFrom = async (entry) => {
    const created = await addFeature(actor, { entry })
    setPicking(null)
    if (created) selectItem(created.id)
  }

  return (
    <div>
      <SectionTitle
        info="Select an entry to edit its details and current rating. The catalogue shows the rating used when buying it.">
        Merits &amp; flaws
      </SectionTitle>

      <div className="bo-master-detail">
        <div>
          {SECTIONS.map((section) => {
            // Loresheet levels are merits to the system, but they live on
            // their own cards below.
            const items = featuresOfType(actor, section.type).filter((item) => !isLoresheetItem(item))

            return (
              <div key={section.type} style={{ marginBottom: '22px' }}>
                <div className="bo-row" style={{ marginBottom: '10px' }}>
                  <div className="bo-label" style={{ margin: 0 }}>
                    {section.title}
                  </div>
                  {editable ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {hunter || werewolf || isLoaded() ? (
                        <GhostButton
                          tone="accent"
                          onClick={() =>
                            setPicking({
                              kind: section.kind,
                              backgroundsOnly: section.type === FEATURE_TYPES.background,
                              type: section.type
                            })
                          }
                        >
                          + Add
                        </GhostButton>
                      ) : null}
                      <GhostButton onClick={() => addBlank(section.type)}>Custom</GhostButton>
                    </div>
                  ) : null}
                </div>

                {items.length ? (
                  <div style={{ display: 'grid', gap: '4px' }}>
                    {items.map((item) => (
                      <div key={item.id} className="bo-stat-row">
                        <div className="bo-stat-name">
                          <button
                            type="button"
                            className={
                              selectedId === item.id ? 'bo-trait-name is-selected' : 'bo-trait-name'
                            }
                            onClick={() => selectItem(selectedId === item.id ? null : item.id)}
                          >
                            {item.name}
                          </button>
                          {readAdvantageMeta(item).details ? (
                            <span className="bo-specialty">({readAdvantageMeta(item).details})</span>
                          ) : null}
                          {featureOrigin(actor, item.id) ? (
                            <span
                              className="bo-origin"
                              title={`Granted by predator type: ${featureOrigin(actor, item.id)}`}
                            >
                              pred
                            </span>
                          ) : null}
                        </div>
                        <FeatureRating item={item} editable={editable} locked={locked} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="bo-empty" style={{ textAlign: 'left', padding: '4px 0' }}>
                    {section.type === FEATURE_TYPES.flaw
                      ? 'Nothing weighs on them yet.'
                      : 'Nothing recorded yet.'}
                  </p>
                )}
              </div>
            )
          })}

          {!hunter ? <SharedFromCoterie group={groupOf(actor)} actor={actor} /> : null}

          <div style={{ marginBottom: '22px' }}>
            <div className="bo-row" style={{ marginBottom: '10px' }}>
              <div className="bo-label" style={{ margin: 0 }}>
                Loresheets
              </div>
              {editable ? (
                <GhostButton tone="accent" onClick={() => setPickingLore(true)}>
                  + Add
                </GhostButton>
              ) : null}
            </div>
            {loresheets.length ? (
              <div style={{ display: 'grid', gap: '8px' }}>
                {loresheets.map((group) => (
                  <LoresheetCard
                    key={group.entry.id}
                    actor={actor}
                    group={group}
                    selected={selectedLore === group.entry.id}
                    onSelect={() => selectLore(group.entry.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="bo-empty" style={{ textAlign: 'left', padding: '4px 0' }}>
                No loresheet ties them to the wider story yet.
              </p>
            )}
          </div>
        </div>

        <div>
          {selectedLoreGroup ? (
            <LoresheetDetail
              actor={actor}
              group={selectedLoreGroup}
              editable={editable}
              onDropped={() => setSelectedLore(null)}
            />
          ) : selected ? (
            <FeatureDetail
              key={selected.id}
              item={selected}
              editable={editable}
              locked={locked}
              onEdit={() => setEditing({ id: selected.id, duplicate: false })}
              onDuplicate={() => setEditing({ id: selected.id, duplicate: true })}
              onDelete={() => remove(selected)}
            />
          ) : (
            <div className="bo-panel">
              <p className="bo-empty" style={{ padding: '28px 0' }}>
                Select an entry on the left to view its details.
              </p>
            </div>
          )}
        </div>
      </div>

      {picking && werewolf ? <GarouAdvantagePicker type={picking.type} taken={actor.items.filter((item) => item.type === 'feature').map(({ name }) => name)}
        onPick={pickFrom} onClose={() => setPicking(null)} /> : picking ? (
        <AdvantagePicker
          actor={actor}
          kind={picking.kind}
          sectionType={picking.type}
          backgroundsOnly={picking.backgroundsOnly}
          allowEnemyCopies
          // A clan's coterie merit can be bought by one of its Kindred alone.
          extraEntries={!hunter && picking.kind === 'merit' && !picking.backgroundsOnly ? clanCoterieEntries(actor) : null}
          onPick={pickFrom}
          onClose={() => setPicking(null)}
        />
      ) : null}

      {editingItem && editable ? (
        <FeatureEditor key={editingItem.id} item={editingItem} duplicate={editing.duplicate} locked={locked}
          onClose={() => setEditing(null)}
          onSaved={(id) => { selectItem(id); setEditing(null) }} />
      ) : null}

      {pickingLore ? (
        <LoresheetPicker actor={actor} onTake={takeFromPicker} onClose={() => setPickingLore(false)} />
      ) : null}
    </div>
  )
}
