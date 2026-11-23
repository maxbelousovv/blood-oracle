import Select from '../components/Select.jsx'
import Stepper from '../components/Stepper.jsx'

const SHOTS = ['', 'Heart', 'Neck', 'Other'].map((value) => ({ value, label: value || 'None' }))
const optionsFor = (items, empty) => [
  { value: '', label: empty },
  ...items.map(({ id, name }) => ({ value: id, label: name }))
]

export default function HunterEquipmentRoll({ equipment, choice, update, disabled }) {
  const { ranges, weapons, weapon, ammoOptions, ammo, gear, calledShot, canCallShot } = equipment
  if (!canCallShot && !gear.length) return null

  return (
    <div className="bo-block">
      <div className="bo-label">Equipment &amp; attack</div>
      <div className="bo-pair-grid">
        {weapons.length === 1 ? (
          <label className="bo-toggle">
            <input type="checkbox" checked={Boolean(weapon)} disabled={disabled}
              onChange={(event) => update({ weaponId: event.target.checked ? weapons[0].id : '', ammoId: '' })} />
            <span>Use weapon</span>
            <span className="bo-toggle-note">{weapons[0].name}</span>
          </label>
        ) : ranges.length ? (
          <label className="bo-field-label">
            <span>Weapon</span>
            <Select value={weapon?.id ?? ''} options={optionsFor(weapons, weapons.length ? 'None' : 'No equipped weapon')}
              disabled={disabled || !weapons.length} onChange={(weaponId) => update({ weaponId, ammoId: '' })} />
          </label>
        ) : null}
        {ammoOptions.length ? (
          <label className="bo-field-label">
            <span>Ammunition</span>
            <Select value={ammo?.id ?? ''} options={optionsFor(ammoOptions, 'Standard')}
              disabled={disabled} onChange={(ammoId) => update({ ammoId })} />
          </label>
        ) : null}
        {canCallShot ? (
          <label className="bo-field-label">
            <span>Called shot</span>
            <Select value={calledShot ?? ''} options={SHOTS} disabled={disabled}
              onChange={(calledShot) => update({ calledShot, calledShotDice: 0 })} />
          </label>
        ) : null}
        {calledShot ? (
          <div>
            <Stepper label="Called shot dice" value={choice.calledShotDice ?? 0} min={-10} max={0}
              disabled={disabled} onChange={(calledShotDice) => update({ calledShotDice })} />
            <p className="bo-roll-note">Use the Storyteller’s penalty, or adjust Difficulty below.</p>
          </div>
        ) : null}
      </div>
      {gear.map(({ item, dice, when }) => (
        <label className="bo-toggle" key={item.id}>
          <input type="checkbox" disabled={disabled} checked={choice.gearIds?.includes(item.id) ?? false}
            onChange={(event) => update({
              gearIds: event.target.checked
                ? [...(choice.gearIds ?? []), item.id]
                : choice.gearIds.filter((id) => id !== item.id)
            })} />
          <span>{item.name} +{dice}</span>
          <span className="bo-toggle-note">{when}</span>
        </label>
      ))}
    </div>
  )
}
