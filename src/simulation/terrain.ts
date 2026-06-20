import type { Terrain, Tile, BiomeType, ResourceType } from './types'

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

class NoiseGenerator {
  private perm: number[] = []

  constructor(seed: number) {
    const rng = seededRandom(seed)
    const p: number[] = []
    for (let i = 0; i < 256; i++) p[i] = i
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]]
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255]
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a)
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3
    const u = h < 2 ? x : y
    const v = h < 2 ? y : x
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
  }

  noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255
    const xf = x - Math.floor(x)
    const yf = y - Math.floor(y)
    const u = this.fade(xf)
    const v = this.fade(yf)
    const aa = this.perm[this.perm[X] + Y]
    const ab = this.perm[this.perm[X] + Y + 1]
    const ba = this.perm[this.perm[X + 1] + Y]
    const bb = this.perm[this.perm[X + 1] + Y + 1]
    return this.lerp(
      this.lerp(this.grad(aa, xf, yf), this.grad(ba, xf - 1, yf), u),
      this.lerp(this.grad(ab, xf, yf - 1), this.grad(bb, xf - 1, yf - 1), u),
      v
    )
  }

  fbm(x: number, y: number, octaves: number = 4, lacunarity: number = 2, gain: number = 0.5): number {
    let value = 0
    let amplitude = 1
    let frequency = 1
    let maxValue = 0
    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise2D(x * frequency, y * frequency)
      maxValue += amplitude
      amplitude *= gain
      frequency *= lacunarity
    }
    return value / maxValue
  }
}

function determineBiome(elevation: number, moisture: number): BiomeType {
  if (elevation < 0.25) return 'ocean'
  if (elevation < 0.3) return 'beach'
  if (elevation > 0.75) {
    if (moisture > 0.4) return 'tundra'
    return 'mountains'
  }
  if (elevation > 0.6) return 'hills'
  if (moisture < 0.2) return 'desert'
  if (moisture > 0.6) return 'forest'
  return 'plains'
}

function determineResource(biome: BiomeType, elevation: number, moisture: number, rng: () => number, density: number): ResourceType | null {
  if (biome === 'ocean') return rng() < 0.3 * density ? 'fish' : null
  if (biome === 'beach') return rng() < 0.15 * density ? 'fish' : null
  if (biome === 'plains') return rng() < 0.35 * density ? 'grain' : null
  if (biome === 'forest') {
    if (rng() < 0.3 * density) return 'timber'
    if (rng() < 0.2 * density) return 'game'
    return null
  }
  if (biome === 'hills') {
    if (rng() < 0.25 * density) return 'ore'
    if (rng() < 0.15 * density) return 'game'
    return null
  }
  if (biome === 'mountains') return rng() < 0.3 * density ? 'ore' : null
  if (biome === 'desert') return rng() < 0.1 * density ? 'spice' : null
  if (biome === 'tundra') return rng() < 0.15 * density ? 'game' : null
  return null
}

export function generateTerrain(seed: number, width: number = 80, height: number = 60, resourceDensity: number = 0.5): Terrain {
  const elevationNoise = new NoiseGenerator(seed)
  const moistureNoise = new NoiseGenerator(seed + 12345)
  const rng = seededRandom(seed + 99999)
  const tiles: Tile[][] = []

  for (let y = 0; y < height; y++) {
    const row: Tile[] = []
    for (let x = 0; x < width; x++) {
      const nx = x / width
      const ny = y / height
      let elevation = (elevationNoise.fbm(nx * 4, ny * 4, 5) + 1) / 2
      const dx = nx - 0.5
      const dy = ny - 0.5
      const distFromCenter = Math.sqrt(dx * dx + dy * dy) * 2
      elevation = elevation - distFromCenter * 0.4
      elevation = Math.max(0, Math.min(1, elevation + 0.15))
      const moisture = (moistureNoise.fbm(nx * 3 + 50, ny * 3 + 50, 4) + 1) / 2
      const biome = determineBiome(elevation, moisture)
      const resource = determineResource(biome, elevation, moisture, rng, resourceDensity)
      row.push({ elevation, moisture, biome, resource })
    }
    tiles.push(row)
  }

  return { seed, width, height, tiles }
}

export function getTileAt(terrain: Terrain, x: number, y: number): Tile | null {
  if (x < 0 || x >= terrain.width || y < 0 || y >= terrain.height) return null
  return terrain.tiles[y][x]
}

export function getNeighbors(terrain: Terrain, x: number, y: number): { x: number; y: number; tile: Tile }[] {
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]
  const result: { x: number; y: number; tile: Tile }[] = []
  for (const [dx, dy] of dirs) {
    const nx = x + dx
    const ny = y + dy
    const tile = getTileAt(terrain, nx, ny)
    if (tile) result.push({ x: nx, y: ny, tile })
  }
  return result
}

export function isLand(tile: Tile): boolean {
  return tile.biome !== 'ocean'
}

export function findSettleablePositions(terrain: Terrain): { x: number; y: number }[] {
  const positions: { x: number; y: number; score: number }[] = []
  for (let y = 0; y < terrain.height; y++) {
    for (let x = 0; x < terrain.width; x++) {
      const tile = terrain.tiles[y][x]
      if (!isLand(tile) || tile.biome === 'mountains') continue
      let score = 0
      if (tile.resource) score += 2
      if (tile.biome === 'plains') score += 1
      if (tile.biome === 'forest') score += 0.5
      const neighbors = getNeighbors(terrain, x, y)
      const waterNeighbors = neighbors.filter(n => n.tile.biome === 'ocean' || n.tile.biome === 'beach').length
      if (waterNeighbors > 0 && waterNeighbors < 4) score += 1
      const resourceNeighbors = neighbors.filter(n => n.tile.resource !== null).length
      score += resourceNeighbors * 0.3
      positions.push({ x, y, score })
    }
  }
  positions.sort((a, b) => b.score - a.score)
  return positions.map(p => ({ x: p.x, y: p.y }))
}
