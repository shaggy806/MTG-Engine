import { useSyncExternalStore } from 'react'
import type { Step } from 'engine/client'
import type { PassSettings } from 'protocol'

/**
 * The viewer's own priority-passing preferences (`PassSettings`): "pass to
 * main", "pass through combat", and the steps they've flagged as stops on the
 * phase track. Per device, in `localStorage`, like the animation settings;
 * the server does the passing, so `GameScreen` sends them whenever they change
 * and whenever a game screen opens.
 */

/** The steps a stop can go on — the ones a player gets priority in. Mirrors
 * the server's `STOPPABLE_STEPS`, which is what enforces it. */
export const STOPPABLE_STEPS: ReadonlySet<Step> = new Set<Step>([
  'upkeep',
  'draw',
  'precombat-main',
  'begin-combat',
  'declare-attackers',
  'declare-blockers',
  'combat-damage',
  'end-combat',
  'postcombat-main',
  'end',
])

/** Every step of a turn, in order: its id, the phase track's abbreviation,
 * and its name for a tooltip. */
export const STEPS = [
  ['untap', 'UT', 'untap'],
  ['upkeep', 'UP', 'upkeep'],
  ['draw', 'DR', 'draw'],
  ['precombat-main', 'M1', 'first main phase'],
  ['begin-combat', 'BC', 'beginning of combat'],
  ['declare-attackers', 'DA', 'declare attackers'],
  ['declare-blockers', 'DB', 'declare blockers'],
  ['combat-damage', 'CD', 'combat damage'],
  ['end-combat', 'EC', 'end of combat'],
  ['postcombat-main', 'M2', 'second main phase'],
  ['end', 'END', 'end step'],
  ['cleanup', 'CU', 'cleanup'],
] as const

const STORAGE_KEY = 'mtg.pass'
const DEFAULTS: PassSettings = {
  passToMain: false,
  passThroughCombat: false,
  orderTriggers: false,
  stops: { mine: [], theirs: [] },
}

function readStored(): PassSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<PassSettings>
    const steps = (list: unknown): Step[] =>
      Array.isArray(list) ? list.filter((s): s is Step => STOPPABLE_STEPS.has(s as Step)) : []
    return {
      passToMain: parsed.passToMain === true,
      passThroughCombat: parsed.passThroughCombat === true,
      orderTriggers: parsed.orderTriggers === true,
      stops: { mine: steps(parsed.stops?.mine), theirs: steps(parsed.stops?.theirs) },
    }
  } catch {
    return DEFAULTS
  }
}

let current: PassSettings = readStored()
const listeners = new Set<() => void>()

export function setPassSettings(next: Partial<PassSettings>): void {
  current = { ...current, ...next }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  } catch {
    // Not remembered past this page load; still applies now.
  }
  for (const l of listeners) l()
}

/** Flags or unflags `step` as a stop on your own turns (`mine`) or on
 * everyone else's. */
export function toggleStop(step: Step, mine: boolean): void {
  if (!STOPPABLE_STEPS.has(step)) return
  const list = mine ? current.stops.mine : current.stops.theirs
  const next = list.includes(step) ? list.filter((s) => s !== step) : [...list, step]
  setPassSettings({ stops: mine ? { ...current.stops, mine: next } : { ...current.stops, theirs: next } })
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function usePassSettings(): PassSettings {
  return useSyncExternalStore(subscribe, () => current)
}
