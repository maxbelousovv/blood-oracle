import { hunterTouchstones } from '../schema/touchstones.js'
import { useState } from 'react'
import { GhostButton } from './primitives.jsx'
import { MODULE_ID } from '../../constants.js'

const MAX_PRINCIPLES = 3

/**
 * Convictions paired with the mortal Touchstone that anchors each one.
 *
 * Stored only in module flags. The obvious mirror, `headers.touchstones`, is
 * deliberately not written: the system's own limited sheet renders that field
 * to any player who opens the character, and a Touchstone is the name of a
 * mortal someone loves — the most blackmailable line on the sheet.
 */
export function readPrinciples(actor) {
  const stored = actor.getFlag(MODULE_ID, 'principles')
  return Array.isArray(stored) ? stored : []
}

export function PortraitSlot({ path, editable, onPick, label = 'Portrait' }) {
  const browse = async () => {
    if (!editable) return
    // Foundry's own picker, so images live as files rather than base64 blobs
    // in the document — which is how the standalone app had to do it.
    const picker = new foundry.applications.apps.FilePicker.implementation({
      type: 'image',
      current: path || '',
      callback: (result) => onPick(result)
    })
    await picker.browse()
  }

  return (
    <div className="bo-field-label" style={{ width: '92px', flex: 'none' }}>
      <span>{label}</span>
      <button
        type="button"
        className="bo-portrait-slot"
        onClick={browse}
        disabled={!editable}
        title={editable ? 'Choose an image' : undefined}
      >
        {path ? <img src={path} alt="" /> : <span>upload portrait</span>}
      </button>
    </div>
  )
}

export default function PrinciplesEditor({ actor, editable, hunter = false }) {
  const principles = hunter ? hunterTouchstones(actor) : readPrinciples(actor)
  const write = (entries) => actor.setFlag(MODULE_ID, hunter ? 'hunterTouchstones' : 'principles', entries)
  const [confirming, setConfirming] = useState(null)

  const update = (index, field, value) => {
    write(
      principles.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry))
    )
  }

  const add = () => {
    if (!hunter && principles.length >= MAX_PRINCIPLES) return
    write([...principles, { conviction: '', touchstone: '', portrait: '' }])
  }

  const remove = (index) => {
    write(principles.filter((_, i) => i !== index))
    setConfirming(null)
  }

  return (
    <div style={{ marginTop: '18px' }}>
      <div className="bo-row" style={{ marginBottom: '10px' }}>
        <div className="bo-label" style={{ margin: 0 }}>
          {hunter ? "Connections" : "Principles"}
        </div>
        {editable ? (
          <GhostButton
            tone="accent"
            onClick={add}
            disabled={!hunter && principles.length >= MAX_PRINCIPLES}
            title={
              !hunter && principles.length >= MAX_PRINCIPLES
                ? 'Three Principles is the maximum'
                : hunter ? 'Add a Touchstone' : 'Add a Conviction and Touchstone pair'
            }
          >
            {hunter ? "+ Add Touchstone" : "+ Add principle"}
          </GhostButton>
        ) : null}
      </div>

      {!principles.length ? (
        <p className="bo-empty" style={{ textAlign: 'left' }}>
          {hunter ? 'With no Touchstones, the Hunter is in Despair and cannot recover Willpower.' : "No principles yet. A Kindred's moral lines only hold weight while a mortal Touchstone anchors them — add a pair to begin."}
        </p>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {principles.map((entry, index) => (
            <div key={index} className="bo-panel">
              <div className="bo-row" style={{ marginBottom: '10px' }}>
                <div className="bo-principle-number">
                  {hunter ? "Touchstone" : "Principle"} {index + 1} of {principles.length}
                </div>
                {editable ? (
                  confirming === index ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <GhostButton tone="danger" onClick={() => remove(index)}>
                        Confirm
                      </GhostButton>
                      <GhostButton onClick={() => setConfirming(null)}>Keep</GhostButton>
                    </div>
                  ) : (
                    <GhostButton tone="danger" onClick={() => setConfirming(index)}>
                      × Remove
                    </GhostButton>
                  )
                ) : null}
              </div>

              <div className={hunter ? 'bo-principle-body is-hunter' : 'bo-principle-body'} style={hunter ? { gridTemplateColumns: "minmax(0, 1fr) auto" } : undefined}>
                {!hunter ? <>
                <label className="bo-field-label">
                  <span>Conviction</span>
                  <textarea
                    className="bo-field"
                    rows={4}
                    style={{ resize: 'vertical' }}
                    key={entry.conviction}
                    defaultValue={entry.conviction}
                    disabled={!editable}
                    placeholder="A personal moral line the character won't cross…"
                    onBlur={(event) => update(index, 'conviction', event.target.value)}
                  />
                </label>

                {/* The bond between a Conviction and the mortal who anchors it. */}
                <div className="bo-principle-bond" aria-hidden="true">
                  ∞
                </div>
                </> : null}

                <label className="bo-field-label">
                  <span>Touchstone</span>
                  <textarea
                    className="bo-field"
                    rows={4}
                    style={{ resize: 'vertical' }}
                    key={entry.touchstone}
                    defaultValue={entry.touchstone}
                    disabled={!editable}
                    placeholder={hunter ? "Name, relationship, why they matter…" : "The mortal who anchors this conviction — name, relationship, why they matter…"}
                    onBlur={(event) => update(index, 'touchstone', event.target.value)}
                  />
                </label>

                <PortraitSlot
                  path={entry.portrait}
                  editable={editable}
                  onPick={(value) => update(index, 'portrait', value)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
