import RulesReference from './RulesReference.jsx'
import { SectionTitle } from './primitives.jsx'
import { getWerewolfReference } from '../rules/catalog.js'

export default function WerewolfReference({ id, inline = false }) {
  const entry = getWerewolfReference(id)
  if (!entry?.sections?.length) return null
  const related = (entry.related ?? []).map(getWerewolfReference).filter(Boolean)
  const sections = [...entry.sections, ...related.flatMap((reference) =>
    reference.sections.map((section) => ({ ...section, heading: section.heading || reference.title })))]
  return (
    <RulesReference title={entry.title} source={entry.source} inline={inline}>
      {sections.map(({ heading, text }, index) => (
        <section key={index} className="bo-block">
          {heading ? <SectionTitle>{heading}</SectionTitle> : null}
          {text.split(/\n\n+/).map((paragraph, index) => <p className="bo-prose" key={index}>{paragraph}</p>)}
        </section>
      ))}
    </RulesReference>
  )
}
