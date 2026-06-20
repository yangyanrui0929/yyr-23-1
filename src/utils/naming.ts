import type { CultureTendency, CultureTrait } from '../simulation/types'
import { CULTURE_TENDENCY_LABELS, CULTURE_TRAIT_LABELS } from '../simulation/types'

const SURNAMES = [
  '风', '云', '雷', '山', '河', '石', '林', '火',
  '冰', '雪', '霜', '月', '星', '日', '海', '岩',
]

const TRIBAL_NAMES = [
  '部落', '氏族', '部族', '族群', '宗族',
]

const PLACE_PREFIXES = [
  '青', '赤', '金', '白', '黑', '翠', '紫', '苍',
  '幽', '明', '暗', '玄', '灵', '圣', '古', '新',
]

const PLACE_SUFFIXES = [
  '原', '谷', '岭', '泽', '川', '城', '镇', '港',
  '关', '渡', '寨', '营', '墟', '坊', '甸', '泊',
]

let nameCounter = 0

export function generateClanName(tendency: CultureTendency): string {
  nameCounter++
  const idx = (nameCounter - 1) % SURNAMES.length
  const suffix = tendency === 'nomadic' ? TRIBAL_NAMES[Math.floor(Math.random() * TRIBAL_NAMES.length)]
    : tendency === 'martial' ? '部'
    : tendency === 'mercantile' ? '商'
    : '族'
  return SURNAMES[idx] + suffix
}

export function generatePlaceName(): string {
  const prefix = PLACE_PREFIXES[Math.floor(Math.random() * PLACE_PREFIXES.length)]
  const suffix = PLACE_SUFFIXES[Math.floor(Math.random() * PLACE_SUFFIXES.length)]
  return prefix + suffix
}

export function describeCultureBrief(tendency: CultureTendency, traits: CultureTrait[]): string {
  const tendencyLabel = CULTURE_TENDENCY_LABELS[tendency]
  const traitLabels = traits.map(t => CULTURE_TRAIT_LABELS[t]).join('·')
  return `${tendencyLabel} | ${traitLabels}`
}

export function resetNaming(): void {
  nameCounter = 0
}
