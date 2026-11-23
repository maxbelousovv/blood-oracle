/** Reflow source column wraps while keeping the rule sections and perk list. */
export function edgeRuleBlocks(text, title) {
  const blocks = []
  let block = { heading: '', paragraphs: [], perks: [] }
  let lines = []
  let perk = false
  const reflow = (parts) => parts.join(' ').replace(/\s+/g, ' ').trim()

  const flush = () => {
    const content = reflow(lines)
    if (content) {
      if (perk) {
        const colon = content.indexOf(':')
        block.perks.push(colon < 0
          ? { name: content, description: '' }
          : { name: content.slice(0, colon), description: content.slice(colon + 1).trim() })
      } else {
        block.paragraphs.push(content)
      }
    }
    lines = []
  }

  const section = (heading) => {
    flush()
    if (block.heading || block.paragraphs.length || block.perks.length) blocks.push(block)
    block = { heading, paragraphs: [], perks: [] }
    perk = false
  }

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    const label = /^(Edge Pool|System)\s*:\s*(.*)$/i.exec(line)
    const bullet = /^[●•]\s*(.*)$/.exec(line)
    if (label) {
      section(label[1])
      lines.push(label[2])
    } else if (line.toLowerCase() === (title + ' Perks').toLowerCase()) {
      section(line)
    } else if (bullet) {
      flush()
      perk = true
      lines.push(bullet[1])
    } else if (!line && !perk) {
      flush()
    } else if (line) {
      lines.push(line)
    }
  }
  section('')
  return blocks
}
