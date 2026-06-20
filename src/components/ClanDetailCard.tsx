import { useSimulationStore } from '@/store/useSimulationStore'
import { X } from 'lucide-react'
import { CULTURE_TRAIT_LABELS } from '@/simulation/types'
import { describeCultureBrief } from '@/utils/naming'

export default function ClanDetailCard() {
  const { selectedClanId, clans, setSelectedClan } = useSimulationStore()

  if (selectedClanId === null) {
    return (
      <div className="fixed top-80 right-4 w-64 max-h-[60vh] overflow-y-auto
        bg-[#1a1a2e]/95 border border-[#3d3228] rounded-lg
        transition-transform duration-300 translate-x-[120%]" />
    )
  }

  const clan = clans.find(c => c.id === selectedClanId)
  if (!clan) return null

  const findName = (id: string) => clans.find(c => c.id === id)?.name ?? id
  const parentClan = clan.parentClanId ? clans.find(c => c.id === clan.parentClanId) : null

  return (
    <div className="fixed top-80 right-4 w-64 max-h-[60vh] overflow-y-auto
      bg-[#1a1a2e]/95 border border-[#3d3228] rounded-lg p-4 space-y-3
      transition-transform duration-300 translate-x-0 z-40">

      <button onClick={() => setSelectedClan(null)}
        className="absolute top-3 right-3 text-[#a89880] hover:text-[#d4a574]">
        <X size={16} />
      </button>

      <div className="flex items-center gap-2 pr-6">
        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: clan.color }} />
        <span className="text-lg font-bold text-[#d4a574] truncate">{clan.name}</span>
      </div>

      <div className="text-sm" style={{ color: clan.extinct ? '#C4703F' : '#a89880' }}>
        {clan.extinct ? `已灭亡 (第${clan.extinctEra}纪)` : '存续'}
      </div>

      <div className="text-sm text-[#a89880]">
        人口: <span className="text-[#d4a574]">{clan.population}</span>
      </div>

      <div className="text-sm text-[#a89880]">
        {describeCultureBrief(clan.culture.tendency, clan.culture.traits)}
      </div>

      <div className="text-sm text-[#a89880]">
        领地: <span className="text-[#d4a574]">{clan.territory.length}</span>格
      </div>

      <div className="text-sm text-[#a89880]">
        同盟: {clan.allies.length > 0
          ? clan.allies.map(id => (
            <span key={id} className="text-[#d4a574] mr-1">{findName(id)}</span>
          ))
          : <span className="text-[#a89880]">无</span>
        }
      </div>

      <div className="text-sm text-[#a89880]">
        宿敌: {clan.enemies.length > 0
          ? clan.enemies.map(id => (
            <span key={id} className="text-[#C4703F] mr-1">{findName(id)}</span>
          ))
          : <span className="text-[#a89880]">无</span>
        }
      </div>

      <div className="text-sm text-[#a89880]">
        母族: <span className="text-[#d4a574]">
          {parentClan ? parentClan.name : '原始族群'}
        </span>
      </div>

      {clan.culture.evolution.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-[#3d3228]">
          <div className="text-xs text-[#a89880] font-medium">文化演变</div>
          {clan.culture.evolution.map((evo, i) => (
            <div key={i} className="text-xs text-[#a89880]">
              <span className="text-[#C4703F]">第{evo.era}纪</span>{' '}
              <span className="text-[#d4a574]">{CULTURE_TRAIT_LABELS[evo.trait]}</span>{' '}
              {evo.reason}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
