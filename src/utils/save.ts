import type { SaveData, Terrain, Clan, Event, SimulationParams } from '../simulation/types'

const SAVE_KEY = 'civ_observer_saves'

export function saveSimulation(
  name: string,
  terrain: Terrain,
  clans: Clan[],
  events: Event[],
  currentEra: number,
  params: SimulationParams
): SaveData {
  const save: SaveData = {
    id: `save_${Date.now()}`,
    name,
    timestamp: Date.now(),
    terrain,
    clans,
    events,
    currentEra,
    params,
  }
  const saves = loadAllSaves()
  saves.push(save)
  localStorage.setItem(SAVE_KEY, JSON.stringify(saves))
  return save
}

export function loadAllSaves(): SaveData[] {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function loadSave(id: string): SaveData | null {
  const saves = loadAllSaves()
  return saves.find(s => s.id === id) ?? null
}

export function deleteSave(id: string): void {
  const saves = loadAllSaves().filter(s => s.id !== id)
  localStorage.setItem(SAVE_KEY, JSON.stringify(saves))
}

export function overwriteSave(id: string, data: Partial<SaveData>): void {
  const saves = loadAllSaves()
  const idx = saves.findIndex(s => s.id === id)
  if (idx >= 0) {
    saves[idx] = { ...saves[idx], ...data, timestamp: Date.now() }
    localStorage.setItem(SAVE_KEY, JSON.stringify(saves))
  }
}
