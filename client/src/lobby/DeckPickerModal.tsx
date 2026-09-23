import { commanderPrintings, listPickableDecks } from '../deck-builder/decks.ts'
import type { PickableDeck } from '../deck-builder/decks.ts'
import { CommanderArt } from './CommanderArt.tsx'
import './lobby.css'

/**
 * The popup the seat board opens when you click a seat's deck slot — lets
 * you pick from this browser's saved decks or the built-in starters without
 * ever leaving the room (see `SeatBoard.tsx`'s header comment for why that
 * matters). Purely a picker: it hands the chosen deck back via `onPick` and
 * lets the caller decide what that means (stage it for your own seat's
 * `Join`, or immediately assign it to a bot).
 *
 * `includeSaved` gates this browser's saved decks (and the "build a new
 * one" link, which only makes sense alongside them) — on for your own seat,
 * off for a bot's: a bot only ever plays a curated starter deck, never a
 * deck you're still building or one meant for you to actually play.
 */
export function DeckPickerModal({
  title,
  roomId,
  includeSaved,
  onPick,
  onClose,
}: {
  readonly title: string
  readonly roomId: string | null
  readonly includeSaved: boolean
  readonly onPick: (deck: PickableDeck) => void
  readonly onClose: () => void
}) {
  const decks = listPickableDecks()
  const saved = includeSaved ? decks.filter((d) => d.key.startsWith('saved:')) : []
  const starters = decks.filter((d) => d.key.startsWith('starter:'))

  return (
    <div className="deck-picker-overlay" onClick={onClose}>
      <div className="deck-picker-box" onClick={(e) => e.stopPropagation()}>
        <div className="deck-picker-head">
          <h3>{title}</h3>
          <button type="button" className="deck-picker-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="deck-picker-list">
          {saved.length > 0 ? (
            <>
              <p className="deck-picker-section">My decks</p>
              {saved.map((d) => (
                <DeckPickerRow key={d.key} deck={d} onPick={onPick} />
              ))}
            </>
          ) : null}
          {includeSaved ? <p className="deck-picker-section">Starter decks</p> : null}
          {starters.map((d) => (
            <DeckPickerRow key={d.key} deck={d} onPick={onPick} />
          ))}
        </div>
        {includeSaved ? (
          <a
            className="link-button deck-picker-build"
            href={roomId ? `/deck-builder?room=${roomId}` : '/deck-builder'}
          >
            + Build or import a deck
          </a>
        ) : null}
      </div>
    </div>
  )
}

function DeckPickerRow({
  deck,
  onPick,
}: {
  readonly deck: PickableDeck
  readonly onPick: (deck: PickableDeck) => void
}) {
  return (
    <button type="button" className="deck-picker-row" onClick={() => onPick(deck)}>
      <CommanderArt
        commanders={commanderPrintings(deck)}
        className="deck-picker-row-art"
        blankClass="deck-picker-row-art-blank"
      />
      <span className="deck-picker-row-text">
        <span className="deck-picker-row-name">{deck.name}</span>
        {deck.commanders.length > 0 ? (
          <span className="deck-picker-row-commander">{deck.commanders.join(' & ')}</span>
        ) : (
          <span className="deck-picker-row-commander muted">{deck.cards.length} cards</span>
        )}
      </span>
    </button>
  )
}
