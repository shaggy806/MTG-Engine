import { motionPrefs } from './motionPrefs.ts'

/**
 * The game's sound effects: a handful of short cues synthesised with Web
 * Audio rather than recorded — nothing to license, nothing to download — and
 * off unless the viewer turns them on (motionPrefs' `sound`). Played from the
 * same cues the animations are (see `AnimationLayer`), so a sound lands with
 * the thing it belongs to.
 */
export type SoundCue = 'cast' | 'hit' | 'death' | 'exile' | 'gain' | 'loss' | 'turn' | 'tap'

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    // A context made before any click starts suspended; any later cue after a
    // click (turning sound on is one) resumes it.
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** One enveloped tone: `freq` (gliding to `to`, if given) for `ms`. */
function tone(
  a: AudioContext,
  freq: number,
  ms: number,
  opts: { to?: number; type?: OscillatorType; gain?: number; at?: number } = {},
): void {
  const start = a.currentTime + (opts.at ?? 0) / 1000
  const end = start + ms / 1000
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = opts.type ?? 'sine'
  osc.frequency.setValueAtTime(freq, start)
  if (opts.to !== undefined) osc.frequency.exponentialRampToValueAtTime(opts.to, end)
  const peak = (opts.gain ?? 0.12) * VOLUME
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, end)
  osc.connect(gain).connect(a.destination)
  osc.start(start)
  osc.stop(end + 0.02)
}

/** Kept low: these play under a game, not over it. */
const VOLUME = 0.6

/** When each cue last played, so a run of one (a wrath's deaths, a spell's
 * worth of taps, all on one beat) sounds once rather than as a chord. */
const lastPlayed = new Map<SoundCue, number>()

/** Plays `cue` if the viewer has sound on. Never throws. */
export function playSound(cue: SoundCue): void {
  if (!motionPrefs().sound) return
  const now = performance.now()
  if (now - (lastPlayed.get(cue) ?? -Infinity) < 90) return
  lastPlayed.set(cue, now)
  const a = audio()
  if (a === null) return
  switch (cue) {
    case 'cast':
      tone(a, 660, 160, { type: 'triangle' })
      tone(a, 990, 220, { type: 'triangle', at: 70, gain: 0.08 })
      break
    case 'hit':
      tone(a, 140, 140, { to: 60, type: 'square', gain: 0.1 })
      break
    case 'death':
      tone(a, 330, 380, { to: 110, type: 'sawtooth', gain: 0.06 })
      break
    case 'exile':
      tone(a, 880, 360, { to: 1760, type: 'sine', gain: 0.07 })
      break
    case 'gain':
      tone(a, 520, 120, { type: 'sine' })
      tone(a, 780, 160, { type: 'sine', at: 90 })
      break
    case 'loss':
      tone(a, 420, 120, { type: 'sine' })
      tone(a, 280, 180, { type: 'sine', at: 90 })
      break
    case 'turn':
      tone(a, 523, 260, { type: 'triangle', gain: 0.08 })
      tone(a, 784, 380, { type: 'triangle', at: 120, gain: 0.07 })
      break
    case 'tap':
      tone(a, 1200, 40, { type: 'square', gain: 0.03 })
      break
  }
}
