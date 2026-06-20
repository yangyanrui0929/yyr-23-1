import { useEffect, useRef } from 'react'
import { Play, Pause, FastForward } from 'lucide-react'
import { useSimulationStore } from '@/store/useSimulationStore'
import type { SpeedType } from '@/simulation/types'

const SPEED_INTERVAL: Record<SpeedType, number> = { 1: 1000, 2: 500, 5: 200, 10: 100 }
const SPEEDS: SpeedType[] = [1, 2, 5, 10]

export default function EraControlBar() {
  const { currentEra, clans, events, isRunning, speed, toggleRunning, setSpeed, advanceEra } = useSimulationStore()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(advanceEra, SPEED_INTERVAL[speed])
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, speed, advanceEra])

  const activeClanCount = clans.filter(c => !c.extinct).length

  return (
    <div className="fixed bottom-0 left-0 right-0 h-14 bg-[#1a1a2e]/95 border-t border-[#3d3228] flex items-center gap-4 px-6 z-50">
      <span className="text-xl font-bold" style={{ color: '#d4a574' }}>第 {currentEra} 纪</span>
      <span style={{ color: '#a89880' }}>存续族群: {activeClanCount}</span>
      <span style={{ color: '#a89880' }}>记录事件: {events.length}</span>

      <button onClick={toggleRunning} className="rounded px-3 py-1 text-sm font-medium" style={{ background: '#2a2a3e', color: '#d4a574' }}>
        {isRunning ? <Pause size={16} /> : <Play size={16} />}
      </button>

      {SPEEDS.map(s => (
        <button
          key={s}
          onClick={() => setSpeed(s)}
          className="rounded px-3 py-1 text-sm font-medium"
          style={{ background: speed === s ? '#C4703F' : '#2a2a3e', color: '#d4a574' }}
        >
          {s}x
        </button>
      ))}

      <button onClick={advanceEra} className="rounded px-3 py-1 text-sm font-medium flex items-center gap-1" style={{ background: '#2a2a3e', color: '#d4a574' }}>
        <FastForward size={14} /> 前进一纪
      </button>
    </div>
  )
}
