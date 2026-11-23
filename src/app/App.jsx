import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { isLocked, setLocked } from './lock.js'
import { splatOf, splatClass, STORY_CHARACTER_TYPES, storyCharacterType } from './splats.js'
import StatisticsTab from './tabs/StatisticsTab.jsx'
import LimitedView from './tabs/LimitedView.jsx'
import GroupApp from './tabs/GroupApp.jsx'
import BiographyTab from './tabs/BiographyTab.jsx'
import BloodTab from './tabs/BloodTab.jsx'
import CreedTab from './tabs/CreedTab.jsx'
import DisciplinesTab from './tabs/DisciplinesTab.jsx'
import EdgesTab from './tabs/EdgesTab.jsx'
import StoryGiftsTab from './tabs/StoryGiftsTab.jsx'
import GarouTab, { GarouPowersTab } from './tabs/GarouTab.jsx'
import GarouIdentityTab from './tabs/GarouIdentityTab.jsx'
import { werewolfRollFlavor } from './roll/werewolf.js'
import { StoryQuickRoll } from './tabs/StoryCharacterPools.jsx'
import MeritsFlawsTab from './tabs/MeritsFlawsTab.jsx'
import InventoryTab from './tabs/InventoryTab.jsx'
import NotesTab from './tabs/NotesTab.jsx'
import RollPanel from './roll/RollPanel.jsx'
import { rouseCheck, resistFrenzy, willpowerPool } from './roll/checks.js'
import EditableText from './components/EditableText.jsx'
import Select from './components/Select.jsx'
import { BloodOracleChargen } from '../sheet/chargen-app.js'
import { chargenDone, readDraft, shouldOfferChargen } from './chargen/apply.js'

/** Statistics rows hand over a trait entry; the pool constructor wants a slot. */
function toSlot(entry) {
  if (!entry) return null
  return {
    kind: entry.path.includes('.skills.') ? 'skill' : 'attribute',
    id: entry.id,
    label: entry.label
  }
}

const ALL_TABS = [
  { id: 'bio', label: 'Biography' },
  { id: 'stats', label: 'Statistics' },
  { id: 'blood', label: 'Blood' },
  { id: 'creed', label: 'Creed & Drive' },
  { id: 'garou-identity', label: 'Auspice & Tribe' },
  { id: 'disciplines', label: 'Disciplines' },
  { id: 'edges', label: 'Edges' },
  { id: 'gifts', label: 'Gifts' },
  { id: 'forms', label: 'Forms' },
  { id: 'garou-powers', label: 'Gifts & Rites' },
  { id: 'merits', label: 'Merits & flaws' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'notes', label: 'Notes & XP' }
]

/**
 * Compact stand-in for the standalone app's masthead: a sheet window cannot
 * spare the vertical space for a centred title block, so the clan and
 * generation line sits under the name instead.
 */
function Padlock({ locked, onToggle }) {
  return (
    <button
      type="button"
      className={locked ? 'bo-padlock is-locked' : 'bo-padlock'}
      onClick={onToggle}
      aria-pressed={locked}
      title={locked ? 'Ratings are locked — click to unlock' : 'Ratings are editable — click to lock'}
    >
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4.5" y="10.5" width="15" height="10" rx="1.6" />
        {locked ? (
          <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
        ) : (
          <path d="M8 10.5V7.5a4 4 0 0 1 7.6-1.7" />
        )}
        <circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    </button>
  )
}

