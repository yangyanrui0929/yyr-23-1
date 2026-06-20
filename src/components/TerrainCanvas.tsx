import { useRef, useEffect, useState, useCallback } from 'react'
import type { Terrain, Clan, BiomeType } from '@/simulation/types'
import { BIOME_COLORS } from '@/simulation/types'

interface TerrainCanvasProps {
  terrain: Terrain | null
  clans: Clan[]
  showOverlay: boolean
  selectedClanId: string | null
  onSelectClan: (id: string | null) => void
}

const TILE_SIZE = 8
const SETTLEMENT_RADIUS = 5
const CLICK_THRESHOLD = 12

export default function TerrainCanvas({
  terrain,
  clans,
  showOverlay,
  selectedClanId,
  onSelectClan,
}: TerrainCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const offsetStart = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setSize({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = size.width
    canvas.height = size.height

    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, size.width, size.height)

    if (!terrain) return

    ctx.save()
    ctx.translate(offset.x, offset.y)
    ctx.scale(scale, scale)

    for (let y = 0; y < terrain.height; y++) {
      for (let x = 0; x < terrain.width; x++) {
        const tile = terrain.tiles[y]?.[x]
        if (!tile) continue
        ctx.fillStyle = BIOME_COLORS[tile.biome as BiomeType] ?? '#333333'
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
      }
    }

    if (showOverlay) {
      for (const clan of clans) {
        if (clan.extinct) continue
        ctx.fillStyle = clan.color + '55'
        for (const pt of clan.territory) {
          ctx.fillRect(pt.x * TILE_SIZE, pt.y * TILE_SIZE, TILE_SIZE, TILE_SIZE)
        }
      }

      for (const clan of clans) {
        if (!clan.settledAt || clan.extinct) continue
        const sx = clan.settledAt.x * TILE_SIZE + TILE_SIZE / 2
        const sy = clan.settledAt.y * TILE_SIZE + TILE_SIZE / 2

        ctx.beginPath()
        ctx.arc(sx, sy, SETTLEMENT_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = clan.color
        ctx.fill()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1.5 / scale
        ctx.stroke()

        if (clan.id === selectedClanId) {
          ctx.beginPath()
          ctx.arc(sx, sy, SETTLEMENT_RADIUS + 3, 0, Math.PI * 2)
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2 / scale
          ctx.stroke()
        }
      }
    }

    ctx.restore()
  }, [terrain, clans, showOverlay, selectedClanId, size, offset, scale])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY }
    offsetStart.current = { ...offset }
  }, [offset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setOffset({ x: offsetStart.current.x + dx, y: offsetStart.current.y + dy })
  }, [dragging])

  const handleMouseUp = useCallback(() => {
    setDragging(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setScale((prev) => {
      const next = prev - e.deltaY * 0.001
      return Math.min(3, Math.max(0.5, next))
    })
  }, [])

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!terrain || !showOverlay) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = (e.clientX - rect.left - offset.x) / scale
    const my = (e.clientY - rect.top - offset.y) / scale

    let found: string | null = null
    for (const clan of clans) {
      if (!clan.settledAt || clan.extinct) continue
      const sx = clan.settledAt.x * TILE_SIZE + TILE_SIZE / 2
      const sy = clan.settledAt.y * TILE_SIZE + TILE_SIZE / 2
      const dist = Math.hypot(mx - sx, my - sy)
      if (dist <= CLICK_THRESHOLD) {
        found = clan.id
        break
      }
    }
    onSelectClan(found)
  }, [terrain, clans, showOverlay, offset, scale, onSelectClan])

  if (!terrain) {
    return (
      <div
        ref={containerRef}
        className="border border-[#3d3228] rounded-lg flex items-center justify-center bg-[#1a1a1a]"
        style={{ width: '100%', height: '100%' }}
      >
        <span className="text-[#d4a574]">点击「开始观察」生成沙盘</span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="border border-[#3d3228] rounded-lg bg-[#1a1a1a] overflow-hidden"
      style={{ width: '100%', height: '100%' }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', cursor: dragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
      />
    </div>
  )
}
