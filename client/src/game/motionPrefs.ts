import { useSyncExternalStore } from 'react'

/**
 * The viewer's own animation settings — the one pacing control each player
 * owns (bot speed is the host's, and lives on the server). Per device, in
 * `localStorage`: losing them costs a click, so a storage that throws or comes
 * back empty just means the defaults.
 *
 * `animScale` multiplies every animation's length, both the slots
 * `animationSchedule` reserves and the CSS durations (as `--anim-scale` on
 * `:root`), so the two can't drift apart.
 *
 * `reduceMotion` is the setting *or* the browser's `prefers-reduced-motion`,
 * whichever says so. It turns movement off (flights, lunges, tilts) and keeps
 * the colour cues, so the information stays and the motion goes. CSS reads it
 * as `:root[data-reduce-motion]` rather than the media query, so both sources
 * go through one switch.
 */
export const ANIM_SCALES = [0.5, 1, 1.5, 2] as const
export type AnimScale = (typeof ANIM_SCALES)[number]

export interface MotionSettings {
  readonly animScale: AnimScale
  /** The viewer's own switch, not counting the browser's preference. */
  readonly reduceMotion: boolean
}

export interface MotionPrefs extends MotionSettings {
  /** The setting or the browser's preference. What every animation obeys. */
  readonly reduced: boolean
}

const STORAGE_KEY = 'mtg.motion'
const DEFAULTS: MotionSettings = { animScale: 1, reduceMotion: false }

function readStored(): MotionSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<MotionSettings>
    const animScale = ANIM_SCALES.find((s) => s === parsed.animScale) ?? DEFAULTS.animScale
    return { animScale, reduceMotion: parsed.reduceMotion === true }
  } catch {
    return DEFAULTS
  }
}

function browserPrefersReduced(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

let settings: MotionSettings = readStored()
let current: MotionPrefs = derive(settings)
const listeners = new Set<() => void>()

function derive(s: MotionSettings): MotionPrefs {
  return { ...s, reduced: s.reduceMotion || browserPrefersReduced() }
}

function apply(): void {
  current = derive(settings)
  const root = document.documentElement
  root.style.setProperty('--anim-scale', String(current.animScale))
  if (current.reduced) root.setAttribute('data-reduce-motion', '')
  else root.removeAttribute('data-reduce-motion')
  for (const l of listeners) l()
}

apply()
try {
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', apply)
} catch {
  // An old browser without matchMedia listeners keeps whatever it said at load.
}

/** The settings as they stand, for code outside React (the scheduler, the
 * overlays' timers). */
export function motionPrefs(): MotionPrefs {
  return current
}

export function setMotionSettings(next: Partial<MotionSettings>): void {
  settings = { ...settings, ...next }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Not remembered past this page load; still applies now.
  }
  apply()
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useMotionPrefs(): MotionPrefs {
  return useSyncExternalStore(subscribe, motionPrefs)
}
