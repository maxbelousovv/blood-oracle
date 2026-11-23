import LibraryPicker from '../components/LibraryPicker.jsx'
import RulesReference from '../components/RulesReference.jsx'
import { useState } from 'react'
import { SectionTitle, LabelledValue, GhostButton } from '../components/primitives.jsx'
import {
  SECTIONS,
  GEAR_PLACES,
  gearPlace,
  setGearPlace,
  itemsOfSection,
  isEquipped,
  setEquipped,
  armorRating,
  armorUpdate,
  buildArmorData,
  buildItemData,
  weaponClass,
  weaponUpdate,
  buildWeaponData
} from '../schema/inventory.js'
import WeaponDialog from '../components/WeaponDialog.jsx'
import ArmorDialog from '../components/ArmorDialog.jsx'
import Select from '../components/Select.jsx'
import { MODULE_ID } from '../../constants.js'
import { HUNTER_AMMO } from '../roll/hunter-equipment.js'
import { getHunterEquipmentText } from '../rules/catalog.js'
import {
  HUNTER_ARMOR_RULE,
  HUNTER_EQUIPMENT,
  HUNTER_WEAPON_RULE,
  buildHunterEquipment,
  hunterWeaponRange
} from '../rules/hunter-equipment.js'


const HUNTER_SECTIONS = SECTIONS.flatMap((section) => section.id === 'weapon' ? [
  { ...section, label: 'Melee Weapons', range: 'melee' },
  { ...section, label: 'Ranged Weapons', range: 'ranged' }
] : [section])

function EquipmentReference({ id, title = "Equipment rules", inline }) {
  const text = getHunterEquipmentText(id)
  if (!text) return null
  return (
    <RulesReference title={title} source="Core Rulebook" inline={inline}>
      <div className="bo-prose" style={{ whiteSpace: 'pre-line' }}>{text}</div>
    </RulesReference>
  )
}

function HunterEquipment({ section, onAdd, onCustom, onClose }) {
  const entries = HUNTER_EQUIPMENT.filter((entry) => {
    if (entry.type !== section.id || section.place === GEAR_PLACES.property) return false
    return !section.range || hunterWeaponRange(entry) === section.range
  })
  return (
    <LibraryPicker title={section.label} entries={entries} onClose={onClose}
      onAdd={async (entry) => { await onAdd(entry); onClose() }}
      custom={<GhostButton onClick={onCustom}>+ Custom item</GhostButton>}
      renderDetails={(entry) => (
        <>
          {entry.damage != null ? <LabelledValue label="Damage" value={`+${entry.damage}`} /> : null}
          {entry.rating != null ? <LabelledValue label="Armor" value={entry.rating} /> : null}
        </>
      )}
      renderRules={(entry) => entry.type === 'gear' ? <EquipmentReference inline key={entry.id} id={entry.reference} title={entry.name} /> : null} />
  )
}

