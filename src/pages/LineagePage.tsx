import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Users } from 'lucide-react'
import { useSimulationStore } from '@/store/useSimulationStore'
import { buildLineageTree, type LineageNode } from '@/simulation/relations'
import { CULTURE_TENDENCY_LABELS } from '@/simulation/types'

export default function LineagePage() {
  const clans = useSimulationStore((s) => s.clans)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clanMap = new Map(clans.map((c) => [c.id, c]))

  const renderNode = (node: LineageNode, depth: number) => {
    const clan = clanMap.get(node.id)
    const tendency = clan?.culture.tendency
    const tendencyLabel = tendency ? CULTURE_TENDENCY_LABELS[tendency] : null
    const hasChildren = node.children.length > 0
    const isOpen = expanded.has(node.id)

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-[#2a2a3e] transition"
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
          onClick={() => hasChildren && toggle(node.id)}
        >
          <span
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: node.color }}
          />
          <span className={node.extinct ? 'line-through opacity-50' : ''}>
            {node.name}
          </span>
          <span className="text-xs text-[#8a7a6a]">
            <Users className="inline w-3 h-3 mr-1" />
            {node.population}
          </span>
          {tendencyLabel && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[#2a2a3e] text-[#d4a574]">
              {tendencyLabel}
            </span>
          )}
          {node.extinct && (
            <span className="text-xs text-red-400/60">已灭亡</span>
          )}
          {hasChildren && (
            <span className="text-xs text-[#8a7a6a] ml-auto">
              {isOpen ? '▼' : '▶'}
            </span>
          )}
        </div>
        {hasChildren && isOpen && (
          <div className="border-l-2 border-[#3d3228] ml-6">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const roots = clans.length > 0 ? buildLineageTree(clans) : []

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-[#d4a574]">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/"
            className="flex items-center gap-1 text-[#8a7a6a] hover:text-[#d4a574] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Link>
          <h1 className="text-xl font-bold">族群谱系</h1>
        </div>

        {clans.length === 0 ? (
          <div className="bg-[#1a1a2e] rounded-lg border border-[#3d3228] p-8 text-center text-[#8a7a6a]">
            尚无族群数据
          </div>
        ) : (
          <div className="space-y-4">
            {roots.map((root) => (
              <div
                key={root.id}
                className="bg-[#1a1a2e] rounded-lg border border-[#3d3228] p-4"
              >
                {renderNode(root, 0)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
