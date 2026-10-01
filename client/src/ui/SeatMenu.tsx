import { useEffect, useRef, useState } from 'react'
import type { PlayerView } from 'engine/client'
import type { NetworkGame } from '../net/useNetworkGame.ts'

/**
 * What a player can do with their own seat mid-game, in one button in the top
 * strip (which has no room for three): hand it to a bot and take it back,
 * concede, and leave. Conceding asks once more inside the panel rather than
 * through a browser dialog: rule 104.3a lets a player concede at any time,
 * and it can't be undone.
 */
export function SeatMenu({ game, view }: { readonly game: NetworkGame; readonly view: PlayerView }) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
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
  const inGame = seat !== null && !view.result.over && view.players[seat]?.hasLost === false
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
        title={botPlaying ? 'A bot is playing your seat' : 'Your seat'}
        aria-expanded={open}
        onClick={() => {
          // Opening it never starts on a half-finished concession.
          setConfirming(false)
          setOpen((o) => !o)
        }}
      >
        Seat
      </button>
      {open ? (
        <div className="motion-panel seat-menu-panel" role="dialog" aria-label="Your seat">
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
          <button type="button" onClick={() => window.location.assign('/')}>
            Leave the room
          </button>
        </div>
      ) : null}
    </div>
  )
}
