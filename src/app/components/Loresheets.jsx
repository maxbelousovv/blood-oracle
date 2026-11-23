import { useState } from 'react'
import { Modal, GhostButton } from './primitives.jsx'
import HoverTip from './HoverTip.jsx'
import { getLoresheetText, loresheetTextsLoaded } from '../rules/catalog.js'
import {
  availability,
  dropLevel,
  dropLoresheet,
  isPrivate,
  setPrivate,
  takeLevel
} from '../schema/loresheets.js'

const LEVELS = [1, 2, 3, 4, 5]

const dotsText = (level) => '●'.repeat(level)

const NO_TEXT = 'The loresheet texts are not loaded — see RULES.md for adding them.'

function EyeIcon({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" style={{ display: 'block' }}>
      <path
        d="M1 8s2.6-4.5 7-4.5S15 8 15 8s-2.6 4.5-7 4.5S1 8 1 8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="8" cy="8" r="2" fill="currentColor" />
      {open ? null : <path d="M2 14L14 2" stroke="currentColor" strokeWidth="1.4" />}
    </svg>
  )
}

/**
 * One loresheet in the list on the left: its name, which levels the character
 * has, and every level's name — the taken ones bright, the rest dimmed, so the
 * ladder can be read at a glance. Hovering a level shows its text.
 */
export function LoresheetCard({ actor, group, selected, onSelect }) {
  const [tip, setTip] = useState(null) // { anchor, level }
  const { entry, owned } = group
  const texts = getLoresheetText(entry.id)
  const hidden = isPrivate(actor, entry.id)

  return (
    <div className={selected ? 'bo-lore-card is-selected' : 'bo-lore-card'}>
      <div className="bo-lore-head">
        <button type="button" className={selected ? 'bo-trait-name is-selected' : 'bo-trait-name'} onClick={onSelect}>
          {entry.name}
        </button>
        {hidden ? (
          <span className="bo-lore-private" title="Private: only the character’s owners and the Storyteller see it">
            <EyeIcon open={false} />
          </span>
        ) : null}
        <span className="bo-lore-pips" title={`${group.dots} dots in this loresheet`}>
          {LEVELS.map((level) => (
            <span key={level} className={owned.has(level) ? 'bo-lore-pip is-on' : 'bo-lore-pip'} />
          ))}
        </span>
      </div>

      <ul className="bo-lore-ladder">
        {LEVELS.map((level) => (
          <li
            key={level}
            className={owned.has(level) ? 'is-owned' : undefined}
            onMouseEnter={(event) => texts && setTip({ anchor: event.currentTarget, level })}
            onMouseLeave={() => setTip(null)}
          >
            <span className="bo-lore-level-dots">{dotsText(level)}</span>
            <span className="bo-lore-level-name">{entry.levels[level - 1] || `Level ${level}`}</span>
          </li>
        ))}
      </ul>

      {tip ? (
        <HoverTip anchor={tip.anchor} title={`${dotsText(tip.level)} ${entry.levels[tip.level - 1]}`}>
          {texts.levels[tip.level - 1]}
        </HoverTip>
      ) : null}
    </div>
  )
}

/** The whole loresheet, every word of it. */
export function LoresheetRules({ entry, owned, onClose }) {
  const texts = getLoresheetText(entry.id)

  return (
    <Modal title={entry.name} subtitle={entry.source ?? entry.restriction?.text} wide onClose={onClose}>
      {texts ? (
        <>
          <p className="bo-prose bo-lore-text">{texts.description}</p>
          <div className="bo-lore-rules">
            {LEVELS.map((level) => (
              <section key={level} className={owned?.has(level) ? 'bo-lore-rule is-owned' : 'bo-lore-rule'}>
                <h4>
                  <span className="bo-lore-level-dots">{dotsText(level)}</span> {entry.levels[level - 1]}
                  {owned?.has(level) ? <span className="bo-lore-taken">taken</span> : null}
                </h4>
                <p className="bo-prose bo-lore-text">{texts.levels[level - 1]}</p>
              </section>
            ))}
          </div>
        </>
      ) : (
        <p className="bo-picker-note">{NO_TEXT}</p>
      )}
    </Modal>
  )
}

