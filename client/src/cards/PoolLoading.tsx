import { Component } from 'react'
import type { ReactNode } from 'react'

/**
 * What the library and the deck builder show while their code and the card
 * pool download (see `main.tsx`). It fades in after a short delay, so a
 * visit served from the browser's cache doesn't flash it.
 */
export function PoolLoading() {
  return (
    <div className="pool-status pool-status-loading" role="status">
      Loading cards…
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
