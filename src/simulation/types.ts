export type BiomeType = 'ocean' | 'beach' | 'plains' | 'forest' | 'hills' | 'mountains' | 'desert' | 'tundra'

export type ResourceType = 'grain' | 'fish' | 'ore' | 'game' | 'spice' | 'timber'

export interface Tile {
  elevation: number
  moisture: number
  biome: BiomeType
  resource: ResourceType | null
}

export interface Terrain {
  seed: number
  width: number
  height: number
  tiles: Tile[][]
}

export interface SimulationParams {
  terrainSeed: number
  resourceDensity: number
  cultureTendencyWeights: Record<CultureTendency, number>
  initialClanCount: number
}

export type CultureTendency = 'martial' | 'mercantile' | 'agrarian' | 'nomadic'

export type CultureTrait = 'expansive' | 'isolationist' | 'innovative' | 'traditional' | 'diplomatic' | 'aggressive'

export interface CultureEvolution {
  era: number
  trait: CultureTrait
  reason: string
}

export interface Culture {
  tendency: CultureTendency
  traits: CultureTrait[]
  evolution: CultureEvolution[]
}

export interface Clan {
  id: string
  name: string
  color: string
  population: number
  culture: Culture
  territory: Point[]
  settledAt: Point | null
  allies: string[]
  enemies: string[]
  parentClanId: string | null
  splitFromEra: number | null
  extinct: boolean
  extinctEra: number | null
}

export interface Point {
  x: number
  y: number
}

export type EventType = 'migration' | 'settlement' | 'split' | 'alliance' | 'war' | 'famine' | 'boom' | 'extinction'

export interface Event {
  id: string
  era: number
  type: EventType
  description: string
  involvedClans: string[]
  location: Point | null
}

export interface RelationEdge {
  source: string
  target: string
  type: 'alliance' | 'war' | 'split' | 'parent'
}

export interface SaveData {
  id: string
  name: string
  timestamp: number
  terrain: Terrain
  clans: Clan[]
  events: Event[]
  currentEra: number
  params: SimulationParams
}

export type SpeedType = 1 | 2 | 5 | 10

export const CLAN_COLORS = [
  '#D4813F', '#3F8DD4', '#D43F3F', '#8B3FD4',
  '#3FD48B', '#D4C83F', '#D43FA1', '#3FD4D4',
  '#7AD43F', '#D47A3F', '#3F3FD4', '#D43F6E',
]

export const BIOME_COLORS: Record<BiomeType, string> = {
  ocean: '#1a3a5c',
  beach: '#d4c090',
  plains: '#8db360',
  forest: '#3d6b35',
  hills: '#9e8c6c',
  mountains: '#7a7a7a',
  desert: '#d4a574',
  tundra: '#c8d8e4',
}

export const CULTURE_TENDENCY_LABELS: Record<CultureTendency, string> = {
  martial: '尚武',
  mercantile: '商贸',
  agrarian: '农耕',
  nomadic: '游牧',
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  migration: '迁徙',
  settlement: '定居',
  split: '分裂',
  alliance: '结盟',
  war: '战争',
  famine: '饥荒',
  boom: '繁荣',
  extinction: '灭亡',
}

export const CULTURE_TRAIT_LABELS: Record<CultureTrait, string> = {
  expansive: '扩张型',
  isolationist: '孤立型',
  innovative: '革新型',
  traditional: '传统型',
  diplomatic: '外交型',
  aggressive: '好战型',
}
