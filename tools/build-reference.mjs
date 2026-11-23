#!/usr/bin/env node
/**
 * Builds the rules reference for Vampire, Hunter and Werewolf from private
 * sources. Use --merge to add companion files to an existing reference.
 *
 *   node tools/build-reference.mjs <sources folder> <blood-oracle-rules.json> [--catalogues | --merge]
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

import { mkdtempSync, readdirSync, readFileSync, renameSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const catalogues = args.includes('--catalogues')
const mergeOnly = args.includes('--merge')
const [sourcesDir, outputPath] = args.filter((arg) => !arg.startsWith('--'))

if (!sourcesDir || !outputPath || (catalogues && mergeOnly)) {
  console.error('Usage: node tools/build-reference.mjs <sources folder> <blood-oracle-rules.json> [--catalogues | --merge]')
  process.exit(1)
}

const toolsDir = dirname(fileURLToPath(import.meta.url))
const repoDir = resolve(toolsDir, '..')
const work = mergeOnly ? null : mkdtempSync(join(tmpdir(), 'blood-oracle-'))

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

function rebuildVampireReference() {
  // The standalone export is the base of the file.
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
  return reference
}

function readIfPresent(file) {
  try {
    return readFileSync(file, 'utf8')
  } catch (error) {
    if (error.code === 'ENOENT') return undefined
    throw error
  }
}

function readExport(text, file, format) {
  const data = JSON.parse(text.replace(/^\uFEFF/, ''))
  if (data?.format !== format) throw new Error(`Unexpected format in ${file}`)
  return data
}

function mergeCompanions(reference, previous) {
  for (const section of ['hunter', 'werewolf']) {
    const format = 'blood-oracle-' + section + '-rules'
    const source = findSource(new RegExp('^' + format + '(?:_v[0-9]+)?\\.json$', 'i'))
    const existing = previous?.[section]
    const file = source?.path ?? join(dirname(resolve(outputPath)), format + '.json')
    const text = source || existing === undefined ? readIfPresent(file) : undefined
    const data = text === undefined ? existing : readExport(text, file, format)[section]

    if (data === undefined && text === undefined) continue
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error(`Invalid ${section} section in ${text === undefined ? outputPath : file}`)
    }
    reference[section] = data
    sections.push(section)
    console.log(`${section} ← ${text === undefined ? 'existing reference' : file}`)
  }
}

try {
  const original = readIfPresent(outputPath)
  const previous = original === undefined ? undefined : readExport(original, outputPath, 'blood-oracle-rules')
  if (mergeOnly && !previous) throw new Error('Create the base rules reference before using --merge.')
  const reference = mergeOnly ? { ...previous } : rebuildVampireReference()
  if (mergeOnly) sections.push('existing reference')
  mergeCompanions(reference, previous)

  // Foundry can keep serving the preceding file until the replacement is ready.
  const temp = resolve(outputPath + '.' + randomUUID() + '.tmp')
  try {
    writeFileSync(temp, JSON.stringify(reference), { flag: 'wx' })
    if (readIfPresent(outputPath) !== original) throw new Error('The target reference changed during the build.')
    renameSync(temp, outputPath)
  } finally {
    try {
      unlinkSync(temp)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
  }
  console.log(`\nWrote ${outputPath}: ${sections.join(', ')}.`)
  if (skipped.length) console.log(`Left out: ${skipped.join('; ')}.`)
  if (catalogues) console.log('Catalogues under src/app/rules regenerated — commit them if they changed.')
} catch (error) {
  console.error(`\nNot built: ${error.message}`)
  process.exitCode = 1
} finally {
  if (work) rmSync(work, { recursive: true, force: true })
}
