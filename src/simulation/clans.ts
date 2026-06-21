import type { Clan, Terrain, Point, CultureTendency, SimulationParams } from './types'
import { CLAN_COLORS } from './types'
import { createCulture, evolveCulture, getCultureScore, shouldEvolve, pickTendencyByWeights } from './culture'
import { generateClanName } from '../utils/naming'
import { findSettleablePositions, isLand, getNeighbors } from './terrain'

let clanIdCounter = 0

export function resetClanCounter(): void {
  clanIdCounter = 0
}

export function createClan(
  tendency: CultureTendency,
  startPostion: Point,
  population: number = 50
): Clan {
  const id = `clan_${++clanIdCounter}`
  const name = generateClanName(tendency)
  const colorIdx = (clanIdCounter - 1) % CLAN_COLORS.length
  const culture = createCulture(tendency)
  return {
    id,
    name,
    color: CLAN_COLORS[colorIdx],
    population,
    culture,
    territory: [startPostion],
    settledAt: startPostion,
    allies: [],
    enemies: [],
    parentClanId: null,
    splitFromEra: null,
    extinct: false,
    extinctEra: null,
  }
}

export function seedInitialClans(terrain: Terrain, params: SimulationParams): Clan[] {
  const positions = findSettleablePositions(terrain)
  const clans: Clan[] = []
  const usedPositions = new Set<string>()
  const count = Math.min(params.initialClanCount, positions.length)
  let posIdx = 0

  for (let i = 0; i < count; i++) {
    while (posIdx < positions.length) {
      const pos = positions[posIdx]
      const key = `${pos.x},${pos.y}`
      posIdx++
      if (usedPositions.has(key)) continue
      const tooClose = clans.some(c => {
        const s = c.settledAt!
        return Math.abs(s.x - pos.x) + Math.abs(s.y - pos.y) < 6
      })
      if (tooClose) continue
      usedPositions.add(key)
      const tendency = pickTendencyByWeights(params.cultureTendencyWeights)
      const clan = createClan(tendency, pos, 40 + Math.floor(Math.random() * 30))
      clans.push(clan)
      break
    }
  }
  return clans
}

export interface TurnResultEvent {
  type: string
  description: string
  location: Point | null
  involvedClans: string[]
  newClan?: Clan
  targetClanUpdate?: { id: string; patch: Partial<Clan> }
}

export function simulateClanTurn(clan: Clan, terrain: Terrain, allClans: Clan[], currentEra: number): {
  clan: Clan
  events: TurnResultEvent[]
} {
  if (clan.extinct) return { clan, events: [] }

  const events: TurnResultEvent[] = []
  let updatedClan = { ...clan }

  const growthResult = simulatePopulationGrowth(updatedClan, terrain)
  updatedClan = growthResult.clan
  if (growthResult.event) events.push(growthResult.event)

  const lastEvoEra = updatedClan.culture.evolution.length > 0
    ? updatedClan.culture.evolution[updatedClan.culture.evolution.length - 1].era
    : 0
  if (shouldEvolve(currentEra, lastEvoEra)) {
    const pressure = determinePressure(updatedClan, terrain)
    updatedClan = {
      ...updatedClan,
      culture: evolveCulture(updatedClan.culture, currentEra, pressure),
    }
  }

  const migrateChance = getMigrateChance(updatedClan, terrain)
  if (Math.random() < migrateChance) {
    const migrateResult = tryMigrate(updatedClan, terrain, allClans)
    if (migrateResult) {
      updatedClan = migrateResult.clan
      events.push(migrateResult.event)
    }
  }

  if (updatedClan.population > 120 && Math.random() < 0.15) {
    const splitResult = trySplit(updatedClan, terrain, currentEra)
    if (splitResult) {
      updatedClan = splitResult.parent
      events.push({
        ...splitResult.event,
        newClan: splitResult.child,
      })
      return { clan: updatedClan, events }
    }
  }

  if (updatedClan.culture.traits.includes('expansive') && Math.random() < 0.2) {
    const expandResult = tryExpand(updatedClan, terrain, allClans)
    if (expandResult) {
      updatedClan = expandResult.clan
      events.push(expandResult.event)
    }
  }

  if (updatedClan.culture.traits.includes('aggressive') && Math.random() < 0.15) {
    const warResult = tryWar(updatedClan, allClans)
    if (warResult) {
      updatedClan = warResult.clan
      events.push(warResult.event)
    }
  } else if (updatedClan.culture.traits.includes('diplomatic') && Math.random() < 0.2) {
    const allianceResult = tryAlliance(updatedClan, allClans)
    if (allianceResult) {
      updatedClan = allianceResult.clan
      events.push(allianceResult.event)
    }
  }

  if (updatedClan.population <= 0) {
    updatedClan = { ...updatedClan, extinct: true, extinctEra: currentEra }
    events.push({
      type: 'extinction',
      description: `${updatedClan.name}因人口凋零而灭亡`,
      location: updatedClan.settledAt,
      involvedClans: [updatedClan.id],
    })
  }

  return { clan: updatedClan, events }
}

