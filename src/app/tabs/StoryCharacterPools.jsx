import { useState } from 'react'
import LibraryPicker from '../components/LibraryPicker.jsx'
import { GhostButton, Modal, SectionTitle } from '../components/primitives.jsx'
import Stepper from '../components/Stepper.jsx'
import StoryRating from '../components/StoryRating.jsx'
import StoryAbility from '../components/StoryAbility.jsx'
import { rollStoryPool } from '../roll/story-character.js'

const STANDARD = [
  ['physical', 'Physical'], ['social', 'Social'], ['mental', 'Mental']
]

const GENERAL = [
  ['normal', 'Normal'], ['strongest', 'Strongest']
]

export default function StoryCharacterPools({ actor, editable, locked }) {
  const [adding, setAdding] = useState(false)
  const canEdit = editable && !locked
  const skills = Object.entries(actor.system.exceptionaldicepools ?? {})
    .filter(([, entry]) => !entry.hidden)
    .map(([id, entry]) => ({ id, name: entry.displayName || game.i18n.localize(entry.label ?? id), active: entry.active }))
  const exceptional = skills.filter(({ active }) => active)
  const canAdd = canEdit && skills.some(({ active }) => !active)

  return (
    <section className="bo-spc-pools">
      <SectionTitle actions={canAdd ? (
        <GhostButton tone="accent" onClick={() => setAdding(true)}>+ Exceptional skill</GhostButton>
      ) : null}>Dice pools</SectionTitle>

      <div className="bo-spc-pool-grid">
        <div className="bo-spc-standard">
          <div className="bo-label">Standard</div>
          <div className="bo-spc-pool-ratings">
            {STANDARD.map(([id, label]) => (
              <StoryRating key={id} actor={actor} path={'system.standarddicepools.' + id + '.value'}
                label={label} editable={canEdit}
                onRoll={editable ? (dice) => rollStoryPool(actor, { label, dice, selectors: [id] }) : null} />
            ))}
          </div>
        </div>
        {actor.system.settings?.generalDifficultyEnabled !== false ? (
          <div className="bo-spc-difficulty">
            <div className="bo-label" title="Use these ratings as difficulties against this NPC. Roll to oppose with twice the rating in dice.">
              General difficulty
            </div>
            <div className="bo-spc-pool-ratings">
              {GENERAL.map(([id, label]) => (
                <StoryRating key={id} actor={actor} path={'system.generaldifficulty.' + id}
                  label={label} editable={canEdit}
                  onRoll={editable ? (value) => rollStoryPool(actor, { label, dice: value * 2 }) : null} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {exceptional.length ? (
        <div className="bo-spc-exceptional">
          <div className="bo-label">Exceptional</div>
          <div className="bo-spc-pool-ratings">
            {exceptional.map(({ id, name }) => (
              <StoryRating actor={actor} path={'system.exceptionaldicepools.' + id + '.value'}
                key={id} label={name} editable={canEdit}
                action={canEdit ? (
                  <button className="bo-mini" type="button" title={'Remove ' + name}
                    aria-label={'Remove ' + name} onClick={() => actor.update({ ['system.exceptionaldicepools.' + id + '.active']: false })}>×</button>
                ) : null}
                onRoll={editable ? (dice) => rollStoryPool(actor, { label: name, dice, selectors: ['skills', 'skills.' + id] }) : null} />
            ))}
          </div>
        </div>
      ) : null}

      {adding && canEdit ? (
        <LibraryPicker title="Choose an exceptional skill" onClose={() => setAdding(false)}
          entries={skills.map(({ id, name, active }) => ({ id, name, disabled: active }))}
          onAdd={async ({ id }) => {
            await actor.update({ ['system.exceptionaldicepools.' + id + '.active']: true })
            setAdding(false)
          }} />
      ) : null}
    </section>
  )
}

export function StoryQuickRoll({ actor, editable, onClose }) {
  const [dice, setDice] = useState(1)
  const [difficulty, setDifficulty] = useState(0)
  const [rolling, setRolling] = useState(false)

  async function roll() {
    setRolling(true)
    try {
      if (await rollStoryPool(actor, { label: 'Quick roll', dice, difficulty })) onClose()
    } finally {
      setRolling(false)
    }
  }

  return (
    <Modal title="Quick roll" onClose={rolling ? undefined : onClose}>
      <div className="bo-roll-footer">
        <Stepper label="Dice" value={dice} min={1} onChange={setDice} disabled={rolling} />
        <Stepper label="Difficulty" value={difficulty} min={0} onChange={setDifficulty} disabled={rolling} />
        <div className="bo-roll-actions">
          <GhostButton onClick={onClose} disabled={rolling}>Cancel</GhostButton>
          <button type="button" className="bo-solid" onClick={roll} disabled={!editable || rolling}>
            {rolling ? 'Rolling…' : 'Roll'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export function StoryTraits({ actor, editable }) {
  const traits = actor.items.filter((item) => item.type === 'trait')

  async function add() {
    const [item] = await actor.createEmbeddedDocuments('Item', [{ name: 'New Trait', type: 'trait' }])
    if (item) await item.sheet.render({ force: true })
  }

  if (!editable && !traits.length) return null

  return (
    <section className="bo-spc-abilities">
      <SectionTitle actions={editable ? <GhostButton tone="accent" onClick={add}>+ Add trait</GhostButton> : null}>
        NPC traits
      </SectionTitle>
      {traits.map((item) => (
        <StoryAbility key={item.id} actor={actor} item={item} dice={Number(item.system.dice) || 0}
          selectors={['traits']} editable={editable} canRoll={editable} />
      ))}
      {!traits.length ? <p className="bo-spc-empty">No NPC traits recorded.</p> : null}
    </section>
  )
}
