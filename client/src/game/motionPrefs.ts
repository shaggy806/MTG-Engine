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

/** How a played card's spotlight comes in. `rise` (the default, the user's
 * pick on 2026-09-30) comes up from the same spot for everyone — with the
 * caption naming the player, flying in from their side of the table read as
 * wrong; `side` is that older flight, kept as an option for now; `fade` fades
 * in place. Read by CSS as `:root[data-cast-entrance]`. */
export const CAST_ENTRANCES = ['rise', 'side', 'fade'] as const
export type CastEntrance = (typeof CAST_ENTRANCES)[number]

export interface MotionSettings {
  readonly animScale: AnimScale
  /** The viewer's own switch, not counting the browser's preference. */
  readonly reduceMotion: boolean
  readonly castEntrance: CastEntrance
  /** Sound effects (`game/sound.ts`). On unless turned off. */
  readonly sound: boolean
}

/** Stored beside the settings from when sound became on by default
 * (2026-10-10). Before then every save wrote `sound: false` whether or not
 * the viewer had touched it (changing the speed saved it too), so a `sound`
 * saved without this mark is no choice, and reads as the default. */
const SOUND_DEFAULT_ON = 2

export interface MotionPrefs extends MotionSettings {
  /** The setting or the browser's preference. What every animation obeys. */
  readonly reduced: boolean
}

const STORAGE_KEY = 'mtg.motion'
const DEFAULTS: MotionSettings = {
  animScale: 1,
  reduceMotion: false,
  castEntrance: 'rise',
  sound: true,
}

function readStored(): MotionSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<MotionSettings> & { readonly version?: number }
    const animScale = ANIM_SCALES.find((s) => s === parsed.animScale) ?? DEFAULTS.animScale
    const castEntrance =
      CAST_ENTRANCES.find((e) => e === parsed.castEntrance) ?? DEFAULTS.castEntrance
    return {
      animScale,
      reduceMotion: parsed.reduceMotion === true,
      castEntrance,
      sound: parsed.version === SOUND_DEFAULT_ON ? parsed.sound !== false : DEFAULTS.sound,
    }
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
  root.setAttribute('data-cast-entrance', current.castEntrance)
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...settings, version: SOUND_DEFAULT_ON }))
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
