import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Users, GitBranch, Network } from 'lucide-react'
import { useSimulationStore } from '@/store/useSimulationStore'
import { buildLineageTree, buildRelationEdges, type LineageNode } from '@/simulation/relations'
import type { RelationEdge } from '@/simulation/types'
import { CULTURE_TENDENCY_LABELS } from '@/simulation/types'

type TabType = 'tree' | 'network'

const EDGE_COLORS: Record<RelationEdge['type'], string> = {
  alliance: '#D4C83F',
  war: '#D43F3F',
  split: '#8B3FD4',
  parent: '#3F8DD4',
}

const EDGE_LABELS: Record<RelationEdge['type'], string> = {
  alliance: '同盟',
  war: '战争',
  split: '分裂',
  parent: '母族',
}

export default function LineagePage() {
  const clans = useSimulationStore((s) => s.clans)
  const [tab, setTab] = useState<TabType>('tree')
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clanMap = useMemo(() => new Map(clans.map((c) => [c.id, c])), [clans])

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

  const { nodes, edges, svgWidth, svgHeight } = useMemo(() => {
    const activeClans = clans.filter((c) => !c.extinct)
    const allEdges = buildRelationEdges(clans).filter((e) => {
      const s = clanMap.get(e.source)
      const t = clanMap.get(e.target)
      return s && t && !s.extinct && !t.extinct
    })

    const width = 720
    const height = 520
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) * 0.38

    const nodePositions = new Map<string, { x: number; y: number }>()
    activeClans.forEach((c, i) => {
      const angle = (i / activeClans.length) * Math.PI * 2 - Math.PI / 2
      nodePositions.set(c.id, {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      })
    })

    return {
      nodes: activeClans.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        population: c.population,
        tendency: c.culture.tendency,
        x: nodePositions.get(c.id)?.x ?? 0,
        y: nodePositions.get(c.id)?.y ?? 0,
      })),
      edges: allEdges,
      svgWidth: width,
      svgHeight: height,
    }
  }, [clans, clanMap])

  const activeClanCount = clans.filter((c) => !c.extinct).length

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
          <>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setTab('tree')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  tab === 'tree'
                    ? 'bg-[#C4703F] text-white'
                    : 'bg-[#1a1a2e] border border-[#3d3228] text-[#8a7a6a] hover:text-[#d4a574]'
                }`}
              >
                <GitBranch size={14} />
                谱系树
              </button>
              <button
                onClick={() => setTab('network')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  tab === 'network'
                    ? 'bg-[#C4703F] text-white'
                    : 'bg-[#1a1a2e] border border-[#3d3228] text-[#8a7a6a] hover:text-[#d4a574]'
                }`}
              >
                <Network size={14} />
                关系网络
              </button>
            </div>

            {tab === 'tree' && (
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

            {tab === 'network' && (
              <div className="bg-[#1a1a2e] rounded-lg border border-[#3d3228] p-4">
                {activeClanCount === 0 ? (
                  <div className="p-8 text-center text-[#8a7a6a]">
                    无存续族群
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-4 mb-4 text-xs">
                      {(['alliance', 'war', 'split'] as const).map((type) => (
                        <div key={type} className="flex items-center gap-2">
                          <span
                            className="w-6 h-0.5 rounded"
                            style={{ backgroundColor: EDGE_COLORS[type] }}
                          />
                          <span className="text-[#8a7a6a]">{EDGE_LABELS[type]}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center overflow-auto">
                      <svg
                        width={svgWidth}
                        height={svgHeight}
                        className="max-w-full"
                        style={{ minHeight: svgHeight }}
                      >
                        {edges.map((edge, i) => {
                          const source = nodes.find((n) => n.id === edge.source)
                          const target = nodes.find((n) => n.id === edge.target)
                          if (!source || !target) return null
                          const isHovered =
                            hoveredNode === edge.source || hoveredNode === edge.target
                          return (
                            <line
                              key={`${edge.source}-${edge.target}-${edge.type}-${i}`}
                              x1={source.x}
                              y1={source.y}
                              x2={target.x}
                              y2={target.y}
                              stroke={EDGE_COLORS[edge.type]}
                              strokeWidth={isHovered ? 2.5 : 1.2}
                              opacity={isHovered ? 1 : 0.5}
                            />
                          )
                        })}

                        {nodes.map((node) => {
                          const r = Math.max(6, Math.min(18, Math.sqrt(node.population) * 0.5))
                          const isHovered = hoveredNode === node.id
                          return (
                            <g
                              key={node.id}
                              onMouseEnter={() => setHoveredNode(node.id)}
                              onMouseLeave={() => setHoveredNode(null)}
                              style={{ cursor: 'pointer' }}
                            >
                              <circle
                                cx={node.x}
                                cy={node.y}
                                r={r + (isHovered ? 4 : 0)}
                                fill={node.color}
                                stroke="#0f0f1a"
                                strokeWidth={2}
                              />
                              <text
                                x={node.x}
                                y={node.y - r - 6}
                                textAnchor="middle"
                                fontSize="11"
                                fill={isHovered ? '#d4a574' : '#a89880'}
                                fontWeight={isHovered ? 600 : 400}
                              >
                                {node.name}
                              </text>
                              {isHovered && (
                                <text
                                  x={node.x}
                                  y={node.y + r + 16}
                                  textAnchor="middle"
                                  fontSize="10"
                                  fill="#8a7a6a"
                                >
                                  {CULTURE_TENDENCY_LABELS[node.tendency]} · {node.population}人
                                </text>
                              )}
                            </g>
                          )
                        })}
                      </svg>
                    </div>
                    <div className="mt-4 text-xs text-[#8a7a6a] text-center">
                      存续族群 {activeClanCount} 个 · 关系边 {edges.length} 条
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
