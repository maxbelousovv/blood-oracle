import { useMemo, useState } from 'react'
import DotTracker from './DotTracker.jsx'
import HoverTip from './HoverTip.jsx'
import { useDelayedTip } from './TraitTip.jsx'
import Select from './Select.jsx'
import AdvantagePicker from './AdvantagePicker.jsx'
import { Modal, GhostButton, SectionTitle } from './primitives.jsx'
import { getCoterieAdvantageText, getCoterieRules, getCoterieTypeText } from '../rules/catalog.js'
import { readSingletonName } from '../schema/singletons.js'
import { COTERIE_TYPES } from '../rules/coterie-types.js'
import { COTERIE_ADVANTAGES } from '../rules/coterie-advantages.js'
import { addFeature, readAdvantageMeta, setDetails, dotsRange } from '../schema/advantages.js'
import {
  COTERIE_BACKGROUNDS,
  applyGrants,
  changeCoterieType,
  choiceStatus,
  coterieFeatures,
  coterieOrigin,
  emptySelections,
  grantLabel,
  isSecretMember,
  readCoterieType,
  readExtra,
  readGrants,
  resolveGrants
} from '../schema/coterie.js'

const CUSTOM = '__custom__'
const NONE = ''

/* ------------------------------------------------------------ type dialog */

/**
 * What a coterie type grants, with its choices: "one of" as chips, a spread as
 * small steppers against the allowance, equal flaws as rows to fill in.
 */
