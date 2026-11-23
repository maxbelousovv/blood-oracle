import { garouTouchstones } from '../schema/garou-touchstones.js'
import { birthForm } from '../schema/werewolf.js'
import GarouAdvantagePicker from '../components/GarouAdvantagePicker.jsx'
import { GarouBasics, GarouIdentity, GarouPowers, GarouSummary } from './GarouSteps.jsx'
import { GAROU_ALLOWANCE, GAROU_STEPS, finishGarou, garouStepProblem } from './garou.js'
import PowerSelection from '../components/PowerSelection.jsx'
import { hunterTouchstones } from '../schema/touchstones.js'
import { HunterBasics, HunterDrive, HunterEdges, HunterSummary } from './HunterSteps.jsx'
import { HUNTER_ALLOWANCE, HUNTER_STEPS, finishHunter, hunterStepProblem } from './hunter.js'
import { useMemo, useRef, useState } from 'react'
import { GhostButton } from '../components/primitives.jsx'
import DotTracker from '../components/DotTracker.jsx'
import Select from '../components/Select.jsx'
import AdvantagePicker from '../components/AdvantagePicker.jsx'
import LoresheetPicker from '../components/LoresheetPicker.jsx'
import { ChooseBlock, SpreadBlock } from '../components/PredatorGrantsDialog.jsx'
import { clanCoterieEntries } from '../components/Coterie.jsx'
import { getAttributeGroups, getSkillGroups } from '../traits.js'
import { CLANS, ALL_CLAN_DISCIPLINES } from '../rules/clans.js'
import { PREDATORS } from '../rules/predators.js'
import { advantagesOfKind, entriesForDiscipline, isLoaded } from '../rules/catalog.js'
import { disciplineLabel } from '../schema/disciplines.js'
import { dotsRange, featureTypeFor } from '../schema/advantages.js'
import { LORESHEET_BY_ID } from '../schema/loresheets.js'
import { emptySelections, grantLabel, restrictionWarnings } from '../schema/predator-grants.js'
import {
  ATTRIBUTE_REST,
  ATTRIBUTE_TIERS,
  MAX_PRINCIPLES,
  REQUIRED_SPECIALTY_SKILLS,
  SKILL_DISTRIBUTIONS,
  generationLabel,
  generationOptions,
  isCaitiff,
  isThinBlood,
  powersFitDots,
  tierWord
} from './rules.js'
import {
  STEPS,
  advantageAllowance,
  advantageSpend,
  attributeValue,
  clanDisciplines,
  disciplineDots,
  emptyDraft,
  generationOf,
  openTier,
  predatorDiscipline,
  predatorOf,
  predatorSelections,
  skillTiers,
  stepProblem
} from './draft.js'
import { finishCharacter, readDraft, saveDraft } from './apply.js'

const DOTS = (n) => '●'.repeat(Math.max(0, n))
const pickId = () => foundry.utils.randomID(8)

/**
 * A stand-in actor for the pickers the wizard borrows from the sheet. They
 * read a clan, owned features and discipline ratings off an actor; until
 * Finish those live in the draft, so this presents the draft in that shape.
 */
function draftActor(actor, draft) {
  const items = []
  if (draft.clan) items.push({ type: 'clan', name: draft.clan })
  for (const pick of draft.advantages) {
    items.push({ type: 'feature', name: pick.entry.name, system: { featuretype: featureTypeFor(pick.entry) } })
  }
  const disciplines = Object.fromEntries(Object.entries(disciplineDots(draft)).map(([key, value]) => [key, { value }]))
  return {
    id: actor.id,
    uuid: actor.uuid,
    type: actor.type,
    items,
    system: { blood: { potency: generationOf(draft).potency }, disciplines },
    getFlag: () => null
  }
}

/** Keep later choices consistent with an earlier one that changed. */
function prune(draft) {
  const next = { ...draft }
  const pool = clanDisciplines(next)
  if (!isThinBlood(next.clan)) {
    if (next.primary && !pool.includes(next.primary)) next.primary = null
    if (next.secondary && (!pool.includes(next.secondary) || next.secondary === next.primary)) next.secondary = null
  }
  const dots = disciplineDots(next)
  const powers = {}
  for (const [key, names] of Object.entries(next.powers ?? {})) {
    const limit = dots[key] ?? 0
    if (!limit) continue
    const allowed = entriesForDiscipline(key).filter((entry) => entry.level <= limit).map((entry) => entry.name)
    powers[key] = names.filter((name) => allowed.includes(name) || !isLoaded()).slice(0, limit)
  }
  next.powers = powers
  return next
}

/* ================================================================ wizard */

