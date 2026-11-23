import { useState } from 'react'
import { GhostButton, Modal, SectionTitle } from '../components/primitives.jsx'
import GarouTouchstones from '../components/GarouTouchstones.jsx'
import PrinciplesEditor from '../components/PrinciplesEditor.jsx'
import { clanNames, predatorNames, isLoaded } from '../rules/catalog.js'
import { CREEDS, findCreed } from '../rules/creeds.js'
import { DRIVES, findDrive } from '../rules/drives.js'
import { AUSPICES, TRIBES, findGarouIdentity, garouIdentityData } from '../rules/garou-identity.js'
import { readSingleton, readSingletonName, setSingleton } from '../schema/singletons.js'
import { changePredator, predatorTableNames } from '../schema/predator-grants.js'
import PredatorGrantsDialog from '../components/PredatorGrantsDialog.jsx'
import Dropdown from '../components/Select.jsx'
import { MODULE_ID } from '../../constants.js'
import { storyCharacterType } from '../splats.js'

const GENERATIONS = [
  '4th', '5th', '6th', '7th', '8th', '9th', '10th',
  '11th', '12th', '13th', '14th', '15th', '16th'
]

const SECTS = ['Camarilla', 'Anarch', 'Sabbat', 'Autarkis / Independent']

const OTHER = '__other__'

/**
 * Uncontrolled text field committed on blur. `key` is tied to the stored value
 * so an external change (another client, an import) refreshes the input, while
 * typing is never interrupted mid-word by a re-render.
 */
function Field({ label, value, onCommit, editable, multiline = false, rows = 8, placeholder }) {
  const commit = (event) => {
    if (event.target.value !== (value ?? '')) onCommit(event.target.value)
  }

  return (
    <label className="bo-field-label">
      <span>{label}</span>
      {multiline ? (
        <textarea
          className="bo-field"
          rows={rows}
          style={{ resize: 'vertical' }}
          defaultValue={value ?? ''}
          disabled={!editable}
          placeholder={placeholder}
          onBlur={commit}
          key={value}
        />
      ) : (
        <input
          type="text"
          className="bo-field"
          defaultValue={value ?? ''}
          disabled={!editable}
          placeholder={placeholder}
          onBlur={commit}
          key={value}
        />
      )}
    </label>
  )
}

function Select({ label, value, options, editable, onChange, placeholder = '—' }) {
  return (
    <label className="bo-field-label">
      <span>{label}</span>
      <Dropdown
        value={value ?? ''}
        disabled={!editable}
        options={[{ value: '', label: placeholder }, ...options.map((entry) => typeof entry === 'string' ? { value: entry, label: entry } : entry)]}
        onChange={onChange}
      />
    </label>
  )
}

