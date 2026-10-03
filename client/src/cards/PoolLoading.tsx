import { Component, useEffect, useId, useState } from 'react'
import type { ReactNode } from 'react'
import { usePoolProgress } from './cardData.ts'
// The reduced-motion switch the bar's CSS reads (`:root[data-reduce-motion]`)
// and `--anim-scale` are set as this module loads. The game's own code loads
// it too, but these pages shouldn't depend on that.
import '../game/motionPrefs.ts'

/** How long the bar may sit without another shard arriving before the page
 * says so and offers a reload. A slow connection can trip it while every
 * shard is still downloading in parallel, so it's a hint, not an error: the
 * bar carries on underneath. */
const STALL_MS = 15_000

/**
 * What the library and the deck builder show while their code and the card
 * pool download (see `main.tsx`): a bar filling as the pool's shards arrive.
 * It fades in after a short delay, so a visit served from the browser's cache
 * doesn't flash it.
 *
 * A shard that fails rejects the whole load, and `PoolLoadBoundary` replaces
 * this with its own message. One that never answers would leave the bar
 * where it was, so after `STALL_MS` without progress it says so.
 */
export function PoolLoading() {
  const { loaded, total } = usePoolProgress()
  const labelId = useId()
  const pct = total === 0 ? 0 : Math.round((loaded / total) * 100)

  // The count the bar had when it last sat still for `STALL_MS`. Comparing it
  // with the current count, rather than setting a flag back to false, means a
  // shard arriving clears the hint without a state update of its own.
  const [stalledAt, setStalledAt] = useState<number | null>(null)
  useEffect(() => {
    const timer = window.setTimeout(() => setStalledAt(loaded), STALL_MS)
    return () => window.clearTimeout(timer)
  }, [loaded])
  const stalled = stalledAt === loaded

  return (
    <div className="pool-status pool-status-loading">
      <div className="pool-progress">
        <div className="pool-progress-label">
          <span id={labelId}>Loading cards…</span>
          <span className="mono pool-progress-pct" aria-hidden="true">
            {pct}%
          </span>
        </div>
        <div
          className="pool-progress-track"
          role="progressbar"
          aria-labelledby={labelId}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={loaded}
          aria-valuetext={`${pct}% (${loaded} of ${total} card files)`}
        >
          <div className="pool-progress-fill" style={{ transform: `scaleX(${pct / 100})` }} />
        </div>
        {/* The live region is there from the start and only its contents
            come and go: a screen reader announces a change inside a region
            it already knows, not one that arrives together with its text. */}
        <div className="pool-progress-stalled" role="status">
          {stalled ? (
            <>
              <p>This is taking longer than usual.</p>
              <button type="button" onClick={() => window.location.reload()}>
                Reload
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/**
 * Catches a page that couldn't load its code or the card pool, and offers a
 * reload in place of a blank screen. Usually that's the network, or a deploy
 * that replaced the build while the tab was open, which the new build's
 * files fix.
 */
export class PoolLoadBoundary extends Component<{ readonly children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="pool-status" role="alert">
        <p>The card data couldn't be loaded.</p>
        <button type="button" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    )
  }
}
