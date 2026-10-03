import type { GameEvent, PlayerView } from 'engine/client'
import type { Half } from './animationSchedule.ts'
import { ResolveAims } from './resolveAims.ts'

/**
 * The one channel between "what the board is currently playing out"
 * (`usePlayback`) and "the overlays that draw it" (`AnimationLayer`).
 *
 * The two live side by side in `GameScreen` rather than nested — `Table`
 * remounts on every frame it's keyed on, which would tear down any animation
 * rendered inside it — so a cue has to travel sideways between siblings. An
 * instance per screen, created with a `useRef`, rather than module state:
 * there's no reset-on-mount hazard that way, and a second game on screen
 * would just get its own.
 *
 * Crucially, a cue carries the **view it belongs to**, not just the event.
 * The overlay for "a land was played" has to draw that land as it looked in
 * the frame it was played in — untapped, freshly arrived. Reading it out of
 * whatever view happened to be newest is what used to show a bot's land
 * already tapped for the spell it hadn't cast yet.
 */

export interface AnimationCue {
  readonly event: GameEvent
  /** The board this event belongs to — the state the frame carrying it
   * settled into. Every object an overlay needs is looked up here. */
  readonly view: PlayerView
  /** The board the frame started from (the one on screen when its first half
   * plays), or `null` for the first. What only the old board knows: whose a
   * permanent that has since left was. */
  readonly prev: PlayerView | null
  /** Milliseconds from publication until this cue's animation should fire. */
  readonly delay: number
  /** Which board it plays over (see `Half`). An `after` cue is published
   * before the new board is painted, and has to start in that same task. */
  readonly half: Half
}

type Listener = (cues: readonly AnimationCue[]) => void

export class AnimationBus {
  /** Only ever one subscriber (`AnimationLayer`); a second one replaces it. */
  private listener: Listener | null = null
  /** The other thing that travels sideways: which spell or ability is
   * resolving over the board on screen, for `ArrowLayer` to point from. Not a
   * cue but state with a lifetime — up from its resolution's first beat to
   * the end of its exit — so it's kept rather than sent (see `ResolveAims`). */
  readonly aims = new ResolveAims()

  subscribe(fn: Listener): () => void {
    this.listener = fn
    return () => {
      if (this.listener === fn) this.listener = null
    }
  }

  publish(cues: readonly AnimationCue[]): void {
    if (cues.length > 0) this.listener?.(cues)
  }
}
