import { StrictMode, Suspense, lazy } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { loadCardPool } from './cards/cardData.ts'
import { PoolLoadBoundary, PoolLoading } from './cards/PoolLoading.tsx'

/**
 * A page that works over the whole card pool, loaded with it. The library
 * and the deck builder search, sort and validate over every card, so the
 * page's own code and every card shard are fetched together, and the page
 * renders once both are in. That's what lets them read `cardPool()`
 * directly. Neither page, nor the pool, is part of the game's own download.
 */
function withCardPool(load: () => Promise<ComponentType>) {
  return lazy(async () => {
    const [page] = await Promise.all([load(), loadCardPool()])
    return { default: page }
  })
}

const LibraryPage = withCardPool(() =>
  import('./library/LibraryPage.tsx').then((m) => m.LibraryPage),
)
const DeckBuilderPage = withCardPool(() =>
  import('./deck-builder/DeckBuilderPage.tsx').then((m) => m.DeckBuilderPage),
)

const poolPage = (page: ReactNode) => (
  <PoolLoadBoundary>
    <Suspense fallback={<PoolLoading />}>{page}</Suspense>
  </PoolLoadBoundary>
)

// The public card library and the deck builder are both separate, network-
// free pages (no room/seat/WebSocket at all) -- branching here, before
// `<App/>` is chosen, means `useNetworkGame`'s eager WebSocket connection
// (see `client/src/net/useNetworkGame.ts`) never opens for these routes.
const path = window.location.pathname
const page = path.startsWith('/library')
  ? poolPage(<LibraryPage />)
  : path.startsWith('/deck-builder')
    ? poolPage(<DeckBuilderPage />)
    : <App />

createRoot(document.getElementById('root')!).render(<StrictMode>{page}</StrictMode>)
