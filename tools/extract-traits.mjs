#!/usr/bin/env node
/**
 * Reads the attribute and skill table (xlsx) into the private file the sheet's
 * trait tooltips read:
 *
 *   node tools/extract-traits.mjs <table.xlsx> <blood-oracle-traits.json>
 *
 * Expected columns on every sheet: name, description, and an optional
 * comma-separated list of example specialties. The first row of each sheet is
 * its header. The descriptions are rulebook text, so the output goes
 * next to the rules reference in Foundry's Data directory, never into the
 * repository.
 *
 * Traits are keyed by their name with everything but letters removed and
 * lowercased — "Animal Ken" becomes "animalken" — which is how wod5e keys them.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { readZip, readSheets } from './xlsx.mjs'

const [, , tablePath, outputPath] = process.argv

if (!tablePath || !outputPath) {
  console.error('Usage: node tools/extract-traits.mjs <table.xlsx> <blood-oracle-traits.json>')
  process.exit(1)
}

const keyOf = (name) => String(name).toLowerCase().replace(/[^a-z]/g, '')

// Every sheet is read, each with a header row: attributes and skills on one,
// coterie domain traits (Chasse, Lien, Portillon) on another, and so on.
const sheets = readSheets(readZip(readFileSync(tablePath)))
const rows = sheets.flatMap((sheet) => sheet.rows.slice(1))
const traits = {}

for (const row of rows) {
  const name = String(row[0] ?? '').trim()
  if (!name) continue
  traits[keyOf(name)] = {
    name,
    description: String(row[1] ?? '').trim(),
    specialties: String(row[2] ?? '')
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
}

writeFileSync(
  outputPath,
  JSON.stringify({
    format: 'blood-oracle-traits',
    version: 1,
    generated: new Date().toISOString(),
    traits
  })
)

const withSpecialties = Object.values(traits).filter((trait) => trait.specialties.length).length
console.log(`Wrote ${outputPath}: ${Object.keys(traits).length} traits from ${sheets.length} sheet(s), ${withSpecialties} with example specialties`)
