import { useState } from 'react'
import type { NetworkGame } from '../net/useNetworkGame.ts'
import { createDeckFromImport } from '../deck-builder/decks.ts'
import { importDecklist, looksLikeDecklist, resolveImport } from '../deck-builder/importDeck.ts'
import type { ImportProgress } from '../deck-builder/importDeck.ts'

type Phase =
  | { readonly kind: 'idle' }
  /** The clipboard couldn't be read, or held no list: a box to paste into. */
  | { readonly kind: 'paste'; readonly note: string }
  | { readonly kind: 'importing'; readonly progress: ImportProgress | null }

/**
 * Blitzing — goldfishing against bots. One button at the foot of the landing
 * page, no explanation beyond its label: the decklist on the clipboard, run
 * through the deck import (an unimplemented card swapped for its stand-in,
 * one with none dropped), saved as the active deck, and played at once
 * against three bots on random starter decks (`NetworkGame.blitz`), with no
 * seat board in between.
 *
 * The clipboard is read on the click itself, which is what lets a browser
 * allow it. Where it won't (a refused permission, an older browser), or the
 * clipboard holds no "N Card Name" line, a box opens to paste the list into
 * instead, so the button never just does nothing.
 */
export function BlitzPanel({ game }: { readonly game: NetworkGame }) {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [pasted, setPasted] = useState('')
  const [error, setError] = useState<string | null>(null)

  const busy = phase.kind === 'importing' || game.blitzing
  // Indeterminate before the server's first progress line, and once the
  // list is read and the room is being set up.
  const progressPct =
    phase.kind === 'importing' && phase.progress !== null && phase.progress.total > 0
      ? Math.round((phase.progress.done / phase.progress.total) * 100)
      : null

  const run = (text: string) => {
    setError(null)
    setPhase({ kind: 'importing', progress: null })
    importDecklist(text, (progress) => setPhase({ kind: 'importing', progress }))
      .then(({ cards, format }) => {
        const resolved = resolveImport(cards, format)
        if (resolved.commanders.length === 0) {
          throw new Error(
            'No commander found in that list. Put it under a "Commander" heading, or on its own at the end.',
          )
        }
        if (resolved.cards.length === 0) throw new Error('None of the cards in that list could be played.')
        const deck = createDeckFromImport(resolved.name, resolved.cards, resolved.commanders, resolved.printings)
        game.blitz(
          { cards: deck.cards, commanders: deck.commanders, name: deck.name, printings: deck.printings },
          {
            deckName: deck.name,
            substituted: resolved.report.substituted.map(({ from, to }) => ({ from, to })),
            dropped: resolved.report.dropped,
          },
        )
        setPhase({ kind: 'idle' })
        setPasted('')
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err))
        setPhase({ kind: 'paste', note: 'Fix the list and try again, or paste a different one.' })
        setPasted(text)
      })
  }

  const fromClipboard = () => {
    setError(null)
    navigator.clipboard
      .readText()
      .then((text) => {
        if (looksLikeDecklist(text)) run(text)
        else setPhase({ kind: 'paste', note: "Your clipboard doesn't hold a decklist. Paste one here." })
      })
      .catch(() =>
        setPhase({ kind: 'paste', note: "Your browser didn't let the page read the clipboard. Paste the list here." }),
      )
  }

  return (
    <section className="landing-blitz" aria-label="Blitz a deck">
      <button type="button" className="landing-cta landing-blitz-btn" onClick={fromClipboard} disabled={busy}>
        Have a deck copied? Click here to blitz!
      </button>

      {phase.kind === 'paste' && !busy ? (
        <form
          className="landing-blitz-paste"
          onSubmit={(e) => {
            e.preventDefault()
            if (pasted.trim() !== '') run(pasted)
          }}
        >
          <label className="landing-field-label" htmlFor="landing-blitz-list">
            {phase.note}
          </label>
          <textarea
            id="landing-blitz-list"
            className="landing-blitz-textarea"
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            rows={6}
            placeholder={'1 Ureni of the Unwritten\n1 Sol Ring\n1 Command Tower\n...'}
            spellCheck={false}
            autoFocus
          />
          <div className="landing-blitz-paste-row">
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setPhase({ kind: 'idle' })
                setError(null)
              }}
            >
              Cancel
            </button>
            <button type="submit" className="landing-join-btn" disabled={pasted.trim() === ''}>
              Blitz
            </button>
          </div>
        </form>
      ) : null}

      {busy ? (
        <div className="landing-blitz-progress" aria-hidden="true">
          <div
            className={`landing-blitz-progress-fill${progressPct === null ? ' indeterminate' : ''}`}
            style={progressPct === null ? undefined : { width: `${progressPct}%` }}
          />
        </div>
      ) : null}
      {busy ? (
        <p className="landing-blitz-status" role="status">
          {game.blitzing
            ? 'Shuffling up against three bots…'
            : phase.kind === 'importing' && phase.progress !== null
              ? `Reading your list: ${phase.progress.done} of ${phase.progress.total} cards`
              : 'Reading your list…'}
        </p>
      ) : null}
      {error !== null ? (
        <p className="landing-blitz-error" role="alert">
          ⚠ {error}
        </p>
      ) : null}
    </section>
  )
}
