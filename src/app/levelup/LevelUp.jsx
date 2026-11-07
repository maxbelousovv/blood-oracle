import { useState } from 'react'
import { GhostButton } from '../components/primitives.jsx'
import DotTracker from '../components/DotTracker.jsx'
import Select from '../components/Select.jsx'
import AdvantagePicker from '../components/AdvantagePicker.jsx'
import LoresheetPicker from '../components/LoresheetPicker.jsx'
import { PowerChooser } from '../chargen/Chargen.jsx'
import { coterieEntries } from '../components/Coterie.jsx'
import { getAttributeGroups, getSkillGroups, readTrait } from '../traits.js'
import { entriesForDiscipline, isLoaded } from '../rules/catalog.js'
import { disciplineLabel } from '../schema/disciplines.js'
import { dotsRange, readAdvantageMeta } from '../schema/advantages.js'
import { experienceTotals } from '../schema/journal.js'
import { COTERIE_BACKGROUNDS, coterieFeatures, groupOf } from '../schema/coterie.js'
import { LORESHEET_BY_ID } from '../schema/loresheets.js'
import { COST_TABLE, SPECIALTY_COST, clanOf, disciplineMultiplier, stepCost } from './costs.js'
import {
  applyPlan,
  disciplineValue,
  emptyPlan,
  featureMax,
  ownedPowerNames,
  planLines,
  planProblem,
  planTotal,
  potencyCap,
  raisableFeatures,
  skillTarget,
  specialtyCount
} from './plan.js'

const CORE_DISCIPLINES = ['animalism', 'auspex', 'celerity', 'dominate', 'fortitude', 'obfuscate', 'oblivion', 'potence', 'presence', 'protean', 'sorcery']
const uid = () => foundry.utils.randomID(8)

/**
 * One rating to raise: what it is, what it will be, and what that costs. The
 * current dots are gold, the ones being bought glow red. It never goes below
 * what the character already has — spending is not undoing.
 */
function Stepper({ label, from, to, max, cost, onChange, note }) {
  const target = Math.max(from, to ?? from)
  return (
    <div className={target > from ? 'bo-lu-row is-raised' : 'bo-lu-row'}>
      <span className="bo-lu-name">
        {label}
        {note ? <span className="bo-lu-note">{note}</span> : null}
      </span>
      <span className="bo-lu-dots">
        {Array.from({ length: max }).map((_, i) => (
          <span key={i} className={i < from ? 'is-have' : i < target ? 'is-new' : ''} />
        ))}
      </span>
      <button type="button" className="bo-lu-step" disabled={target <= from} onClick={() => onChange(target - 1)}>
        −
      </button>
      <button type="button" className="bo-lu-step" disabled={target >= max} onClick={() => onChange(target + 1)}>
        +
      </button>
      <span className="bo-lu-cost">{cost ? `${cost} XP` : ''}</span>
    </div>
  )
}

function Section({ title, sub, children, actions }) {
  return (
    <section className="bo-lu-section">
      <div className="bo-lu-section-head">
        <h3>{title}</h3>
        {actions}
      </div>
      {sub ? <p className="bo-lu-sub">{sub}</p> : null}
      {children}
    </section>
  )
}

