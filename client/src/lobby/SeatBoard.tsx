import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { PlayerId } from 'engine'
import type { NetworkGame } from '../net/useNetworkGame.ts'
import type { WireDeck } from '../net/protocol.ts'
import { playerLabel, SEAT_CLASSES } from '../format.ts'
import { getActiveDeck, setActive } from '../deck-builder/decks.ts'
import type { PickableDeck } from '../deck-builder/decks.ts'
import { findCardDef } from '../ui/defToVisible.ts'
import { cssUrl, resolveArtUrl } from '../ui/art.ts'
import { DeckPickerModal } from './DeckPickerModal.tsx'
import { BotSpeedControl } from '../ui/BotSpeedControl.tsx'
import './lobby.css'

type LocalDeck = {
  readonly name: string
  readonly commander?: string
  readonly cards: readonly string[]
  readonly printings?: Readonly<Record<string, string>>
}

/** A table is 2-4 seats. Mirrors `PendingRoom`'s own limits, which are what
 * actually enforce this — these only decide whether to draw the control. */
const MIN_SEATS = 2
const MAX_SEATS = 4

const toWire = (d: LocalDeck): WireDeck => ({
  cards: d.cards,
  commander: d.commander,
  name: d.name,
  printings: d.printings,
})

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
 * This is also where the table gets its size (2-4 seats), via the "Add seat"
 * tile on the end of the row and a small × on any seat nobody is sitting in.
 * That question used to be asked on the landing page instead, as three "N
 * players" buttons above "Create a game" — before anyone had seen a seat, in
 * a layout where nothing tied the counts to the button below them. Here the
 * seats are on screen, and a wrong guess costs one click rather than a whole
 * new room.
 *
 * Choosing a deck never navigates away to `/deck-builder` — the old flow's
 * dead end, since that page has no room context and there was no way back to
 * this room short of re-entering its code by hand. The popup this opens
 * (`DeckPickerModal`) picks from decks already on this browser; its own
 * "Build or import a deck" link carries `?room=<code>` along so the deck
 * builder's own back link can return here instead.
 *
 * Everything that shapes the table for everyone — seats, bots and their
 * decks, bot speed, starting — is the host's (`game.isHost`, the room's
 * creator); everyone else sees those controls' results but not the controls,
 * since the server refuses them. Your own seat, deck and ready state are
 * always yours.
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
  const host = game.isHost
  const canAddSeat = host && game.seats.length < MAX_SEATS
  const hostSeat = game.seats.find((s) => s.isHost)

  return (
    <div className="seat-board" style={{ '--seat-count': game.seats.length } as CSSProperties}>
      <div className={`seat-board-grid${canAddSeat ? ' has-add' : ''}`}>
        {game.seats.map((s, i) => {
          const isMySeat = s.player === mySeatPlayer
          const deck: (LocalDeck & { commanderPrinting?: string | null }) | null = isMySeat
            ? myDeck === null
              ? null
              : {
                  ...myDeck,
                  // My own seat draws from the local deck, which has the
                  // whole printings map; every other seat only gets the one
                  // the server forwards on its `SeatStatus`.
                  commanderPrinting:
                    myDeck.commander === undefined
                      ? null
                      : (myDeck.printings?.[myDeck.commander] ?? null),
                }
            : s.deck
              ? {
                  name: s.deck.name,
                  commander: s.deck.commander ?? undefined,
                  commanderPrinting: s.deck.commanderPrinting,
                  cards: [],
                }
              : null
          // My own seat's deck is editable until I ready up; any other
          // still-open or bot-filled seat is editable by anyone at any time
          // (a bot has no ready state of its own to gate on); a human's
          // seat other than mine is never editable.
          const deckEditable = isMySeat ? !amReady : host && !s.claimed
          // Nobody is sitting here, and dropping it wouldn't take the table
          // below two. `isMySeat` also covers the seat I haven't claimed yet
          // but would take on "Ready" — removing the chair out from under
          // myself just shunts me to the next one, which reads as a bug.
          const removable = host && !s.claimed && !isMySeat && game.seats.length > MIN_SEATS

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
                {s.isHost ? <span className="seat-host-badge">Host</span> : null}
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
                {removable ? (
                  <button
                    type="button"
                    className="seat-panel-remove"
                    title="Remove this seat"
                    aria-label={`Remove seat ${i + 1}`}
                    onClick={() => game.removeSeat(s.player)}
                  >
                    ×
                  </button>
                ) : null}
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
              ) : host && !s.claimed && !s.isBot ? (
                <button type="button" className="seat-panel-add-bot" onClick={() => game.addBot(s.player)}>
                  Add bot (default deck)
                </button>
              ) : null}
            </div>
          )
        })}

        {canAddSeat ? (
          <button type="button" className="seat-add-panel" onClick={game.addSeat}>
            <span className="seat-add-plus">+</span>
            <span className="seat-add-label">Add seat</span>
          </button>
        ) : null}
      </div>

      <div className="seat-board-footer">
        <BotSpeedControl speed={game.botSpeed} editable={host} onChange={game.setBotSpeed} />
        {host ? (
          <button type="button" className="start-game-btn" disabled={!allReady} onClick={game.startGame}>
            Start Game
          </button>
        ) : null}
        {!allReady ? (
          <p className="muted seat-board-hint">Waiting for everyone to ready up…</p>
        ) : !host ? (
          <p className="muted seat-board-hint">
            Waiting for {hostSeat ? playerLabel(hostSeat.player, game.seats) : 'the host'} to start the game…
          </p>
        ) : null}
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
  readonly deck: {
    readonly name: string
    readonly commander?: string
    /** The printing this deck brings for its commander, if it isn't the
     * default — the thumbnail is a preview of what will hit the table, so
     * it shows the art its owner picked. */
    readonly commanderPrinting?: string | null
  } | null
  readonly editable: boolean
  readonly onClick: () => void
}) {
  const commanderDef = deck?.commander ? findCardDef(deck.commander) : null
  const artUrl = commanderDef
    ? resolveArtUrl(deck?.commanderPrinting ?? commanderDef.art, commanderDef.name)
    : null

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
            style={artUrl ? { backgroundImage: cssUrl(artUrl) } : undefined}
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