function CoterieTypeDialog({ actor, type, onClose }) {
  const [selections, setSelections] = useState(() => emptySelections(type))
  const [busy, setBusy] = useState(false)
  const text = getCoterieTypeText(type.id)
  const status = choiceStatus(type, selections)
  const fixed = resolveGrants(type, emptySelections(type))

  const setAnswer = (index, patch) =>
    setSelections((current) => current.map((answer, i) => (i === index ? { ...answer, ...patch } : answer)))

  const apply = async () => {
    if (!status.ok || busy) return
    setBusy(true)
    try {
      await applyGrants(actor, type, resolveGrants(type, selections))
      onClose()
    } catch (error) {
      console.error('Blood Oracle | Applying the coterie type failed', error)
      ui.notifications.error('Blood Oracle: could not apply the coterie type. See the console.')
      setBusy(false)
    }
  }

  return (
    <Modal title={type.name} subtitle="Coterie type" wide onClose={onClose}>
      {text?.description ? <p className="bo-prose bo-lore-text">{text.description}</p> : null}

      <div className="bo-label" style={{ marginTop: '14px' }}>
        Grants
      </div>
      {fixed.length ? (
        <ul className="bo-grant-list">
          {fixed.map((grant, i) => (
            <li key={i} className={grant.kind === 'flaw' ? 'is-flaw' : undefined}>
              {grantLabel(grant)}
              {grant.kind === 'flaw' ? <span className="bo-grant-kind">flaw</span> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="bo-picker-note">No fixed grants — only the choices below.</p>
      )}
      <p className="bo-roll-note">Domain ratings rise to these values; higher ones stay as they are.</p>

      {(type.choices ?? []).map((choice, index) => {
        const answer = selections[index] ?? {}

        if (choice.kind === 'oneOf') {
          return (
            <div key={index} className="bo-grant-choice">
              <div className="bo-label">Choose one</div>
              <div className="bo-spec-chips">
                {choice.options.map((option, i) => (
                  <button
                    key={i}
                    type="button"
                    className={answer.pick === i ? 'bo-chip is-selected' : 'bo-chip'}
                    onClick={() => setAnswer(index, { pick: i })}
                  >
                    {grantLabel({ ...option, kind: 'merit' })}
                  </button>
                ))}
              </div>
            </div>
          )
        }

        if (choice.kind === 'spread') {
          return (
            <div key={index} className="bo-grant-choice">
              <div className="bo-label">
                Spread up to {choice.total} dots · {status.spent} used
              </div>
              <div className="bo-grant-spread">
                {choice.among.map((name) => (
                  <div key={name} className="bo-stat-row">
                    <div className="bo-stat-name">
                      <span className="bo-trait-name">{name}</span>
                    </div>
                    <DotTracker
                      value={answer.dots?.[name] ?? 0}
                      max={5}
                      onChange={(next) => setAnswer(index, { dots: { ...answer.dots, [name]: next } })}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        }

        if (choice.kind === 'flawsEqual') {
          const flaws = answer.flaws ?? []
          const setFlaws = (next) => setAnswer(index, { flaws: next })
          return (
            <div key={index} className="bo-grant-choice">
              <div className="bo-label">Flaws worth as many dots · {status.spent} needed</div>
              {flaws.map((flaw, i) => (
                <div key={i} className="bo-grant-flaw">
                  <input
                    type="text"
                    className="bo-field"
                    value={flaw.name}
                    placeholder="Flaw — Enemy, Suspect, Haunted…"
                    onChange={(event) => setFlaws(flaws.map((f, j) => (j === i ? { ...f, name: event.target.value } : f)))}
                  />
                  <DotTracker
                    value={flaw.dots}
                    max={5}
                    onChange={(next) => setFlaws(flaws.map((f, j) => (j === i ? { ...f, dots: next } : f)))}
                  />
                  <button type="button" className="bo-mini" title="Remove" onClick={() => setFlaws(flaws.filter((_, j) => j !== i))}>
                    ×
                  </button>
                </div>
              ))}
              <GhostButton onClick={() => setFlaws([...flaws, { name: '', dots: 1 }])}>+ Flaw</GhostButton>
            </div>
          )
        }
        return null
      })}

      {!status.ok ? (
        <ul className="bo-grant-problems">
          {status.problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      ) : null}

      <div className="bo-grant-footer">
        <GhostButton onClick={onClose}>Not now</GhostButton>
        <GhostButton tone="accent" disabled={!status.ok || busy} onClick={apply}>
          Apply
        </GhostButton>
      </div>
    </Modal>
  )
}

/* ------------------------------------------------------------ type section */

/**
 * The coterie type: a dropdown, the type's description and possible extras,
 * and — when the type's grants are not on the sheet — a button to apply them.
 * Clicking an extra opens the picker on it.
 */
export function CoterieTypeSection({ actor, editable, onPickExtra }) {
  const [dialog, setDialog] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const current = readCoterieType(actor)
  const journal = readGrants(actor)
  const type = current?.entry ?? null
  const text = type ? getCoterieTypeText(type.id) : null

  const value = type ? type.id : current?.custom !== undefined ? CUSTOM : NONE
  const options = [
    { value: NONE, label: '—' },
    ...COTERIE_TYPES.map((entry) => ({ value: entry.id, label: entry.name })),
    { value: CUSTOM, label: 'Custom…' }
  ]

  // Like the predator type, choosing is a deliberate act, so the padlock —
  // which guards dots against stray clicks — does not stand in its way.
  const choose = async (next) => {
    const target = next === NONE ? null : next === CUSTOM ? { custom: current?.custom ?? '' } : { id: next }
    const opened = await changeCoterieType(actor, target)
    if (opened) setDialog(opened)
  }

  const applied = type && journal?.id === type.id

  return (
    <div className="bo-coterie-type">
      <div className="bo-row" style={{ alignItems: 'center', gap: '10px' }}>
        <div className="bo-label" style={{ margin: 0 }}>
          Coterie type
        </div>
        <div style={{ flex: 1, maxWidth: '260px' }}>
          <Select value={value} disabled={!editable} searchable options={options} onChange={choose} />
        </div>
        {editable && type && !applied ? (
          <GhostButton tone="accent" onClick={() => setDialog(type)}>
            Apply grants
          </GhostButton>
        ) : null}
      </div>

      {current?.custom !== undefined && !type ? (
        <input
          type="text"
          className="bo-field"
          style={{ marginTop: '8px' }}
          defaultValue={current.custom}
          disabled={!editable}
          placeholder="Name your own kind of coterie"
          onBlur={(event) => changeCoterieType(actor, { custom: event.target.value.trim() })}
          key={current.custom}
        />
      ) : null}

      {type ? (
        <div className="bo-coterie-type-body">
          {text?.description ? (
            <p
              className={expanded ? 'bo-prose bo-lore-text' : 'bo-prose bo-lore-text is-clamped'}
              onClick={() => setExpanded(!expanded)}
              title={expanded ? 'Click to shorten' : 'Click to read all'}
              style={{ cursor: 'pointer' }}
            >
              {text.description}
            </p>
          ) : null}
          {applied ? (
            <p className="bo-roll-note">
              Granted: {journal.entries.map((entry) => entry.label).join(', ') || 'nothing new — the coterie already had it all'}
            </p>
          ) : null}
          {type.extras?.length ? (
            <div className="bo-coterie-extras">
              <span className="bo-chip-group">Possible extras</span>
              {type.extras.map((extra) => {
                const read = readExtra(extra)
                return read && editable ? (
                  <button key={extra} type="button" className="bo-chip" onClick={() => onPickExtra(read)} title="Open the picker on it">
                    {extra}
                  </button>
                ) : (
                  <span key={extra} className="bo-chip is-static">
                    {extra}
                  </span>
                )
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {dialog ? <CoterieTypeDialog actor={actor} type={dialog} onClose={() => setDialog(null)} /> : null}
    </div>
  )
}

/* ------------------------------------------------------------- advantages */

/**
 * Coterie merits and flaws — the coterie's own, and the domain merits sorted
 * under Chasse, Lien and Portillon — in the shape the merit picker reads. A
 * domain merit names a kind of place, so it asks which one.
 */
function toPickerEntry(entry, group = entry.group) {
  const texts = getCoterieAdvantageText(entry.id)
  const text = texts?.description ?? ''
  const domain = ['Chasse', 'Lien', 'Portillon'].includes(entry.group)
  const lead = entry.resonance ? `Resonance: ${entry.resonance}.` : entry.clan ? `Clan: ${entry.clan}.` : ''
  return {
    kind: entry.kind,
    group,
    name: entry.name,
    dots: entry.dots,
    description: lead ? `${lead}${text ? `\n\n${text}` : ''}` : text,
    summary: texts?.summary ?? '',
    hasDetails: domain,
    detailsPlaceholder: domain ? 'Which place exactly' : ''
  }
}

/** The one-line summary of a coterie merit, found by the item's name. */
function summaryOf(name) {
  const needle = String(name ?? '').trim().toLowerCase()
  const entry = COTERIE_ADVANTAGES.find((candidate) => candidate.name.toLowerCase() === needle)
  return entry ? getCoterieAdvantageText(entry.id)?.summary ?? '' : ''
}

/** A name that shows its summary after the pointer rests on it, when it has one. */
function SummaryName({ name, className, onClick }) {
  const tip = useDelayedTip()
  const summary = summaryOf(name)
  const Tag = onClick ? 'button' : 'span'
  return (
    <>
      <Tag type={onClick ? 'button' : undefined} className={className} onClick={onClick} {...(summary ? tip.bind : {})}>
        {name}
      </Tag>
      {summary && tip.anchor ? (
        <HoverTip anchor={tip.anchor} title={name}>
          {summary}
        </HoverTip>
      ) : null}
    </>
  )
}

export function coterieEntries(kind) {
  return COTERIE_ADVANTAGES.filter((entry) => entry.kind === kind).map((entry) => toPickerEntry(entry))
}

/**
 * Clan coterie merits a character may buy for themselves: their own clan's,
 * or every clan's for a story character or one with no clan set.
 */
export function clanCoterieEntries(actor) {
  const clan = String(readSingletonName(actor, 'clan') ?? '').toLowerCase()
  return COTERIE_ADVANTAGES.filter(
    (entry) => entry.group === 'Clan' && (actor.type === 'spc' || !clan || clan.includes(entry.clanKey))
  ).map((entry) => toPickerEntry(entry, 'Clan coterie'))
}

function FeatureRow({ actor, item, editable, locked, open, onToggle }) {
  const meta = readAdvantageMeta(item)
  const range = dotsRange(meta.dots)
  const origin = coterieOrigin(actor, item.id)

  const remove = async () => {
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      classes: ['blood-oracle', 'bo-dialog'],
      window: { title: 'Remove advantage' },
      content: `<p>Remove <strong>${foundry.utils.escapeHTML(item.name)}</strong> from the coterie?</p>`
    })
    if (confirmed) await item.delete()
  }

  return (
    <div className={open ? 'bo-coterie-feature is-open' : 'bo-coterie-feature'}>
      <div className="bo-stat-row">
        <div className="bo-stat-name">
          <SummaryName
            name={item.name}
            className={open ? 'bo-trait-name is-selected' : 'bo-trait-name'}
            onClick={onToggle}
          />
          {meta.details ? <span className="bo-specialty">({meta.details})</span> : null}
          {origin ? (
            <span className="bo-origin" title={`Granted by the coterie type: ${origin}`}>
              type
            </span>
          ) : null}
        </div>
        <DotTracker
          value={item.system.points ?? 0}
          max={Math.min(Math.max(range.max, 1), 6)}
          min={range.min}
          disabled={!editable || range.fixed}
          locked={locked}
          onChange={(next) => item.update({ 'system.points': Math.max(range.min, Math.min(range.max, next)) })}
        />
        {editable ? (
          <button type="button" className="bo-mini" title="Remove" onClick={remove}>
            ×
          </button>
        ) : null}
      </div>
      {open ? (
        <div className="bo-coterie-feature-body">
          <label className="bo-field-label">
            <span>Details</span>
            <input
              type="text"
              className="bo-field"
              defaultValue={meta.details ?? ''}
              disabled={!editable}
              placeholder={meta.detailsPlaceholder || 'Who, where, what exactly…'}
              onBlur={(event) => setDetails(item, event.target.value)}
              key={meta.details ?? ''}
            />
          </label>
          {item.system.description ? <p className="bo-prose">{item.system.description}</p> : null}
        </div>
      ) : null}
    </div>
  )
}

/**
 * What the coterie holds in common: backgrounds and flaws, from the corebook's
 * coterie list. Each member uses them as their own, but they belong to the
 * coterie and stay with it.
 */
export function CoterieAdvantages({ actor, editable, locked, picking, setPicking }) {
  const [openId, setOpenId] = useState(null)
  const [readingRules, setReadingRules] = useState(false)
  const rules = getCoterieRules()
  const { backgrounds, flaws } = coterieFeatures(actor)
  const extraMerits = useMemo(() => coterieEntries('merit'), [])
  const extraFlaws = useMemo(() => coterieEntries('flaw'), [])

  const pick = async (entry) => {
    const created = await addFeature(actor, { entry })
    setPicking(null)
    if (created) setOpenId(created.id)
  }

  const custom = async (featuretype) => {
    const created = await addFeature(actor, { featuretype })
    if (created) setOpenId(created.id)
  }

  const list = (items, empty) =>
    items.length ? (
      <div style={{ display: 'grid', gap: '4px' }}>
        {items.map((item) => (
          <FeatureRow
            key={item.id}
            actor={actor}
            item={item}
            editable={editable}
            locked={locked}
            open={openId === item.id}
            onToggle={() => setOpenId(openId === item.id ? null : item.id)}
          />
        ))}
      </div>
    ) : (
      <p className="bo-empty" style={{ textAlign: 'left', padding: '4px 0' }}>
        {empty}
      </p>
    )

  const header = (label, kind, featuretype) => (
    <div className="bo-row" style={{ marginBottom: '8px' }}>
      <div className="bo-label" style={{ margin: 0 }}>
        {label}
      </div>
      {editable ? (
        <div style={{ display: 'flex', gap: '6px' }}>
          {/* Coterie merits ship with the module, so the picker always has
              something to offer, reference or not. */}
          <GhostButton tone="accent" onClick={() => setPicking({ kind, query: '' })}>
            + Add
          </GhostButton>
          <GhostButton onClick={() => custom(featuretype)}>Custom</GhostButton>
        </div>
      ) : null}
    </div>
  )

  return (
    <div>
      <SectionTitle
        info="Backgrounds the coterie holds together. Every member uses them as their own, but they belong to the coterie: a character who leaves it cannot take them along. A shared Herd is still one Herd."
        actions={
          // The rulebook's own wording, when the private coterie file has it.
          rules.length ? <GhostButton onClick={() => setReadingRules(true)}>Rules</GhostButton> : null
        }
      >
        Coterie advantages
      </SectionTitle>

      {readingRules && rules.length ? (
        <Modal title="Coterie advantages" subtitle="Rules reference" wide onClose={() => setReadingRules(false)}>
          {rules.map((note) => (
            <section key={note.title} className="bo-lore-rule">
              <h4>{note.title}</h4>
              <p className="bo-prose bo-lore-text">{note.text}</p>
            </section>
          ))}
        </Modal>
      ) : null}

      <div className="bo-coterie-advantages">
        <div>
          {header('Backgrounds & merits', 'merit', 'background')}
          {list(backgrounds, 'Nothing held in common yet.')}
        </div>
        <div>
          {header('Flaws', 'flaw', 'flaw')}
          {list(flaws, 'Nothing weighs on them yet.')}
        </div>
      </div>

      {picking ? (
        <AdvantagePicker
          actor={actor}
          kind={picking.kind}
          sectionType={picking.kind === 'flaw' ? 'flaw' : 'background'}
          backgroundsOnly
          only={picking.kind === 'flaw' ? null : COTERIE_BACKGROUNDS}
          extraEntries={picking.kind === 'flaw' ? extraFlaws : extraMerits}
          initialQuery={picking.query}
          title={picking.kind === 'flaw' ? 'Choose a coterie flaw' : 'Choose a coterie background or merit'}
          onPick={pick}
          onClose={() => setPicking(null)}
        />
      ) : null}
    </div>
  )
}

/* -------------------------------------------------------- member's view */

/**
 * On a member's own sheet: what their coterie holds, read-only, so a player
 * sees what they can call on. It follows membership, so leaving the coterie
 * takes it away.
 */
export function SharedFromCoterie({ group, actor }) {
  if (!group) return null
  if (actor && isSecretMember(group, actor)) {
    return (
      <div className="bo-shared-coterie">
        <div className="bo-label" style={{ margin: 0 }}>
          Secret member of {group.name}
        </div>
        <p className="bo-roll-note">The coterie’s advantages and domain are out of reach while the membership stays secret.</p>
      </div>
    )
  }
  const { backgrounds, flaws } = coterieFeatures(group)
  if (!backgrounds.length && !flaws.length) return null

  const row = (item) => {
    const meta = readAdvantageMeta(item)
    const points = Number(item.system.points) || 0
    return (
      <div key={item.id} className="bo-stat-row is-shared">
        <div className="bo-stat-name">
          <SummaryName name={item.name} className="bo-trait-name" />
          {meta.details ? <span className="bo-specialty">({meta.details})</span> : null}
        </div>
        <span className="bo-shared-dots">{'●'.repeat(points)}</span>
      </div>
    )
  }

  return (
    <div className="bo-shared-coterie">
      <div className="bo-row" style={{ marginBottom: '8px' }}>
        <div className="bo-label" style={{ margin: 0 }}>
          Shared through {group.name}
        </div>
        {group.testUserPermission(game.user, 'LIMITED') ? (
          <GhostButton onClick={() => group.sheet?.render(true)}>Open</GhostButton>
        ) : null}
      </div>
      <div style={{ display: 'grid', gap: '2px' }}>
        {backgrounds.map(row)}
        {flaws.length ? <div className="bo-shared-sub">Flaws</div> : null}
        {flaws.map(row)}
      </div>
    </div>
  )
}
