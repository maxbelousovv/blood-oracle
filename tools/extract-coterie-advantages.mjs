#!/usr/bin/env node
/**
 * Reads the coterie merits and flaws table (CSV or xlsx):
 *
 *   node tools/extract-coterie-advantages.mjs <table> <blood-oracle-coterie.json> [catalogue.js]
 *
 * Columns: name, cost in dots ("•", "• to •••", "Varies"), description, and
 * the group: "coterie merit", "coterie flaw", "CHASSE MERITS", "LIEN MERITS"
 * or "PORTILLON MERITS" — or "rules" for a rules note the sheet shows as
 * reference, such as "Coterie Advantages"; a note has no cost. A domain merit's resonance may follow its name in
 * brackets: "Hospital (Melancholy/Phlegmatic)".
 *
 * An xlsx may carry a second sheet of clan coterie merits — clan, name, cost,
 * description and an optional one-line summary — recognised by its first
 * header ("Клан" or "Clan").
 *
 * The descriptions are rulebook text and go into the private coterie file
 * beside the rules reference — the same file the coterie types write their
 * descriptions to, so this adds to it rather than replacing it. The names,
 * costs, groups and resonances are the catalogue that ships with the module.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { readZip, readSheets } from './xlsx.mjs'

const [, , tablePath, textsPath, cataloguePath] = process.argv

if (!tablePath || !textsPath) {
  console.error('Usage: node tools/extract-coterie-advantages.mjs <table.csv|xlsx> <texts.json> [catalogue.js]')
  process.exit(1)
}

/** RFC 4180 CSV: quoted fields may hold commas, quotes and line breaks. */
function readCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (char === '"') quoted = false
      else field += char
      continue
    }
    if (char === '"') quoted = true
    else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += char
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

// A CSV is one sheet; an xlsx may hold several — the coterie's own merits and
// flaws on one, the clan coterie merits on another. Each starts with a header.
const sheets = tablePath.toLowerCase().endsWith('.csv')
  ? [{ name: 'csv', rows: readCsv(readFileSync(tablePath, 'utf8').replace(/^\uFEFF/, '')) }]
  : readSheets(readZip(readFileSync(tablePath)))

const slug = (text) =>
  String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const GROUPS = {
  'coterie merit': { kind: 'merit', group: 'Coterie' },
  'coterie flaw': { kind: 'flaw', group: 'Coterie' },
  'chasse merits': { kind: 'merit', group: 'Chasse' },
  'lien merits': { kind: 'merit', group: 'Lien' },
  'portillon merits': { kind: 'merit', group: 'Portillon' }
}

/** "•" → "1", "• to •••" → "1-3", "Varies" stays as words. */
function readDots(text) {
  const runs = String(text ?? '').match(/•+/g)
  if (!runs) return String(text ?? '').trim()
  const counts = runs.map((run) => run.length)
  return counts.length > 1 ? `${Math.min(...counts)}-${Math.max(...counts)}` : String(counts[0])
}

const problems = []
const catalogue = []
const texts = {}
const rules = {}

/**
 * A clan sheet: clan, name, cost, description — "Banu Haqim | Call to Purpose
 * | •• | …". The clan's key is what a character's clan name contains.
 */
const clanKey = (clan) => {
  const lower = String(clan).toLowerCase()
  if (lower.includes('thin')) return 'thin'
  if (lower.includes('ministry')) return 'ministry'
  return lower.replace(/^the\s+/, '').trim()
}

function readClanSheet(rows) {
  for (const row of rows.slice(1)) {
    const clan = String(row[0] ?? '').trim()
    const name = String(row[1] ?? '').trim()
    if (!clan || !name) continue
    const id = slug(`clan-${name}`)
    catalogue.push({ id, name, kind: 'merit', group: 'Clan', dots: readDots(row[2]), clan, clanKey: clanKey(clan) })
    const summary = String(row[4] ?? '').trim()
    texts[id] = { description: String(row[3] ?? '').trim(), ...(summary ? { summary } : {}) }
  }
}

const isClanSheet = (rows) => /клан|clan/i.test(String(rows[0]?.[0] ?? ''))

// A help sheet explains the table and holds no entries.
const isHelpSheet = (sheet) => /как заполнять|how to|legend|readme/i.test(sheet.name)

const rows = []
for (const sheet of sheets) {
  if (isHelpSheet(sheet)) continue
  if (isClanSheet(sheet.rows)) readClanSheet(sheet.rows)
  else rows.push(...sheet.rows.slice(1))
}

for (const row of rows) {
  const rawName = String(row[0] ?? '').trim()
  if (!rawName) continue
  const group = String(row[3] ?? '').trim().toLowerCase()
  if (group === 'rules') {
    rules[slug(rawName)] = { title: rawName, text: String(row[2] ?? '').trim() }
    continue
  }
  const where = GROUPS[group]
  if (!where) {
    problems.push(`${rawName}: unknown group "${row[3]}"`)
    continue
  }
  const bracket = rawName.match(/^(.*?)\s*\(([^)]*)\)\s*$/)
  const name = bracket && where.group !== 'Coterie' ? bracket[1].trim() : rawName
  const resonance = bracket && where.group !== 'Coterie' ? bracket[2].trim() : null
  const id = slug(`${where.group}-${name}`)

  catalogue.push({
    id,
    name,
    kind: where.kind,
    group: where.group,
    dots: readDots(row[1]),
    ...(resonance ? { resonance } : {})
  })
  texts[id] = { description: String(row[2] ?? '').trim() }
}

// Add to the coterie file the types wrote, keeping what is already there.
let file = { format: 'blood-oracle-coterie', version: 1 }
if (existsSync(textsPath)) {
  try {
    const current = JSON.parse(readFileSync(textsPath, 'utf8'))
    if (current?.format === 'blood-oracle-coterie') file = current
  } catch {
    problems.push(`${textsPath} could not be read; writing a fresh one`)
  }
}
file.generated = new Date().toISOString()
file.advantages = texts
file.rules = rules
writeFileSync(textsPath, JSON.stringify(file))
console.log(
  `Wrote ${textsPath}: ${Object.keys(texts).length} coterie merits and flaws, ${Object.keys(rules).length} rules notes ` +
    `(types kept: ${Object.keys(file.types ?? {}).length})`
)

if (cataloguePath) {
  writeFileSync(
    cataloguePath,
    '// Generated by tools/extract-coterie-advantages.mjs — do not edit by hand.\n' +
      '// Names, costs, groups and resonances only; the descriptions live in the\n' +
      '// private blood-oracle-coterie.json next to the rules reference.\n\n' +
      `export const COTERIE_ADVANTAGES = ${JSON.stringify(catalogue, null, 2)}\n`
  )
  console.log(`Wrote ${cataloguePath}: ${catalogue.length} entries`)
}

if (problems.length) {
  console.log(`\n${problems.length} things to look at:`)
  for (const problem of problems) console.log(`  - ${problem}`)
}