function getMigrateChance(clan: Clan, terrain: Terrain): number {
  let chance = 0
  if (clan.culture.tendency === 'nomadic') chance += 0.25
  if (clan.culture.traits.includes('expansive')) chance += 0.08
  if (clan.culture.traits.includes('isolationist')) chance -= 0.1

  const pressure = determinePressure(clan, terrain)
  if (pressure === 'scarcity') chance += 0.2
  if (pressure === 'conflict') chance += 0.12
  if (pressure === 'abundance') chance -= 0.15

  return Math.max(0, Math.min(0.6, chance))
}

function determinePressure(clan: Clan, terrain: Terrain): 'scarcity' | 'abundance' | 'conflict' | 'peace' {
  const territory = clan.territory
  let resourceCount = 0
  for (const pos of territory) {
    const tile = terrain.tiles[pos.y]?.[pos.x]
    if (tile?.resource) resourceCount++
  }
  const resourcePerCapita = resourceCount / Math.max(clan.population, 1)
  if (clan.enemies.length > 0) return Math.random() < 0.7 ? 'conflict' : 'scarcity'
  if (resourcePerCapita > 0.5) return Math.random() < 0.6 ? 'abundance' : 'peace'
  if (resourcePerCapita < 0.2) return Math.random() < 0.6 ? 'scarcity' : 'conflict'
  return Math.random() < 0.5 ? 'peace' : 'abundance'
}

function simulatePopulationGrowth(clan: Clan, terrain: Terrain): {
  clan: Clan
  event?: TurnResultEvent
} {
  let resourceScore = 0
  for (const pos of clan.territory) {
    const tile = terrain.tiles[pos.y]?.[pos.x]
    if (!tile) continue
    if (tile.resource) resourceScore += 1
    if (tile.biome === 'plains') resourceScore += 0.5
    if (tile.biome === 'forest') resourceScore += 0.3
  }
  const growthRate = resourceScore > clan.population * 0.3 ? 1.05 : 0.97
  const randomFactor = 0.9 + Math.random() * 0.2
  const newPopulation = Math.max(0, Math.floor(clan.population * growthRate * randomFactor))

  if (newPopulation < clan.population * 0.7) {
    return {
      clan: { ...clan, population: newPopulation },
      event: {
        type: 'famine',
        description: `${clan.name}遭遇严重饥荒，人口锐减`,
        location: clan.settledAt,
        involvedClans: [clan.id],
      },
    }
  }
  if (newPopulation > clan.population * 1.3) {
    return {
      clan: { ...clan, population: newPopulation },
      event: {
        type: 'boom',
        description: `${clan.name}迎来繁荣时期，人口增长`,
        location: clan.settledAt,
        involvedClans: [clan.id],
      },
    }
  }
  return { clan: { ...clan, population: newPopulation } }
}

function trySplit(clan: Clan, terrain: Terrain, currentEra: number): {
  parent: Clan
  child: Clan
  event: { type: string; description: string; location: Point | null; involvedClans: string[] }
} | null {
  const settleable = findSettleablePositions(terrain)
  const usedPositions = new Set(clan.territory.map(p => `${p.x},${p.y}`))
  const available = settleable.filter(p => {
    if (usedPositions.has(`${p.x},${p.y}`)) return false
    const dx = Math.abs(p.x - (clan.settledAt?.x ?? 0))
    const dy = Math.abs(p.y - (clan.settledAt?.y ?? 0))
    return dx + dy > 3 && dx + dy < 20
  })
  if (available.length === 0) return null

  const newPos = available[Math.floor(Math.random() * Math.min(5, available.length))]
  const tendency: CultureTendency = Math.random() < 0.5 ? clan.culture.tendency : (
    ['martial', 'mercantile', 'agrarian', 'nomadic'] as CultureTendency[]
  )[Math.floor(Math.random() * 4)]
  const childId = `clan_${++clanIdCounter}`
  const childName = generateClanName(tendency)
  const colorIdx = (clanIdCounter - 1) % CLAN_COLORS.length
  const childPop = Math.floor(clan.population * 0.35)
  const child: Clan = {
    id: childId,
    name: childName,
    color: CLAN_COLORS[colorIdx],
    population: childPop,
    culture: createCulture(tendency),
    territory: [newPos],
    settledAt: newPos,
    allies: [clan.id],
    enemies: [...clan.enemies],
    parentClanId: clan.id,
    splitFromEra: currentEra,
    extinct: false,
    extinctEra: null,
  }
  const updatedParent: Clan = {
    ...clan,
    population: clan.population - childPop,
    allies: [...clan.allies, childId],
  }
  return {
    parent: updatedParent,
    child,
    event: {
      type: 'split',
      description: `${clan.name}分裂出${childName}`,
      location: newPos,
      involvedClans: [clan.id, childId],
    },
  }
}

