/**
 * The smallest xlsx reader that serves the extractors: an xlsx file is a zip
 * of XML, and only the shared strings, the workbook and its first sheet are
 * needed. No packages, so the tools run without npm install.
 */

import { inflateRawSync } from 'node:zlib'

/* ----------------------------------------------------------------- zip */

export function readZip(buffer) {
  // The end-of-central-directory record sits in the last 64 KB.
  let eocd = -1
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65558); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error('Not a zip file — is this really an .xlsx?')

  const count = buffer.readUInt16LE(eocd + 10)
  let offset = buffer.readUInt32LE(eocd + 16)
  const files = new Map()

  for (let n = 0; n < count; n++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('Damaged zip directory.')
    const method = buffer.readUInt16LE(offset + 10)
    const compressedSize = buffer.readUInt32LE(offset + 20)
    const nameLength = buffer.readUInt16LE(offset + 28)
    const extraLength = buffer.readUInt16LE(offset + 30)
    const commentLength = buffer.readUInt16LE(offset + 32)
    const localOffset = buffer.readUInt32LE(offset + 42)
    const name = buffer.toString('utf8', offset + 46, offset + 46 + nameLength)
    files.set(name, { method, compressedSize, localOffset })
    offset += 46 + nameLength + extraLength + commentLength
  }

  return (name) => {
    const entry = files.get(name)
    if (!entry) return null
    const local = entry.localOffset
    const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28)
    const data = buffer.subarray(start, start + entry.compressedSize)
    if (entry.method === 0) return data.toString('utf8')
    if (entry.method === 8) return inflateRawSync(data).toString('utf8')
    throw new Error(`Unsupported compression in ${name}.`)
  }
}

/* ----------------------------------------------------------------- xml */

const decode = (text) =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, '&')

/** Every <t> inside a fragment, joined — rich text splits a cell into runs. */
const textOf = (fragment) =>
  [...fragment.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((match) => decode(match[1])).join('')

function columnIndex(ref) {
  const letters = ref.replace(/\d+/g, '')
  let index = 0
  for (const char of letters) index = index * 26 + (char.charCodeAt(0) - 64)
  return index - 1
}

function sharedStrings(file) {
  const shared = []
  const sharedXml = file('xl/sharedStrings.xml')
  if (sharedXml) {
    for (const match of sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)) shared.push(textOf(match[1]))
  }
  return shared
}

function targetOf(rels, id) {
  return (
    rels.match(new RegExp(`<Relationship\\b[^>]*Id="${id}"[^>]*Target="([^"]+)"`))?.[1] ??
    rels.match(new RegExp(`<Relationship\\b[^>]*Target="([^"]+)"[^>]*Id="${id}"`))?.[1] ??
    null
  )
}

function readRows(sheet, shared) {
  const rows = []
  for (const rowMatch of sheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = []
    for (const cell of rowMatch[1].matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attributes = cell[1]
      const body = cell[2] ?? ''
      const ref = attributes.match(/\br="([A-Z]+\d+)"/)?.[1]
      const type = attributes.match(/\bt="([^"]+)"/)?.[1]
      const raw = body.match(/<v>([\s\S]*?)<\/v>/)?.[1]
      let value = ''
      if (type === 's') value = shared[Number(raw)] ?? ''
      else if (type === 'inlineStr') value = textOf(body)
      else if (raw !== undefined) value = decode(raw)
      if (ref) row[columnIndex(ref)] = value
    }
    rows.push(row)
  }
  return rows
}

/** Every sheet in workbook order: [{ name, rows }]. */
export function readSheets(file) {
  const shared = sharedStrings(file)
  const workbook = file('xl/workbook.xml')
  const rels = file('xl/_rels/workbook.xml.rels') ?? ''
  const sheets = []
  for (const match of workbook.matchAll(/<sheet\b([^>]*)\/?>/g)) {
    const attributes = match[1]
    const name = decode(attributes.match(/\bname="([^"]*)"/)?.[1] ?? '')
    const id = attributes.match(/\br:id="([^"]+)"/)?.[1]
    const target = id ? targetOf(rels, id) : null
    if (!target) continue
    const sheet = file(`xl/${target.replace(/^\/?xl\//, '')}`)
    if (sheet) sheets.push({ name, rows: readRows(sheet, shared) })
  }
  if (!sheets.length) throw new Error('No sheets found in the workbook.')
  return sheets
}

/** The first sheet's rows, header included. */
export function readFirstSheet(file) {
  return readSheets(file)[0].rows
}
