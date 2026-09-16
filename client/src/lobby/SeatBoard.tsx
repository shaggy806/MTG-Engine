import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { PlayerId } from 'engine'
import type { NetworkGame } from '../net/useNetworkGame.ts'
import type { WireDeck } from '../net/protocol.ts'
import { playerLabel, SEAT_CLASSES } from '../format.ts'
import { getActiveDeck, setActive } from '../deck-builder/decks.ts'
import type { PickableDeck } from '../deck-builder/decks.ts'
import { findCardDef } from '../ui/defToVisible.ts'
import { resolveArtUrl } from '../ui/art.ts'
import { DeckPickerModal } from './DeckPickerModal.tsx'
import './lobby.css'

type LocalDeck = { readonly name: string; readonly commander?: string; readonly cards: readonly string[] }

const toWire = (d: LocalDeck): WireDeck => ({ cards: d.cards, commander: d.commander, name: d.name })

/**
 * The seat-picker/waiting-room board: one panel per seat, side by side, each
 * showing who's sitting there and what deck (and commander) they're
 * bringing — with a blank "+" slot for a still-undecided seat. Shared
 * between `SeatPickerScreen` (before I've claimed a seat — my own panel
 * doubles as the join form) and `WaitingForPlayersScreen` (after — I'm just
 * watching the rest of the table fill in).
 *
 * Filling every seat doesn't start the game by itself: each seat has to
 * ready up (a green outline — bots always are) and the *Start Game* button
 * at the bottom only lights up once every seat has. Un-readying (mine only)
 * reopens my own deck slot for editing; a readied deck is locked until then.
 *
 * Choosing a deck never navigates away to `/deck-builder` — the old flow's
 * dead end, since that page has no room context and there was no way back to
 * this room short of re-entering its code by hand. The popup this opens
 * (`DeckPickerModal`) picks from decks already on this browser; its own
 * "Build or import a deck" link carries `?room=<code>` along so the deck
 * builder's own back link can return here instead.
 */