function scorePosition(terrain: Terrain, x: number, y: number): number {
  const tile = terrain.tiles[y]?.[x]
  if (!tile || !isLand(tile) || tile.biome === 'mountains') return -100
  let score = 0
  if (tile.resource) score += 3
  if (tile.biome === 'plains') score += 1.5
  if (tile.biome === 'forest') score += 0.8
  if (tile.biome === 'hills') score += 0.5
  if (tile.biome === 'desert') score -= 1
  if (tile.biome === 'tundra') score -= 0.5
  const neighbors = getNeighbors(terrain, x, y)
  const waterCount = neighbors.filter(n => n.tile.biome === 'ocean').length
  if (waterCount > 0 && waterCount < 4) score += 1
  const resourceNeighbors = neighbors.filter(n => n.tile.resource !== null).length
  score += resourceNeighbors * 0.5
  return score
}

function tryMigrate(clan: Clan, terrain: Terrain, allClans: Clan[]): {
  clan: Clan
  event: TurnResultEvent
} | null {
  if (!clan.settledAt) return null
  const fromPos = clan.settledAt
  const isNomadic = clan.culture.tendency === 'nomadic'
  const searchRadius = isNomadic ? 20 : 10
  const occupiedSet = new Set<string>()
  for (const other of allClans) {
    if (other.id === clan.id || other.extinct) continue
    for (const t of other.territory) occupiedSet.add(`${t.x},${t.y}`)
  }

  let bestPos: Point | null = null
  let bestScore = -Infinity
  const currentScore = scorePosition(terrain, fromPos.x, fromPos.y) + clan.territory.length * 0.3

  const minX = Math.max(1, fromPos.x - searchRadius)
  const maxX = Math.min(terrain.width - 2, fromPos.x + searchRadius)
  const minY = Math.max(1, fromPos.y - searchRadius)
  const maxY = Math.min(terrain.height - 2, fromPos.y + searchRadius)

  for (let y = minY; y <= maxY; y += 2) {
    for (let x = minX; x <= maxX; x += 2) {
      if (occupiedSet.has(`${x},${y}`)) continue
      const dist = Math.abs(x - fromPos.x) + Math.abs(y - fromPos.y)
      if (dist < 4) continue
      const score = scorePosition(terrain, x, y)
      if (isNomadic) {
        if (score > currentScore * 0.9 && score > bestScore) {
          bestScore = score
          bestPos = { x, y }
        }
      } else {
        if (score > currentScore * 1.2 && score > bestScore) {
          bestScore = score
          bestPos = { x, y }
        }
      }
    }
  }

  if (!bestPos) return null

  const territorySize = clan.territory.length
  const newTerritory: Point[] = [bestPos]
  const frontier = [bestPos]
  const visited = new Set<string>([`${bestPos.x},${bestPos.y}`])

  while (newTerritory.length < territorySize && frontier.length > 0) {
    const current = frontier.shift()!
    const neighbors = getNeighbors(terrain, current.x, current.y)
    for (const n of neighbors) {
      const key = `${n.x},${n.y}`
      if (visited.has(key)) continue
      if (!isLand(n.tile) || n.tile.biome === 'mountains') continue
      if (occupiedSet.has(key)) continue
      visited.add(key)
      newTerritory.push({ x: n.x, y: n.y })
      frontier.push({ x: n.x, y: n.y })
      if (newTerritory.length >= territorySize) break
    }
  }

  const fromDesc = `(${fromPos.x},${fromPos.y})`
  const toDesc = `(${bestPos.x},${bestPos.y})`

  return {
    clan: {
      ...clan,
      settledAt: bestPos,
      territory: newTerritory,
    },
    event: {
      type: 'migration',
      description: `${clan.name}从${fromDesc}迁徙至${toDesc}`,
      location: bestPos,
      involvedClans: [clan.id],
    },
  }
}

