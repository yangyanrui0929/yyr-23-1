import type { Culture, CultureTendency, CultureTrait, CultureEvolution } from './types'

export function createCulture(tendency: CultureTendency): Culture {
  const baseTraits = getBaseTraits(tendency)
  return {
    tendency,
    traits: baseTraits,
    evolution: [],
  }
}

function getBaseTraits(tendency: CultureTendency): CultureTrait[] {
  switch (tendency) {
    case 'martial': return ['aggressive', 'expansive']
    case 'mercantile': return ['diplomatic', 'innovative']
    case 'agrarian': return ['traditional', 'isolationist']
    case 'nomadic': return ['expansive', 'innovative']
  }
}

export function evolveCulture(culture: Culture, era: number, pressure: 'scarcity' | 'abundance' | 'conflict' | 'peace'): Culture {
  const newTrait = determineNewTrait(culture, pressure)
  if (!newTrait) return culture
  const existing = culture.traits.includes(newTrait)
  if (existing) return culture
  const maxTraits = 4
  const updatedTraits = culture.traits.length >= maxTraits
    ? [...culture.traits.slice(1), newTrait]
    : [...culture.traits, newTrait]
  const evolution: CultureEvolution = {
    era,
    trait: newTrait,
    reason: getEvolutionReason(pressure, newTrait),
  }
  return {
    ...culture,
    traits: updatedTraits,
    evolution: [...culture.evolution, evolution],
  }
}

function determineNewTrait(culture: Culture, pressure: string): CultureTrait | null {
  const tendency = culture.tendency
  const currentTraits = new Set(culture.traits)
  const candidates: CultureTrait[] = []

  if (pressure === 'scarcity') {
    candidates.push('aggressive', 'expansive', 'innovative')
  } else if (pressure === 'abundance') {
    candidates.push('diplomatic', 'traditional', 'isolationist')
  } else if (pressure === 'conflict') {
    candidates.push('aggressive', 'expansive', 'innovative')
  } else {
    candidates.push('diplomatic', 'traditional', 'isolationist')
  }

  if (tendency === 'martial') candidates.push('aggressive', 'expansive')
  else if (tendency === 'mercantile') candidates.push('diplomatic', 'innovative')
  else if (tendency === 'agrarian') candidates.push('traditional', 'isolationist')
  else if (tendency === 'nomadic') candidates.push('expansive', 'innovative')

  const filtered = candidates.filter(t => !currentTraits.has(t))
  if (filtered.length === 0) return null
  return filtered[Math.floor(Math.random() * filtered.length)]
}

function getEvolutionReason(pressure: string, trait: CultureTrait): string {
  const reasons: Record<string, Record<CultureTrait, string>> = {
    scarcity: {
      aggressive: '资源匮乏催生了尚武之风',
      expansive: '为求生存，族群向外扩张',
      innovative: '困境激发创造力',
      traditional: '回归传统以凝聚人心',
      diplomatic: '以谈判争取稀缺资源',
      isolationist: '闭门自守以节约资源',
    },
    abundance: {
      aggressive: '富足助长了征服野心',
      expansive: '人口增长推动扩张',
      innovative: '繁荣孕育技术进步',
      traditional: '安逸强化了传统秩序',
      diplomatic: '贸易繁荣促进外交',
      isolationist: '自给自足无需外联',
    },
    conflict: {
      aggressive: '战火锻造了尚武精神',
      expansive: '战争推动疆域拓展',
      innovative: '军备竞赛催生革新',
      traditional: '危难中回归传统',
      diplomatic: '寻求和平之路',
      isolationist: '战乱中闭关自守',
    },
    peace: {
      aggressive: '长期和平中尚武精神衰退',
      expansive: '和平时期温和扩张',
      innovative: '太平盛世孕育发明',
      traditional: '和平巩固传统秩序',
      diplomatic: '邦交日益密切',
      isolationist: '安于现状不思进取',
    },
  }
  return (reasons[pressure]?.[trait]) ?? '文化自然演化'
}

export function getCultureScore(culture: Culture, context: 'war' | 'trade' | 'growth' | 'survival'): number {
  let score = 0
  for (const trait of culture.traits) {
    switch (context) {
      case 'war':
        if (trait === 'aggressive') score += 3
        if (trait === 'expansive') score += 1
        if (trait === 'isolationist') score -= 1
        if (trait === 'diplomatic') score -= 1
        break
      case 'trade':
        if (trait === 'diplomatic') score += 3
        if (trait === 'innovative') score += 2
        if (trait === 'aggressive') score -= 2
        break
      case 'growth':
        if (trait === 'expansive') score += 3
        if (trait === 'innovative') score += 2
        if (trait === 'isolationist') score -= 2
        break
      case 'survival':
        if (trait === 'traditional') score += 2
        if (trait === 'isolationist') score += 1
        if (trait === 'expansive') score -= 1
        break
    }
  }
  return score
}

export function shouldEvolve(era: number, lastEvolutionEra: number): boolean {
  const gap = era - lastEvolutionEra
  return gap >= 5 && Math.random() < 0.3
}

export function pickTendencyByWeights(weights: Record<CultureTendency, number>): CultureTendency {
  const entries = Object.entries(weights) as [CultureTendency, number][]
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  if (total === 0) return 'agrarian'
  let r = Math.random() * total
  for (const [tendency, weight] of entries) {
    r -= weight
    if (r <= 0) return tendency
  }
  return entries[entries.length - 1][0]
}
