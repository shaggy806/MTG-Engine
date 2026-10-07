import { useEffect, useRef, useState } from 'react'
import type { PlayerView } from 'engine/client'
import type { NetworkGame } from '../net/useNetworkGame.ts'

/**
 * The top strip's "Game" menu: what a player can do with this game, in one
 * button (the strip has no room for several) — hand their seat to a bot and
 * take it back, concede, and leave, and once the game is over, reopen its
 * result. It was "Seat", which said little about what was in it (the user,
 * 2026-10-07). The host can restart the game mid-way: the same seats and decks dealt afresh
 * for everyone (`NetworkGame.rematch(true)`), asked once more first, since
 * the game in progress is lost.
 * Conceding asks once more inside the panel rather than through a browser
 * dialog: rule 104.3a lets a player concede at any time, and it can't be
 * undone.
 */
export function SeatMenu({
  game,
  view,
  onShowResult,
}: {
  readonly game: NetworkGame
  readonly view: PlayerView
  /** Opens the end-of-game panel again once it's been put aside to look at
   * the board: the way back to its rematch. */
  readonly onShowResult?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmingRestart, setConfirmingRestart] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  // Closes on a click anywhere else, or Escape, as the animations panel does.
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const seat = game.seat
  // A spectator's seat is only whose side is drawn nearest: nothing to play.
  const inGame = !game.spectating && seat !== null && !view.result.over && view.players[seat]?.hasLost === false
  const botPlaying = game.seats.find((s) => s.player === seat)?.isBot === true
  // The opening hands are answered in parallel before the game begins; the
  // server refuses a concession then (`Game.whyCannotConcede`).
  const begun = view.turn.number > 0

  return (
    <div className="motion-control seat-menu" ref={boxRef}>
      <button
        type="button"
        // Amber while a bot has the seat, as the bots' pause button is when
        // paused; the strip has no room for a longer label.
        className={botPlaying ? 'ts-paused' : undefined}
        title={botPlaying ? 'A bot is playing your seat' : 'This game: a bot for your seat, concede, restart, leave'}
        aria-expanded={open}
        onClick={() => {
          // Opening it never starts on a half-finished concession.
          setConfirming(false)
          setConfirmingRestart(false)
          setOpen((o) => !o)
        }}
      >
        Game
      </button>
      {open ? (
        <div className="motion-panel seat-menu-panel" role="dialog" aria-label="Game">
          {inGame ? (
            <button type="button" onClick={() => game.setBotTakeover(!botPlaying)}>
              {botPlaying ? 'Take back control' : 'Let a bot play for me'}
            </button>
          ) : null}
          {inGame && begun ? (
            confirming ? (
              <div className="seat-menu-confirm">
                <span>Concede the game?</span>
                <button
                  type="button"
                  className="seat-menu-danger"
                  onClick={() => {
                    game.concede()
                    setOpen(false)
                  }}
                >
                  Concede
                </button>
                <button type="button" onClick={() => setConfirming(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirming(true)}>
                Concede…
              </button>
            )
          ) : null}
          {game.isHost && game.canRematch && !view.result.over ? (
            confirmingRestart ? (
              <div className="seat-menu-confirm">
                <span>Restart for everyone?</span>
                <button
                  type="button"
                  className="seat-menu-danger"
                  onClick={() => {
                    game.rematch(true)
                    setOpen(false)
                  }}
                >
                  Restart
                </button>
                <button type="button" onClick={() => setConfirmingRestart(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmingRestart(true)}>
                Restart game…
              </button>
            )
          ) : null}
          {onShowResult !== undefined ? (
            <button
              type="button"
              onClick={() => {
                onShowResult()
                setOpen(false)
              }}
            >
              Game result
            </button>
          ) : null}
          <button type="button" onClick={() => window.location.assign('/')}>
            Leave the room
          </button>
        </div>
      ) : null}
    </div>
  )
}