function tryExpand(clan: Clan, terrain: Terrain, allClans: Clan[]): {
  clan: Clan
  event: TurnResultEvent
} | null {
  const neighbors: Point[] = []
  for (const pos of clan.territory) {
    for (const n of getNeighbors(terrain, pos.x, pos.y)) {
      if (isLand(n.tile) && !clan.territory.some(t => t.x === n.x && t.y === n.y)) {
        neighbors.push({ x: n.x, y: n.y })
      }
    }
  }
  if (neighbors.length === 0) return null

  const occupiedByOthers = new Set<string>()
  for (const other of allClans) {
    if (other.id === clan.id || other.extinct) continue
    for (const t of other.territory) occupiedByOthers.add(`${t.x},${t.y}`)
  }

  const freeNeighbors = neighbors.filter(n => !occupiedByOthers.has(`${n.x},${n.y}`))
  if (freeNeighbors.length === 0) return null

  const target = freeNeighbors[Math.floor(Math.random() * freeNeighbors.length)]
  return {
    clan: { ...clan, territory: [...clan.territory, target] },
    event: {
      type: 'settlement',
      description: `${clan.name}扩张至(${target.x},${target.y})`,
      location: target,
      involvedClans: [clan.id],
    },
  }
}

function tryWar(clan: Clan, allClans: Clan[]): {
  clan: Clan
  event: TurnResultEvent
} | null {
  const potentialTargets = allClans.filter(c =>
    !c.extinct && c.id !== clan.id
    && !clan.allies.includes(c.id)
    && !clan.enemies.includes(c.id)
    && !c.enemies.includes(clan.id)
  )
  if (potentialTargets.length === 0) return null

  const target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)]
  const attackerScore = getCultureScore(clan.culture, 'war') + clan.population * 0.01
  const defenderScore = getCultureScore(target.culture, 'war') + target.population * 0.01

  if (attackerScore > defenderScore * 0.8) {
    return {
      clan: {
        ...clan,
        enemies: [...clan.enemies, target.id],
        allies: clan.allies.filter(a => a !== target.id),
        population: Math.max(1, clan.population - Math.floor(Math.random() * 10)),
      },
      event: {
        type: 'war',
        description: `${clan.name}向${target.name}发动战争`,
        location: clan.settledAt,
        involvedClans: [clan.id, target.id],
        targetClanUpdate: {
          id: target.id,
          patch: {
            enemies: [...target.enemies, clan.id],
            allies: target.allies.filter(a => a !== clan.id),
          },
        },
      },
    }
  }
  return null
}

function tryAlliance(clan: Clan, allClans: Clan[]): {
  clan: Clan
  event: TurnResultEvent
} | null {
  const candidates = allClans.filter(c =>
    !c.extinct && c.id !== clan.id
    && !clan.allies.includes(c.id)
    && !c.allies.includes(clan.id)
    && !clan.enemies.includes(c.id)
    && !c.enemies.includes(clan.id)
  )
  if (candidates.length === 0) return null

  const partner = candidates[Math.floor(Math.random() * candidates.length)]
  const score = getCultureScore(clan.culture, 'trade') + getCultureScore(partner.culture, 'trade')
  if (score < 2) return null

  return {
    clan: {
      ...clan,
      allies: [...clan.allies, partner.id],
    },
    event: {
      type: 'alliance',
      description: `${clan.name}与${partner.name}缔结同盟`,
      location: clan.settledAt,
      involvedClans: [clan.id, partner.id],
      targetClanUpdate: {
        id: partner.id,
        patch: {
          allies: [...partner.allies, clan.id],
        },
      },
    },
  }
}

export function applyWarDamage(allClans: Clan[]): Clan[] {
  const damageMap = new Map<string, number>()
  for (const clan of allClans) {
    if (clan.extinct) continue
    for (const enemyId of clan.enemies) {
      const enemy = allClans.find(c => c.id === enemyId)
      if (!enemy || enemy.extinct) continue
      const atkScore = getCultureScore(clan.culture, 'war') + clan.population * 0.01
      const dmg = Math.max(1, Math.floor(atkScore * 2 + Math.random() * 5))
      damageMap.set(enemyId, (damageMap.get(enemyId) ?? 0) + dmg)
    }
  }
  return allClans.map(c => {
    const dmg = damageMap.get(c.id)
    if (!dmg) return c
    const newPop = Math.max(0, c.population - dmg)
    return { ...c, population: newPop }
  })
}