/** Rituals, ceremonies or formulas: any number, each costing its level × 3. */
function LeveledPicks({ disciplineKey, cap, owned, chosen, onChange }) {
  const entries = entriesForDiscipline(disciplineKey).filter((entry) => entry.level <= cap && !owned.includes(entry.name))
  if (!entries.length) return <p className="bo-lu-sub">Nothing left to learn at this level.</p>
  return (
    <div className="bo-cg-powers">
      {entries.map((entry) => {
        const selected = chosen.includes(entry.name)
        return (
          <button
            key={entry.name}
            type="button"
            className={selected ? 'bo-cg-power is-selected' : 'bo-cg-power'}
            onClick={() => onChange(selected ? chosen.filter((name) => name !== entry.name) : [...chosen, entry.name])}
          >
            <span className="bo-cg-power-head">
              <span className="bo-cg-card-name">{entry.name}</span>
              <span className="bo-cg-power-level">{entry.level * 3} XP</span>
            </span>
            <span className="bo-cg-card-text">{entry.effect}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function LevelUp({ actor, onClose }) {
  const [plan, setPlanState] = useState(emptyPlan)
  const [picking, setPicking] = useState(null)
  const [busy, setBusy] = useState(false)

  const setPlan = (patch) => setPlanState((current) => ({ ...current, ...(typeof patch === 'function' ? patch(current) : patch) }))

  const { remaining } = experienceTotals(actor)
  const lines = planLines(actor, plan)
  const total = planTotal(lines)
  const left = remaining - total
  const problem = planProblem(actor, plan)
  const clan = clanOf(actor)
  const group = groupOf(actor)
  const isCoterie = group && (group.system.groupType || 'coterie') === 'coterie'

  const confirm = async () => {
    if (!lines.length || problem || busy) return
    const escape = foundry.utils.escapeHTML
    const list = lines.map((line) => `<li>${escape(line.label)}${line.cost ? ` — ${line.cost} XP` : ''}</li>`).join('')
    const ok = await foundry.applications.api.DialogV2.confirm({
      classes: ['blood-oracle', 'bo-dialog'],
      window: { title: 'Spend experience' },
      content:
        `<ul>${list}</ul><p><strong>${total} XP</strong> in all; ${left} left afterwards.</p>` +
        (left < 0 ? `<p class="bo-dialog-warning">This is ${-left} XP more than the character has. Spend it anyway?</p>` : '<p>Spend it?</p>')
    })
    if (!ok) return
    setBusy(true)
    try {
      await applyPlan(actor, plan)
      ui.notifications.info(`${actor.name} spent ${total} XP.`)
      onClose()
    } catch (error) {
      console.error('Blood Oracle | Spending experience failed', error)
      ui.notifications.error('Blood Oracle: could not apply the purchase. See the console.')
      setBusy(false)
    }
  }

  /* --------------------------------------------------------- sections */

  const traitColumns = (groups, field, multiplier, max) => (
    <div className="bo-lu-columns">
      {groups.map((group) => (
        <div key={group.type}>
          <div className="bo-label">{group.label}</div>
          {group.entries.map((entry) => {
            const from = readTrait(actor, entry.path)
            const to = plan[field][entry.id] ?? from
            return (
              <Stepper
                key={entry.id}
                label={entry.label}
                from={from}
                to={to}
                max={max}
                cost={stepCost(from, to, multiplier)}
                onChange={(next) => setPlan((current) => ({ [field]: { ...current[field], [entry.id]: next } }))}
              />
            )
          })}
        </div>
      ))}
    </div>
  )

  const skills = getSkillGroups().flatMap((group) => group.entries)
  const specialtySkills = skills.filter((entry) => {
    const dots = skillTarget(actor, plan, entry)
    return dots > 0 && specialtyCount(actor, plan, entry.id) < dots
  })

  const disciplineKeys = [...CORE_DISCIPLINES, ...(clan?.name === 'Thin-blood' || disciplineValue(actor, 'alchemy') ? ['alchemy'] : [])]
  const target = (key) => plan.disciplines[key] ?? disciplineValue(actor, key)

  const addFeaturePick = (entry, into) => {
    const range = dotsRange(entry.dots)
    const pick = { uid: uid(), entry, dots: Math.max(range.min, 1) }
    if (into === 'coterie') setPlan((current) => ({ coterie: { ...current.coterie, newFeatures: [...current.coterie.newFeatures, pick] } }))
    else setPlan((current) => ({ newFeatures: [...current.newFeatures, pick] }))
    setPicking(null)
  }

  const newFeatureRows = (picks, into) =>
    picks.map((pick) => {
      const range = dotsRange(pick.entry.dots)
      const setDots = (dots) =>
        into === 'coterie'
          ? setPlan((current) => ({ coterie: { ...current.coterie, newFeatures: current.coterie.newFeatures.map((p) => (p.uid === pick.uid ? { ...p, dots } : p)) } }))
          : setPlan((current) => ({ newFeatures: current.newFeatures.map((p) => (p.uid === pick.uid ? { ...p, dots } : p)) }))
      const remove = () =>
        into === 'coterie'
          ? setPlan((current) => ({ coterie: { ...current.coterie, newFeatures: current.coterie.newFeatures.filter((p) => p.uid !== pick.uid) } }))
          : setPlan((current) => ({ newFeatures: current.newFeatures.filter((p) => p.uid !== pick.uid) }))
      return (
        <div key={pick.uid} className="bo-cg-adv">
          <span className="bo-cg-adv-name">
            {pick.entry.name}
            <span className="bo-cg-adv-group">new · {pick.entry.group}</span>
          </span>
          <DotTracker
            value={pick.dots}
            min={Math.max(range.min, 1)}
            max={Math.min(Math.max(range.max, 1), 5)}
            onChange={setDots}
          />
          <span className="bo-lu-cost">{pick.dots * 3} XP</span>
          <button type="button" className="bo-mini" title="Remove" onClick={remove}>
            ×
          </button>
        </div>
      )
    })

  const sorcery = target('sorcery')
  const oblivion = target('oblivion')
  const alchemy = target('alchemy')
  const potencyNow = Number(actor.system.blood?.potency) || 0

  return (
    <div className="bo-levelup">
      <div className="bo-lu-main">
        <Section title="Attributes" sub="New level × 5 for each level gained.">
          {traitColumns(getAttributeGroups(), 'attributes', 5, 5)}
        </Section>

        <Section title="Skills" sub="New level × 3 for each level gained.">
          {traitColumns(getSkillGroups(), 'skills', 3, 5)}
        </Section>

        <Section
          title="Specialties"
          sub="3 XP each. A skill holds no more specialties than it has dots."
          actions={
            <GhostButton
              tone="accent"
              disabled={!specialtySkills.length}
              onClick={() => setPlan((current) => ({ specialties: [...current.specialties, { uid: uid(), skill: '', text: '' }] }))}
            >
              + Specialty
            </GhostButton>
          }
        >
          {plan.specialties.map((entry) => {
            const choices = skills.filter(
              (skill) => skill.id === entry.skill || specialtySkills.some((open) => open.id === skill.id)
            )
            const set = (patch) =>
              setPlan((current) => ({ specialties: current.specialties.map((s) => (s.uid === entry.uid ? { ...s, ...patch } : s)) }))
            return (
              <div key={entry.uid} className="bo-cg-row">
                <div style={{ width: '220px', flex: 'none' }}>
                  <Select
                    value={entry.skill}
                    options={[{ value: '', label: 'Choose a skill…' }, ...choices.map((skill) => ({ value: skill.id, label: skill.label }))]}
                    onChange={(value) => set({ skill: value })}
                  />
                </div>
                <input type="text" className="bo-field" value={entry.text} placeholder="e.g. Knife fighting" onChange={(event) => set({ text: event.target.value })} />
                <span className="bo-lu-cost">{SPECIALTY_COST} XP</span>
                <button
                  type="button"
                  className="bo-mini"
                  title="Remove"
                  onClick={() => setPlan((current) => ({ specialties: current.specialties.filter((s) => s.uid !== entry.uid) }))}
                >
                  ×
                </button>
              </div>
            )
          })}
        </Section>

        <Section
          title="Disciplines"
          sub={
            clan?.name === 'Caitiff'
              ? 'New level × 6 for every discipline. One power for every new dot.'
              : 'New level × 5 in clan, × 7 otherwise. One power for every new dot.'
          }
        >
          {disciplineKeys.map((key) => {
            const from = disciplineValue(actor, key)
            const to = target(key)
            const multiplier = disciplineMultiplier(actor, key)
            const need = Math.max(0, to - from)
            return (
              <div key={key}>
                <Stepper
                  label={disciplineLabel(key)}
                  note={multiplier === 5 ? 'in clan' : multiplier === 6 ? 'Caitiff' : null}
                  from={from}
                  to={to}
                  max={5}
                  cost={stepCost(from, to, multiplier)}
                  onChange={(next) =>
                    setPlan((current) => ({
                      disciplines: { ...current.disciplines, [key]: next },
                      powers: { ...current.powers, [key]: (current.powers[key] ?? []).slice(0, Math.max(0, next - from)) }
                    }))
                  }
                />
                {need && key !== 'alchemy' ? (
                  <div className="bo-lu-powers">
                    <div className="bo-label">
                      {disciplineLabel(key)} · {(plan.powers[key] ?? []).length}/{need} new {need === 1 ? 'power' : 'powers'}
                    </div>
                    <PowerChooser
                      disciplineKey={key}
                      dots={to}
                      limit={need}
                      base={from}
                      owned={ownedPowerNames(actor, key)}
                      chosen={plan.powers[key] ?? []}
                      onChange={(names) => setPlan((current) => ({ powers: { ...current.powers, [key]: names } }))}
                    />
                  </div>
                ) : null}
              </div>
            )
          })}
        </Section>

        {isLoaded() && sorcery > 0 ? (
          <Section title="Blood Sorcery rituals" sub={`Ritual level × 3. Rituals up to level ${sorcery}.`}>
            <LeveledPicks
              disciplineKey="rituals"
              cap={sorcery}
              owned={ownedPowerNames(actor, 'rituals')}
              chosen={plan.rituals}
              onChange={(names) => setPlan({ rituals: names })}
            />
          </Section>
        ) : null}
        {isLoaded() && oblivion > 0 ? (
          <Section title="Oblivion ceremonies" sub={`Ceremony level × 3. Ceremonies up to level ${oblivion}.`}>
            <LeveledPicks
              disciplineKey="ceremonies"
              cap={oblivion}
              owned={ownedPowerNames(actor, 'ceremonies')}
              chosen={plan.ceremonies}
              onChange={(names) => setPlan({ ceremonies: names })}
            />
          </Section>
        ) : null}
        {isLoaded() && alchemy > 0 ? (
          <Section title="Thin-blood formulas" sub={`Formula level × 3. Formulas up to level ${alchemy}.`}>
            <LeveledPicks
              disciplineKey="alchemy"
              cap={alchemy}
              owned={ownedPowerNames(actor, 'alchemy')}
              chosen={plan.formulas}
              onChange={(names) => setPlan({ formulas: names })}
            />
          </Section>
        ) : null}

        <Section title="Blood Potency" sub={`New level × 10. At most ${potencyCap(actor)} for this generation.`}>
          <Stepper
            label="Blood Potency"
            from={potencyNow}
            to={plan.potency ?? potencyNow}
            max={Math.max(potencyCap(actor), potencyNow)}
            cost={stepCost(potencyNow, plan.potency ?? potencyNow, 10)}
            onChange={(next) => setPlan({ potency: next })}
          />
        </Section>

        <Section
          title="Advantages"
          sub="3 XP per dot. A loresheet level is bought on its own and costs its level × 3; it does not bring the levels below it."
          actions={
            <div style={{ display: 'flex', gap: '8px' }}>
              <GhostButton tone="accent" onClick={() => setPicking('background')}>
                + Background
              </GhostButton>
              <GhostButton tone="accent" onClick={() => setPicking('merit')}>
                + Merit
              </GhostButton>
              <GhostButton tone="arcane" onClick={() => setPicking('loresheet')}>
                + Loresheet
              </GhostButton>
            </div>
          }
        >
          {raisableFeatures(actor).map((item) => {
            const from = Number(item.system.points) || 0
            const max = featureMax(item)
            if (max <= from) return null
            const to = plan.features[item.id] ?? from
            const meta = readAdvantageMeta(item)
            return (
              <Stepper
                key={item.id}
                label={item.name}
                note={meta.details || null}
                from={from}
                to={to}
                max={max}
                cost={(Math.max(to, from) - from) * 3}
                onChange={(next) => setPlan((current) => ({ features: { ...current.features, [item.id]: next } }))}
              />
            )
          })}
          {newFeatureRows(plan.newFeatures, 'self')}
          {plan.loresheets.map((pick) => {
            const entry = LORESHEET_BY_ID[pick.id]
            return (
              <div key={`${pick.id}-${pick.level}`} className="bo-cg-adv">
                <span className="bo-cg-adv-name">
                  {entry?.levels?.[pick.level - 1] ?? pick.id}
                  <span className="bo-cg-adv-group">new · Loresheet · {entry?.name}</span>
                </span>
                <span className="bo-cg-dots">{'●'.repeat(pick.level)}</span>
                <span className="bo-lu-cost">{pick.level * 3} XP</span>
                <button
                  type="button"
                  className="bo-mini"
                  title="Remove"
                  onClick={() => setPlan((current) => ({ loresheets: current.loresheets.filter((p) => !(p.id === pick.id && p.level === pick.level)) }))}
                >
                  ×
                </button>
              </div>
            )
          })}
        </Section>

        {isCoterie ? (
          <Section
            title={`Coterie · ${group.name}`}
            sub="Put your own experience into what the coterie holds: 3 XP per dot of domain or coterie advantage."
            actions={
              group.isOwner ? (
                <GhostButton tone="accent" onClick={() => setPicking('coterie')}>
                  + Coterie advantage
                </GhostButton>
              ) : null
            }
          >
            {!group.isOwner ? (
              <p className="bo-lu-sub">
                You cannot change {group.name}: ask the Storyteller to give you ownership of the coterie, or to buy it for you.
              </p>
            ) : (
              <>
                {['chasse', 'lien', 'portillon'].map((key) => {
                  const from = Number(group.system?.[key]?.value) || 0
                  const to = plan.coterie.domain[key] ?? from
                  return (
                    <Stepper
                      key={key}
                      label={key.charAt(0).toUpperCase() + key.slice(1)}
                      from={from}
                      to={to}
                      max={5}
                      cost={(Math.max(to, from) - from) * 3}
                      onChange={(next) => setPlan((current) => ({ coterie: { ...current.coterie, domain: { ...current.coterie.domain, [key]: next } } }))}
                    />
                  )
                })}
                {coterieFeatures(group).backgrounds.map((item) => {
                  const from = Number(item.system.points) || 0
                  const max = featureMax(item)
                  if (max <= from) return null
                  const to = plan.coterie.features[item.id] ?? from
                  return (
                    <Stepper
                      key={item.id}
                      label={item.name}
                      from={from}
                      to={to}
                      max={max}
                      cost={(Math.max(to, from) - from) * 3}
                      onChange={(next) => setPlan((current) => ({ coterie: { ...current.coterie, features: { ...current.coterie.features, [item.id]: next } } }))}
                    />
                  )
                })}
                {newFeatureRows(plan.coterie.newFeatures, 'coterie')}
              </>
            )}
          </Section>
        ) : null}
      </div>

      <aside className="bo-lu-side">
        <div className="bo-lu-totals">
          <div>
            <span>Available</span>
            <b>{remaining}</b>
          </div>
          <div>
            <span>Spending</span>
            <b>{total}</b>
          </div>
          <div className={left < 0 ? 'is-over' : ''}>
            <span>Left</span>
            <b>{left}</b>
          </div>
        </div>

        <div className="bo-lu-lines">
          {lines.length ? (
            lines.map((line, i) => (
              <div key={i} className="bo-lu-line">
                <span>{line.label}</span>
                <span>{line.cost ? line.cost : ''}</span>
              </div>
            ))
          ) : (
            <p className="bo-lu-sub">Raise something on the left to see what it costs.</p>
          )}
        </div>

        <div className="bo-lu-actions">
          {problem ? <p className="bo-cg-problem">{problem}</p> : null}
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <button type="button" className="bo-solid" disabled={!lines.length || Boolean(problem) || busy} onClick={confirm}>
            {busy ? 'Spending…' : 'Spend'}
          </button>
        </div>

        <div className="bo-lu-table">
          <div className="bo-label">Experience costs</div>
          {COST_TABLE.map(([trait, cost]) => (
            <div key={trait} className="bo-lu-line">
              <span>{trait}</span>
              <span>{cost}</span>
            </div>
          ))}
        </div>
      </aside>

      {picking === 'loresheet' ? (
        <LoresheetPicker
          actor={actor}
          onTake={(entry, level) => {
            setPlan((current) => ({ loresheets: [...current.loresheets.filter((p) => !(p.id === entry.id && p.level === level)), { id: entry.id, level }] }))
            setPicking(null)
          }}
          onClose={() => setPicking(null)}
        />
      ) : picking === 'coterie' ? (
        <AdvantagePicker
          actor={group}
          kind="merit"
          sectionType="background"
          backgroundsOnly
          only={COTERIE_BACKGROUNDS}
          extraEntries={coterieEntries('merit')}
          title="Choose a coterie background or merit"
          onPick={(entry) => addFeaturePick(entry, 'coterie')}
          onClose={() => setPicking(null)}
        />
      ) : picking ? (
        <AdvantagePicker
          actor={actor}
          kind="merit"
          sectionType={picking === 'background' ? 'background' : 'merit'}
          backgroundsOnly={picking === 'background'}
          onPick={(entry) => addFeaturePick(entry, 'self')}
          onClose={() => setPicking(null)}
        />
      ) : null}
    </div>
  )
}
