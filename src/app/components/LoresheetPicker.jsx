import { useMemo, useState } from 'react'
import { Modal, GhostButton } from './primitives.jsx'
import { LORESHEETS } from '../rules/loresheets.js'
import { getLoresheetText, loresheetTextsLoaded } from '../rules/catalog.js'
import { availability, ownedLoresheets } from '../schema/loresheets.js'

const LEVELS = [1, 2, 3, 4, 5]
const norm = (value) => String(value ?? '').trim().toLowerCase()

/**
 * Choosing a loresheet level. On the left every loresheet, searchable, the
 * ones outside the character's clan or blood dimmed but still takeable; on
 * the right the one under the pointer in full, each level with its own Take.
 */
export default function LoresheetPicker({ actor, onTake, onClose }) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)

  const owned = useMemo(() => {
    const map = new Map()
    for (const group of ownedLoresheets(actor)) map.set(group.entry.id, group.owned)
    return map
  }, [actor, actor.items.size])

  const needle = norm(query)
  const entries = useMemo(() => {
    const list = needle
      ? LORESHEETS.filter(
          (entry) =>
            norm(entry.name).includes(needle) ||
            entry.levels.some((level) => norm(level).includes(needle)) ||
            norm(entry.restriction?.text).includes(needle)
        )
      : LORESHEETS
    // Available first, then alphabetical, so a Ventrue sees their own lineages
    // among the general ones rather than after a hundred others.
    return [...list].sort((a, b) => {
      const ra = availability(actor, a).ok ? 0 : 1
      const rb = availability(actor, b).ok ? 0 : 1
      return ra - rb || a.name.localeCompare(b.name)
    })
  }, [needle, actor])

  // Once one is clicked it stays, so the pointer can travel to its Take buttons
  // across other names; until then hovering previews.
  const preview = selected ?? hovered
  const previewText = preview ? getLoresheetText(preview.id) : null
  const previewAccess = preview ? availability(actor, preview) : null
  const previewOwned = preview ? owned.get(preview.id) : null

  return (
    <Modal title="Choose a loresheet" className="bo-modal is-xwide" onClose={onClose}>
      <input
        type="text"
        className="bo-field"
        value={query}
        autoFocus
        placeholder="Search loresheets, their levels and restrictions…"
        onChange={(event) => setQuery(event.target.value)}
      />

      <div className="bo-picker is-lore">
        <ul className="bo-picker-list" onMouseLeave={() => setHovered(null)}>
          {entries.map((entry) => {
            const access = availability(actor, entry)
            const mine = owned.get(entry.id)
            const classes = [
              'bo-catalog-item',
              access.ok ? '' : 'is-unavailable',
              selected?.id === entry.id ? 'is-selected' : ''
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  className={classes}
                  onMouseEnter={() => setHovered(entry)}
                  onClick={() => setSelected(entry)}
                >
                  <span>
                    {mine ? <span className="bo-picker-check">✓ </span> : null}
                    {entry.name}
                  </span>
                  {entry.restriction ? (
                    <span className="bo-catalog-meta">{entry.restriction.text.replace(/ characters? only$/i, ' only')}</span>
                  ) : null}
                </button>
              </li>
            )
          })}
          {!entries.length ? <li className="bo-picker-note">No loresheet matches that.</li> : null}
        </ul>

        <div className="bo-picker-preview is-lore">
          {preview ? (
            <>
              <h3 className="bo-detail-title">{preview.name}</h3>
              {preview.restriction ? (
                <p className={previewAccess.ok ? 'bo-detail-sub' : 'bo-detail-sub is-unavailable'}>
                  {preview.restriction.text}
                  {previewAccess.ok ? '' : ' — this character does not qualify'}
                </p>
              ) : null}

              {previewText ? (
                <p className="bo-prose bo-lore-text">{previewText.description}</p>
              ) : (
                <p className="bo-picker-note">
                  {loresheetTextsLoaded()
                    ? 'No text for this loresheet.'
                    : 'The loresheet texts are not loaded — names only. See RULES.md.'}
                </p>
              )}

              <div className="bo-lore-levels">
                {LEVELS.map((level) => {
                  const taken = previewOwned?.has(level)
                  return (
                    <div key={level} className={taken ? 'bo-lore-level is-owned' : 'bo-lore-level'}>
                      <div className="bo-lore-level-head">
                        <span className="bo-lore-level-dots">{'●'.repeat(level)}</span>
                        <span className="bo-lore-level-name">{preview.levels[level - 1]}</span>
                        <GhostButton
                          tone="accent"
                          disabled={taken}
                          onClick={() => onTake(preview, level)}
                        >
                          {taken ? 'Taken' : 'Take'}
                        </GhostButton>
                      </div>
                      {previewText ? <p className="bo-lore-text">{previewText.levels[level - 1]}</p> : null}
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <p className="bo-picker-note">Point at a loresheet to read it.</p>
          )}
        </div>
      </div>
    </Modal>
  )
}
