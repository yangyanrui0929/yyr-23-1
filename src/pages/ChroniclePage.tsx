import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileJson, FileText } from 'lucide-react'
import { useSimulationStore } from '@/store/useSimulationStore'
import { getEventTimeline } from '@/simulation/chronicle'
import { EVENT_TYPE_LABELS } from '@/simulation/types'
import type { EventType } from '@/simulation/types'
import { exportAsJSON, exportAsMarkdown, downloadFile } from '@/utils/export'

const TYPE_COLORS: Record<EventType, string> = {
  migration: '#3F8DD4',
  settlement: '#5B7553',
  split: '#8B3FD4',
  alliance: '#D4C83F',
  war: '#D43F3F',
  famine: '#D4813F',
  boom: '#3FD48B',
  extinction: '#7a7a7a',
}

const ALL_TYPES = Object.keys(EVENT_TYPE_LABELS) as EventType[]

export default function ChroniclePage() {
  const events = useSimulationStore((s) => s.events)
  const clans = useSimulationStore((s) => s.clans)
  const currentEra = useSimulationStore((s) => s.currentEra)
  const [filter, setFilter] = useState<EventType | 'all'>('all')

  const filtered = filter === 'all' ? events : events.filter((e) => e.type === filter)
  const timeline = getEventTimeline(filtered)
  const eras = Object.keys(timeline).map(Number).sort((a, b) => a - b)

  const handleExportJSON = () => {
    const content = exportAsJSON(events, clans, currentEra)
    downloadFile(content, 'chronicle.json', 'application/json')
  }

  const handleExportMarkdown = () => {
    const content = exportAsMarkdown(events, clans, currentEra)
    downloadFile(content, 'chronicle.md', 'text/markdown')
  }

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-[#d4a574]">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-1 text-[#8a7a6a] hover:text-[#d4a574] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Link>
            <h1 className="text-xl font-bold">历史纪年</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1a1a2e] border border-[#3d3228] text-[#d4a574] hover:bg-[#2a2a3e] transition text-sm"
            >
              <FileJson className="w-4 h-4" />
              导出 JSON
            </button>
            <button
              onClick={handleExportMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1a1a2e] border border-[#3d3228] text-[#d4a574] hover:bg-[#2a2a3e] transition text-sm"
            >
              <FileText className="w-4 h-4" />
              导出 Markdown
            </button>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="bg-[#1a1a2e] rounded-lg border border-[#3d3228] p-8 text-center text-[#8a7a6a]">
            尚无历史记录
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  filter === 'all'
                    ? 'bg-[#C4703F] text-white'
                    : 'bg-[#1a1a2e] border border-[#3d3228] text-[#8a7a6a] hover:text-[#d4a574]'
                }`}
              >
                全部
              </button>
              {ALL_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    filter === type
                      ? 'text-white'
                      : 'bg-[#1a1a2e] border border-[#3d3228] text-[#8a7a6a] hover:text-[#d4a574]'
                  }`}
                  style={filter === type ? { backgroundColor: TYPE_COLORS[type] } : undefined}
                >
                  {EVENT_TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            <div className="relative">
              <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-[#3d3228]" />
              {eras.map((era) => (
                <div key={era} className="relative mb-8 last:mb-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="relative z-10 bg-[#C4703F] text-white rounded-full px-3 py-0.5 text-sm font-bold">
                      第{era}纪
                    </span>
                  </div>
                  <div className="ml-8 space-y-2">
                    {timeline[era].map((event) => (
                      <div
                        key={event.id}
                        className="bg-[#1a1a2e] rounded-lg border border-[#3d3228] p-3"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{ backgroundColor: TYPE_COLORS[event.type], color: '#fff' }}
                          >
                            {EVENT_TYPE_LABELS[event.type]}
                          </span>
                        </div>
                        <p className="text-sm mb-1">{event.description}</p>
                        {event.involvedClans.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {event.involvedClans.map((clanId) => (
                              <span
                                key={clanId}
                                className="px-1.5 py-0.5 rounded bg-[#2a2a3e] text-[#8a7a6a] text-xs"
                              >
                                {clanId}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