function Header({ actor, editable, locked, onToggleLock, onQuickRoll, onResistFrenzy, splat }) {
  const [savingType, setSavingType] = useState(false)
  const headers = actor.system?.headers ?? {}
  const storyType = storyCharacterType(actor)
  const hunter = actor.type === 'hunter'
  const werewolf = actor.type === 'werewolf'
  const clan = !storyType || storyType === 'vampire' || storyType === 'ghoul'
  const lineage = (hunter || clan) && actor.items.find((item) => item.type === (werewolf ? 'tribe' : hunter ? 'creed' : 'clan'))?.name
  const generation = !hunter && !werewolf && (!storyType || storyType === 'vampire') && (actor.system?.blood?.generation ?? headers.generation)

  async function changeType(value) {
    setSavingType(true)
    try {
      await actor.update({ 'system.spcType': value })
    } catch (error) {
      console.error('Blood Oracle | Could not change NPC type', error)
      ui.notifications.error('The NPC type could not be saved.')
    } finally {
      setSavingType(false)
    }
  }

  async function choosePortrait() {
    const picker = new foundry.applications.apps.FilePicker.implementation({
      type: 'image',
      current: actor.img,
      callback: (img) => actor.update({ img })
    })
    await picker.browse()
  }

  return (
    <header className="bo-header">
      {storyType && editable ? (
        <button type="button" className="bo-portrait bo-spc-portrait"
          aria-label="Change portrait" title="Change portrait" onClick={choosePortrait}>
          {actor.img ? <img src={actor.img} alt="" /> : <i className="fa-solid fa-user" aria-hidden="true" />}
        </button>
      ) : actor.img ? <img src={actor.img} alt="" className="bo-portrait" /> : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <EditableText
          className="bo-name"
          value={actor.name}
          editable={editable}
          locked={locked}
          placeholder="Unnamed"
          onCommit={(next) => actor.update({ name: next })}
        />
        <p className="bo-subtitle">
          <EditableText
            as="span"
            value={headers.concept ?? ''}
            editable={editable}
            placeholder="No concept recorded"
            onCommit={(next) => actor.update({ 'system.headers.concept': next })}
          />
          {lineage ? ` · ${lineage}` : ''}
          {generation ? ` · ${generation}th` : ''}
        </p>
      </div>
      <div className="bo-header-actions">
        {storyType ? (
          <Select className="bo-spc-type" title="NPC type" value={storyType}
            options={STORY_CHARACTER_TYPES} disabled={!editable || savingType} onChange={changeType} />
        ) : null}
        {splat.resistFrenzy ? (
          <button type="button" className="bo-header-button is-danger" onClick={onResistFrenzy}>
            Resist frenzy
          </button>
        ) : null}
        {/* Only a creation left half-way gets a button; starting one is the
            first-open question's job, or the window menu's. */}
        {editable && ['vampire', 'hunter', 'werewolf'].includes(actor.type) && !chargenDone(actor) && readDraft(actor) ? (
          <button type="button" className="bo-header-button is-accent" onClick={() => BloodOracleChargen.open(actor)}>
            Continue creation
          </button>
        ) : null}
        <button type="button" className="bo-header-button" onClick={onQuickRoll}>
          Quick roll
        </button>
        {editable ? <Padlock locked={locked} onToggle={onToggleLock} /> : null}
      </div>
    </header>
  )
}

export default function App({ store }) {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const [tab, setTab] = useState('stats')
  const [rollSlots, setRollSlots] = useState(null)
  const [edgePool, setEdgePool] = useState(null)
  const [storyRoll, setStoryRoll] = useState(false)
  const [locked, setLockedState] = useState(() => isLocked())
  // Asked once per opening of the sheet, never on every re-render.
  const offered = useRef(false)

  useEffect(() => {
    if (offered.current || !snapshot?.editable || !snapshot?.actor) return
    if (!shouldOfferChargen(snapshot.actor)) return
    offered.current = true
    BloodOracleChargen.offer(snapshot.actor)
  }, [snapshot?.actor, snapshot?.editable])

  const toggleLock = async () => {
    const next = !locked
    setLockedState(next)
    await setLocked(next)
  }

  if (!snapshot) return null

  const { actor, editable, isOwner } = snapshot

  // Anyone who does not own the character gets the short view — including
  // OBSERVER, which is not "limited" but must not read private data either.
  // The full sheet never renders, so nothing private sits hidden in the DOM.
  if (!isOwner) return <LimitedView actor={actor} />

  // A group is a different kind of sheet entirely — shared ratings and a roster
  // rather than a character — so it gets its own component.
  if (actor.type === 'group') {
    return (
      <GroupApp actor={actor} editable={editable} locked={locked} onToggleLock={toggleLock} />
    )
  }

  // Computed after the snapshot is unpacked — `actor` does not exist before it.
  const splat = splatOf(actor)
  const storyType = storyCharacterType(actor)
  const tabs = ALL_TABS.filter((entry) => splat.tabs.includes(entry.id))
  // Switching an actor's type, or opening a mortal on a remembered tab, must
  // not leave the sheet pointing at a tab this splat does not have.
  const activeTab = tabs.some((entry) => entry.id === tab) ? tab : storyType ? 'stats' : tabs[0]?.id

  return (
    <div className={`bo-app ${splatClass(actor)}`}>
      <Header
        actor={actor}
        editable={editable}
        locked={locked}
        onToggleLock={toggleLock}
        splat={splat}
        onQuickRoll={() => storyType ? setStoryRoll(true) : setRollSlots([null, null, null])}
        onResistFrenzy={() => resistFrenzy(actor)}
      />

      <nav className="bo-tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={t.id === activeTab ? 'bo-tab bo-tab-active' : 'bo-tab'}
          >
            {t.id === 'notes' && storyType ? 'Notes' : t.label}
          </button>
        ))}
      </nav>

      <div style={{ flex: 1 }}>
        {activeTab === 'stats' ? (
          <StatisticsTab
            actor={actor}
            editable={editable}
            locked={locked}
            onRoll={(entry) => setRollSlots([toSlot(entry), null, null])}
            onRouse={() => rouseCheck(actor)}
            onRollWillpower={() =>
              WOD5E.api.Roll({
                basicDice: Math.max(willpowerPool(actor), 1),
                disableAdvancedDice: true,
                actor,
                data: actor.system,
                title: game.i18n.localize('WOD5E.Chat.RollingWillpower'),
                flavor: actor.type === 'werewolf' ? werewolfRollFlavor({ flavor: '', frenzy: true }) : '',
                selectors: ['willpower'],
                quickRoll: true
              })
            }
          />
        ) : null}
        {activeTab === 'bio' ? <BiographyTab actor={actor} editable={editable} /> : null}
        {activeTab === 'blood' ? <BloodTab actor={actor} editable={editable} locked={locked} /> : null}
        {activeTab === 'creed' ? <CreedTab actor={actor} editable={editable} /> : null}
        {activeTab === 'disciplines' ? <DisciplinesTab actor={actor} editable={editable} locked={locked} /> : null}
        {activeTab === 'edges' ? <EdgesTab actor={actor} editable={editable} locked={locked} onRoll={setEdgePool} /> : null}
        {activeTab === 'gifts' ? <StoryGiftsTab actor={actor} editable={editable} locked={locked} /> : null}
        {activeTab === 'forms' ? <GarouTab actor={actor} editable={editable} /> : null}
        {activeTab === 'garou-identity' ? <GarouIdentityTab actor={actor} /> : null}
        {activeTab === 'garou-powers' ? <GarouPowersTab actor={actor} editable={editable} /> : null}
        {activeTab === 'merits' ? <MeritsFlawsTab actor={actor} editable={editable} locked={locked} /> : null}
        {activeTab === 'inventory' ? <InventoryTab actor={actor} editable={editable} /> : null}
        {activeTab === 'notes' ? <NotesTab actor={actor} editable={editable} /> : null}
      </div>

      {storyRoll ? <StoryQuickRoll actor={actor} editable={editable} onClose={() => setStoryRoll(false)} /> : null}
      {rollSlots || edgePool ? (
        <RollPanel
          actor={actor}
          editable={editable}
          initialSlots={rollSlots}
          edgePool={edgePool}
          onClose={() => {
            setRollSlots(null)
            setEdgePool(null)
          }}
        />
      ) : null}
    </div>
  )
}
