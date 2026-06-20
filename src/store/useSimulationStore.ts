import { create } from 'zustand'
import type { Terrain, Clan, Event, SimulationParams, SpeedType } from '../simulation/types'
import { initializeSimulation, simulateEra } from '../simulation/engine'

interface SimulationStore {
  terrain: Terrain | null
  clans: Clan[]
  events: Event[]
  currentEra: number
  isRunning: boolean
  speed: SpeedType
  params: SimulationParams
  selectedClanId: string | null
  showOverlay: boolean
  isInitialized: boolean

  setParams: (params: Partial<SimulationParams>) => void
  startSimulation: () => void
  resetSimulation: () => void
  toggleRunning: () => void
  setSpeed: (speed: SpeedType) => void
  advanceEra: () => void
  setSelectedClan: (id: string | null) => void
  toggleOverlay: () => void
  loadFromSave: (terrain: Terrain, clans: Clan[], events: Event[], era: number, params: SimulationParams) => void
}

const defaultParams: SimulationParams = {
  terrainSeed: 42,
  resourceDensity: 0.5,
  cultureTendencyWeights: {
    martial: 1,
    mercantile: 1,
    agrarian: 1,
    nomadic: 1,
  },
  initialClanCount: 6,
}

export const useSimulationStore = create<SimulationStore>((set, get) => ({
  terrain: null,
  clans: [],
  events: [],
  currentEra: 0,
  isRunning: false,
  speed: 1,
  params: { ...defaultParams },
  selectedClanId: null,
  showOverlay: true,
  isInitialized: false,

  setParams: (partial) => {
    const current = get().params
    set({ params: { ...current, ...partial } })
  },

  startSimulation: () => {
    const { params } = get()
    const snapshot = initializeSimulation(params)
    set({
      terrain: snapshot.terrain,
      clans: snapshot.clans,
      events: snapshot.events,
      currentEra: snapshot.currentEra,
      isRunning: true,
      isInitialized: true,
    })
  },

  resetSimulation: () => {
    set({
      terrain: null,
      clans: [],
      events: [],
      currentEra: 0,
      isRunning: false,
      isInitialized: false,
      selectedClanId: null,
    })
  },

  toggleRunning: () => {
    set(s => ({ isRunning: !s.isRunning }))
  },

  setSpeed: (speed) => {
    set({ speed })
  },

  advanceEra: () => {
    const { terrain, clans, events, currentEra, params, isInitialized } = get()
    if (!isInitialized || !terrain) return
    const activeClans = clans.filter(c => !c.extinct)
    if (activeClans.length === 0) {
      set({ isRunning: false })
      return
    }
    const snapshot = simulateEra({ terrain, clans, events, currentEra }, params)
    set({
      clans: snapshot.clans,
      events: snapshot.events,
      currentEra: snapshot.currentEra,
    })
  },

  setSelectedClan: (id) => {
    set({ selectedClanId: id })
  },

  toggleOverlay: () => {
    set(s => ({ showOverlay: !s.showOverlay }))
  },

  loadFromSave: (terrain, clans, events, era, params) => {
    set({
      terrain,
      clans,
      events,
      currentEra: era,
      params,
      isInitialized: true,
      isRunning: false,
      selectedClanId: null,
    })
  },
}))