function Detail({ item, editable, hunter, onDelete, onEditWeapon, onEditArmor }) {
  const section = item.type
  const rating = armorRating(item)
  const wclass = section === 'weapon' ? weaponClass(item) : null
  const template = hunter && HUNTER_EQUIPMENT.find(({ id }) => id === item.getFlag(MODULE_ID, 'hunterEquipment'))
  const specialWeapon = template && section === 'weapon' && !template.classId

  return (
    <div className="bo-panel">
      <div className="bo-row" style={{ alignItems: 'flex-start' }}>
        <div>
          <h3 className="bo-detail-title">{item.name}</h3>
          <p className="bo-detail-sub">
            {section}
            {isEquipped(item) ? ' · equipped' : ''}
          </p>
        </div>
        {editable ? (
          <div style={{ display: 'flex', gap: '6px' }}>
            {section === 'weapon' && !specialWeapon ? <GhostButton onClick={onEditWeapon}>Edit</GhostButton> : null}
            {section === 'armor' ? <GhostButton onClick={onEditArmor}>Edit</GhostButton> : null}
            <GhostButton tone="danger" onClick={onDelete}>
              Remove
            </GhostButton>
          </div>
        ) : null}
      </div>

      {section === 'weapon' ? (
        <div className="bo-scalars" style={{ marginBottom: '14px' }}>
          <LabelledValue label="Range" value={item.system.weaponType === 'ranged' ? 'Ranged' : 'Melee'} />
          <LabelledValue label="Class" value={specialWeapon ? 'Special weapon' : wclass?.label ?? '—'} />
          <LabelledValue label="Damage" value={specialWeapon && template.damage == null
            ? 'See properties'
            : `+${Number(item.system.weaponvalue) || 0}`} />
        </div>
      ) : null}

      {section === 'armor' ? (
        <div className="bo-scalars" style={{ marginBottom: '14px' }}>
          <LabelledValue label="Class" value={rating?.label ?? '—'} />
          <LabelledValue label="Armour" value={rating ? String(rating.dice) : '—'} />
          <LabelledValue
            label="Against bullets"
            value={rating ? String(rating.vsBullets ?? rating.dice) : '—'}
          />
          <LabelledValue label="Dexterity" value={rating?.dexPenalty ? `−${rating.dexPenalty} die` : '—'} />
        </div>
      ) : null}

      {hunter && section === 'weapon' ? (
        <div className="bo-block">
          <label className="bo-field-label">
            <span>Properties</span>
            <textarea className="bo-field" rows={3} disabled={!editable}
              key={item.id}
              defaultValue={item.getFlag(MODULE_ID, 'weaponProperties') ?? ''}
              onBlur={(event) => item.setFlag(MODULE_ID, 'weaponProperties', event.target.value)} />
          </label>
          <div className="bo-pair-grid">
            <label className="bo-field-label">
              <span>Disguise</span>
              <Select value={item.getFlag(MODULE_ID, 'hunterDisguised') ?? ''} disabled={!editable}
                options={[
                  { value: '', label: 'None' },
                  { value: 'standard', label: 'Disguised (−1 die)' },
                  { value: 'critical', label: 'Disguised (critical craft)' }
                ]}
                onChange={(value) => item.setFlag(MODULE_ID, 'hunterDisguised', value)} />
            </label>
            {item.system.weaponType === 'ranged' && !specialWeapon ? (
              <label className="bo-field-label">
                <span>Compatible special ammunition</span>
                <Select value={item.getFlag(MODULE_ID, 'hunterAmmoType') ?? ''} disabled={!editable}
                  options={[{ value: '', label: 'None' }, ...Object.entries(HUNTER_AMMO)
                    .map(([value, { label }]) => ({ value, label }))]}
                  onChange={(value) => item.setFlag(MODULE_ID, 'hunterAmmoType', value)} />
              </label>
            ) : null}
          </div>
          {item.getFlag(MODULE_ID, 'hunterDisguised') ? <EquipmentReference id="disguised-weapons" title="Disguised Weapon" /> : null}
          {!specialWeapon ? (
            <label className="bo-toggle">
              <input type="checkbox" disabled={!editable}
                checked={Boolean(item.getFlag(MODULE_ID, 'hunterImprovisedIncendiary'))}
                onChange={(event) => item.setFlag(MODULE_ID, 'hunterImprovisedIncendiary', event.target.checked)} />
              <span>Improvised incendiary</span>
            </label>
          ) : null}
          {item.getFlag(MODULE_ID, 'hunterImprovisedIncendiary') ? <EquipmentReference id="incendiary-weapons" title="Incendiary Weapon" /> : null}
        </div>
      ) : null}

      <div className="bo-form-grid" style={{ marginBottom: '14px' }}>
        <label className="bo-field-label">
          <span>Name</span>
          <input
            type="text"
            className="bo-field"
            defaultValue={item.name}
            disabled={!editable}
            onBlur={(event) => item.update({ name: event.target.value })}
            key={item.name}
          />
        </label>

        <label className="bo-field-label">
          <span>Quantity</span>
          <input
            type="number"
            className="bo-field"
            min={1}
            defaultValue={item.system.quantity ?? 1}
            disabled={!editable}
            onBlur={(event) =>
              item.update({ 'system.quantity': parseInt(event.target.value, 10) || 1 })
            }
            key={item.system.quantity}
          />
        </label>

        {section === 'gear' ? (
          <label className="bo-field-label">
            <span>Kept</span>
            <Select
              value={gearPlace(item)}
              disabled={!editable}
              options={[
                { value: GEAR_PLACES.carried, label: 'On their person' },
                { value: GEAR_PLACES.property, label: 'Elsewhere' }
              ]}
              onChange={(value) => setGearPlace(item, value)}
            />
          </label>
        ) : null}
      </div>

      <label className="bo-field-label" style={{ marginBottom: '14px' }}>
        <span>Notes</span>
        <textarea
          className="bo-field"
          rows={4}
          style={{ resize: 'vertical' }}
          defaultValue={item.system.description ?? ''}
          disabled={!editable}
          placeholder={
            SECTIONS.find(
              (entry) =>
                entry.id === section && (!entry.place || entry.place === gearPlace(item))
            )?.placeholder
          }
          onBlur={(event) => item.update({ 'system.description': event.target.value })}
          key={item.system.description}
        />
      </label>

      {hunter && section === 'weapon' && !specialWeapon ? <p className="bo-prose">{HUNTER_WEAPON_RULE}</p> : null}
      {hunter && section === 'armor' ? <p className="bo-prose">{HUNTER_ARMOR_RULE}</p> : null}
      {hunter && section === 'gear' && template ? (
        <EquipmentReference key={item.id} id={template.reference} title={item.name} />
      ) : null}
    </div>
  )
}

