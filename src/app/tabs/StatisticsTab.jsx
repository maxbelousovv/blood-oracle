import InfoIcon from '../components/InfoIcon.jsx'
import { hunterCell } from '../schema/hunter-state.js'
import HunterCounters from '../components/HunterCounters.jsx'
import { readSingleton } from '../schema/singletons.js'
import { findDrive } from '../rules/drives.js'
import { hasNoHunterTouchstones, hunterInDespair } from '../schema/touchstones.js'
import DotTracker from '../components/DotTracker.jsx'
import { splatOf, storyCharacterType, usesHunger } from '../splats.js'
import { remorseCheck } from '../roll/checks.js'
import {
  usesDerivedTracks,
  baseMax,
  readBonus,
  setBonus,
  setStoryTrackMaximum
} from '../schema/derived.js'
import SkillRow from '../components/SkillRow.jsx'
import { TraitTip, useDelayedTip } from '../components/TraitTip.jsx'
import { SectionTitle, GhostButton } from '../components/primitives.jsx'
import { DamageTracker, HumanityTracker, HungerTracker } from '../components/Trackers.jsx'
import { getAttributeGroups, getSkillGroups, readTrait } from '../traits.js'
import StoryCharacterPools, { StoryTraits } from './StoryCharacterPools.jsx'
import StoryRating from '../components/StoryRating.jsx'
import { rollStoryPool } from '../roll/story-character.js'
import { GarouRage, GarouRatings } from './GarouTab.jsx'
import { formOf, garouHealth, garouHealthUpdate } from '../schema/werewolf.js'

function AttributeRow({ actor, entry, editable, locked, onRoll }) {
  const tip = useDelayedTip()
  return (
    <div className="bo-stat-row">
      <div className="bo-stat-name">
        <button type="button" className="bo-trait-name" onClick={() => onRoll(entry)} {...tip.bind}>
          {entry.label}
        </button>
        <TraitTip anchor={tip.anchor} entry={entry} />
      </div>
      <DotTracker
        value={readTrait(actor, entry.path)}
        disabled={!editable}
        locked={locked}
        onChange={(next) => actor.update({ [entry.path]: next })}
      />
    </div>
  )
}

function Column({ title, children }) {
  return (
    <section>
      <div className="bo-label" style={{ textAlign: 'center', marginBottom: '8px' }}>
        {title}
      </div>
      {children}
    </section>
  )
}

function Trackers({ actor, editable, locked, onRouse, onRollWillpower }) {
  const werewolf = actor.type === 'werewolf'
  const health = werewolf ? garouHealth(actor) : actor.system?.health ?? {}
  const noTouchstones = hasNoHunterTouchstones(actor)
  const inDespair = hunterInDespair(actor)
  const drive = actor.type === 'hunter' ? readSingleton(actor, 'drive') : null
  const redemption = findDrive(drive?.name)?.redemption
  const willpower = actor.system?.willpower ?? {}
  const isVampire = usesHunger(actor)
  const storyType = storyCharacterType(actor)
  const showDespair = actor.type === 'hunter' || storyType === 'hunter'
  const showHumanity = !werewolf && !showDespair && (!storyType || storyType === 'vampire' || storyType === 'ghoul')
  const despairActive = storyType ? Boolean(actor.system.despair?.value) : inDespair
  const splat = splatOf(actor)

  // Maximums follow attributes; the stepper covers anything beyond the formula.
  const derived = usesDerivedTracks(actor, true)
  const base = baseMax(actor)
  const bonus = readBonus(actor)
  const bonusFor = (key, formula) =>
    derived
      ? {
          bonus: bonus[key],
          base: base[key],
          formula,
          locked,
          onChange: (next) => setBonus(actor, key, next)
        }
      : null
  const maximumControl = (key, label) => storyType ? (
    <StoryRating actor={actor} label={label} path={'system.' + key + '.max'}
      editable={!locked} onSave={(max) => setStoryTrackMaximum(actor, key, max)} />
  ) : null

  return (
    <div className="bo-columns">
      <DamageTracker
        label={werewolf && formOf(actor).id === 'crinos' ? 'Health · Crinos' : 'Health'}
        ignoreImpairment={werewolf && Boolean(actor.system.frenzyActive)}
        bonus={bonusFor('health', 'Stamina + 3')}
        maximumControl={maximumControl('health', 'Maximum Health')}
        max={health.max ?? 0}
        superficial={health.superficial ?? 0}
        aggravated={health.aggravated ?? 0}
        disabled={!editable}
        onUpdate={(next) =>
          actor.update(werewolf ? garouHealthUpdate(actor, next) : {
            'system.health.superficial': next.superficial,
            'system.health.aggravated': next.aggravated
          })
        }
      />

      <DamageTracker
        label="Willpower"
        onRoll={onRollWillpower}
        bonus={bonusFor('willpower', 'Composure + Resolve')}
        maximumControl={maximumControl('willpower', 'Maximum Willpower')}
        max={willpower.max ?? 0}
        superficial={willpower.superficial ?? 0}
        aggravated={willpower.aggravated ?? 0}
        disabled={!editable}
        onUpdate={(next) =>
          actor.update({
            'system.willpower.superficial': next.superficial,
            'system.willpower.aggravated': next.aggravated
          })
        }
      />

      {werewolf ? <GarouRage actor={actor} editable={editable} /> : null}

      {isVampire ? (
        <div>
          <HungerTracker
            value={actor.system?.hunger?.value ?? 0}
            disabled={!editable}
            onChange={(next) => actor.update({ 'system.hunger.value': next })}
            inlineExtra={
              editable ? (
                <GhostButton tone="danger" onClick={onRouse} style={{ padding: '4px 10px' }}>
                  Rouse
                </GhostButton>
              ) : null
            }
          />
        </div>
      ) : null}

      {showDespair ? (
        <div className="bo-tracker">
          <div className="bo-tracker-label">
            Despair
            <InfoIcon accent={despairActive} text={noTouchstones
              ? 'Restore a Touchstone before Despair can clear.'
              : storyType
                ? 'Track whether this Hunter is in Despair. Standard NPC pools use regular dice.'
                : despairActive
                ? (redemption ? 'Clear Despair after Redemption. ' + redemption : 'Clear Despair once you fulfill your Drive’s Redemption.')
                : 'Despair blocks Desperation dice. Fulfill your Drive’s Redemption to clear it.'} />
          </div>
          <button
            type="button"
            className={despairActive ? 'bo-ghost is-accent' : 'bo-ghost'}
            aria-pressed={despairActive}
            disabled={!editable || noTouchstones}
            onClick={() => actor.update({ 'system.despair.value': actor.system.despair?.value ? 0 : 1 })}
          >
            {noTouchstones ? 'No Touchstones · In Despair' : despairActive ? 'Clear Despair' : 'Mark Despair'}
          </button>
        </div>
      ) : null}

      {showHumanity ? <HumanityTracker
        humanity={actor.system?.humanity?.value ?? 0}
        stains={actor.system?.humanity?.stains ?? 0}
        disabled={!editable}
        onRemorse={splat.remorse ? () => remorseCheck(actor) : null}
        onUpdate={(next) =>
          actor.update(
            Object.fromEntries(
              Object.entries(next).map(([key, value]) => [
                key === 'humanity' ? 'system.humanity.value' : 'system.humanity.stains',
                value
              ])
            )
          )
        }
      /> : null}

      {storyType === 'werewolf' ? (
        <StoryRating actor={actor} label="Rage" path="system.rage.value" max={5} editable={editable} />
      ) : null}
      {storyType === 'spirit' ? (
        <StoryRating actor={actor} label="Power" path="system.power.value" editable={editable && !locked}
          onRoll={editable ? (dice) => rollStoryPool(actor, { label: 'Power', dice }) : null} />
      ) : null}
      {storyType === 'vampire' ? (
        <StoryRating actor={actor} label="Blood potency" path="system.blood.potency" max={10} editable={editable && !locked} />
      ) : null}
    </div>
  )
}

