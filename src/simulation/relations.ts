import type { RelationEdge, Clan } from '../simulation/types'

export function buildRelationEdges(clans: Clan[]): RelationEdge[] {
  const edges: RelationEdge[] = []
  for (const clan of clans) {
    if (clan.extinct) continue
    for (const allyId of clan.allies) {
      if (clan.id < allyId) {
        edges.push({ source: clan.id, target: allyId, type: 'alliance' })
      }
    }
    for (const enemyId of clan.enemies) {
      if (clan.id < enemyId) {
        edges.push({ source: clan.id, target: enemyId, type: 'war' })
      }
    }
    if (clan.parentClanId) {
      edges.push({ source: clan.parentClanId, target: clan.id, type: 'split' })
    }
  }
  return edges
}

export function getClanAncestors(clans: Clan[], clanId: string): Clan[] {
  const clanMap = new Map(clans.map(c => [c.id, c]))
  const ancestors: Clan[] = []
  let current = clanMap.get(clanId)
  while (current?.parentClanId) {
    const parent = clanMap.get(current.parentClanId)
    if (parent) {
      ancestors.push(parent)
      current = parent
    } else break
  }
  return ancestors
}

export function getClanDescendants(clans: Clan[], clanId: string): Clan[] {
  const direct = clans.filter(c => c.parentClanId === clanId)
  const all: Clan[] = [...direct]
  for (const child of direct) {
    all.push(...getClanDescendants(clans, child.id))
  }
  return all
}

export function getClanTree(clans: Clan[]): Map<string, string[]> {
  const tree = new Map<string, string[]>()
  for (const clan of clans) {
    if (clan.parentClanId) {
      const children = tree.get(clan.parentClanId) ?? []
      children.push(clan.id)
      tree.set(clan.parentClanId, children)
    }
    if (!tree.has(clan.id)) tree.set(clan.id, [])
  }
  return tree
}

export function getRootClans(clans: Clan[]): Clan[] {
  return clans.filter(c => c.parentClanId === null)
}

export interface LineageNode {
  id: string
  name: string
  color: string
  extinct: boolean
  population: number
  children: LineageNode[]
}

export function buildLineageTree(clans: Clan[]): LineageNode[] {
  const clanMap = new Map(clans.map(c => [c.id, c]))
  const built = new Set<string>()

  function buildNode(clan: Clan): LineageNode {
    built.add(clan.id)
    const children = clans
      .filter(c => c.parentClanId === clan.id)
      .map(c => buildNode(c))
    return {
      id: clan.id,
      name: clan.name,
      color: clan.color,
      extinct: clan.extinct,
      population: clan.population,
      children,
    }
  }

  return clans
    .filter(c => c.parentClanId === null || !clanMap.has(c.parentClanId))
    .map(c => buildNode(c))
}
