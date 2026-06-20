import { useState } from 'react'
import type { CultureTendency } from '@/simulation/types'
import { CULTURE_TENDENCY_LABELS } from '@/simulation/types'
import { useSimulationStore } from '@/store/useSimulationStore'
import { Settings, Play, RotateCcw, Eye, EyeOff, Save, FolderOpen } from 'lucide-react'
import { saveSimulation, loadAllSaves, deleteSave } from '@/utils/save'

const TENDENCY_KEYS: CultureTendency[] = ['martial', 'mercantile', 'agrarian', 'nomadic']

export default function ControlPanel() {
  const {
    params, setParams, startSimulation, resetSimulation,
    toggleOverlay, showOverlay, isInitialized,
    terrain, clans, events, currentEra, loadFromSave,
  } = useSimulationStore()

  const [showLoadModal, setShowLoadModal] = useState(false)
  const [saves, setSaves] = useState<ReturnType<typeof loadAllSaves>>([])

  const handleStart = () => {
    if (!isInitialized) startSimulation()
  }

  const handleReset = () => {
    resetSimulation()
    startSimulation()
  }

  const handleSave = () => {
    if (!terrain) return
    saveSimulation(`存档_${currentEra}纪`, terrain, clans, events, currentEra, params)
  }

  const handleOpenLoad = () => {
    setSaves(loadAllSaves())
    setShowLoadModal(true)
  }

  const handleDeleteSave = (id: string) => {
    deleteSave(id)
    setSaves(loadAllSaves())
  }

  const handleLoadSave = (save: typeof saves[number]) => {
    loadFromSave(save.terrain, save.clans, save.events, save.currentEra, save.params)
    setShowLoadModal(false)
  }

  const updateWeight = (key: CultureTendency, value: number) => {
    setParams({
      cultureTendencyWeights: { ...params.cultureTendencyWeights, [key]: value },
    })
  }

  return (
    <div className="fixed right-0 top-0 w-72 max-h-screen overflow-y-auto rounded-l-xl border border-[#3d3228] p-4 space-y-4"
      style={{ backgroundColor: 'rgba(26,26,46,0.95)' }}>

      <div className="flex items-center gap-2 text-[#d4a574]">
        <Settings size={18} />
        <h2 className="font-bold text-lg">观察参数</h2>
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="text-[#a89880] text-sm">地形种子</span>
          <input type="number" min={0} max={99999}
            value={params.terrainSeed}
            onChange={e => setParams({ terrainSeed: Number(e.target.value) })}
            className="w-full mt-1 rounded px-2 py-1 text-sm bg-[#2a2a3e] border border-[#3d3228] text-[#d4a574] focus:outline-none focus:border-[#C4703F]" />
        </label>

        <label className="block">
          <span className="text-[#a89880] text-sm">资源密度：{params.resourceDensity.toFixed(1)}</span>
          <input type="range" min={0.1} max={1.0} step={0.1}
            value={params.resourceDensity}
            onChange={e => setParams({ resourceDensity: Number(e.target.value) })}
            className="w-full mt-1 accent-[#C4703F]" />
        </label>

        <label className="block">
          <span className="text-[#a89880] text-sm">初始族群数：{params.initialClanCount}</span>
          <input type="range" min={2} max={12} step={1}
            value={params.initialClanCount}
            onChange={e => setParams({ initialClanCount: Number(e.target.value) })}
            className="w-full mt-1 accent-[#C4703F]" />
        </label>

        <div className="space-y-2">
          <span className="text-[#a89880] text-sm">文化倾向权重</span>
          {TENDENCY_KEYS.map(key => (
            <label key={key} className="block">
              <span className="text-[#a89880] text-xs">
                {CULTURE_TENDENCY_LABELS[key]}：{params.cultureTendencyWeights[key]}
              </span>
              <input type="range" min={0} max={3} step={0.5}
                value={params.cultureTendencyWeights[key]}
                onChange={e => updateWeight(key, Number(e.target.value))}
                className="w-full mt-0.5 accent-[#C4703F]" />
            </label>
          ))}
        </div>
      </div>

      <div className="border-t border-[#3d3228] pt-3 space-y-2">
        {!isInitialized && (
          <button onClick={handleStart}
            className="w-full flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-medium text-white bg-[#C4703F] hover:bg-[#a85e34] transition-colors">
            <Play size={16} /> 开始观察
          </button>
        )}

        {isInitialized && (
          <button onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-medium text-[#d4a574] border border-[#C4703F] hover:bg-[#C4703F] hover:text-white transition-colors">
            <RotateCcw size={16} /> 重新开始
          </button>
        )}

        <button onClick={toggleOverlay}
          className="w-full flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-medium text-[#d4a574] border border-[#3d3228] hover:border-[#C4703F] transition-colors">
          {showOverlay ? <Eye size={16} /> : <EyeOff size={16} />}
          {showOverlay ? '隐藏覆盖层' : '显示覆盖层'}
        </button>

        <button onClick={handleSave} disabled={!isInitialized}
          className="w-full flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-medium text-[#d4a574] border border-[#3d3228] hover:border-[#C4703F] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <Save size={16} /> 存档
        </button>

        <button onClick={handleOpenLoad}
          className="w-full flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-medium text-[#d4a574] border border-[#3d3228] hover:border-[#C4703F] transition-colors">
          <FolderOpen size={16} /> 读档
        </button>
      </div>

      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowLoadModal(false)}>
          <div className="w-80 max-h-96 overflow-y-auto rounded-lg border border-[#3d3228] p-4 space-y-2"
            style={{ backgroundColor: '#1a1a2e' }}
            onClick={e => e.stopPropagation()}>
            <h3 className="text-[#d4a574] font-bold">读取存档</h3>
            {saves.length === 0 && (
              <p className="text-[#a89880] text-sm">暂无存档</p>
            )}
            {saves.map(save => (
              <div key={save.id} className="flex items-center justify-between rounded border border-[#3d3228] p-2">
                <div className="text-[#a89880] text-xs">
                  <div className="text-[#d4a574] text-sm">{save.name}</div>
                  <div>{new Date(save.timestamp).toLocaleString('zh-CN')}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleLoadSave(save)}
                    className="rounded px-2 py-1 text-xs bg-[#C4703F] text-white hover:bg-[#a85e34]">读取</button>
                  <button onClick={() => handleDeleteSave(save.id)}
                    className="rounded px-2 py-1 text-xs border border-[#3d3228] text-[#a89880] hover:text-red-400 hover:border-red-400">删除</button>
                </div>
              </div>
            ))}
            <button onClick={() => setShowLoadModal(false)}
              className="w-full mt-2 rounded px-3 py-2 text-sm text-[#a89880] border border-[#3d3228] hover:border-[#C4703F]">
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
