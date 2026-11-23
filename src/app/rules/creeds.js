// Original sheet summaries. Book excerpts belong in the private reference.
export const CREEDS = [
  {
    name: 'Entrepreneurial',
    description: 'Entrepreneurial Hunters solve problems by building and testing tools. They may observe or capture quarry to learn what makes it tick and turn discoveries into gear. A failed prototype or a live captive can turn the experiment against them.',
    field: 'Build, invent, upgrade, or fix something during a Hunt.'
  },
  {
    name: 'Faithful',
    description: 'Faithful Hunters draw resolve from spiritual conviction. Some confront monsters, others protect people or recover relics. Conviction can sustain them through horror, but rigid doctrine or a crisis of faith can undermine their purpose.',
    field: 'Directly confront a supernatural opponent during a Hunt, whether physically, socially, or mentally.'
  },
  {
    name: 'Inquisitive',
    description: 'Inquisitive Hunters gather evidence, uncover secrets, and share what they learn. They favor reconnaissance and getting out alive over a fight. Their curiosity exposes them to quarry that will kill to stay hidden.',
    field: 'Uncover information during a Hunt, for example by researching, breaking in, or questioning someone.'
  },
  {
    name: 'Martial',
    description: 'Martial Hunters use preparation and decisive force to stop quarry from harming anyone else. They may fight on the front line or support those who do. The pressure to act can strain relationships and make it easier to mistake suspicion for proof.',
    field: 'Take part in physical conflict during a Hunt. The opponent may be human and may have no direct connection to the quarry.'
  },
  {
    name: 'Underground',
    description: 'Underground Hunters rely on their cell, local contacts, and whatever is at hand. They use deception, ambushes, and improvisation to strike on their own terms. A quarry that survives the first blow can catch them unprepared.',
    field: 'Use stealth or deception to advance the Hunt.'
  }
]

export function findCreed(name) {
  const key = name?.trim().toLowerCase()
  return CREEDS.find((creed) => creed.name.toLowerCase() === key)
}
