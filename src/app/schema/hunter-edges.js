import { HUNTER_EDGES } from '../rules/hunter-edges.js'

export const EDGE_COST = 7
export const PERK_COST = 3

export function edgeLabel(key, data) {
  return data?.displayName ?? game.i18n.localize(data?.label ?? key)
}

export function edgeOptions(actor, { includeOwned = false } = {}) {
  return Object.entries(WOD5E.Edges.getList({}))
    .filter(([key, data]) => !data.hidden && (includeOwned || !actor.system.edges?.[key]?.visible))
    .map(([value, data]) => {
      const taken = Boolean(actor.system.edges?.[value]?.visible)
      return { value, label: edgeLabel(value, data), group: HUNTER_EDGES[value]?.category, disabled: taken,
        hint: taken ? 'already chosen' : data.custom ? 'custom' : undefined }
    })
}

export function edgeItems(actor, key) {
  return actor.items.filter((item) => item.system.edge === key && ['perk', 'edgepool'].includes(item.type))
}

export function availablePerks(actor, key, pending = []) {
  const owned = edgeItems(actor, key).filter((item) => item.type === 'perk')
  return (HUNTER_EDGES[key]?.perks ?? []).filter(([name, , repeatable]) => {
    if (repeatable === true) return true
    const count = owned.filter((item) => item.name === name).length
      + pending.filter((pick) => pick.edge === key && pick.name === name).length
    return count < (repeatable || 1)
  })
}

export function perkData(edge, name = 'New Perk') {
  return { name, type: 'perk', system: { edge } }
}

export async function addCustomEdge(name) {
  if (!game.user.isGM) {
    ui.notifications.warn('Only a GM can create a custom Edge, since it is a world setting.')
    return null
  }
  if (Object.entries(WOD5E.Edges.getList({})).some(([key, data]) => edgeLabel(key, data).toLowerCase() === name.toLowerCase())) {
    ui.notifications.warn('An Edge with that name already exists.')
    return null
  }
  const id = foundry.utils.randomID(8)
  const list = game.settings.get('wod5e', 'customEdges') ?? []
  await game.settings.set('wod5e', 'customEdges', [...list, { id, label: name }])
  return id
}

export function edgePoolSlots(item, groups) {
  const traits = groups.flatMap((group) => group.entries)
  return Object.values(item?.system.dicepool ?? {}).flatMap(({ path } = {}) => {
    const fullPath = 'system.' + String(path ?? '').replace(/\.value$/, '') + '.value'
    const trait = traits.find((entry) => entry.path === fullPath)
    if (!trait) return []
    return [{ kind: fullPath.startsWith('system.skills.') ? 'skill' : 'attribute', id: trait.id, label: trait.label }]
  })
}

export function edgePoolData(edge, name, description, attribute, skill) {
  return {
    name, type: 'edgepool',
    system: { edge, description, dicepool: {
      attribute: { path: 'attributes.' + attribute },
      skill: { path: 'skills.' + skill }
    } }
  }
}

// Each row represents one pool to record. A row can offer alternatives.
const EDGE_POOLS = {
  arsenal: [[['intelligence', 'craft'], ['manipulation', 'streetwise']]],
  fleet: [[['intelligence', 'technology'], ['manipulation', 'persuasion']]],
  ordnance: [[['composure', 'science'], ['composure', 'streetwise']]],
  library: [[['resolve', 'academics']]],
  improvisedgear: [[['intelligence', 'craft'], ['intelligence', 'technology'], ['intelligence', 'science']]],
  globalaccess: [[['intelligence', 'technology']]],
  dronejockey: [[['wits', 'technology']], [['intelligence', 'craft']]],
  beastwhisperer: [[['charisma', 'animalken']], [['composure', 'animalken']]],
  sensetheunnatural: [[['wits', 'occult'], ['wits', 'science']]],
  repeltheunnatural: [[['resolve', 'occult'], ['resolve', 'science']]],
  thwarttheunnatural: [[['composure', 'occult'], ['composure', 'science']]],
  artifact: [[['intelligence', 'occult'], ['intelligence', 'science']]],
  greatdestiny: [],
  unnaturalchanges: [[['stamina', 'insight'], ['composure', 'insight'], ['resolve', 'insight']]],
  cleansetheunnatural: [[['charisma', 'persuasion'], ['resolve', 'science'], ['manipulation', 'occult']]],
  turncoat: [[['manipulation', 'subterfuge']]],
  experimentalmedicine: [[['stamina', 'medicine'], ['composure', 'insight']]]
}

export function hunterEdgePools(edge) {
  return (EDGE_POOLS[edge] ?? []).map((choices, index) => ({
    choices,
    name: edge === 'dronejockey' ? ['Control', 'Repair'][index]
      : edge === 'beastwhisperer' ? ['Command', 'Train'][index] : ''
  }))
}

export function poolSelection(choices, selected) {
  return choices.length === 1 ? choices[0].join('+') : selected
}

export function edgePoolsComplete(edge, selections) {
  return hunterEdgePools(edge).every(({ choices }, index) =>
    choices.some((pair) => pair.join('+') === poolSelection(choices, selections?.[index])))
}

export function hunterEdgePoolItems(edge, label, selections) {
  return hunterEdgePools(edge).map(({ choices, name }, index) => {
    const [attribute, skill] = poolSelection(choices, selections?.[index]).split('+')
    return edgePoolData(edge, name ? label + ' · ' + name : label, HUNTER_EDGES[edge]?.pool ?? '', attribute, skill)
  })
}
