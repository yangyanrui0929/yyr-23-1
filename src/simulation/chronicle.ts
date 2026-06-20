import type { Event, EventType, Clan, Point } from './types'
import { EVENT_TYPE_LABELS } from './types'

let eventIdCounter = 0

export function createEvent(
  era: number,
  type: EventType,
  description: string,
  involvedClans: string[],
  location: Point | null
): Event {
  return {
    id: `evt_${++eventIdCounter}`,
    era,
    type,
    description,
    involvedClans,
    location,
  }
}

export function describeMigration(clan: Clan, from: Point | null, to: Point): string {
  const fromDesc = from ? `从(${from.x},${from.y})` : '离开故土'
  return `${clan.name}${fromDesc}迁徙至(${to.x},${to.y})`
}

export function describeSettlement(clan: Clan, location: Point): string {
  return `${clan.name}在(${location.x},${location.y})建立定居点`
}

export function describeSplit(parent: Clan, child: Clan, reason: string): string {
  return `${parent.name}分裂出${child.name}，原因：${reason}`
}

export function describeAlliance(clan1: Clan, clan2: Clan): string {
  return `${clan1.name}与${clan2.name}缔结同盟`
}

export function describeWar(attacker: Clan, defender: Clan, reason: string): string {
  return `${attacker.name}向${defender.name}发动战争，起因：${reason}`
}

export function describeFamine(clan: Clan): string {
  return `${clan.name}遭遇严重饥荒，人口锐减`
}

export function describeBoom(clan: Clan): string {
  return `${clan.name}迎来繁荣时期，人口增长`
}

export function describeExtinction(clan: Clan, reason: string): string {
  return `${clan.name}灭亡，原因：${reason}`
}

export function formatEventBrief(event: Event): string {
  const typeLabel = EVENT_TYPE_LABELS[event.type]
  return `[第${event.era}纪] ${typeLabel} - ${event.description}`
}

export function getEventsByEra(events: Event[], era: number): Event[] {
  return events.filter(e => e.era === era)
}

export function getEventsByClan(events: Event[], clanId: string): Event[] {
  return events.filter(e => e.involvedClans.includes(clanId))
}

export function getEventsByType(events: Event[], type: EventType): Event[] {
  return events.filter(e => e.type === type)
}

export function getEventTimeline(events: Event[]): Record<number, Event[]> {
  const timeline: Record<number, Event[]> = {}
  for (const event of events) {
    if (!timeline[event.era]) timeline[event.era] = []
    timeline[event.era].push(event)
  }
  return timeline
}

export function resetEventCounter(): void {
  eventIdCounter = 0
}
