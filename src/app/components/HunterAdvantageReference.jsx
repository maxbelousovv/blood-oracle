import RulesReference from './RulesReference.jsx'
import { getHunterAdvantageText } from '../rules/catalog.js'

export default function HunterAdvantageReference({ id, source = 'Core Rulebook', inline }) {
  const text = getHunterAdvantageText(id)
  if (!text) return null
  return (
    <RulesReference title="Advantage rules" source={source} inline={inline}>
      <div className="bo-prose" style={{ whiteSpace: 'pre-line' }}>{text}</div>
    </RulesReference>
  )
}
