import type { Terrain, Clan, Event, SimulationParams, EventType } from './types'
import { generateTerrain } from './terrain'
import { seedInitialClans, simulateClanTurn, applyWarDamage, resetClanCounter } from './clans'
import { createEvent } from './chronicle'
import { resetNaming } from '../utils/naming'
import { resetEventCounter } from './chronicle'

export interface SimulationSnapshot {
  terrain: Terrain
  clans: Clan[]
  events: Event[]
  currentEra: number
}

export function initializeSimulation(params: SimulationParams): SimulationSnapshot {
  resetClanCounter()
  resetEventCounter()
  resetNaming()
  const terrain = generateTerrain(params.terrainSeed, 80, 60, params.resourceDensity)
  const clans = seedInitialClans(terrain, params)
  const events: Event[] = []
  for (const clan of clans) {
    if (clan.settledAt) {
      events.push(createEvent(
        0,
        'settlement',
        `${clan.name}在(${clan.settledAt.x},${clan.settledAt.y})建立定居点`,
        [clan.id],
        clan.settledAt
      ))
    }
  }
  return { terrain, clans, events, currentEra: 0 }
}

function mapTurnEventType(type: string): EventType {
  const valid: EventType[] = ['migration', 'settlement', 'split', 'alliance', 'war', 'famine', 'boom', 'extinction']
  return valid.includes(type as EventType) ? (type as EventType) : 'settlement'
}

export function simulateEra(snapshot: SimulationSnapshot, params: SimulationParams): SimulationSnapshot {
  void params
  const { terrain, clans, events, currentEra } = snapshot
  const nextEra = currentEra + 1
  let updatedClans: Clan[] = [...clans]
  const newEvents: Event[] = []
  const newClanBuffer: Clan[] = []
  const pendingPatches: Map<string, Partial<Clan>> = new Map()

  for (let i = 0; i < updatedClans.length; i++) {
    const clan = updatedClans[i]
    if (clan.extinct) continue
    const result = simulateClanTurn(clan, terrain, updatedClans, nextEra)
    updatedClans[i] = result.clan
    for (const evt of result.events) {
      if (evt.newClan) {
        newClanBuffer.push(evt.newClan)
      }
      if (evt.targetClanUpdate) {
        const existing = pendingPatches.get(evt.targetClanUpdate.id) ?? {}
        pendingPatches.set(evt.targetClanUpdate.id, { ...existing, ...evt.targetClanUpdate.patch })
      }
      const eventType = mapTurnEventType(evt.type)
      newEvents.push(createEvent(nextEra, eventType, evt.description, evt.involvedClans, evt.location))
    }
  }

  for (const [clanId, patch] of pendingPatches) {
    const idx = updatedClans.findIndex(c => c.id === clanId)
    if (idx >= 0 && !updatedClans[idx].extinct) {
      updatedClans[idx] = { ...updatedClans[idx], ...patch }
    }
  }

  updatedClans = [...updatedClans, ...newClanBuffer]
  updatedClans = applyWarDamage(updatedClans)
  updatedClans = updatedClans.map(c => {
    if (!c.extinct && c.population <= 0) {
      return { ...c, extinct: true, extinctEra: nextEra }
    }
    return c
  })

  for (const c of updatedClans) {
    if (c.extinct && c.extinctEra === nextEra && !newEvents.some(e => e.type === 'extinction' && e.involvedClans.includes(c.id))) {
      newEvents.push(createEvent(
        nextEra,
        'extinction',
        `${c.name}因战乱而灭亡`,
        [c.id],
        c.settledAt
      ))
    }
  }

  const activeClans = updatedClans.filter(c => !c.extinct)
  if (activeClans.length === 0 && updatedClans.some(c => c.extinct)) {
    newEvents.push(createEvent(
      nextEra,
      'extinction',
      '所有族群均已灭亡，文明终结',
      [],
      null
    ))
  }

  return {
    terrain,
    clans: updatedClans,
    events: [...events, ...newEvents],
    currentEra: nextEra,
  }
}
