import { useRef, useState } from 'react'
import { GhostButton } from './primitives.jsx'
import PickerModal from './PickerModal.jsx'

export default function LibraryPicker({ title, entries, onAdd, onClose, custom, renderDetails, renderRules, action = 'Add', initialId = '', requireSelection = false, canAdd = true, beforeList }) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('')
  const [selected, setSelected] = useState(initialId)
  const [hovered, setHovered] = useState('')
  const [busy, setBusy] = useState(false)
  const adding = useRef(false)
  const needle = query.trim().toLowerCase()
  const groups = [...new Set(entries.map((entry) => entry.group).filter(Boolean))]
  const visible = entries.filter((entry) => needle
    ? [entry.name, entry.group, entry.summary].some((value) => value?.toLowerCase().includes(needle))
    : !group || entry.group === group)
  const preview = visible.find(({ id }) => id === selected) ?? visible.find(({ id }) => id === hovered) ?? visible[0]

  async function add(entry) {
    if (!entry || entry.disabled || entry.blocked || !canAdd || (requireSelection && selected !== entry.id) || adding.current) return
    adding.current = true
    setBusy(true)
    try {
      await onAdd(entry)
    } catch (error) {
      console.error('Blood Oracle | Could not add catalog entry', error)
      ui.notifications.error('Blood Oracle: could not add ' + entry.name + '.')
    } finally {
      adding.current = false
      setBusy(false)
    }
  }

  return (
    <PickerModal title={title} onClose={busy ? undefined : onClose}>
      {beforeList}
      <input type="search" className="bo-field" aria-label="Search catalog" placeholder="Search every group…"
        autoFocus value={query} onChange={(event) => setQuery(event.target.value)} />
      <div className={'bo-picker bo-library-picker' + (groups.length < 2 ? ' is-single' : '')}>
        {groups.length > 1 ? (
          <ul className="bo-picker-rubrics">
            {['', ...groups].map((name) => (
              <li key={name}>
                <button type="button" className={'bo-picker-rubric' + (!needle && name === group ? ' is-active' : '')}
                  onClick={() => { setGroup(name); setQuery(''); setSelected(''); setHovered('') }}>
                  <span>{name || 'All'}</span>
                  <span>{name ? entries.filter((entry) => entry.group === name).length : entries.length}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <ul className="bo-picker-list" onMouseLeave={() => setHovered('')}>
          {visible.map((entry) => (
            <li key={entry.id}>
              <button type="button" className={'bo-catalog-item' + (preview?.id === entry.id ? ' is-selected' : '') + (entry.disabled ? ' is-taken' : entry.blocked ? ' is-unavailable' : '')}
                onMouseEnter={() => setHovered(entry.id)} onClick={() => setSelected(entry.id)}
                onDoubleClick={() => add(entry)}>
                <span>{entry.name}</span>
                {entry.disabled || entry.meta ? <span className="bo-catalog-meta">{entry.disabled ? 'Taken' : entry.meta}</span> : null}
              </button>
            </li>
          ))}
          {!visible.length ? <li className="bo-picker-note">No matching entries.</li> : null}
        </ul>
        <div className="bo-picker-preview">
          {preview ? (
            <>
              <h3 className="bo-detail-title">{preview.name}</h3>
              {preview.group ? <p className="bo-detail-sub">{preview.group}</p> : null}
              {preview.summary ? <p className="bo-prose">{preview.summary}</p> : null}
              {renderDetails?.(preview)}
              <div className="bo-library-actions">
                {renderRules?.(preview)}
                <GhostButton tone="accent" disabled={busy || preview.disabled || preview.blocked || !canAdd || (requireSelection && selected !== preview.id)} onClick={() => add(preview)}>
                  {preview.disabled ? 'Taken' : action}
                </GhostButton>
              </div>
            </>
          ) : null}
        </div>
      </div>
      {custom ? <fieldset className="bo-catalog-custom bo-block" disabled={busy}>{custom}</fieldset> : null}
    </PickerModal>
  )
}
