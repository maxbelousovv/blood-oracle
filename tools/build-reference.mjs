#!/usr/bin/env node
/**
 * Builds the whole rules reference — rules, loresheets, trait tooltips and
 * coterie texts — into one file, from every source in one folder:
 *
 *   node tools/build-reference.mjs <sources folder> <blood-oracle-rules.json> [--catalogues]
 *
 * The folder holds the sources under their usual names; when there are
 * several versions of one, the highest _vN wins:
 *
 *   blood_oracle*.jsx            the standalone app — rules, powers, merits
 *   loresheets*.xlsx             loresheets
 *   attributes*.xlsx             attribute, skill and domain tooltips
 *   coterie_types*.xlsx          coterie types
 *   coterie_advantages*.xlsx     coterie merits and flaws (or .csv)
 *
 * A missing source leaves its section out and says so; the rest still builds.
 * --catalogues also regenerates the parts that ship with the module
 * (loresheet, coterie type and coterie merit names) under src/app/rules —
 * run it from the repository and commit what changes.
 *
 * Each source is read by its own extractor in tools/, so they also still work
 * one at a time.
 */

import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const catalogues = args.includes('--catalogues')
const [sourcesDir, outputPath] = args.filter((arg) => !arg.startsWith('--'))

if (!sourcesDir || !outputPath) {
  console.error('Usage: node tools/build-reference.mjs <sources folder> <blood-oracle-rules.json> [--catalogues]')
  process.exit(1)
}

const toolsDir = dirname(fileURLToPath(import.meta.url))
const repoDir = resolve(toolsDir, '..')
const work = mkdtempSync(join(tmpdir(), 'blood-oracle-'))

/** The newest file matching a name: highest _vN, then latest change. */
function findSource(pattern) {
  const version = (name) => Number(name.match(/_v(\d+)/i)?.[1] ?? 0)
  const matches = readdirSync(sourcesDir)
    .filter((name) => pattern.test(name) && !name.startsWith('~$'))
    .map((name) => ({ name, path: join(sourcesDir, name), version: version(name), time: statSync(join(sourcesDir, name)).mtimeMs }))
    .sort((a, b) => b.version - a.version || b.time - a.time)
  return matches[0] ?? null
}

function run(script, ...scriptArgs) {
  const result = spawnSync(process.execPath, [join(toolsDir, script), ...scriptArgs], { encoding: 'utf8' })
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.trim()
  if (output) console.log(output.replace(/^/gm, '    '))
  if (result.status !== 0) throw new Error(`${script} failed`)
}

const catalogue = (file) => (catalogues ? [join(repoDir, 'src/app/rules', file)] : [])
const sections = []
const skipped = []

try {
  // Rules: the base of the file.
  const app = findSource(/^blood_oracle.*\.jsx$/i)
  if (!app) throw new Error('No blood_oracle*.jsx in the sources folder — the rules are the base of the file.')
  console.log(`Rules        ← ${app.name}`)
  const rulesPath = join(work, 'rules.json')
  run('extract-rules.mjs', app.path, rulesPath)
  const reference = JSON.parse(readFileSync(rulesPath, 'utf8'))
  sections.push('rules')

  const lore = findSource(/^loresheets.*\.xlsx$/i)
  if (lore) {
    console.log(`Loresheets   ← ${lore.name}`)
    const path = join(work, 'loresheets.json')
    run('extract-loresheets.mjs', lore.path, path, ...catalogue('loresheets.js'))
    reference.loresheets = JSON.parse(readFileSync(path, 'utf8')).loresheets
    sections.push('loresheets')
  } else skipped.push('loresheets (no loresheets*.xlsx)')

  const traits = findSource(/^attributes.*\.xlsx$/i)
  if (traits) {
    console.log(`Tooltips     ← ${traits.name}`)
    const path = join(work, 'traits.json')
    run('extract-traits.mjs', traits.path, path)
    reference.traits = JSON.parse(readFileSync(path, 'utf8')).traits
    sections.push('tooltips')
  } else skipped.push('tooltips (no attributes*.xlsx)')

  const types = findSource(/^coterie_types.*\.xlsx$/i)
  const advantages = findSource(/^coterie_advantages.*\.(xlsx|csv)$/i)
  if (types || advantages) {
    const path = join(work, 'coterie.json')
    if (types) {
      console.log(`Coterie types ← ${types.name}`)
      run('extract-coterie-types.mjs', types.path, path, ...catalogue('coterie-types.js'))
    } else skipped.push('coterie types (no coterie_types*.xlsx)')
    if (advantages) {
      console.log(`Coterie merits ← ${advantages.name}`)
      run('extract-coterie-advantages.mjs', advantages.path, path, ...catalogue('coterie-advantages.js'))
    } else skipped.push('coterie merits (no coterie_advantages*.xlsx)')
    const coterie = JSON.parse(readFileSync(path, 'utf8'))
    reference.coterie = { types: coterie.types ?? {}, advantages: coterie.advantages ?? {}, rules: coterie.rules ?? {} }
    sections.push('coterie')
  } else skipped.push('coterie (no coterie tables)')

  reference.generated = new Date().toISOString()
  writeFileSync(outputPath, JSON.stringify(reference))
  console.log(`\nWrote ${outputPath}: ${sections.join(', ')}.`)
  if (skipped.length) console.log(`Left out: ${skipped.join('; ')}.`)
  if (catalogues) console.log('Catalogues under src/app/rules regenerated — commit them if they changed.')
} catch (error) {
  console.error(`\nNot built: ${error.message}`)
  process.exitCode = 1
} finally {
  rmSync(work, { recursive: true, force: true })
}
