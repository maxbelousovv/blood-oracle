import { useState } from 'react'
import LibraryPicker from '../components/LibraryPicker.jsx'
import { GhostButton, SectionTitle } from '../components/primitives.jsx'
import StoryAbility from '../components/StoryAbility.jsx'
import StoryRating from '../components/StoryRating.jsx'

export default function StoryGiftsTab({ actor, editable, locked }) {
  const [adding, setAdding] = useState(false)
  const canEdit = editable && !locked
  const gifts = actor.items.filter((item) => item.type === 'gift')
  const groups = Object.entries(WOD5E.Gifts.getList({}))
    .filter(([, entry]) => !entry.hidden)
    .map(([id, entry]) => ({
      id,
      name: entry.displayName || game.i18n.localize(entry.label ?? id),
      items: gifts.filter((item) => item.system.giftType === id),
      rating: Number(actor.system.gifts?.[id]?.value) || 0,
      visible: actor.system.gifts?.[id]?.visible
    }))
  const visible = groups.filter((entry) => entry.visible || entry.items.length)

  async function addGift(id) {
    const [item] = await actor.createEmbeddedDocuments('Item', [{
      name: 'New Gift',
      type: 'gift',
      system: { giftType: id }
    }])
    if (item) await item.sheet.render({ force: true })
  }

  return (
    <div>
      <SectionTitle info="Each Gift rolls the dice pool set for its category. Edit the Gift to record its effects and costs."
        actions={canEdit ? <GhostButton tone="accent" onClick={() => setAdding(true)}>+ Add Gift category</GhostButton> : null}>
        Gifts
      </SectionTitle>
      {!visible.length ? <p className="bo-spc-empty">No Gifts recorded.</p> : null}
      <div className="bo-columns">
        {visible.map(({ id, name, items, rating }) => (
          <section key={id} className="bo-panel">
            <h3 className="bo-detail-title">{name}</h3>
            <StoryRating actor={actor} path={'system.gifts.' + id + '.value'} label="Gift pool" editable={canEdit} />
            {items.map((item) => (
              <StoryAbility key={item.id} actor={actor} item={item} dice={rating}
                selectors={['gifts', 'gifts.' + id]} editable={canEdit} canRoll={editable} />
            ))}
            {canEdit ? (
              <div className="bo-library-actions">
                <GhostButton onClick={() => addGift(id)}>+ Add Gift</GhostButton>
                {!items.length ? <GhostButton tone="danger"
                  onClick={() => actor.update({ ['system.gifts.' + id + '.visible']: false })}>Remove category</GhostButton> : null}
              </div>
            ) : null}
          </section>
        ))}
      </div>
      {adding && canEdit ? (
        <LibraryPicker title="Choose a Gift category" onClose={() => setAdding(false)}
          entries={groups.map(({ id, name }) => ({ id, name, disabled: visible.some((entry) => entry.id === id) }))}
          onAdd={async ({ id }) => {
            await actor.update({ ['system.gifts.' + id + '.visible']: true })
            setAdding(false)
          }} />
      ) : null}
    </div>
  )
}
