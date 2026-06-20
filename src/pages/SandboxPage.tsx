import TerrainCanvas from '@/components/TerrainCanvas';
import ControlPanel from '@/components/ControlPanel';
import EraControlBar from '@/components/EraControlBar';
import ClanDetailCard from '@/components/ClanDetailCard';
import { useSimulationStore } from '@/store/useSimulationStore';

export default function SandboxPage() {
  const terrain = useSimulationStore((s) => s.terrain);
  const clans = useSimulationStore((s) => s.clans);
  const showOverlay = useSimulationStore((s) => s.showOverlay);
  const selectedClanId = useSimulationStore((s) => s.selectedClanId);
  const setSelectedClan = useSimulationStore((s) => s.setSelectedClan);

  return (
    <div className="h-screen bg-[#0f0f1a] flex">
      <div className="flex-1 pb-14">
        <TerrainCanvas
          terrain={terrain}
          clans={clans}
          showOverlay={showOverlay}
          selectedClanId={selectedClanId}
          onSelectClan={setSelectedClan}
        />
      </div>
      <ControlPanel />
      <EraControlBar />
      <ClanDetailCard />
    </div>
  );
}
