import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LibraryPage } from './library/LibraryPage.tsx'
import { DeckBuilderPage } from './deck-builder/DeckBuilderPage.tsx'

// The public card library and the deck builder are both separate, network-
// free pages (no room/seat/WebSocket at all) -- branching here, before
// `<App/>` is chosen, means `useNetworkGame`'s eager WebSocket connection
// (see `client/src/net/useNetworkGame.ts`) never opens for these routes.
const path = window.location.pathname
const page = path.startsWith('/library')
  ? <LibraryPage />
  : path.startsWith('/deck-builder')
    ? <DeckBuilderPage />
    : <App />

createRoot(document.getElementById('root')!).render(<StrictMode>{page}</StrictMode>)
