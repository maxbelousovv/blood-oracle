import { PackFavor } from './PackTab.jsx'
import { packOf } from '../schema/pack.js'
import RichText from '../components/RichText.jsx'
import WerewolfReference from '../components/WerewolfReference.jsx'
import { SectionTitle, LabelledValue } from '../components/primitives.jsx'
import { AUSPICES, TRIBES, findGarouIdentity } from '../rules/garou-identity.js'
import { readSingleton } from '../schema/singletons.js'

function GiftAccess({ kind, page }) {
  return (
    <p className="bo-roll-note">
      This {kind} grants access to its Gifts as your Total Renown rises. · W5 Core Rulebook, p. {page}
    </p>
  )
}

export default function GarouIdentityTab({ actor }) {
  const auspiceItem = readSingleton(actor, 'auspice')
  const tribeItem = readSingleton(actor, 'tribe')
  const auspice = findGarouIdentity(AUSPICES, auspiceItem?.name)
  const tribe = findGarouIdentity(TRIBES, tribeItem?.name)
  const patron = tribeItem?.system.patronSpirit
  const pack = packOf(actor)
  return (
    <>
    <div className="bo-pair-grid">
      <section>
        <SectionTitle>Auspice</SectionTitle>
        {auspiceItem ? (
          <div className="bo-panel">
            <h3 className="bo-detail-title">{auspice?.name ?? auspiceItem.name}</h3>
            {auspice ? <>
              <p className="bo-detail-sub">{auspice.moon}</p>
              <p className="bo-prose">{auspice.summary}</p>
              <GiftAccess kind="Auspice" page={auspice.giftsPage} />
              <WerewolfReference id={auspice.id} />
            </> : <RichText content={auspiceItem.system.description} />}
          </div>
        ) : <p className="bo-empty">Choose an Auspice in Biography.</p>}
      </section>

      <section>
        <SectionTitle>Tribe</SectionTitle>
        {tribeItem ? (
          <div className="bo-panel">
            <h3 className="bo-detail-title">{tribe?.name ?? tribeItem.name}</h3>
            {tribe ? <p className="bo-prose">{tribe.summary}</p> : <RichText content={tribeItem.system.description} />}
            <div className="bo-pair-grid bo-block">
              <LabelledValue label="Patron Spirit" value={patron?.name || tribe?.patron} />
              {tribe ? <LabelledValue label="Associated Renown" value={tribe.renown} /> : null}
            </div>
            <div className="bo-block">
              <SectionTitle>Favor</SectionTitle>
              <RichText content={patron?.favor || tribe?.favor} />
              <SectionTitle>Ban</SectionTitle>
              <RichText content={patron?.ban || tribe?.ban} />
            </div>
            {tribe ? <>
              <GiftAccess kind="Tribe" page={tribe.giftsPage} />
              <WerewolfReference id={tribe.id} />
            </> : null}
          </div>
        ) : <p className="bo-empty">Choose a Tribe in Biography.</p>}
      </section>
    </div>
    {pack ? <PackFavor actor={actor} pack={pack} /> : null}
    </>
  )
}
