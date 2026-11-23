import HunterCounters from '../components/HunterCounters.jsx'
import { hunterCounter } from '../schema/hunter-state.js'
import { edgePoolSlots } from '../schema/hunter-edges.js'
import { readSingleton } from '../schema/singletons.js'
import { findCreed } from '../rules/creeds.js'
import { hunterInDespair } from '../schema/touchstones.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Modal, GhostButton } from '../components/primitives.jsx'
import Select from '../components/Select.jsx'
import { getAttributeGroups, getSkillGroups } from '../traits.js'
import { getAllDisciplines } from '../schema/custom-disciplines.js'
import { composePool } from './pool.js'
import { getHungerDice, splitPool } from './bridge.js'
import { rouseCheck } from './checks.js'
import { rollHunter } from './hunter.js'
import { hunterEquipmentForRoll } from './hunter-equipment.js'
import HunterEquipmentRoll from './HunterEquipmentRoll.jsx'
import OddsPopover from './OddsPopover.jsx'
import { coterieDomainFor, huntingDifficulty } from '../schema/coterie.js'
import Stepper from '../components/Stepper.jsx'
import { splatOf, storyCharacterType, usesHunger } from '../splats.js'
import GarouRollOptions, { packRollOptions } from './GarouRollOptions.jsx'
import { garouPackContext } from '../schema/pack-effects.js'
import { attackDamageType, availableNaturalAttacks, crinosTurnPending, naturalAttackFlavor, targetedActors } from './garou-combat.js'
import { formModifiers, GAROU_RENOWN, rageOf } from '../schema/werewolf.js'
import { werewolfRollFlavor } from './werewolf.js'

const EMPTY = { kind: null, id: null, label: '' }
const SLOT_COUNT = 3

/**
 * The standalone app's pool constructor: three independent trait slots plus a
 * Storyteller modifier, with blood surge, specialty and resonance applied on
 * top. Every contribution is listed so the number can be argued with.
 */