export default function Chargen({ actor, onClose }) {
  const hunter = actor.type === 'hunter'
  const garou = actor.type === 'werewolf'
  const steps = garou ? GAROU_STEPS : hunter ? HUNTER_STEPS : STEPS
  const [draft, setDraftState] = useState(() => {
    const base = emptyDraft(actor)
    const saved = readDraft(actor)
    if (garou) {
      const touchstones = garouTouchstones(actor).slice(0, 3).map((row) => row.touchstone)
      return {
        ...base,
        basics: { ...base.basics, concept: actor.system.headers?.concept, chronicle: actor.system.headers?.chronicle, portrait: actor.img },
        birthForm: birthForm(actor),
        touchstones: touchstones?.length ? touchstones : [''],
        auspice: '', tribe: '', otherRenown: '', garouPicks: {},
        ...saved
      }
    }
    if (!hunter) return { ...base, ...saved }
    const headers = actor.system.headers ?? {}
    const touchstones = hunterTouchstones(actor)
    const initialTouchstones = touchstones.length ? touchstones : [{ touchstone: '', portrait: '' }]
    return {
      ...base,
      basics: { ...base.basics, concept: headers.concept, ambition: headers.ambition, desire: headers.desire },
      creed: '',
      drive: '',
      touchstones: initialTouchstones.map((entry) => ({ ...entry, id: pickId() })),
      edges: [],
      perks: [],
      edgePools: {},
      ...saved
    }
  })
  const operation = useRef(false)
  const pendingSave = useRef(Promise.resolve())
  const [busy, setBusy] = useState(false)

  const setDraft = (patch) => setDraftState((current) => {
    const next = { ...current, ...(typeof patch === 'function' ? patch(current) : patch) }
    return hunter || garou ? next : prune(next)
  })

  const step = steps[draft.step]
  const last = draft.step === steps.length - 1
  const problemFor = (id) => garou ? garouStepProblem(draft, id) : hunter ? hunterStepProblem(actor, draft, id) : stepProblem(draft, id)
  const invalid = (hunter || garou) && last ? steps.find(({ id }) => problemFor(id)) : null
  const problem = invalid ? invalid.label + ' — ' + problemFor(invalid.id) : problemFor(step.id)

  const persist = (next) => {
    const save = pendingSave.current.then(() => saveDraft(actor, next))
    pendingSave.current = save.catch((error) => {
      console.error('Blood Oracle | Could not save the draft', error)
      ui.notifications.error('Blood Oracle: could not save the draft.')
    })
    return save
  }
  const saveAndClose = async () => {
    if (operation.current) return
    operation.current = true
    setBusy(true)
    try {
      await persist(draft)
      onClose()
    } catch {
      setBusy(false)
    } finally {
      operation.current = false
    }
  }

  const go = (index) => {
    if (operation.current || index > draft.reached || index === draft.step) return
    const next = { ...draft, step: index }
    setDraftState(next)
    void persist(next).catch(() => {})
  }

  const confirm = async () => {
    if (problem || operation.current) return
    if (!last) {
      const index = draft.step + 1
      const next = { ...draft, step: index, reached: Math.max(draft.reached, index) }
      setDraftState(next)
      void persist(next).catch(() => {})
      return
    }
    operation.current = true
    setBusy(true)
    try {
      const ok = await foundry.applications.api.DialogV2.confirm({
        classes: ['blood-oracle', 'bo-dialog', ...(hunter || garou ? ['bo-splat-' + actor.type] : [])],
        window: { title: 'Create the character' },
        content: '<p>Write everything to the sheet now? You can still change anything there afterwards.</p>'
      })
      if (!ok) return
      if (garou) {
        await persist(draft)
        await finishGarou(actor, draft)
      } else if (hunter) {
        await persist(draft)
        await finishHunter(actor, draft)
      } else {
        await pendingSave.current
        await finishCharacter(actor, draft)
      }
      ui.notifications.info(`${draft.basics.name || actor.name} is ready.`)
      onClose()
    } catch (error) {
      console.error('Blood Oracle | Character creation failed', error)
      ui.notifications.error('Blood Oracle: could not write the character. See the console.')
    } finally {
      operation.current = false
      setBusy(false)
    }
  }

  const back = () => {
    if (!draft.step || operation.current) return
    const next = { ...draft, step: draft.step - 1 }
    setDraftState(next)
    void persist(next).catch(() => {})
  }

  const shim = useMemo(() => draftActor(actor, draft), [actor, draft])
  const props = { draft, setDraft, shim, hunter, garou }

  return (
    <div className="bo-chargen">
      <aside className="bo-cg-side">
        <div className="bo-label">Create a character</div>
        <ol className="bo-cg-steps">
          {steps.map((entry, index) => {
            const skipped = entry.id === 'predator' && isThinBlood(draft.clan)
            // Steps before the furthest one reached have been confirmed.
            const done = index < draft.reached && index !== draft.step
            const state = index === draft.step ? 'is-current' : done ? 'is-done' : ''
            return (
              <li key={entry.id} className={`${state} ${index <= draft.reached ? 'is-reachable' : ''}`} onClick={() => go(index)}>
                <span className="bo-cg-mark">{done ? '✓' : index + 1}</span>
                <span>{entry.label}</span>
                {skipped ? <span className="bo-cg-skip">none</span> : null}
              </li>
            )
          })}
        </ol>
        {garou ? <GarouSummary draft={draft} /> : hunter ? <HunterSummary actor={actor} draft={draft} /> : <Summary draft={draft} />}
      </aside>

      <section className="bo-cg-main">
        <div className="bo-cg-body">
          {step.id === 'garou-basics' ? <GarouBasics {...props} /> : null}
          {step.id === 'garou-identity' ? <GarouIdentity {...props} /> : null}
          {step.id === 'garou-powers' ? <GarouPowers {...props} /> : null}
          {step.id === 'garou-review' ? <GarouSummary draft={draft} review /> : null}
          {step.id === 'hunter-basics' ? <HunterBasics {...props} /> : null}
          {step.id === 'hunter-drive' ? <HunterDrive {...props} /> : null}
          {step.id === 'hunter-edges' ? <HunterEdges actor={actor} {...props} /> : null}
          {step.id === 'hunter-review' ? <HunterSummary actor={actor} draft={draft} review /> : null}
          {step.id === 'clan' ? <StepClan {...props} /> : null}
          {step.id === 'attributes' ? <StepAttributes {...props} /> : null}
          {step.id === 'skills' ? <StepSkills {...props} /> : null}
          {step.id === 'specialties' ? <StepSpecialties {...props} /> : null}
          {step.id === 'generation' ? <StepGeneration {...props} /> : null}
          {step.id === 'predator' ? <StepPredator {...props} /> : null}
          {step.id === 'basics' ? <StepBasics {...props} /> : null}
          {step.id === 'disciplines' ? <StepDisciplines {...props} /> : null}
          {step.id === 'touchstones' ? <StepTouchstones {...props} /> : null}
          {step.id === 'merits' ? <StepMerits {...props} /> : null}
        </div>
        <footer className="bo-cg-foot">
          <span className="bo-cg-problem">{problem}</span>
          {hunter || garou ? <GhostButton disabled={busy} onClick={saveAndClose}>Save &amp; close</GhostButton> : null}
          <GhostButton disabled={!draft.step || busy} onClick={back}>
            Back
          </GhostButton>
          <button type="button" className="bo-solid" disabled={Boolean(problem) || busy} onClick={confirm}>
            {last ? (busy ? 'Writing…' : 'Finish') : 'Confirm'}
          </button>
        </footer>
      </section>
    </div>
  )
}