export function SeatBoard({ game }: { readonly game: NetworkGame }) {
  const joined = game.seat !== null
  const nextSeatIndex = game.seats.findIndex((s) => !s.claimed && !s.isBot)
  const nextSeat = nextSeatIndex === -1 ? null : game.seats[nextSeatIndex]
  // The seat this device either already holds, or would claim on "Ready" —
  // `null` once every seat is spoken for and I'm not one of them.
  const mySeatPlayer = joined ? game.seat : nextSeat?.player ?? null
  const mySeatStatus = joined ? game.seats.find((s) => s.player === game.seat) : undefined
  const amReady = mySeatStatus?.ready ?? false

  const [name, setName] = useState('')
  const [myDeck, setMyDeck] = useState<LocalDeck | null>(() => getActiveDeck())
  const [pickerSeat, setPickerSeat] = useState<PlayerId | null>(null)

  const readyUp = () => {
    if (mySeatPlayer === null) return
    if (!joined) {
      // First click: claims the seat and readies up in one round trip.
      game.claimSeat(
        mySeatPlayer,
        name.trim() || `Player ${nextSeatIndex + 1}`,
        myDeck ? toWire(myDeck) : undefined,
        true,
      )
    } else {
      // Already claimed (un-readied earlier) — any deck change was already
      // persisted immediately by `pick` below, so just flip ready back on.
      game.setReady(true)
    }
  }

  const pickingForMySeat = pickerSeat !== null && pickerSeat === mySeatPlayer

  const pick = (deck: PickableDeck) => {
    if (pickerSeat === null) return
    if (pickingForMySeat) {
      setMyDeck(deck)
      if (deck.ref) setActive(deck.ref)
      // Already claimed (editing while un-ready) — push the change now
      // rather than waiting for a "Ready" click that might resend it.
      if (joined) game.claimSeat(pickerSeat, undefined, toWire(deck))
    } else {
      const wire = toWire(deck)
      const status = game.seats.find((s) => s.player === pickerSeat)
      if (status?.isBot) game.setBotDeck(pickerSeat, wire)
      else game.addBot(pickerSeat, wire)
    }
    setPickerSeat(null)
  }

  const allReady = game.seats.every((s) => s.ready)

  return (
    <div className="seat-board" style={{ '--seat-count': game.seats.length } as CSSProperties}>
      <div className="seat-board-grid">
        {game.seats.map((s, i) => {
          const isMySeat = s.player === mySeatPlayer
          const deck: LocalDeck | null = isMySeat
            ? myDeck
            : s.deck
              ? { name: s.deck.name, commander: s.deck.commander ?? undefined, cards: [] }
              : null
          // My own seat's deck is editable until I ready up; any other
          // still-open or bot-filled seat is editable by anyone at any time
          // (a bot has no ready state of its own to gate on); a human's
          // seat other than mine is never editable.
          const deckEditable = isMySeat ? !amReady : !s.claimed

          return (
            <div
              key={s.player}
              className={`seat-panel ${SEAT_CLASSES[i % SEAT_CLASSES.length]}${s.ready ? ' ready' : ''}`}
            >
              <div className="seat-panel-head">
                <span className="seat-panel-name">
                  {s.claimed || s.isBot ? playerLabel(s.player, game.seats) : `Player ${i + 1}`}
                  {isMySeat && joined ? ' (you)' : ''}
                </span>
                <span className="seat-panel-tag">
                  {s.isBot
                    ? 'Bot'
                    : s.claimed
                      ? s.ready
                        ? 'Ready'
                        : s.online
                          ? 'Taken'
                          : 'Taken · offline'
                      : 'Open'}
                </span>
              </div>

              <DeckSlot deck={deck} editable={deckEditable} onClick={() => setPickerSeat(s.player)} />

              {isMySeat ? (
                amReady ? (
                  <button type="button" className="seat-panel-ready-btn active" onClick={() => game.setReady(false)}>
                    ✓ Ready
                  </button>
                ) : (
                  <>
                    {!joined ? (
                      <input
                        className="name-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name (optional)"
                        maxLength={20}
                      />
                    ) : null}
                    <button type="button" className="seat-panel-ready-btn" onClick={readyUp}>
                      Ready
                    </button>
                  </>
                )
              ) : !s.claimed && !s.isBot ? (
                <button type="button" className="seat-panel-add-bot" onClick={() => game.addBot(s.player)}>
                  Add bot (default deck)
                </button>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="seat-board-footer">
        <button type="button" className="start-game-btn" disabled={!allReady} onClick={game.startGame}>
          Start Game
        </button>
        {!allReady ? <p className="muted seat-board-hint">Waiting for everyone to ready up…</p> : null}
      </div>

      {pickerSeat !== null ? (
        <DeckPickerModal
          title={pickingForMySeat ? 'Choose your deck' : "Choose the bot's deck"}
          roomId={game.roomId}
          includeSaved={pickingForMySeat}
          onPick={pick}
          onClose={() => setPickerSeat(null)}
        />
      ) : null}
    </div>
  )
}

function DeckSlot({
  deck,
  editable,
  onClick,
}: {
  readonly deck: { readonly name: string; readonly commander?: string } | null
  readonly editable: boolean
  readonly onClick: () => void
}) {
  const commanderDef = deck?.commander ? findCardDef(deck.commander) : null
  const artUrl = commanderDef ? resolveArtUrl(commanderDef.art, commanderDef.name) : null

  return (
    <button
      type="button"
      className={`seat-deck-slot${deck ? '' : ' blank'}${editable ? ' editable' : ''}`}
      onClick={editable ? onClick : undefined}
      disabled={!editable}
    >
      {deck ? (
        <>
          <span
            className={`seat-deck-art${artUrl ? '' : ' blank'}`}
            style={artUrl ? { backgroundImage: `url(${artUrl})` } : undefined}
          />
          <span className="seat-deck-name">{deck.name}</span>
          <span className="seat-deck-commander">{deck.commander ?? 'No commander'}</span>
        </>
      ) : (
        <span className="seat-deck-plus">+</span>
      )}
      {editable ? <span className="seat-deck-hint">{deck ? 'Change deck' : 'Pick a deck'}</span> : null}
    </button>
  )
}
