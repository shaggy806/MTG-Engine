import { motionPrefs } from './motionPrefs.ts'

/**
 * The game's sound effects, on unless the viewer turns them off (motionPrefs'
 * `sound`). Played from the same cues the animations are (see
 * `AnimationLayer`), so a sound lands with the thing it belongs to.
 *
 * Two sources. The table's own noises — cards, dice, chips — the swords of
 * combat and the victory tune are recorded (`public/sfx/`, all CC0;
 * `CREDITS.md` there says whose),
 * loaded once sound is first played. Everything else is a short tone
 * synthesised with Web Audio, which is also what a recorded cue falls back to
 * while its files load (or if they can't), where it has a tone at all.
 */
export type SoundCue =
  | 'cast'
  | 'land'
  | 'draw'
  | 'shuffle'
  | 'discard'
  | 'mill'
  | 'attack'
  | 'block'
  | 'hit'
  | 'death'
  | 'exile'
  | 'gain'
  | 'loss'
  | 'turn'
  | 'tap'
  | 'counters'
  | 'countered'
  | 'dice'
  | 'die'
  | 'victory'

/** `name-1` … `name-n`: a recording's takes, as its pack numbers them. */
function takes(name: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => `${name}-${i + 1}`)
}

/**
 * The recorded cues, each a few takes (files in `public/sfx/`, without the
 * `.mp3`), one picked at random each time so a run of draws doesn't sound
 * like one sample on repeat.
 */
const SAMPLES: Partial<Record<SoundCue, readonly string[]>> = {
  land: takes('card-place', 4),
  draw: takes('card-slide', 8),
  shuffle: ['card-shuffle'],
  discard: takes('card-shove', 4),
  mill: ['card-fan-1'],
  counters: takes('chip-lay', 3),
  countered: ['error_006'],
  dice: ['dice-throw-1', 'dice-throw-3'],
  die: takes('die-throw', 4),
  // Swords (StarNinjas): a swing as attackers are declared, and as one
  // connects with a player; a clash as a blocker is, and as combat damage
  // lands on a creature.
  attack: takes('sword', 10),
  block: takes('sword-clash', 10),
  hit: takes('sword-clash', 10),
  victory: ['newthingget'],
}

/** Cues that are tunes: played as recorded, never nudged in pitch. */
const TUNES: ReadonlySet<SoundCue> = new Set<SoundCue>(['victory'])

/** Kept low: these play under a game, not over it. */
const VOLUME = 0.6

/**
 * The recordings are all normalised to the same loudness (-29 LUFS at their
 * loudest moment), well above the tones; this brings them down level with
 * them (about -38 LUFS, the `cast` tone's).
 */
const SAMPLE_LEVEL = 0.6

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    // The browser plays nothing until the page has had a click (or a key):
    // until then a cue is simply not heard, rather than a blocked context
    // made and warned about. A browser that can't say goes ahead.
    if (navigator.userActivation?.hasBeenActive === false) return null
    ctx ??= new AudioContext()
    // A context can still start suspended; any later cue resumes it.
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** Each recording once decoded. One that failed to load is simply never
 * here, and its cue keeps falling back to its tone. */
const buffers = new Map<string, AudioBuffer>()
let loading = false

/**
 * Fetches and decodes every recording, once: when the game mounts with sound
 * on, or else the first time sound plays. Decoded offline, which needs no
 * click first (a live context made before one starts suspended), so the
 * opening hand's draws can already be heard; a buffer plays in any context.
 */
export function preloadSounds(): void {
  if (loading) return
  loading = true
  let decoder: OfflineAudioContext
  try {
    decoder = new OfflineAudioContext(2, 1, 44100)
  } catch {
    return
  }
  for (const file of new Set(Object.values(SAMPLES).flat())) {
    fetch(`/sfx/${file}.mp3`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.arrayBuffer()
      })
      .then((data) => decoder.decodeAudioData(data))
      .then(
        (buffer) => buffers.set(file, buffer),
        () => {},
      )
  }
}

/** The take each cue played last, so the next one is a different take. */
const lastTake = new Map<SoundCue, string>()

/** Plays one of `cue`'s recordings, if any has loaded. */
function sample(a: AudioContext, cue: SoundCue): boolean {
  const ready = (SAMPLES[cue] ?? []).filter((f) => buffers.has(f))
  if (ready.length === 0) return false
  const fresh = ready.length > 1 ? ready.filter((f) => f !== lastTake.get(cue)) : ready
  const file = fresh[Math.floor(Math.random() * fresh.length)]
  lastTake.set(cue, file)
  const source = a.createBufferSource()
  source.buffer = buffers.get(file) ?? null
  // A touch of pitch either way, so even the same take twice isn't identical.
  if (!TUNES.has(cue)) source.playbackRate.value = 0.96 + Math.random() * 0.08
  const gain = a.createGain()
  gain.gain.value = SAMPLE_LEVEL * VOLUME
  source.connect(gain).connect(a.destination)
  source.start()
  return true
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

/** When each cue last played, so a run of one (a wrath's deaths, a spell's
 * worth of taps, all on one beat) sounds once rather than as a chord. */
const lastPlayed = new Map<SoundCue, number>()

/** Plays `cue` if the viewer has sound on, `afterMs` from now. Never throws. */
export function playSound(cue: SoundCue, afterMs = 0): void {
  if (!motionPrefs().sound) return
  if (afterMs > 0) {
    window.setTimeout(() => playSound(cue), afterMs)
    return
  }
  const now = performance.now()
  if (now - (lastPlayed.get(cue) ?? -Infinity) < 90) return
  lastPlayed.set(cue, now)
  const a = audio()
  if (a === null) return
  preloadSounds()
  if (sample(a, cue)) return
  switch (cue) {
    case 'cast':
    case 'land':
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
    case 'dice':
    case 'die':
      // A rattle: short clicks, each quieter, as the dice bounce and settle.
      for (const [at, gain] of [
        [0, 0.05],
        [260, 0.045],
        [560, 0.04],
        [820, 0.03],
        [1000, 0.02],
      ] as const) {
        tone(a, 1500 + at, 30, { type: 'square', at, gain })
      }
      break
    // The rest have no tone: silent until their recordings load.
    default:
      break
  }
}