function GarouIdentityField({ actor, item, label, type, entries, editable }) {
  const current = item?.name ?? ''
  const preset = findGarouIdentity(entries, current)
  const [custom, setCustom] = useState(null)
  const [saving, setSaving] = useState(false)
  const options = entries.map(({ name }) => name)
  if (current && !preset) options.unshift(current)
  if (editable) options.push({ value: OTHER, label: 'Custom…' })

  async function save(name) {
    setSaving(true)
    try {
      const entry = findGarouIdentity(entries, name)
      const value = entry?.name ?? name.trim()
      if (value !== (preset?.name ?? current)) {
        const useDefaults = entry || preset || !item
        await setSingleton(actor, type, value, useDefaults ? { system: garouIdentityData(type, entry) } : {})
      }
      setCustom(null)
    } catch (error) {
      console.error('Blood Oracle | Could not set Garou identity', error)
      ui.notifications.error('Could not save ' + label + '.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <Select label={label} value={preset?.name ?? current} options={options}
        editable={editable && !saving} placeholder={'Choose ' + label + '…'}
        onChange={(name) => name === OTHER ? setCustom(preset ? '' : current) : save(name)} />
      {custom !== null ? (
        <Modal title={'Custom ' + label} onClose={saving ? undefined : () => setCustom(null)}>
          <form onSubmit={(event) => { event.preventDefault(); if (!saving && custom.trim()) save(custom) }}>
            <label className="bo-field-label">
              <span>Name</span>
              <input autoFocus type="text" className="bo-field" value={custom} disabled={saving}
                onChange={(event) => setCustom(event.target.value)} required />
            </label>
            <div className="bo-roll-footer">
              <div className="bo-roll-actions">
                <GhostButton disabled={saving} onClick={() => setCustom(null)}>Cancel</GhostButton>
                <button className="bo-solid" disabled={saving || !custom.trim()} type="submit">Save</button>
              </div>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  )
}

/** Predator type, with a free-text escape hatch for homebrew. */
function PredatorField({ actor, editable }) {
  const current = readSingletonName(actor, 'predatorType')
  // The grant table ships with the module, so its predators are listed even
  // without the rules reference installed.
  const known = [...new Set([...predatorNames(), ...predatorTableNames()])]
  const isKnown = !current || known.includes(current)
  const [other, setOther] = useState(!isKnown)
  const [granting, setGranting] = useState(null)

  const choose = async (name) => {
    if (String(name ?? '').trim() === current) return
    const predator = await changePredator(actor, name)
    if (predator) setGranting(predator)
  }

  return (
    <div>
      <label className="bo-field-label">
        <span>Predator type</span>
        {other ? (
          <input
            type="text"
            className="bo-field"
            defaultValue={isKnown ? '' : current}
            disabled={!editable}
            placeholder="Homebrew predator type"
            onBlur={(event) => choose(event.target.value)}
          />
        ) : (
          <Dropdown
            value={isKnown ? current : ''}
            disabled={!editable}
            options={[
              { value: '', label: 'Choose predator type…' },
              ...known.map((entry) => ({ value: entry, label: entry })),
              { value: OTHER, label: 'Other (custom)…', muted: true }
            ]}
            onChange={(value) => {
              if (value === OTHER) {
                setOther(true)
                if (isKnown) choose('')
                return
              }
              choose(value)
            }}
          />
        )}
      </label>

      {other && editable ? (
        <button
          type="button"
          className="bo-trait-name"
          style={{ color: 'var(--bo-text-faint)', fontSize: '13px', marginTop: '4px' }}
          onClick={() => setOther(false)}
        >
          back to the list
        </button>
      ) : null}

      {granting ? (
        <PredatorGrantsDialog actor={actor} predator={granting} onClose={() => setGranting(null)} />
      ) : null}
    </div>
  )
}

function Portrait({ actor, editable }) {
  const browse = async () => {
    if (!editable) return
    const picker = new foundry.applications.apps.FilePicker.implementation({
      type: 'image',
      current: actor.img || '',
      callback: (path) => actor.update({ img: path })
    })
    await picker.browse()
  }

  return (
    <div className="bo-field-label">
      <span>Portrait</span>
      <button
        type="button"
        className="bo-portrait-slot is-large"
        onClick={browse}
        disabled={!editable}
      >
        {actor.img ? <img src={actor.img} alt="" /> : <span>Click to upload</span>}
      </button>
    </div>
  )
}

export default function BiographyTab({ actor, editable }) {
  const storyType = storyCharacterType(actor)
  const type = storyType ?? actor.type
  const vampire = type === 'vampire'
  const hunter = type === 'hunter'
  const spirit = type === 'spirit'
  const werewolf = actor.type === 'werewolf'
  const tribe = werewolf ? readSingleton(actor, 'tribe') : null
  const tribePreset = findGarouIdentity(TRIBES, tribe?.name)
  const patron = tribe?.system?.patronSpirit
  const creed = hunter ? readSingleton(actor, 'creed') : null
  const standardCreed = findCreed(creed?.name)
  const creedOptions = CREEDS.map(({ name }) => name)
  if (creed && !standardCreed) creedOptions.unshift(creed.name)
  const drive = hunter ? readSingleton(actor, 'drive') : null
  const standardDrive = findDrive(drive?.name)
  const driveOptions = DRIVES.map(({ name }) => name)
  if (drive && !standardDrive) driveOptions.unshift(drive.name)
  const headers = actor.system.headers ?? {}
  const set = (path) => (value) => actor.update({ [path]: value })

  return (
    <div className="bo-biography">
      <SectionTitle>Identity</SectionTitle>
      <div className="bo-identity">
        <Portrait actor={actor} editable={editable} />

        <div className="bo-pair-grid">
          <Field
            label="Name"
            value={actor.name}
            editable={editable}
            onCommit={(value) => actor.update({ name: value })}
          />
          <Field
            label="Concept"
            value={headers.concept}
            editable={editable}
            placeholder="e.g. Disgraced surgeon"
            onCommit={set('system.headers.concept')}
          />
          <Field
            label="Chronicle"
            value={headers.chronicle}
            editable={editable}
            onCommit={set('system.headers.chronicle')}
          />

          {vampire ? <>
          {isLoaded() ? (
            <Select
              label="Clan"
              value={readSingletonName(actor, 'clan')}
              options={clanNames()}
              editable={editable}
              placeholder="Choose clan…"
              onChange={(value) => setSingleton(actor, 'clan', value)}
            />
          ) : (
            // Without the reference there is no clan list, so it is typed.
            <Field
              label="Clan"
              value={readSingletonName(actor, 'clan')}
              editable={editable}
              onCommit={(value) => setSingleton(actor, 'clan', value)}
            />
          )}

          {!storyType ? <PredatorField actor={actor} editable={editable} /> : null}

          <Field
            label="Sire"
            value={headers.sire}
            editable={editable}
            onCommit={set('system.headers.sire')}
          />

          {/* The system's headers have no sect or title, so both live in flags. */}
          <Select
            label="Sect"
            value={actor.getFlag(MODULE_ID, 'sect') ?? ''}
            options={SECTS}
            editable={editable}
            onChange={(value) => actor.setFlag(MODULE_ID, 'sect', value)}
          />
          <Select
            label="Generation"
            value={headers.generation}
            options={GENERATIONS}
            editable={editable}
            placeholder="Choose generation…"
            onChange={set('system.headers.generation')}
          />
          <Field
            label="Title"
            value={actor.getFlag(MODULE_ID, 'title') ?? ''}
            editable={editable}
            placeholder="Sheriff, Harpy, Prince, Hound…"
            onCommit={(value) => actor.setFlag(MODULE_ID, 'title', value)}
          />
          </> : null}
          {type === 'ghoul' ? (
            <Field label="Domitor" value={headers.domitor} editable={editable}
              onCommit={set('system.headers.domitor')} />
          ) : null}
          {werewolf ? <>
            <GarouIdentityField actor={actor} label="Auspice" type="auspice" entries={AUSPICES}
              item={readSingleton(actor, 'auspice')} editable={editable} />
            <GarouIdentityField actor={actor} label="Tribe" type="tribe" entries={TRIBES}
              item={tribe} editable={editable} />
            <Field label="Patron Spirit" value={patron?.name || tribePreset?.patron} editable={editable && Boolean(tribe)}
              placeholder={tribe ? undefined : 'Set a Tribe first'}
              onCommit={(value) => tribe.update({ 'system.patronSpirit.name': value })} />
          </> : null}
          {hunter ? <>
            <div>
              <Select
                label="Creed"
                value={standardCreed?.name ?? creed?.name}
                options={creedOptions}
                editable={editable}
                placeholder="Choose Creed…"
                onChange={(name) => {
                  const selected = findCreed(name)
                  return setSingleton(actor, 'creed', name,
                    selected ? { system: { desperationFields: selected.field } } : {})
                }}
              />
            </div>
            <div>
              <Select
                label="Drive"
                value={standardDrive?.name ?? drive?.name}
                options={driveOptions}
                editable={editable}
                placeholder="Choose Drive…"
                onChange={(name) => {
                  const selected = findDrive(name)
                  return setSingleton(actor, 'drive', name,
                    selected ? { system: { redemption: selected.redemption } } : {})
                }}
              />
            </div>
          </> : null}
        </div>
      </div>

      {tribe ? (
        <div style={{ marginTop: '30px' }}>
          <SectionTitle>Favor &amp; Ban</SectionTitle>
          <div className="bo-pair-grid">
            <Field label="Favor" value={patron?.favor || tribePreset?.favor} editable={editable} multiline rows={4}
              onCommit={(value) => tribe.update({ 'system.patronSpirit.favor': value })} />
            <Field label="Ban" value={patron?.ban || tribePreset?.ban} editable={editable} multiline rows={4}
              onCommit={(value) => tribe.update({ 'system.patronSpirit.ban': value })} />
          </div>
        </div>
      ) : null}

      {!spirit ? <div style={{ marginTop: '30px' }}>
        <SectionTitle>Vital records</SectionTitle>
        <div className={vampire ? 'bo-quad-grid' : 'bo-pair-grid'}>
          <Field
            label={vampire ? 'Age (real)' : 'Age'}
            value={actor.system.bio?.age?.trueage || (!vampire ? actor.system.bio?.age?.apparent : undefined)}
            editable={editable}
            placeholder={vampire ? 'e.g. 312' : 'e.g. 28'}
            onCommit={(value) => actor.update({
              'system.bio.age.trueage': value,
              ...(!vampire && !value ? { 'system.bio.age.apparent': '' } : {})
            })}
          />
          {vampire ? <Field
            label="Apparent age"
            value={actor.system.bio?.age?.apparent}
            editable={editable}
            placeholder="e.g. 28"
            onCommit={set('system.bio.age.apparent')}
          /> : null}
          <Field
            label="Date of birth"
            value={actor.system.bio?.dateof?.birth}
            editable={editable}
            placeholder="YYYY-MM-DD or 1714"
            onCommit={set('system.bio.dateof.birth')}
          />
          {vampire ? <Field
            label="Date of Embrace"
            value={actor.system.bio?.dateof?.death}
            editable={editable}
            placeholder="Date of Embrace"
            onCommit={set('system.bio.dateof.death')}
          /> : null}
        </div>
      </div> : null}

      <div style={{ marginTop: '30px' }}>
        <SectionTitle>Biography &amp; appearance</SectionTitle>
        <div className="bo-pair-grid">
          <Field
            label="Biography"
            value={actor.system.biography}
            editable={editable}
            multiline
            placeholder={vampire ? 'Mortal life, the Embrace, what happened since…' : hunter ? 'Personal history and how the hunt began…' : 'Personal history…'}
            onCommit={set('system.biography')}
          />
          <Field
            label="Appearance"
            value={actor.system.appearance}
            editable={editable}
            multiline
            placeholder="Physical description — face, build, voice, style of dress, distinguishing marks…"
            onCommit={set('system.appearance')}
          />
        </div>
        {spirit ? (
          <div style={{ marginTop: '14px' }}>
            <Field label="Possession & manifestation" value={actor.system.manifestation} editable={editable}
              multiline rows={4} onCommit={set('system.manifestation')} />
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: '30px' }}>
        <SectionTitle>Goals</SectionTitle>
        <div className="bo-pair-grid">
          <Field
            label="Ambition"
            value={headers.ambition}
            editable={editable}
            multiline
            rows={4}
            placeholder="Long-term goal"
            onCommit={set('system.headers.ambition')}
          />
          <Field
            label="Desire"
            value={headers.desire}
            editable={editable}
            multiline
            rows={4}
            placeholder="Short-term want"
            onCommit={set('system.headers.desire')}
          />
        </div>
      </div>

      {!vampire ? (
        <div style={{ marginTop: '30px' }}>
          <SectionTitle info="The shared principles that set the tone for this chronicle.">Chronicle tenets</SectionTitle>
          <Field label="Tenets" value={headers.tenets} editable={editable} multiline rows={4}
            placeholder="The chronicle’s shared principles…" onCommit={set('system.headers.tenets')} />
          {hunter && !storyType ? <div style={{ marginTop: '22px' }}>
            <SectionTitle info="Choose one to three Touchstones at character creation. Without a Touchstone, the Hunter stays in Despair and cannot recover Willpower. Discuss replacements with the Storyteller.">Touchstones</SectionTitle>
            <PrinciplesEditor actor={actor} editable={editable} hunter />
          </div> : null}
          {werewolf ? <div style={{ marginTop: '22px' }}>
            <GarouTouchstones actor={actor} editable={editable} />
          </div> : null}
        </div>
      ) : <div style={{ marginTop: '30px' }}>
        <SectionTitle
          info="Tenets are the chronicle's baseline; Principles pair a personal Conviction with the mortal who anchors it. Breaking a Tenet causes Stains. A Conviction only holds while a mortal Touchstone anchors it — if that mortal dies, the Conviction is lost. A starting character has up to three."
        >
          Tenets &amp; principles
        </SectionTitle>
        <Field
          label="Chronicle tenets"
          value={headers.tenets}
          editable={editable}
          multiline
          rows={4}
          placeholder="The chronicle's shared moral principles (set by Storyteller). Breaking these causes Stains…"
          onCommit={set('system.headers.tenets')}
        />
        <PrinciplesEditor actor={actor} editable={editable} />
      </div>}
    </div>
  )
}