export default function InventoryTab({ actor, editable }) {
  const [equipmentSection, setEquipmentSection] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  // null, { mode: 'add' } or { mode: 'edit', item }
  const [weaponDialog, setWeaponDialog] = useState(null)
  // The same, for armour.
  const [armorDialog, setArmorDialog] = useState(null)
  const selected = selectedId ? actor.items.get(selectedId) : null
  const hunter = actor.type === 'hunter'

  const addHunterEquipment = async (entry) => {
    const [created] = await actor.createEmbeddedDocuments('Item', [buildHunterEquipment(entry)])
    if (created) setSelectedId(created.id)
  }

  const addWeapon = async (values) => {
    const [created] = await actor.createEmbeddedDocuments('Item', [buildWeaponData(values)])
    if (created) setSelectedId(created.id)
  }

  const editWeapon = async (item, values) => {
    await item.update(weaponUpdate(values))
  }

  const addArmor = async (values) => {
    const [created] = await actor.createEmbeddedDocuments('Item', [buildArmorData(values)])
    if (created) setSelectedId(created.id)
  }

  const editArmor = async (item, values) => {
    await item.update(armorUpdate(values))
  }

  const add = async (section) => {
    if (section.id === 'weapon') {
      setWeaponDialog({ mode: 'add', range: section.range })
      return
    }
    if (section.id === 'armor') {
      setArmorDialog({ mode: 'add' })
      return
    }
    const [created] = await actor.createEmbeddedDocuments('Item', [buildItemData(section)])
    if (created) setSelectedId(created.id)
  }

  const remove = async (item) => {
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      classes: ['blood-oracle', 'bo-dialog', 'bo-dialog-remove'],
      window: { title: 'Remove item' },
      content: `<p>Remove <strong>${foundry.utils.escapeHTML(item.name)}</strong> from this character?</p>`
    })
    if (!confirmed) return
    setSelectedId(null)
    await item.delete()
  }

  return (
    <div>
      <SectionTitle
        info={hunter ? HUNTER_WEAPON_RULE : 'Only equipped weapons add damage, and only equipped heavy armour costs Dexterity. Weapon damage is a flat bonus to successes, not extra dice, so it is shown apart from the pool. Brawl is unarmed and never draws an equipped weapon.'}>
        Inventory
      </SectionTitle>

      <div className="bo-master-detail">
        <div>
          {(hunter ? HUNTER_SECTIONS : SECTIONS).map((section) => {
            const items = itemsOfSection(actor, section)

            return (
              <div key={section.label} style={{ marginBottom: '22px' }}>
                <div className="bo-row" style={{ marginBottom: '10px' }}>
                  <div className="bo-label" style={{ margin: 0 }}>
                    {section.label}
                  </div>
                  {editable ? (
                    <GhostButton tone="accent" onClick={() => hunter && section.place !== GEAR_PLACES.property ? setEquipmentSection(section) : add(section)}>
                      + Add
                    </GhostButton>
                  ) : null}
                </div>

                {items.length ? (
                  <div style={{ display: 'grid', gap: '4px' }}>
                    {items.map((item) => (
                      <div key={item.id} className="bo-stat-row">
                        <div className="bo-stat-name">
                          <button
                            type="button"
                            className={
                              selectedId === item.id ? 'bo-trait-name is-selected' : 'bo-trait-name'
                            }
                            onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
                          >
                            {item.name}
                          </button>
                          {(item.system.quantity ?? 1) > 1 ? (
                            <span style={{ color: 'var(--bo-text-muted)', marginLeft: '6px' }}>
                              ×{item.system.quantity}
                            </span>
                          ) : null}
                          {item.type === 'weapon' && item.system.weaponvalue ? (
                            <span className="bo-specialty">(+{item.system.weaponvalue})</span>
                          ) : null}
                          {item.type === 'armor' && armorRating(item) ? (
                            <span className="bo-specialty">({armorRating(item).dice})</span>
                          ) : null}
                        </div>

                        {section.place === GEAR_PLACES.property ? null : (
                          <label className="bo-equip" title="Equipped">
                            <input
                              type="checkbox"
                              checked={isEquipped(item)}
                              disabled={!editable}
                              onChange={(event) => setEquipped(item, event.target.checked)}
                            />
                            <span>equipped</span>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="bo-empty" style={{ textAlign: 'left', padding: '4px 0' }}>
                    Nothing carried.
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <div>
          {selected ? (
            <Detail
              key={selected.id}
              item={selected}
              editable={editable}
              hunter={hunter}
              onDelete={() => remove(selected)}
              onEditWeapon={() => setWeaponDialog({ mode: 'edit', item: selected })}
              onEditArmor={() => setArmorDialog({ mode: 'edit', item: selected })}
            />
          ) : (
            <div className="bo-panel">
              <p className="bo-empty" style={{ padding: '28px 0' }}>
                Select an item on the left to view its details.
              </p>
            </div>
          )}
        </div>
      </div>

      {equipmentSection ? (
        <HunterEquipment section={equipmentSection} onAdd={addHunterEquipment}
          onClose={() => setEquipmentSection(null)} onCustom={() => {
            setEquipmentSection(null)
            add(equipmentSection)
          }} />
      ) : null}

      {weaponDialog ? (
        <WeaponDialog
          initialRange={weaponDialog.range}
          initial={
            weaponDialog.mode === 'edit'
              ? {
                  name: weaponDialog.item.name,
                  range: weaponDialog.item.system.weaponType ?? 'melee',
                  classId: weaponClass(weaponDialog.item)?.id ?? null
                }
              : null
          }
          onSubmit={(values) =>
            weaponDialog.mode === 'edit' ? editWeapon(weaponDialog.item, values) : addWeapon(values)
          }
          onClose={() => setWeaponDialog(null)}
        />
      ) : null}

      {armorDialog ? (
        <ArmorDialog
          initial={
            armorDialog.mode === 'edit'
              ? { name: armorDialog.item.name, classId: armorRating(armorDialog.item)?.id ?? null }
              : null
          }
          onSubmit={(values) =>
            armorDialog.mode === 'edit' ? editArmor(armorDialog.item, values) : addArmor(values)
          }
          onClose={() => setArmorDialog(null)}
        />
      ) : null}
    </div>
  )
}
