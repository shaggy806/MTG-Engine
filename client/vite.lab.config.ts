import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/**
 * The **card lab** dev server (`npm run lab -w client`). Serves
 * `card-lab.html`, and — unlike the main client — aliases `engine` to its
 * TypeScript *source* rather than the built `engine/dist`, so editing a card
 * file under `engine/src/cards/pool/` hot-reloads the lab immediately.
 *
 * Caveats:
 *  - engine still needs to be built once (`npm run build -w engine`) so the
 *    lab's own `.tsx` type-checks against `engine/dist/*.d.ts`.
 *  - a *new* card file needs `npm run gen:cards -w engine` before the lab
 *    picks it up (it's only added to `BUILTIN_CARDS` by the codegen).
 */
const engineSrc = fileURLToPath(new URL('../engine/src/index.ts', import.meta.url))
const repoRoot = fileURLToPath(new URL('..', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { engine: engineSrc },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    port: 5174,
    fs: { allow: [repoRoot] },
  },
})
