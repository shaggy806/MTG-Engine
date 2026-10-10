import { DEFAULT_SOUND_VOLUME, motionPrefs } from './motionPrefs.ts'

/**
 * The game's sound effects, at the viewer's volume (motionPrefs'
 * `soundVolume`; 0 is off). Played from the same cues the animations are (see
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
  | 'creature-death'
  | 'exile'
  | 'gain'
  | 'loss'
  | 'turn'
  | 'your-turn'
  | 'tap'
  | 'untap'
  | 'ability'
  | 'enter'
  | 'counters'
  | 'countered'
  | 'dice'
  | 'die'
  | 'victory'
  | 'defeat'
  | 'click'

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
  // A spell cast sounds as a land played does: a card put down.
  cast: takes('card-place', 4),
  draw: takes('card-slide', 8),
  shuffle: ['card-shuffle'],
  discard: takes('card-shove', 4),
  mill: ['card-fan-1'],
  counters: takes('chip-lay', 3),
  // qubodup's Energy Drain: a spell or ability countered or fizzling.
  countered: ['energy-drain'],
  // HaelDB's Cockatrice sounds (OpenGameArt's "Card Game sounds"): a
  // permanent tapping and untapping, and dice rolled, one or several.
  tap: ['card-tap'],
  untap: ['card-untap'],
  dice: ['roll-die'],
  die: ['roll-die'],
  // Swords (StarNinjas) for combat's declarations: a swing as attackers are
  // declared, a clash as a blocker is.
  attack: takes('sword', 10),
  block: takes('sword-clash', 10),
  // Hits (Independent.nu) as combat damage lands, on a creature or a player.
  hit: ['hit-25', 'hit-26', 'hit-27', 'hit-28', 'hit-29', 'hit-32'],
  victory: ['newthingget'],
  // congusbongus's "A surprising twist (NES sting)" (OpenGameArt, CC0), whose
  // last note is cut off mid-sustain: here it fades into a short reverb-like
  // tail (echoes at 37-401 ms, decaying over a second).
  defeat: ['surprise-defeat'],
  // A turn beginning, anyone's: HaelDB's game-start sound for Cockatrice
  // (OpenGameArt's "Card Game sounds", CC0). Two cues, so yours can be told
  // apart again if it should sound different.
  turn: ['game-start'],
  'your-turn': ['game-start'],
  // A creature dying (put into a graveyard from the battlefield): tonsil5's
  // "Grunt2 - Death Pain" (Freesound, CC0).
  'creature-death': ['grunt-death'],
  // A permanent exiled: dreggsome's "blow smoke" (Freesound, CC0), cut to
  // start as the breath becomes audible, so its burst lands with the exile's
  // white-blue flare and its body carries the dissolve.
  exile: ['blow-smoke'],
  // Any other permanent leaving the battlefield, but for exile (its own
  // cue): destroyed, sacrificed, returned to hand or library. rubberduck's
  // "75 CC0 breaking / falling / hit sfx" (OpenGameArt), breaking_03.
  death: ['breaking'],
  // A player gaining life: MLaudio's cartoon magic sparkle (Freesound, CC0).
  gain: ['sparkle'],
  // A nonland permanent arriving on the battlefield: OtisJames's thud
  // (Freesound, CC0), on trial (2026-10-10).
  enter: ['thud'],
  // An ability going on the stack, as its entry flies there from its source:
  // qubodup's bamboo-stick whoosh (Freesound, CC0).
  ability: ['whoosh'],
  // Kenney's Interface Sounds: any button on the site (`clickButtons`). A
  // tiny, low click (the user's pick, 2026-10-10; click_001 was too sharp).
  click: ['click_003'],
}

/** A cue's own level against the rest, where it isn't 1: the button click
 * a little under the game's sounds (the user's ask, 2026-10-10), and a tap
 * or untap too, as the commonest thing on the table (every mana tapped, a
 * whole untap step). The victory and defeat tunes well over them (+8 dB, the
 * user's ask, 2026-10-10): matched on loudness, a sustained tune still read
 * as much quieter than the game's sharp hits and card slaps, whose peaks sit
 * about 8 dB higher; the tunes peak near -18 dB even so. */
const CUE_LEVEL: Partial<Record<SoundCue, number>> = { click: 0.7, tap: 0.7, untap: 0.7, victory: 2.5, defeat: 2.5 }

/** Cues that are tunes: played as recorded, never nudged in pitch. */
const TUNES: ReadonlySet<SoundCue> = new Set<SoundCue>(['victory', 'defeat', 'turn', 'your-turn'])

/** Kept low at the slider's default: these play under a game, not over it. */
const VOLUME = 0.6

/** The level everything plays at: `VOLUME` at the slider's default, scaled
 * by the square of the slider (loudness heard grows far slower than
 * amplitude), so its top end is twice the default's amplitude. */
