import type { Event, Clan } from '../simulation/types'
import { EVENT_TYPE_LABELS, CULTURE_TENDENCY_LABELS, CULTURE_TRAIT_LABELS } from '../simulation/types'

export function exportAsJSON(events: Event[], clans: Clan[], currentEra: number): string {
  const data = {
    exportTime: new Date().toISOString(),
    currentEra,
    totalEvents: events.length,
    events: events.map(e => ({
      era: e.era,
      type: EVENT_TYPE_LABELS[e.type],
      description: e.description,
      clans: e.involvedClans,
    })),
    clans: clans.map(c => ({
      name: c.name,
      status: c.extinct ? `灭亡(第${c.extinctEra}纪)` : '存续',
      population: c.population,
      culture: {
        tendency: CULTURE_TENDENCY_LABELS[c.culture.tendency],
        traits: c.culture.traits.map(t => CULTURE_TRAIT_LABELS[t]),
      },
      allies: c.allies,
      enemies: c.enemies,
    })),
  }
  return JSON.stringify(data, null, 2)
}

export function exportAsMarkdown(events: Event[], clans: Clan[], currentEra: number): string {
  const lines: string[] = []
  lines.push('# 沙盘文明纪年表')
  lines.push('')
  lines.push(`导出时间：${new Date().toLocaleString('zh-CN')}`)
  lines.push(`当前纪元：第${currentEra}纪`)
  lines.push('')

  lines.push('## 族群概览')
  lines.push('')
  lines.push('| 族群 | 状态 | 人口 | 文化倾向 | 特质 |')
  lines.push('|------|------|------|----------|------|')
  for (const c of clans) {
    const status = c.extinct ? `灭亡(第${c.extinctEra}纪)` : '存续'
    const tendency = CULTURE_TENDENCY_LABELS[c.culture.tendency]
    const traits = c.culture.traits.map(t => CULTURE_TRAIT_LABELS[t]).join('·')
    lines.push(`| ${c.name} | ${status} | ${c.population} | ${tendency} | ${traits} |`)
  }
  lines.push('')

  lines.push('## 大事年表')
  lines.push('')
  let lastEra = -1
  for (const e of events) {
    if (e.era !== lastEra) {
      lines.push(`### 第${e.era}纪`)
      lines.push('')
      lastEra = e.era
    }
    lines.push(`- **${EVENT_TYPE_LABELS[e.type]}**：${e.description}`)
  }
  lines.push('')

  return lines.join('\n')
}

export function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