/**
 * The right-hand panel for a selected loresheet: a short look at the
 * description, each level with Take or Remove, Full rules for everything, and
 * the privacy switch. Buttons are never stray clicks, so the padlock, which
 * guards dots, does not stop them.
 */
export function LoresheetDetail({ actor, group, editable, onDropped }) {
  const [reading, setReading] = useState(false)
  const { entry, owned } = group
  const texts = getLoresheetText(entry.id)
  const hidden = isPrivate(actor, entry.id)
  const access = availability(actor, entry)

  const dropAll = async () => {
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      classes: ['blood-oracle', 'bo-dialog', 'bo-dialog-remove'],
      window: { title: 'Remove loresheet' },
      content: `<p>Remove every level of <strong>${foundry.utils.escapeHTML(entry.name)}</strong> from this character?</p>`
    })
    if (!confirmed) return
    onDropped?.()
    await dropLoresheet(actor, entry.id)
  }

  return (
    <div className="bo-panel">
      <div className="bo-row" style={{ alignItems: 'flex-start' }}>
        <div>
          <h3 className="bo-detail-title">{entry.name}</h3>
          <p className="bo-detail-sub">
            Loresheet · {group.dots} {group.dots === 1 ? 'dot' : 'dots'}
            {entry.source ? ' · ' + entry.source : ''}
            {entry.restriction ? ` · ${entry.restriction.text}` : ''}
          </p>
        </div>
        {editable ? (
          <GhostButton tone="danger" onClick={dropAll}>
            Remove
          </GhostButton>
        ) : null}
      </div>

      {!access.ok ? (
        <p className="bo-roll-note is-accent">Outside its restriction: {access.reason}. Kept by the Storyteller’s leave.</p>
      ) : null}

      <div className="bo-lore-actions">
        <GhostButton tone="accent" onClick={() => setReading(true)}>
          Full rules
        </GhostButton>
        {editable ? (
          <button
            type="button"
            className={hidden ? 'bo-ghost bo-lore-privacy is-private' : 'bo-ghost bo-lore-privacy'}
            title={
              hidden
                ? 'Private: only the character’s owners and the Storyteller see it. Click to share.'
                : 'Visible to anyone who can open this sheet. Click to make it private.'
            }
            onClick={() => setPrivate(actor, entry.id, !hidden)}
          >
            <EyeIcon open={!hidden} />
            {hidden ? 'Private' : 'Shared'}
          </button>
        ) : null}
      </div>

      {entry.summary || texts ? (
        <p className="bo-prose bo-lore-text is-clamped">{entry.summary ?? texts.description}</p>
      ) : (
        <p className="bo-picker-note">{loresheetTextsLoaded() ? 'No text for this loresheet.' : NO_TEXT}</p>
      )}

      <div className="bo-lore-levels">
        {LEVELS.map((level) => {
          const item = owned.get(level)
          return (
            <div key={level} className={item ? 'bo-lore-level is-owned' : 'bo-lore-level'}>
              <div className="bo-lore-level-head">
                <span className="bo-lore-level-dots">{dotsText(level)}</span>
                <span className="bo-lore-level-name">{entry.levels[level - 1] || `Level ${level}`}</span>
                {editable ? (
                  item ? (
                    <GhostButton onClick={() => dropLevel(item)}>Remove</GhostButton>
                  ) : (
                    <GhostButton tone="accent" onClick={() => takeLevel(actor, entry, level)}>
                      Take
                    </GhostButton>
                  )
                ) : null}
              </div>
              {entry.summaries || texts ? <p className="bo-lore-text is-clamped-short">{entry.summaries?.[level - 1] ?? texts.levels[level - 1]}</p> : null}
            </div>
          )
        })}
      </div>

      {reading ? <LoresheetRules entry={entry} owned={owned} onClose={() => setReading(false)} /> : null}
    </div>
  )
}