export default function RollPanel({ actor, editable, initialSlots, edgePool, onClose }) {
  const storyType = storyCharacterType(actor)
  const garou = actor.type === 'werewolf'
  const [rageAids, setRageAids] = useState(false)
  const [packChoice, setPackChoice] = useState({})
  const [naturalChoice, setNaturalChoice] = useState('')
  const [naturalTarget, setNaturalTarget] = useState('')
  const [clawsHarm, setClawsHarm] = useState('auto')
  const [mundaneSocial, setMundaneSocial] = useState(true)
  const [minorAction, setMinorAction] = useState(false)
  const [resistMentalPower, setResistMentalPower] = useState(false)
  const [slots, setSlots] = useState(() => Array.from({ length: SLOT_COUNT }, () => EMPTY))
  const [modifier, setModifier] = useState(0)
  const [difficulty, setDifficulty] = useState(0)
  const [bloodSurge, setBloodSurge] = useState(false)
  // '' is "no specialty"; otherwise the key of the one applied.
  const [specialtyKey, setSpecialtyKey] = useState('')
  const [oddsOpen, setOddsOpen] = useState(false)
  const oddsRef = useRef(null)
  const closeOdds = useCallback(() => setOddsOpen(false), [])
  const [useResonance, setUseResonance] = useState(false)
  const [useWeaponDamage, setUseWeaponDamage] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [consequence, setConsequence] = useState(null)
  const rollingRef = useRef(false)
  const pendingConsequence = useRef(null)
  useEffect(() => () => pendingConsequence.current?.(null), [])
  const [useDesperation, setUseDesperation] = useState(false)
  const [equipmentChoice, setEquipmentChoice] = useState({})
  // The coterie's domain: Lien adds dice; hunting there sets the difficulty
  // from Chasse, and the difficulty it replaced comes back when it is undone.
  const [useLien, setUseLien] = useState(false)
  const [huntingInDomain, setHuntingInDomain] = useState(false)
  const difficultyBeforeHunt = useRef(0)

  useEffect(() => {
    if (!initialSlots) return
    setSlots(
      Array.from({ length: SLOT_COUNT }, (_, index) => initialSlots[index] ?? EMPTY)
    )
  }, [initialSlots])

  const options = useMemo(() => {
    const attributes = getAttributeGroups().flatMap((group) =>
      group.entries.map((entry) => ({
        key: `attribute:${entry.id}`,
        kind: 'attribute',
        id: entry.id,
        label: entry.label,
        group: `Attributes · ${group.label}`
      }))
    )
    const skills = getSkillGroups().flatMap((group) =>
      group.entries.map((entry) => ({
        key: `skill:${entry.id}`,
        kind: 'skill',
        id: entry.id,
        label: entry.label,
        group: `Skills · ${group.label}`
      }))
    )
    // Only disciplines the character actually has are offered.
    const disciplines = (garou || actor.type === 'hunter' || (storyType && !splatOf(actor).tabs.includes('disciplines'))
      ? [] : getAllDisciplines())
      .filter((entry) => Number(actor.system.disciplines?.[entry.id]?.value) > 0)
      .map((entry) => ({
        key: `discipline:${entry.id}`,
        kind: 'discipline',
        id: entry.id,
        label: entry.label,
        group: 'Disciplines'
      }))

    const renown = garou ? GAROU_RENOWN.map(([id, label]) => ({ key: 'renown:' + id, kind: 'renown', id, label, group: 'Renown' })) : []
    return [...attributes, ...skills, ...disciplines, ...renown]
  }, [actor, garou, storyType])

  // What the dropdown shows. A skill with no dots can still be rolled — the
  // Attribute alone — so it is not removed, only moved to the end and muted.
  const dotsOf = (option) => {
    const path =
      option.kind === 'attribute'
        ? `system.attributes.${option.id}.value`
        : option.kind === 'skill'
          ? `system.skills.${option.id}.value`
          : option.kind === 'renown' ? `system.renown.${option.id}.value` : `system.disciplines.${option.id}.value`
    return Number(foundry.utils.getProperty(actor, path)) || 0
  }

  const menuOptions = (() => {
    const trained = []
    const untrained = []
    for (const option of options) {
      const dots = dotsOf(option)
      const entry = {
        value: option.key,
        label: option.label,
        group: option.group,
        hint: dots ? '●'.repeat(Math.min(dots, 10)) : '—'
      }
      if (option.kind === 'skill' && !dots) {
        untrained.push({ ...entry, group: 'Untrained skills', muted: true })
      } else {
        trained.push(entry)
      }
    }
    return [...trained, ...untrained]
  })()

  const hunter = actor.type === 'hunter'
  const poolSlots = edgePool ? edgePoolSlots(edgePool, [...getAttributeGroups(), ...getSkillGroups()]) : slots
  const equipment = hunter && !edgePool ? hunterEquipmentForRoll(actor, slots, equipmentChoice) : null
  const updateEquipment = (patch) => setEquipmentChoice((previous) => ({ ...previous, ...patch }))
  const inDespair = hunterInDespair(actor)
  const desperation = hunter ? hunterCounter(actor, 'desperation') : 0
  const creed = hunter ? readSingleton(actor, 'creed') : null
  const hasDrive = hunter && Boolean(readSingleton(actor, 'drive'))
  const creedField = findCreed(creed?.name)?.field || creed?.system.desperationFields || actor.system.headers?.creedfields
  const canUseDesperation = !inDespair && hasDrive && Boolean(creedField?.trim()) && desperation > 0
  const domain = hunter || garou ? null : coterieDomainFor(actor)
  const lienDice = domain && !domain.secret && useLien && !huntingInDomain ? domain.lien : 0
  const huntDifficulty = domain && !domain.secret ? huntingDifficulty(domain.chasse) : null

  const toggleHunting = (on) => {
    if (on) {
      difficultyBeforeHunt.current = difficulty
      setDifficulty(huntDifficulty)
      // Lien never modifies a coterie member's hunting rolls.
      setUseLien(false)
    } else {
      setDifficulty(difficultyBeforeHunt.current)
    }
    setHuntingInDomain(on)
  }

  const formRules = garou ? formModifiers(actor, poolSlots, mundaneSocial) : null
  const pack = garou ? garouPackContext(actor) : null
  const packOptions = garou ? packRollOptions(actor, pack, poolSlots) : []
  const attackChoices = garou ? availableNaturalAttacks(actor, poolSlots) : []
  const attack = attackChoices.find(({ id }) => id === naturalChoice)
  const targets = garou ? targetedActors() : []
  const target = targets.find(({ uuid }) => uuid === (naturalTarget || (targets.length === 1 ? targets[0].uuid : '')))
  const packParts = packOptions.filter(({ id }) => id !== 'well-hidden' && packChoice[id])
  const hiding = Number(difficulty) && packChoice['well-hidden'] ? (packOptions.find(({ id }) => id === 'well-hidden')?.value ?? 0) : 0
  const rollDifficulty = Number(difficulty) + hiding
  const crinosPending = garou && crinosTurnPending(actor)
  const formParts = formRules ? [
    ...formRules.parts,
    ...packParts,
    ...(minorAction ? [{ label: 'Shapeshifting', value: -2 }] : []),
    ...(resistMentalPower && actor.system.frenzyActive ? [{ label: 'Frenzy · Mental resistance', value: 3 }] : [])
  ] : null
  const composition = composePool(actor, {
    slots: poolSlots,
    modifier,
    options: {
      bloodSurge,
      specialty: specialtyKey,
      useResonance,
      useWeaponDamage: !hunter && useWeaponDamage,
      equipmentParts: equipment?.parts ?? formParts,
      lien: lienDice,
      lienLabel: domain?.group?.name
    }
  })

  // Toggles switch themselves off when their precondition disappears, so the
  // displayed pool never includes a bonus that no longer applies.
  useEffect(() => {
    if (specialtyKey && !composition.chosenSpecialty) setSpecialtyKey('')
    if (!composition.resonanceAvailable && useResonance) setUseResonance(false)
    if (!composition.weaponBonusAvailable && useWeaponDamage) setUseWeaponDamage(false)
  }, [
    composition.chosenSpecialty,
    composition.resonanceAvailable,
    composition.weaponBonusAvailable,
    specialtyKey,
    useResonance,
    useWeaponDamage
  ])

  // A different skill means a different list: start again from "None".
  const skillSignature = slots
    .filter((slot) => slot?.kind === 'skill' && slot.id)
    .map((slot) => slot.id)
    .join('|')
  useEffect(() => {
    setSpecialtyKey('')
  }, [skillSignature])

  const hunger = getHungerDice(actor)
  const pool = composition.total
  const usesRage = garou || storyType === 'werewolf'
  const advanced = usesRage ? rageOf(actor) : hunger
  const { basicDice, advancedDice } = hunter
    ? { basicDice: pool, advancedDice: useDesperation && canUseDesperation ? desperation : 0 }
    : splitPool(pool, storyType || garou ? Math.min(pool, advanced) : hunger)
  const canRoll = editable && composition.canRoll && !formRules?.blocked && !crinosPending &&
    (!hunter || !advancedDice || difficulty > 0)
  const damageNote = equipment?.damage == null ? '' : (
    equipment.damage < 0
      ? `Damage on a win: margin − ${Math.abs(equipment.damage)}.`
      : `Damage on a win: margin + ${equipment.damage}.`
  )
  const attackNotes = equipment ? [
    equipment.weapon?.name,
    equipment.ammo?.name,
    equipment.calledShot ? `Called shot: ${equipment.calledShot}` : '',
    damageNote,
    ...equipment.effects
  ].filter(Boolean) : []

  const setSlot = (index, key) => {
    const found = options.find((option) => option.key === key)
    setSlots((prev) => prev.map((slot, i) => (i === index ? found ?? EMPTY : slot)))
  }

  const doRoll = async () => {
    if (!canRoll || rollingRef.current) return
    rollingRef.current = true
    setOddsOpen(false)
    setRolling(true)
    try {
      // Blood surge is paid for with a Rouse check, made before the roll so the
      // hunger it may cause is visible in the chat log in the right order.
      if (bloodSurge) {
        await rouseCheck(actor, { title: 'Blood Surge' })
      }

      const partsLabel = composition.parts
        .map((part) => `${part.label} ${part.value >= 0 ? '+' : '−'}${Math.abs(part.value)}`)
        .join(' ')
      const flavor = hunter
        ? [partsLabel, ...attackNotes].filter(Boolean).map((part) => foundry.utils.escapeHTML(part)).join(' · ')
        : (composition.weaponBonus ? `Weapon +${composition.weaponBonus} · ` : '') + partsLabel
      const options = {
        basicDice,
        advancedDice,
        actor,
        data: actor.system,
        title: edgePool?.name ?? (composition.label || 'Rolling'),
        macro: edgePool?.system.macroid,
        flavor: garou ? werewolfRollFlavor({
          flavor: foundry.utils.escapeHTML(flavor) + (attack ? naturalAttackFlavor(attack, target, clawsHarm) : ''),
          rageAids: rageAids || Boolean(attack), frenzy: actor.system.frenzyActive
        }) : flavor,
        difficulty: rollDifficulty || 0,
        quickRoll: true,
        selectors: edgePool
          ? ['edges', `edges.${edgePool.system.edge}`, ...poolSlots.flatMap(({ kind, id }) => {
            const category = kind === 'skill' ? 'skills' : 'attributes'
            return [category, id, category + '.' + id]
          })]
          : slots.filter((slot) => slot?.id).map((slot) => slot.id)
      }
      if (hunter) {
        if (inDespair) options.selectors.push('despair')
        await rollHunter(actor, options, (ones) => new Promise((resolve) => {
          pendingConsequence.current = resolve
          setConsequence(ones)
        }))
      } else {
        await WOD5E.api.Roll(options)
      }
      onClose?.()
    } catch (error) {
      console.error('Blood Oracle | Roll failed', error)
      ui.notifications.error('The roll could not be completed. See the console for details.')
    } finally {
      rollingRef.current = false
      setRolling(false)
    }
  }

  const resolveConsequence = (choice) => {
    pendingConsequence.current?.(choice)
    pendingConsequence.current = null
    setConsequence(null)
  }

  if (consequence) {
    return (
      <Modal title="Overreach or Despair">
        <p className="bo-prose">Keep the win and raise Danger by up to {consequence}, or accept a failed test and enter Despair.</p>
        <div className="bo-roll-footer">
          <div className="bo-roll-actions">
            <GhostButton onClick={() => resolveConsequence('despair')}>Accept Despair</GhostButton>
            <button type="button" className="bo-solid" onClick={() => resolveConsequence('overreach')}>Overreach</button>
          </div>
        </div>
      </Modal>
    )
  }

  const chosenKey = composition.chosenSpecialty?.key ?? ''
  const manySkills = composition.specialtyChoices.length > 1

  return (
    <Modal title={edgePool?.name ?? 'Build a pool'} onClose={rolling ? undefined : onClose}>
      {!edgePool ? <div style={{ display: 'grid', gap: '11px' }}>
        {slots.map((slot, index) => (
          <label key={index} className="bo-field-label">
            <span>Trait {index + 1}</span>
            <Select
              value={slot.kind ? `${slot.kind}:${slot.id}` : ''}
              disabled={!editable}
              searchable
              options={[{ value: '', label: '—' }, ...menuOptions]}
              onChange={(key) => setSlot(index, key)}
            />
          </label>
        ))}
      </div> : null}

      <div className="bo-block">
        {!hunter && !garou && (!storyType || usesHunger(actor)) ? (
        <label className={bloodSurge ? 'bo-toggle is-surge is-on' : 'bo-toggle is-surge'}>
          <input
            type="checkbox"
            checked={bloodSurge}
            onChange={(event) => setBloodSurge(event.target.checked)}
          />
          <span>Blood surge</span>
          <span className="bo-toggle-note">
            {bloodSurge
              ? `+${composition.surge} dice · costs a Rouse check`
              : `+${composition.surge} at Blood Potency ${composition.potency}`}
          </span>
        </label>) : null}

        {/* One specialty per roll, picked from chips: all of them in sight, so a
            player sees there are several, without a list breaking the block. */}
        <div className={composition.specialtyAvailable ? 'bo-toggle bo-spec-row' : 'bo-toggle bo-spec-row is-disabled'}>
          <span className="bo-toggle-spacer" aria-hidden="true" />
          <span>Specialty</span>
          {composition.specialtyAvailable ? (
            <div className="bo-spec-chips" role="radiogroup" aria-label="Specialty">
              <button
                type="button"
                role="radio"
                aria-checked={!chosenKey}
                className={chosenKey ? 'bo-chip is-none' : 'bo-chip is-none is-selected'}
                onClick={() => setSpecialtyKey('')}
              >
                None
              </button>
              {composition.specialtyChoices.map((group) => [
                manySkills ? (
                  <span key={`${group.skillId}-label`} className="bo-chip-group">
                    {group.skillLabel}
                  </span>
                ) : null,
                ...group.entries.map((entry) => (
                  <button
                    key={entry.key}
                    type="button"
                    role="radio"
                    aria-checked={chosenKey === entry.key}
                    className={chosenKey === entry.key ? 'bo-chip is-selected' : 'bo-chip'}
                    title={entry.granted ? 'Granted by the predator type' : undefined}
                    onClick={() => setSpecialtyKey(entry.key)}
                  >
                    {entry.text}
                    {entry.granted ? <span className="bo-chip-origin">pred</span> : null}
                  </button>
                ))
              ])}
              {chosenKey ? <span className="bo-toggle-note">+1 die</span> : null}
            </div>
          ) : (
            <span className="bo-toggle-note">no specialty on the chosen skills</span>
          )}
        </div>

        {!hunter && !garou ? <label
          className={composition.weaponBonusAvailable ? 'bo-toggle' : 'bo-toggle is-disabled'}
        >
          <input
            type="checkbox"
            checked={useWeaponDamage}
            disabled={!composition.weaponBonusAvailable}
            onChange={(event) => setUseWeaponDamage(event.target.checked)}
          />
          <span>Weapon damage</span>
          <span className="bo-toggle-note">
            {composition.weaponBonusAvailable
              ? `+${composition.weaponBonusAvailable} to successes, not dice`
              : composition.weaponType
                ? 'no equipped weapon of that kind'
                : 'only for Melee and Firearms'}
          </span>
        </label> : null}

        {!hunter && !garou ? <label className={composition.resonanceAvailable ? 'bo-toggle' : 'bo-toggle is-disabled'}>
          <input
            type="checkbox"
            checked={useResonance}
            disabled={!composition.resonanceAvailable}
            onChange={(event) => setUseResonance(event.target.checked)}
          />
          <span>Resonance</span>
          <span className="bo-toggle-note">
            {composition.resonanceAvailable
              ? `+1 · ${composition.resonance.humour} ${composition.resonance.temperament}`
              : 'no resonance matching the chosen discipline'}
          </span>
        </label> : null}
      </div>

      {garou ? <div className="bo-block">
        {crinosPending ? <p className="bo-roll-note is-red">Resolve the start of this Crinos turn in Forms.</p> : null}
        {formRules.blocked ? <p className="bo-roll-note is-red">This test automatically fails in Crinos.</p> : null}
        <label className="bo-toggle">
          <input type="checkbox" checked={rageAids || Boolean(attack)} disabled={Boolean(attack)} onChange={(event) => setRageAids(event.target.checked)} />
          <span>Rage aids this test</span>
          <span className="bo-toggle-note">A Brutal Outcome adds four successes.</span>
        </label>
        {formRules.socialTarget ? <label className="bo-toggle">
          <input type="checkbox" checked={mundaneSocial} onChange={(event) => setMundaneSocial(event.target.checked)} />
          <span>Social test against a human</span>
        </label> : null}
        <label className="bo-toggle">
          <input type="checkbox" checked={minorAction} onChange={(event) => setMinorAction(event.target.checked)} />
          <span>Shifted form this turn</span>
          <span className="bo-toggle-note">−2 dice for the minor action.</span>
        </label>
        {actor.system.frenzyActive ? <label className="bo-toggle">
          <input type="checkbox" checked={resistMentalPower} onChange={(event) => setResistMentalPower(event.target.checked)} />
          <span>Resisting a mental Gift or similar power</span>
        </label> : null}
      </div> : null}

      {garou && attackChoices.length ? <div className="bo-block">
        <div className="bo-pair-grid">
          <label className="bo-field-label"><span>Natural attack</span>
            <Select value={attack?.id || ''} options={[{ value: '', label: 'None' }, ...attackChoices.map(({ id, name, bonus }) => ({ value: id, label: name + ' · +' + bonus + ' damage' }))]}
              onChange={setNaturalChoice} /></label>
          {attack && targets.length ? <label className="bo-field-label"><span>Target</span>
            <Select value={target?.uuid ?? 'none'} options={[{ value: 'none', label: 'No target' }, ...targets.map(({ uuid, name }) => ({ value: uuid, label: name }))]}
              onChange={setNaturalTarget} /></label> : null}
          {attack?.id === 'claws' ? <label className="bo-field-label"><span>Claw damage type</span>
            <Select value={clawsHarm} options={[{ value: 'auto', label: target ? 'From target · ' + attackDamageType(attack, target) : 'From target' },
              { value: 'superficial', label: 'Superficial' }, { value: 'aggravated', label: 'Aggravated' }]} onChange={setClawsHarm} /></label> : null}
        </div>
        {attack ? <p className="bo-roll-note">On a win, add {attack.bonus} damage to the margin. Set Difficulty to calculate it in chat.</p> : null}
      </div> : null}
      {garou ? <GarouRollOptions group={pack?.group} options={packOptions} choice={packChoice} difficulty={difficulty}
        onChange={(id, on) => setPackChoice((previous) => ({ ...previous, [id]: on }))} /> : null}
      {hiding ? <p className="bo-roll-note">Difficulty with Well-Hidden · {rollDifficulty}</p> : null}

      {equipment ? (
        <HunterEquipmentRoll equipment={equipment} choice={equipmentChoice}
          update={updateEquipment} disabled={!editable || rolling} />
      ) : null}

      {hunter ? (
        <div className="bo-block">
          <HunterCounters actor={actor} disabled={!editable || rolling} />
          <label className="bo-toggle">
            <input type="checkbox" checked={useDesperation && canUseDesperation} disabled={!editable || !canUseDesperation || rolling}
              onChange={(event) => setUseDesperation(event.target.checked)} />
            <span>Add Desperation dice</span>
            <span className="bo-toggle-note">
              {inDespair ? 'Unavailable in Despair' : !hasDrive ? 'Choose a Drive in Biography' : !creedField ? 'Record a Creed field' : creedField}
            </span>
          </label>
          {advancedDice && !difficulty ? <p className="bo-roll-note">Set a difficulty to resolve Desperation.</p> : null}
        </div>
      ) : null}

      {domain ? (
        <div className="bo-block">
          <div className="bo-label">Domain · {domain.group.name}</div>
          {domain.secret ? (
            <p className="bo-roll-note">
              Membership kept secret: the coterie’s domain does not help this character.
            </p>
          ) : (
            <>
              <label className={domain.lien && !huntingInDomain ? 'bo-toggle' : 'bo-toggle is-disabled'}>
                <input
                  type="checkbox"
                  checked={useLien && !huntingInDomain}
                  disabled={!domain.lien || huntingInDomain}
                  onChange={(event) => setUseLien(event.target.checked)}
                />
                <span>Lien</span>
                <span className="bo-toggle-note">
                  {!domain.lien
                    ? 'no Lien in this domain'
                    : huntingInDomain
                      ? 'never adds to hunting rolls'
                      : `+${domain.lien} · dealing peacefully with locals, finding or investigating in the domain`}
                </span>
              </label>
              <label className={huntDifficulty ? 'bo-toggle' : 'bo-toggle is-disabled'}>
                <input
                  type="checkbox"
                  checked={huntingInDomain}
                  disabled={!huntDifficulty}
                  onChange={(event) => toggleHunting(event.target.checked)}
                />
                <span>Hunting in the domain</span>
                <span className="bo-toggle-note">
                  {huntDifficulty ? `Chasse ${domain.chasse} · difficulty ${huntDifficulty}` : 'no Chasse in this domain'}
                </span>
              </label>
              {domain.portillon ? (
                <p className="bo-roll-note">
                  Portillon {domain.portillon}: anyone slipping into the domain unnoticed rolls {domain.portillon}{' '}
                  {domain.portillon === 1 ? 'die' : 'dice'} fewer — for the Storyteller.
                </p>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      <div className="bo-block">
        <div className="bo-label">Pool</div>
        <ul className="bo-breakdown">
          {composition.parts.map((part, index) => (
            <li key={`${part.label}-${index}`}>
              <span>{part.label}</span>
              <span className={part.value < 0 ? 'is-penalty' : undefined}>
                {part.value >= 0 ? '+' : '−'}
                {Math.abs(part.value)}
              </span>
            </li>
          ))}
          {!composition.parts.length ? (
            <li>
              <span className="bo-roll-note is-faint">Nothing selected yet.</span>
            </li>
          ) : null}
        </ul>

        <div className="bo-roll-summary">
          <p className="bo-prose">
            Rolling <strong>{basicDice}</strong> normal
            {(!storyType && !garou) || advancedDice > 0 ? (
              <> and <strong style={{ color: 'var(--bo-red-glow)' }}>{advancedDice}</strong> {hunter ? 'Desperation' : usesRage ? 'Rage' : 'hunger'}</>
            ) : ' dice'}.
          </p>
          {!usesRage ? <button
            ref={oddsRef}
            type="button"
            className={oddsOpen ? 'bo-ghost is-accent is-open' : 'bo-ghost'}
            disabled={!canRoll}
            onClick={() => setOddsOpen((open) => !open)}
            title="Chances for this pool"
          >
            Odds
          </button> : null}
        </div>
        {composition.weaponBonus ? (
          <p className="bo-roll-note">
            Plus {composition.weaponBonus} damage on a win — added to successes, not rolled.
          </p>
        ) : null}
        {attackNotes.length ? <p className="bo-roll-note">{attackNotes.join(' · ')}</p> : null}
        {composition.unequippedWarning ? (
          <p className="bo-roll-note is-accent">A weapon of that kind is carried but not equipped.</p>
        ) : null}
        {composition.flooredToOne ? (
          <p className="bo-roll-note is-red">
            Penalties would take this below one die; the pool is held at one.
          </p>
        ) : null}
      </div>

      {/* The numbers the Storyteller calls out sit by the button they feed. */}
      <div className="bo-roll-footer">
        <Stepper label="Modifier" value={modifier} min={-10} max={10} onChange={setModifier} disabled={rolling} />
        <Stepper label="Difficulty" value={difficulty} min={0} max={15} onChange={setDifficulty} disabled={rolling} />
        <div className="bo-roll-actions">
          <GhostButton onClick={onClose} disabled={rolling}>Cancel</GhostButton>
          <button
            type="button"
            className="bo-solid"
            onClick={doRoll}
            disabled={rolling || !canRoll}
          >
            {rolling ? 'Rolling…' : 'Roll'}
          </button>
        </div>
      </div>

      {oddsOpen && canRoll && !usesRage ? (
        <OddsPopover
          anchor={oddsRef.current}
          basicDice={basicDice}
          hungerDice={advancedDice}
          hunter={hunter}
          difficulty={difficulty}
          onClose={closeOdds}
        />
      ) : null}

    </Modal>
  )
}
