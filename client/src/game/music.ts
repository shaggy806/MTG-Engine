import { useEffect } from 'react'
import { motionPrefs, useMotionPrefs } from './motionPrefs.ts'
import { audio } from './sound.ts'

/**
 * Background music in a game: RandomMind's medieval pieces (`public/music/`,
 * CC0; `CREDITS.md` there), shuffled, one after another for as long as the
 * game lasts, at the viewer's music volume (motionPrefs' `musicVolume`; 0 is
 * off). It fades in as a game starts and out as it ends, under the victory
 * tune, or as the viewer leaves.
 *
 * Streamed from an `<audio>` element, so only the piece playing downloads,
 * and played through the sound effects' audio context (`sound.ts`'s
 * `audio`), whose gain node is what sets its level: iOS ignores an `<audio>`
 * element's own volume, and a gain node's fades keep time in a background tab
 * too. Like the sound effects, nothing plays until the page has had a click.
 */

/** The pieces, by file name (`public/music/<name>.mp3`). */
export const TRACKS = [
  'harvest-season',
  'the-old-tower-inn',
  'the-bards-tale',
  'kings-feast',
  'minstrel-dance',
  'market-day',
  'exploration',
] as const

/**
 * The music's gain with the slider at half. The files are all normalised to
 * -23 LUFS across the piece; this puts them near -41, under the sound
 * effects (about -38 at their loudest). Scaled by the square of the slider,
 * as the sound effects are: at its default of 70% (the user's pick,
 * 2026-10-10, after listening) about twice this, near -35, and four times
 * this at the top.
 */
const LEVEL_AT_HALF = 0.12
const FADE_IN_S = 2
const FADE_OUT_S = 1.2

let element: HTMLAudioElement | null = null
let gain: GainNode | null = null
/** Whether a game wants music now (`startMusic` / `stopMusic`). */
let wanted = false
let queue: string[] = []
let last: string | null = null
let pauseTimer: number | null = null
let waitingForClick = false

function level(): number {
  return Math.min(1, LEVEL_AT_HALF * (motionPrefs().musicVolume / 0.5) ** 2)
}

/** The next piece: through every one in a shuffled order, then shuffled
 * again, never the same piece twice running. */
function nextTrack(): string {
  if (queue.length === 0) {
    queue = [...TRACKS]
    for (let i = queue.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[queue[i], queue[j]] = [queue[j], queue[i]]
    }
    if (queue[0] === last && queue.length > 1) queue.push(queue.shift() as string)
  }
  last = queue.shift() as string
  return `/music/${last}.mp3`
}

/** The element and the gain it plays through, made once the page has an
 * audio context; null before that. */
function chain(): { readonly el: HTMLAudioElement; readonly node: GainNode; readonly ctx: AudioContext } | null {
  const ctx = audio()
  if (ctx === null) return null
  if (element === null || gain === null) {
    try {
      const el = new Audio()
      el.preload = 'auto'
      el.addEventListener('ended', () => {
        el.src = nextTrack()
        if (wanted) void el.play().catch(() => {})
      })
      const node = ctx.createGain()
      node.gain.value = 0
      ctx.createMediaElementSource(el).connect(node).connect(ctx.destination)
      element = el
      gain = node
    } catch {
      return null
    }
  }
  return { el: element, node: gain, ctx }
}

/** Glides the music's gain to `to` over about `seconds`. */
function glide(node: GainNode, ctx: AudioContext, to: number, seconds: number): void {
  const now = ctx.currentTime
  node.gain.cancelScheduledValues(now)
  node.gain.setValueAtTime(node.gain.value, now)
  node.gain.linearRampToValueAtTime(to, now + seconds)
}

/** Before the page's first click there's no audio context: try again then. */
function afterClick(): void {
  if (waitingForClick) return
  waitingForClick = true
  const go = (): void => {
    waitingForClick = false
    document.removeEventListener('pointerdown', go, true)
    document.removeEventListener('keydown', go, true)
    // After the click's own handlers, which may be what makes the context.
    window.setTimeout(() => {
      if (wanted) startMusic()
    }, 0)
  }
  document.addEventListener('pointerdown', go, true)
  document.addEventListener('keydown', go, true)
}

/** A game wants music: fades it in, from where it left off if it was only
 * faded out, or with the next piece. Silent at a volume of 0. */
export function startMusic(): void {
  wanted = true
  if (pauseTimer !== null) {
    window.clearTimeout(pauseTimer)
    pauseTimer = null
  }
  if (level() <= 0) return
  const c = chain()
  if (c === null) {
    afterClick()
    return
  }
  if (c.el.src === '') c.el.src = nextTrack()
  void c.el.play().catch(() => afterClick())
  glide(c.node, c.ctx, level(), FADE_IN_S)
}

/** No game wants music now: fades it out, then pauses. */
export function stopMusic(): void {
  wanted = false
  if (element === null || gain === null) return
  const ctx = audio()
  if (ctx !== null) glide(gain, ctx, 0, FADE_OUT_S)
  if (pauseTimer !== null) window.clearTimeout(pauseTimer)
  pauseTimer = window.setTimeout(
    () => {
      pauseTimer = null
      if (!wanted) element?.pause()
    },
    FADE_OUT_S * 1000 + 100,
  )
}

/** The volume slider moved: the music follows it, stopping at 0 (nothing
 * streams) and starting again above it. */
function volumeChanged(): void {
  if (!wanted) return
  if (level() <= 0) {
    element?.pause()
    // So turning it up again fades in rather than starting at full level.
    if (gain !== null) {
      gain.gain.cancelScheduledValues(0)
      gain.gain.value = 0
    }
    return
  }
  const c = chain()
  if (c === null) {
    afterClick()
    return
  }
  if (c.el.paused) {
    startMusic()
    return
  }
  glide(c.node, c.ctx, level(), 0.15)
}

/** Music while `on` (a game in progress, `GameScreen`), and none once it
 * isn't or the screen goes. */
export function useGameMusic(on: boolean): void {
  const { musicVolume } = useMotionPrefs()
  useEffect(() => {
    if (!on) return
    startMusic()
    return () => stopMusic()
  }, [on])
  useEffect(() => {
    volumeChanged()
  }, [musicVolume])
}