function level(): number {
  return VOLUME * (motionPrefs().soundVolume / DEFAULT_SOUND_VOLUME) ** 2
}

/**
 * The recordings are all normalised to the same loudness (-29 LUFS at their
 * loudest moment), well above the tones; this brings them down level with
 * them (about -38 LUFS, the `cast` tone's).
 */
const SAMPLE_LEVEL = 0.6

let ctx: AudioContext | null = null

/** The page's one audio context, shared with the music (`music.ts`); null
 * until the page has had a click, or where there's no Web Audio. */
export function audio(): AudioContext | null {
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
/** Each recording asked for, so none is fetched twice. */
const requested = new Set<string>()
let decoder: OfflineAudioContext | null = null

/**
 * Fetches and decodes the recordings of `cues` (every cue's, by default),
 * each once: all of them when the game mounts with sound on, or a cue's own
 * the first time it plays; the button click alone on any page
 * (`clickButtons`), so the landing page doesn't download the game's sounds.
 * Decoded offline, which needs no click first (a live context made before
 * one starts suspended), so the opening hand's draws can already be heard;
 * a buffer plays in any context.
 */
export function preloadSounds(cues: readonly SoundCue[] = Object.keys(SAMPLES) as SoundCue[]): void {
  try {
    decoder ??= new OfflineAudioContext(2, 1, 44100)
  } catch {
    return
  }
  const d = decoder
  for (const file of new Set(cues.flatMap((cue) => SAMPLES[cue] ?? []))) {
    if (requested.has(file)) continue
    requested.add(file)
    fetch(`/sfx/${file}.mp3`)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`)
        return r.arrayBuffer()
      })
      .then((data) => d.decodeAudioData(data))
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
  gain.gain.value = SAMPLE_LEVEL * level() * (CUE_LEVEL[cue] ?? 1)
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
  const peak = (opts.gain ?? 0.12) * level()
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
  if (motionPrefs().soundVolume <= 0) return
  if (afterMs > 0) {
    window.setTimeout(() => playSound(cue), afterMs)
    return
  }
  const now = performance.now()
  if (now - (lastPlayed.get(cue) ?? -Infinity) < 90) return
  lastPlayed.set(cue, now)
  const a = audio()
  if (a === null) return
  preloadSounds([cue])
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
    case 'creature-death':
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
    // Until the recording loads, a chime.
    case 'turn':
    case 'your-turn':
      tone(a, 523, 260, { type: 'triangle', gain: 0.08 })
      tone(a, 784, 380, { type: 'triangle', at: 120, gain: 0.07 })
      break
    case 'enter':
      // Until the thud loads, a low thump.
      tone(a, 140, 180, { to: 55, type: 'sine', gain: 0.14 })
      break
    case 'ability':
      // Until the whoosh loads, a soft rise.
      tone(a, 520, 220, { to: 880, type: 'sine', gain: 0.06 })
      break
    case 'tap':
    case 'untap':
    case 'click':
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

/** How long a link that leaves the page waits, so its click is heard. */
const LEAVE_DELAY_MS = 90

/**
 * Every enabled button on the site clicks (`click`), on every page, and so
 * does every link: each is styled as a button (the landing page's deck
 * builder and library, the pages' way back). One listener on the document,
 * installed once by `main.tsx`, in the capture phase so a button that stops
 * its click from bubbling still sounds; a disabled button gets no click
 * event at all. A link loads another page, which would cut its click off,
 * so a plain click on one (no new tab, nothing else handling it) waits
 * `LEAVE_DELAY_MS` before it goes. The click's sound loads at once (when
 * sound is on), and only it: the landing page has no need of the game's.
 */
export function clickButtons(): void {
  if (motionPrefs().soundVolume > 0) preloadSounds(['click'])
  document.addEventListener(
    'click',
    (e) => {
      const target = e.target instanceof Element ? e.target.closest('button, a[href]') : null
      if (target === null || (target instanceof HTMLButtonElement && target.disabled)) return
      playSound('click')
    },
    true,
  )
  // After React's own handlers (on the root, below the document), so a link
  // something else already handled is left alone.
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (motionPrefs().soundVolume <= 0) return
    const link = e.target instanceof Element ? e.target.closest('a[href]') : null
    if (!(link instanceof HTMLAnchorElement) || (link.target !== '' && link.target !== '_self') || link.hasAttribute('download')) {
      return
    }
    const to = new URL(link.href, window.location.href)
    // A link within the page (#…) doesn't leave it.
    if (to.origin === window.location.origin && to.pathname === window.location.pathname && to.search === window.location.search) return
    e.preventDefault()
    window.setTimeout(() => window.location.assign(to.href), LEAVE_DELAY_MS)
  })
}