/* ============================================================== summary */

function Summary({ draft }) {
  const attributes = getAttributeGroups()
  const generation = generationOf(draft)
  const predator = predatorOf(draft)
  const dots = disciplineDots(draft)
  const rows = Math.max(...attributes.map((group) => group.entries.length))

  return (
    <div className="bo-cg-summary">
      <div className="bo-label">So far</div>
      <div className="bo-cg-sum-line">
        <span>Clan</span>
        <b>{draft.clan ?? '—'}</b>
      </div>
      <div className="bo-cg-sum-line">
        <span>Generation</span>
        <b>{draft.reached > 4 ? `${generation.generation}th ${generation.stage}` : '—'}</b>
      </div>
      <div className="bo-cg-sum-line">
        <span>Predator</span>
        <b>{isThinBlood(draft.clan) ? 'none' : predator?.name ?? '—'}</b>
      </div>
      <div className="bo-cg-attrs">
        {Array.from({ length: rows }).map((_, row) =>
          attributes.map((group) => {
            const entry = group.entries[row]
            if (!entry) return <span key={`${group.type}-${row}`} />
            const value = attributeValue(draft, entry.id)
            return (
              <span key={entry.id} className="bo-cg-attr">
                <span>{entry.label.slice(0, 3)}</span>
                <span className="bo-cg-dots">{value ? DOTS(value) : '·'}</span>
              </span>
            )
          })
        )}
      </div>
      {Object.keys(dots).length ? (
        <div className="bo-cg-sum-block">
          {Object.entries(dots).map(([key, value]) => (
            <div key={key} className="bo-cg-sum-line">
              <span>{disciplineLabel(key)}</span>
              <span className="bo-cg-dots">{DOTS(value)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function Heading({ title, sub }) {
  return (
    <div className="bo-cg-heading">
      <h2>{title}</h2>
      {sub ? <p>{sub}</p> : null}
    </div>
  )
}

/* ================================================================= clan */

function StepClan({ draft, setDraft }) {
  const choose = (name) =>
    setDraft((current) => {
      const changedKind = isThinBlood(name) !== isThinBlood(current.clan)
      return {
        clan: name,
        primary: null,
        secondary: null,
        powers: {},
        caitiffDisciplines: [],
        thinMerits: [],
        thinFlaws: [],
        formula: null,
        generation: changedKind ? generationOptions(name)[0].id : current.generation
      }
    })

  return (
    <>
      <Heading title="Clan" sub="Your blood decides your gifts and your curse." />
      <div className="bo-cg-cards">
        {CLANS.map((clan) => (
          <button
            key={clan.name}
            type="button"
            className={draft.clan === clan.name ? 'bo-cg-card is-selected' : 'bo-cg-card'}
            onClick={() => choose(clan.name)}
          >
            <span className="bo-cg-card-name">{clan.name}</span>
            <span className="bo-cg-card-text">{clan.blurb}</span>
            <span className="bo-cg-card-chips">
              {clan.disciplines.length
                ? clan.disciplines.map((key) => (
                    <span key={key} className="bo-cg-chip">
                      {disciplineLabel(key)}
                    </span>
                  ))
                : (
                    <span className="bo-cg-chip is-muted">
                      {isCaitiff(clan.name) ? 'Any three disciplines' : 'Alchemy through a merit'}
                    </span>
                  )}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}

/* ========================================================== tier picking */

/**
 * Shared by attributes and skills: the tiers to fill, one after another, and
 * the traits in three columns. A click gives the trait the highlighted
 * rating; clicking a rated trait takes the rating back.
 */
function TierPicker({ groups, tiers, assigned, onAssign, onClear, restValue = null, restLabel = null }) {
  const current = openTier(tiers, assigned)

  return (
    <>
      <ol className="bo-cg-tiers">
        {tiers.map((tier, index) => {
          const used = Object.values(assigned).filter((value) => value === tier.value).length
          const state = index === current ? 'is-current' : used >= tier.count ? 'is-done' : ''
          return (
            <li key={index} className={state}>
              {tier.label ?? `${tier.count} ${tier.count === 1 ? 'skill' : 'skills'} you are ${tierWord(tier.value)} in`}
              <span className="bo-cg-tier-value">{DOTS(tier.value)}</span>
              <span className="bo-cg-tier-count">
                {Math.min(used, tier.count)}/{tier.count}
              </span>
            </li>
          )
        })}
        {restLabel ? <li className={current < 0 ? 'is-done' : ''}>{restLabel}</li> : null}
      </ol>

      <div className="bo-cg-columns">
        {groups.map((group) => (
          <div key={group.type}>
            <div className="bo-label">{group.label}</div>
            {group.entries.map((entry) => {
              const value = assigned[entry.id]
              const shown = value || (current < 0 && restValue ? restValue : 0)
              return (
                <button
                  key={entry.id}
                  type="button"
                  className={value ? 'bo-cg-trait is-set' : 'bo-cg-trait'}
                  disabled={!value && current < 0}
                  onClick={() => (value ? onClear(entry.id) : current >= 0 && onAssign(entry.id, tiers[current].value))}
                  title={value ? 'Click to take the rating back' : undefined}
                >
                  <span>{entry.label}</span>
                  <span className="bo-cg-dots">{shown ? DOTS(shown) : ''}</span>
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </>
  )
}

function StepAttributes({ draft, setDraft }) {
  return (
    <>
      <Heading title="Attributes" sub="Click an attribute to give it the highlighted rating; click it again to take it back." />
      <TierPicker
        groups={getAttributeGroups()}
        tiers={ATTRIBUTE_TIERS}
        assigned={draft.attributes}
        restValue={ATTRIBUTE_REST}
        restLabel={`The rest are ${DOTS(ATTRIBUTE_REST)}`}
        onAssign={(id, value) => setDraft((current) => ({ attributes: { ...current.attributes, [id]: value } }))}
        onClear={(id) =>
          setDraft((current) => {
            const attributes = { ...current.attributes }
            delete attributes[id]
            return { attributes }
          })
        }
      />
      <div style={{ marginTop: '14px' }}>
        <GhostButton onClick={() => setDraft({ attributes: {} })}>Reset</GhostButton>
      </div>
    </>
  )
}

function StepSkills({ draft, setDraft }) {
  return (
    <>
      <Heading title="Skills" sub="Pick how the character’s training is spread, then hand out the ratings." />
      <div className="bo-cg-options">
        {Object.entries(SKILL_DISTRIBUTIONS).map(([id, distribution]) => (
          <button
            key={id}
            type="button"
            className={draft.distribution === id ? 'bo-cg-option is-selected' : 'bo-cg-option'}
            onClick={() => draft.distribution !== id && setDraft({ distribution: id, skills: {} })}
          >
            <span className="bo-cg-card-name">{distribution.label}</span>
            <span className="bo-cg-card-text">{distribution.note}</span>
          </button>
        ))}
      </div>
      <TierPicker
        groups={getSkillGroups()}
        tiers={skillTiers(draft)}
        assigned={draft.skills}
        onAssign={(id, value) => setDraft((current) => ({ skills: { ...current.skills, [id]: value } }))}
        onClear={(id) =>
          setDraft((current) => {
            const skills = { ...current.skills }
            delete skills[id]
            return { skills }
          })
        }
      />
      <div style={{ marginTop: '14px' }}>
        <GhostButton onClick={() => setDraft({ skills: {} })}>Reset</GhostButton>
      </div>
    </>
  )
}

/* =========================================================== specialties */

function StepSpecialties({ draft, setDraft, hunter, garou }) {
  const skills = getSkillGroups().flatMap((group) => group.entries)
  const label = (id) => skills.find((entry) => entry.id === id)?.label ?? id
  const required = REQUIRED_SPECIALTY_SKILLS.filter((skill) => (draft.skills[skill] ?? 0) > 0)
  // A skill holds no more specialties than dots: a required one already
  // fills a one-dot skill.
  const rated = skills.filter((entry) => {
    const dots = draft.skills[entry.id] ?? 0
    const taken = REQUIRED_SPECIALTY_SKILLS.includes(entry.id) ? 1 : 0
    return dots - taken > 0 || ((hunter || garou) && entry.id === 'craft' && dots > 0)
  })

  const setRequired = (skill, text) =>
    setDraft((current) => ({ specialties: { ...current.specialties, required: { ...current.specialties.required, [skill]: text } } }))
  const setFree = (patch) =>
    setDraft((current) => ({ specialties: { ...current.specialties, free: { ...current.specialties.free, ...patch } } }))

  return (
    <>
      <Heading
        title="Specialties"
        sub="A specialty is a narrower field within a skill — Performance: Dancing, Academics: History. Some skills always need one."
      />

      {required.length ? (
        <div className="bo-cg-block">
          <div className="bo-label">Required</div>
          {required.map((skill) => (
            <label key={skill} className="bo-cg-row">
              <span className="bo-cg-row-label">{label(skill)}</span>
              <input
                type="text"
                className="bo-field"
                value={draft.specialties.required[skill] ?? ''}
                placeholder={{ academics: 'History', craft: 'Carpentry', performance: 'Dancing', science: 'Biology' }[skill]}
                onChange={(event) => setRequired(skill, event.target.value)}
              />
            </label>
          ))}
        </div>
      ) : null}

      <div className="bo-cg-block">
        <div className="bo-label">One of your choice</div>
        <div className="bo-cg-row">
          <div style={{ width: '240px', flex: 'none' }}>
            <Select
              value={draft.specialties.free.skill}
              options={[{ value: '', label: 'Choose a skill…' }, ...rated.map((entry) => ({ value: entry.id, label: entry.label }))]}
              onChange={(value) => setFree({ skill: value })}
            />
          </div>
          <input
            type="text"
            className="bo-field"
            value={draft.specialties.free.text}
            placeholder="e.g. Knife fighting"
            onChange={(event) => setFree({ text: event.target.value })}
          />
        </div>
      </div>
      {!hunter && !garou ? <p className="bo-cg-note">Your predator type may add another specialty on its own step.</p> : null}
    </>
  )
}

/* ============================================================ generation */

function StepGeneration({ draft, setDraft }) {
  const options = generationOptions(draft.clan)
  const chosen = generationOf(draft)
  const allowance = advantageAllowance(draft)

  return (
    <>
      <Heading
        title="Generation"
        sub={
          isThinBlood(draft.clan)
            ? 'Thin-bloods are always childer, of the 14th to the 16th generation.'
            : 'Agree on it with your Storyteller and coterie: everyone usually starts at the same stage.'
        }
      />
      <div className="bo-cg-block" style={{ maxWidth: '560px' }}>
        <Select
          value={chosen.id}
          options={options.map((option) => ({ value: option.id, label: generationLabel(option) }))}
          onChange={(value) => setDraft({ generation: value })}
        />
      </div>
      <div className="bo-cg-facts">
        <div>
          <span>Blood Potency</span>
          <b>{chosen.potency}</b>
        </div>
        <div>
          <span>Experience to spend later</span>
          <b>{chosen.xp || '—'}</b>
        </div>
        <div>
          <span>Advantage points</span>
          <b>{allowance.advantages}</b>
        </div>
        <div>
          <span>Flaw points</span>
          <b>{allowance.flaws}</b>
        </div>
        <div>
          <span>Starting Humanity</span>
          <b>{chosen.ancilla ? 6 : 7}</b>
        </div>
      </div>
      <p className="bo-cg-note">Experience goes onto the sheet unspent; spend it after creation.</p>
    </>
  )
}

/* ============================================================== predator */

function StepPredator({ draft, setDraft, shim }) {
  if (isThinBlood(draft.clan)) {
    return (
      <>
        <Heading title="Predator type" />
        <p className="bo-cg-note is-large">Thin-bloods have no predator type. Confirm to go on.</p>
      </>
    )
  }

  const predator = predatorOf(draft)
  const selections = predatorSelections(draft)
  const patch = (index, change) =>
    setDraft((current) => ({
      predatorSelections: predatorSelections(current).map((selection, i) => (i === index ? { ...selection, ...change } : selection))
    }))
  const disciplinesOf = (entry) =>
    entry.blocks
      .flatMap((block) => (block.type === 'fixed' ? [block.grant] : block.options ?? []))
      .filter((grant) => grant.kind === 'discipline')
      .map((grant) => grant.key)

  return (
    <>
      <Heading title="Predator type" sub="How the character hunts. It brings a specialty, a discipline dot and a few advantages." />
      <div className="bo-cg-cards is-compact">
        {Object.entries(PREDATORS).map(([id, entry]) => (
          <button
            key={id}
            type="button"
            className={draft.predator === id ? 'bo-cg-card is-selected' : 'bo-cg-card'}
            onClick={() => draft.predator !== id && setDraft({ predator: id, predatorSelections: emptySelections(entry) })}
          >
            <span className="bo-cg-card-name">{entry.name}</span>
            <span className="bo-cg-card-chips">
              {disciplinesOf(entry).map((key) => (
                <span key={key} className="bo-cg-chip">
                  {disciplineLabel(key)}
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>

      {predator ? (
        <div className="bo-cg-block bo-cg-predator">
          <div className="bo-label">{predator.name}</div>
          {restrictionWarnings(shim, predator).map((text) => (
            <p key={text} className="bo-grant-warning">
              {text}
            </p>
          ))}
          {predator.blocks.some((block) => block.type === 'fixed') ? (
            <ul className="bo-grant-fixed">
              {predator.blocks
                .filter((block) => block.type === 'fixed')
                .map((block, i) => (
                  <li key={i}>{grantLabel(block.grant)}</li>
                ))}
            </ul>
          ) : null}
          {predator.blocks.map((block, index) =>
            block.type === 'choose' ? (
              <ChooseBlock key={index} actor={shim} block={block} selection={selections[index]} onChange={(change) => patch(index, change)} />
            ) : block.type === 'spread' ? (
              <SpreadBlock key={index} block={block} selection={selections[index]} onChange={(change) => patch(index, change)} />
            ) : null
          )}
        </div>
      ) : null}
    </>
  )
}

/* ================================================================ basics */

function StepBasics({ draft, setDraft }) {
  const field = (key, label, placeholder, multiline = false) => (
    <label className="bo-field-label">
      <span>{label}</span>
      {multiline ? (
        <textarea
          className="bo-field"
          rows={5}
          value={draft.basics[key] ?? ''}
          placeholder={placeholder}
          onChange={(event) => setDraft((current) => ({ basics: { ...current.basics, [key]: event.target.value } }))}
        />
      ) : (
        <input
          type="text"
          className="bo-field"
          value={draft.basics[key] ?? ''}
          placeholder={placeholder}
          onChange={(event) => setDraft((current) => ({ basics: { ...current.basics, [key]: event.target.value } }))}
        />
      )}
    </label>
  )

  return (
    <>
      <Heading title="Basics" sub="Who they are, who made them, and what they want." />
      <div className="bo-cg-form">
        {field('name', 'Full name', 'Erika Mustermann')}
        {field('sire', 'Sire', 'The vampire who turned you')}
        {field('ambition', 'Long-term ambition', 'Break free from my sire’s clutches')}
        {field('desire', 'Short-term desire', 'Embarrass my rival at court')}
        {field('appearance', 'Description & appearance', 'A young musician in a black vegan-leather jacket…', true)}
      </div>
    </>
  )
}

/* =========================================================== disciplines */

/**
 * Powers of one discipline up to its dots, picked by clicking. `limit` is how
 * many may be picked (one per dot in creation, one per new dot when levelling
 * up); `owned` hides powers the character already has.
 */
export function PowerChooser({ disciplineKey, dots, chosen, onChange, limit = dots, owned = [], base = 0 }) {
  const all = entriesForDiscipline(disciplineKey)
  const entries = all.filter((entry) => entry.level <= dots && !owned.includes(entry.name))
  const levelOf = (name) => all.find((entry) => entry.name === name)?.level ?? 0
  const chosenLevels = chosen.map(levelOf)
  if (!isLoaded()) {
    return <p className="bo-cg-note">Powers come from the rules reference, which is not installed — add them on the sheet afterwards.</p>
  }

  return <PowerSelection entries={entries} chosen={chosen} onChange={onChange}
    blocks={(entry) => chosen.length >= limit || !powersFitDots([...chosenLevels, entry.level], base)} />
}

function StepDisciplines(props) {
  return isThinBlood(props.draft.clan) ? <ThinBloodGifts {...props} /> : <ClanDisciplines {...props} />
}

function ClanDisciplines({ draft, setDraft }) {
  const caitiff = isCaitiff(draft.clan)
  const pool = clanDisciplines(draft)
  const dots = disciplineDots(draft)
  const extra = predatorDiscipline(draft)

  const toggleCaitiff = (key) =>
    setDraft((current) => {
      const has = current.caitiffDisciplines.includes(key)
      if (!has && current.caitiffDisciplines.length >= 3) return {}
      return { caitiffDisciplines: has ? current.caitiffDisciplines.filter((entry) => entry !== key) : [...current.caitiffDisciplines, key] }
    })

  return (
    <>
      <Heading
        title="Disciplines"
        sub={`Two dots in one ${caitiff ? 'of your three' : 'clan'} discipline, one in another${extra ? `, and one more in ${disciplineLabel(extra)} from your predator type` : ''}. One power for every dot.`}
      />

      {caitiff ? (
        <div className="bo-cg-block">
          <div className="bo-label">Your three disciplines · {draft.caitiffDisciplines.length}/3</div>
          <div className="bo-cg-chiprow">
            {ALL_CLAN_DISCIPLINES.map((key) => (
              <button
                key={key}
                type="button"
                className={draft.caitiffDisciplines.includes(key) ? 'bo-chip is-selected' : 'bo-chip'}
                onClick={() => toggleCaitiff(key)}
              >
                {disciplineLabel(key)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {pool.length ? (
        <div className="bo-cg-block">
          <div className="bo-cg-pickrow">
            <span className="bo-cg-row-label">Two dots</span>
            {pool.map((key) => (
              <button
                key={key}
                type="button"
                className={draft.primary === key ? 'bo-chip is-selected' : 'bo-chip'}
                onClick={() => setDraft({ primary: key, secondary: draft.secondary === key ? null : draft.secondary })}
              >
                {disciplineLabel(key)}
              </button>
            ))}
          </div>
          <div className="bo-cg-pickrow">
            <span className="bo-cg-row-label">One dot</span>
            {pool.map((key) => (
              <button
                key={key}
                type="button"
                disabled={draft.primary === key}
                className={draft.secondary === key ? 'bo-chip is-selected' : 'bo-chip'}
                onClick={() => setDraft({ secondary: key })}
              >
                {disciplineLabel(key)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {Object.entries(dots).map(([key, count]) => {
        const chosen = draft.powers[key] ?? []
        return (
          <div key={key} className="bo-cg-block">
            <div className="bo-label">
              {disciplineLabel(key)} {DOTS(count)} · {chosen.length}/{count} powers
              {key === extra ? ' · includes the predator’s dot' : ''}
            </div>
            <PowerChooser
              disciplineKey={key}
              dots={count}
              chosen={chosen}
              onChange={(names) => setDraft((current) => ({ powers: { ...current.powers, [key]: names } }))}
            />
          </div>
        )
      })}
    </>
  )
}

function ThinBloodGifts({ draft, setDraft }) {
  const thin = (kind) => advantagesOfKind(kind).filter((entry) => entry.group === 'Thin-Blood')
  const merits = thin('merit')
  const flaws = thin('flaw')
  const alchemist = draft.thinMerits.includes('Thin-blood Alchemist')
  const formulas = entriesForDiscipline('alchemy').filter((entry) => entry.level <= 1)

  const toggle = (field, name) =>
    setDraft((current) => ({
      [field]: current[field].includes(name) ? current[field].filter((entry) => entry !== name) : [...current[field], name],
      ...(field === 'thinMerits' && name === 'Thin-blood Alchemist' ? { formula: null } : {})
    }))

  const column = (label, list, field) => (
    <div>
      <div className="bo-label">
        {label} · {draft[field].length}
      </div>
      <div className="bo-cg-thin">
        {list.map((entry) => (
          <button
            key={entry.name}
            type="button"
            className={draft[field].includes(entry.name) ? 'bo-cg-thin-item is-selected' : 'bo-cg-thin-item'}
            onClick={() => toggle(field, entry.name)}
          >
            <span className="bo-cg-card-name">{entry.name}</span>
            <span className="bo-cg-card-text">{entry.description}</span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <>
      <Heading
        title="Thin-blood gifts"
        sub="Thin-bloods have no clan disciplines. Their merits and flaws cost nothing: each flaw balances a merit, so take as many of one as of the other. Up to three pairs is usual."
      />
      {!isLoaded() ? (
        <p className="bo-cg-note">The thin-blood merits and flaws come from the rules reference, which is not installed.</p>
      ) : (
        <div className="bo-cg-two">
          {column('Thin-blood merits', merits, 'thinMerits')}
          {column('Thin-blood flaws', flaws, 'thinFlaws')}
        </div>
      )}
      {draft.thinMerits.length > 3 ? <p className="bo-cg-note">More than three pairs — check with your Storyteller.</p> : null}

      {alchemist && isLoaded() ? (
        <div className="bo-cg-block">
          <div className="bo-label">Thin-blood Alchemist · your first formula</div>
          <PowerSelection entries={formulas} chosen={draft.formula ? [draft.formula] : []}
            blocks={() => Boolean(draft.formula)}
            onChange={(chosen) => setDraft({ formula: chosen[0] ?? null })} />
        </div>
      ) : null}
    </>
  )
}

/* =========================================================== touchstones */

function StepTouchstones({ draft, setDraft }) {
  const set = (index, key, value) =>
    setDraft((current) => ({ principles: current.principles.map((entry, i) => (i === index ? { ...entry, [key]: value } : entry)) }))

  return (
    <>
      <Heading
        title="Touchstones & convictions"
        sub="Touchstones are the mortals who tie the character to their humanity; each holds a conviction. One to three is usual."
      />
      {draft.principles.map((entry, index) => (
        <div key={index} className="bo-cg-block bo-cg-principle">
          <label className="bo-field-label">
            <span>Touchstone</span>
            <input
              type="text"
              className="bo-field"
              value={entry.touchstone}
              placeholder="Mira Voss, an investigative journalist"
              onChange={(event) => set(index, 'touchstone', event.target.value)}
            />
          </label>
          <label className="bo-field-label">
            <span>Conviction</span>
            <input
              type="text"
              className="bo-field"
              value={entry.conviction}
              placeholder="Always tell the truth when it matters most"
              onChange={(event) => set(index, 'conviction', event.target.value)}
            />
          </label>
          <GhostButton onClick={() => setDraft((current) => ({ principles: current.principles.filter((_, i) => i !== index) }))}>
            Remove
          </GhostButton>
        </div>
      ))}
      {draft.principles.length < MAX_PRINCIPLES ? (
        <GhostButton
          tone="accent"
          onClick={() => setDraft((current) => ({ principles: [...current.principles, { touchstone: '', conviction: '' }] }))}
        >
          + Touchstone
        </GhostButton>
      ) : null}
    </>
  )
}

/* ================================================================ merits */

function StepMerits({ draft, setDraft, shim, hunter, garou }) {
  const [picking, setPicking] = useState(null) // 'background' | 'merit' | 'flaw' | 'loresheet'
  const allowance = garou ? GAROU_ALLOWANCE : hunter ? HUNTER_ALLOWANCE : advantageAllowance(draft)
  const spent = advantageSpend(draft)
  const caitiff = isCaitiff(draft.clan)
  // The Caitiff may not buy positive Status at creation.
  const statusNames = useMemo(() => (caitiff ? ['Status'] : null), [caitiff])

  const add = (entry) => {
    const range = dotsRange(entry.dots)
    setDraft((current) => ({ advantages: [...current.advantages, { uid: pickId(), entry, dots: range.min || 1 }] }))
    setPicking(null)
  }
  const setDots = (uid, dots) =>
    setDraft((current) => ({ advantages: current.advantages.map((pick) => (pick.uid === uid ? { ...pick, dots } : pick)) }))
  const remove = (uid) => setDraft((current) => ({ advantages: current.advantages.filter((pick) => pick.uid !== uid) }))

  const takeLore = (entry, level) => {
    setDraft((current) => ({
      loresheets: [...current.loresheets.filter((pick) => !(pick.id === entry.id && pick.level === level)), { id: entry.id, level }]
    }))
    setPicking(null)
  }

  const rows = (filter) =>
    draft.advantages
      .filter((pick) => filter(featureTypeFor(pick.entry)))
      .map((pick) => {
        const range = dotsRange(pick.entry.dots)
        return (
          <div key={pick.uid} className="bo-cg-adv">
            <span className="bo-cg-adv-name">
              {pick.entry.name}
              <span className="bo-cg-adv-group">{pick.entry.group}</span>
            </span>
            <DotTracker
              value={pick.dots}
              min={Math.max(range.min, 1)}
              max={Math.min(Math.max(range.max, 1), garou ? 6 : 5)}
              onChange={(n) => setDots(pick.uid, n)}
            />
            <button type="button" className="bo-mini" title="Remove" onClick={() => remove(pick.uid)}>
              ×
            </button>
          </div>
        )
      })

  return (
    <>
      <Heading title="Merits & flaws" sub={garou ? 'Spend 7 Advantage dots and take 2 Flaw dots.' : hunter ? "Spend seven Advantage dots, including any Loresheet levels, and choose two Flaw dots." : "What empowers the character, what complicates their unlife, and the loresheets that tie them to the wider story."} />

      <div className="bo-cg-counters">
        <div className={spent.advantages > allowance.advantages ? 'bo-cg-counter is-over' : 'bo-cg-counter'}>
          <span>Advantage points</span>
          <b>
            {spent.advantages}/{allowance.advantages}
          </b>
        </div>
        <div className={spent.flaws > allowance.flaws ? 'bo-cg-counter is-flaw is-over' : 'bo-cg-counter is-flaw'}>
          <span>Flaw points</span>
          <b>
            {spent.flaws}/{allowance.flaws}
          </b>
        </div>
      </div>
      {caitiff ? <p className="bo-cg-note">As Caitiff you begin with Suspect (●) on top of these, and cannot buy Status now.</p> : null}
      {!hunter && !garou && !isLoaded() ? <p className="bo-cg-note">Merits come from the rules reference, which is not installed; clan coterie merits and loresheets still work.</p> : null}

      <div className="bo-cg-adv-actions">
        <GhostButton tone="accent" onClick={() => setPicking('background')}>
          + Background
        </GhostButton>
        <GhostButton tone="accent" onClick={() => setPicking('merit')}>
          + Merit
        </GhostButton>
        <GhostButton tone="danger" onClick={() => setPicking('flaw')}>
          + Flaw
        </GhostButton>
        <GhostButton tone="arcane" onClick={() => setPicking('loresheet')}>+ Loresheet</GhostButton>
      </div>

      <div className="bo-cg-two">
        <div>
          <div className="bo-label">Backgrounds & merits</div>
          {rows((type) => type !== 'flaw')}
          {draft.loresheets.map((pick) => {
            const entry = LORESHEET_BY_ID[pick.id]
            return (
              <div key={`${pick.id}-${pick.level}`} className="bo-cg-adv">
                <span className="bo-cg-adv-name">
                  {entry?.levels?.[pick.level - 1] ?? pick.id}
                  <span className="bo-cg-adv-group">Loresheet · {entry?.name}</span>
                </span>
                <span className="bo-cg-dots">{DOTS(pick.level)}</span>
                <button
                  type="button"
                  className="bo-mini"
                  title="Remove"
                  onClick={() =>
                    setDraft((current) => ({
                      loresheets: current.loresheets.filter((other) => !(other.id === pick.id && other.level === pick.level))
                    }))
                  }
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
        <div>
          <div className="bo-label">Flaws</div>
          {caitiff ? (
            <div className="bo-cg-adv is-fixed">
              <span className="bo-cg-adv-name">
                Suspect
                <span className="bo-cg-adv-group">Caitiff · not counted</span>
              </span>
              <span className="bo-cg-dots">●</span>
            </div>
          ) : null}
          {rows((type) => type === 'flaw')}
        </div>
      </div>

      {picking && picking !== 'loresheet' && garou ? <GarouAdvantagePicker type={picking} taken={draft.advantages.map(({ entry }) => entry.name)} onPick={add} onClose={() => setPicking(null)} /> : picking === 'loresheet' ? (
        <LoresheetPicker actor={shim} onTake={takeLore} onClose={() => setPicking(null)} />
      ) : picking ? (
        <AdvantagePicker
          actor={shim}
          kind={picking === 'flaw' ? 'flaw' : 'merit'}
          sectionType={picking === 'background' ? 'background' : picking}
          backgroundsOnly={picking === 'background'}
          extraEntries={!hunter && picking === 'merit' ? clanCoterieEntries(shim) : null}
          exclude={picking === 'background' ? statusNames : null}
          onPick={add}
          onClose={() => setPicking(null)}
        />
      ) : null}
    </>
  )
}
