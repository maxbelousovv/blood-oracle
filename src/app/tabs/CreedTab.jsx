import RulesReference from '../components/RulesReference.jsx'
import { SectionTitle } from '../components/primitives.jsx'
import RichText from '../components/RichText.jsx'
import { findCreed } from '../rules/creeds.js'
import { findDrive } from '../rules/drives.js'
import { getHunterCreedSections } from '../rules/catalog.js'
import { readSingleton } from '../schema/singletons.js'

function CreedReference({ creed, sections }) {
  return (
    <RulesReference title={creed.name} source="Core Rulebook">
      {sections.map(({ heading, text }) => (
        <section key={heading} className="bo-block">
          <SectionTitle>{heading}</SectionTitle>
          {text.split(/\n\s*\n/).map((paragraph, index) => (
            <p className="bo-prose" key={index}>{paragraph.replace(/\s*\n\s*/g, ' ')}</p>
          ))}
        </section>
      ))}
    </RulesReference>
  )
}

function Profile({ label, item, summary, ruleLabel, rule, storedRule, path, editable, children }) {
  return (
    <div>
      <SectionTitle>{label}</SectionTitle>
      {item ? (
        <div className="bo-panel">
          <h3 className="bo-detail-title">{summary?.name ?? item.name}</h3>
          {summary ? <p className="bo-prose">{summary.description}</p> : <RichText content={item.system.description} />}
          <div className="bo-block">
            <SectionTitle>{ruleLabel}</SectionTitle>
            {summary ? (
              <p className="bo-prose">{rule}</p>
            ) : (
              <textarea
                aria-label={ruleLabel}
                className="bo-field"
                key={storedRule}
                rows={3}
                defaultValue={storedRule}
                disabled={!editable}
                onBlur={(event) => {
                  if (event.target.value !== storedRule) item.update({ [path]: event.target.value })
                }}
              />
            )}
          </div>
          {children}
        </div>
      ) : <p className="bo-empty">Choose {label === 'Drive' ? 'a Drive' : 'a Creed'} in Biography.</p>}
    </div>
  )
}

export default function CreedTab({ actor, editable }) {
  const creedItem = readSingleton(actor, 'creed')
  const driveItem = readSingleton(actor, 'drive')
  const creed = findCreed(creedItem?.name)
  const drive = findDrive(driveItem?.name)
  const creedSections = creed ? getHunterCreedSections(creed.name) : []

  return (
    <div className="bo-pair-grid">
      <Profile
        label="Creed"
        item={creedItem}
        summary={creed}
        ruleLabel="Desperation Dice Fields"
        rule={creed?.field}
        storedRule={creedItem?.system.desperationFields || actor.system.headers?.creedfields || ''}
        path="system.desperationFields"
        editable={editable}
      >
        {creedSections.length ? (
          <CreedReference key={creed.name} creed={creed} sections={creedSections} />
        ) : null}
      </Profile>
      <Profile
        label="Drive"
        item={driveItem}
        summary={drive}
        ruleLabel="Redemption"
        rule={drive?.redemption}
        storedRule={driveItem?.system.redemption ?? ''}
        path="system.redemption"
        editable={editable}
      />
    </div>
  )
}