export default function StatisticsTab({
  actor,
  editable,
  onRoll,
  onRouse,
  onRollWillpower,
  locked
}) {
  const storyType = storyCharacterType(actor)
  const werewolf = actor.type === 'werewolf'

  return (
    <div className={storyType ? 'bo-spc-stats' : undefined}>
      <SectionTitle info={
        storyType
          ? 'Click a box to mark Superficial damage, click again for Aggravated. Right-click to reverse.'
          : 'Click a damage box to add Superficial, again to convert it to Aggravated; right-click reverses. Health is Stamina + 3, Willpower is Composure + Resolve. A full track means Impaired: two dice off pools using that category. ' +
            (actor.type === 'hunter' ? 'Despair prevents the use of Desperation dice.'
              : werewolf ? 'Rage dice replace regular dice in tests. At Rage 0, you have lost the Wolf.'
                : 'Right-click an empty Humanity box to mark a Stain.')
      }>
        Trackers
      </SectionTitle>
      <div style={{ marginBottom: '26px' }}>
        <Trackers actor={actor} editable={editable} locked={locked} onRouse={onRouse} onRollWillpower={onRollWillpower} />
        {actor.type === 'hunter' ? (
          <div style={{ marginTop: '20px' }}>
            <SectionTitle info="Desperation adds dice on qualifying tests. Danger measures the quarry’s response. Despair blocks Desperation dice until Redemption.">Cell trackers</SectionTitle>
            {!hunterCell(actor) ? <p className="bo-roll-note is-accent" role="status">This Hunter is not in a cell. These ratings are personal.</p> : null}
            <HunterCounters actor={actor} disabled={!editable} />
          </div>
        ) : null}
      </div>

      {storyType ? <StoryCharacterPools actor={actor} editable={editable} locked={locked} /> : null}
      {werewolf ? <GarouRatings actor={actor} editable={editable} locked={locked} /> : null}
      <TraitSections actor={actor} editable={editable} locked={locked} onRoll={onRoll} />
      {storyType ? <StoryTraits actor={actor} editable={editable} /> : null}
    </div>
  )
}

function TraitSections({ actor, editable, locked, onRoll }) {
  return (
    <>
      <SectionTitle info="Click a trait to start a dice pool. Attributes describe what the character is; most pools pair one Attribute with one Skill.">
        Attributes
      </SectionTitle>
      <div className="bo-columns" style={{ marginBottom: '26px' }}>
        {getAttributeGroups().map((group) => (
          <Column key={group.type} title={group.label}>
            {group.entries.map((entry) => (
              <AttributeRow
                key={entry.id}
                actor={actor}
                entry={entry}
                editable={editable}
                locked={locked}
                onRoll={onRoll}
              />
            ))}
          </Column>
        ))}
      </div>

      <SectionTitle info="A Specialty adds one die when it applies. Click beside a skill with dots to name one.">
        Skills
      </SectionTitle>
      <div className="bo-columns">
        {getSkillGroups().map((group) => (
          <Column key={group.type} title={group.label}>
            {group.entries.map((entry) => (
              <SkillRow
                key={entry.id}
                actor={actor}
                entry={entry}
                editable={editable}
                locked={locked}
                onRoll={onRoll}
              />
            ))}
          </Column>
        ))}
      </div>
    </>
  )
}
