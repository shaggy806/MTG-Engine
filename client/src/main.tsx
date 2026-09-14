import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LibraryPage } from './library/LibraryPage.tsx'

// The public card library is a separate, network-free page (no room/seat/
// WebSocket at all) -- branching here, before `<App/>` is chosen, means
// `useNetworkGame`'s eager WebSocket connection (see
// `client/src/net/useNetworkGame.ts`) never opens for this route.
const page = window.location.pathname.startsWith('/library') ? <LibraryPage /> : <App />

createRoot(document.getElementById('root')!).render(<StrictMode>{page}</StrictMode>)
