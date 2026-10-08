import { useEffect, useState } from 'react'
import type { PlayerId } from 'engine/client'
import type { RoomSettings, SeatStatus } from 'protocol'
import type { NetworkGame } from '../net/useNetworkGame.ts'
import { BOT_SPEEDS } from '../ui/botSpeeds.ts'

/** The range the server accepts (`PendingRoom.setSettings`). */
const LIFE_MIN = 1
const LIFE_MAX = 999
/** One click to the totals people actually play: Commander's 40 (rule
 * 903.7), 30 for a shorter game, and the 20 of a duel. */
const LIFE_PRESETS = [20, 30, 40] as const

/**
 * The waiting room's game settings — starting life, who goes first, how fast
 * the bots play — under the seats. The host's to change; everyone else sees
 * what the game will be, as plain text, since the server would refuse their
 * change anyway.
 */
export function RoomSettingsPanel({
  game,
  seatLabel,
}: {
  readonly game: NetworkGame
  readonly seatLabel: (seat: SeatStatus) => string
}) {
  const settings = game.roomSettings
  if (settings === null) return null
  const host = game.isHost
  const firstLabel =
    settings.firstPlayer === 'random'
      ? 'Random (highroll)'
      : (() => {
          const seat = game.seats.find((s) => s.player === settings.firstPlayer)
          return seat === undefined ? 'Random (highroll)' : seatLabel(seat)
        })()
  const speedLabel = BOT_SPEEDS.find((s) => s.speed === game.botSpeed)?.label ?? game.botSpeed

  return (
    <section className="room-settings" aria-label="Room settings">
      <h3 className="room-settings-title">Room settings</h3>
      <div className="room-settings-fields">
        <div className="rs-field">
          <span className="rs-label" id="rs-life">
            Starting life
          </span>
          {host ? (
            <LifeControl life={settings.startingLife} onChange={(startingLife) => game.setRoomSettings({ startingLife })} />
          ) : (
            <span className="rs-value mono">{settings.startingLife}</span>
          )}
        </div>

        <div className="rs-field">
          <label className="rs-label" htmlFor="rs-first">
            First player
          </label>
          {host ? (
            <select
              id="rs-first"
              className="rs-select"
              value={settings.firstPlayer}
              onChange={(e) =>
                game.setRoomSettings({ firstPlayer: e.target.value as RoomSettings['firstPlayer'] })
              }
            >
              <option value="random">Random (highroll)</option>
              {game.seats.map((s) => (
                <option key={s.player} value={s.player as PlayerId}>
                  {seatLabel(s)}
                </option>
              ))}
            </select>
          ) : (
            <span className="rs-value">{firstLabel}</span>
          )}
        </div>

        {/* Commander's deck rules (rule 903.5 — 100 cards, singleton, the
            commanders' colour identity), or any deck at all. */}
        <div className="rs-field">
          <span className="rs-label">Decks</span>
          {host ? (
            <div className="rs-options" role="group" aria-label="Decks">
              {([
                [false, 'Any deck'],
                [true, 'Commander-legal'],
              ] as const).map(([value, label]) => (
                <button
                  key={label}
                  type="button"
                  className={`seg-option${settings.commanderLegalOnly === value ? ' active' : ''}`}
                  aria-pressed={settings.commanderLegalOnly === value}
                  onClick={() => game.setRoomSettings({ commanderLegalOnly: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <span className="rs-value">{settings.commanderLegalOnly ? 'Commander-legal only' : 'Any deck'}</span>
          )}
        </div>

        {/* What "Add bot (random deck)" deals: the precons as printed, or
            as players upgrade them (`RoomSettings.botDecks`). */}
        <div className="rs-field">
          <span className="rs-label">Bot decks</span>
          {host ? (
            <div className="rs-options" role="group" aria-label="Bot decks">
              {([
                ['precon', 'Precons'],
                ['upgraded', 'Upgraded'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`seg-option${settings.botDecks === value ? ' active' : ''}`}
                  aria-pressed={settings.botDecks === value}
                  onClick={() => game.setRoomSettings({ botDecks: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <span className="rs-value">{settings.botDecks === 'upgraded' ? 'Upgraded precons' : 'Precons'}</span>
          )}
        </div>

        <div className="rs-field">
          <span className="rs-label">Bot speed</span>
          {host ? (
            <div className="rs-options" role="group" aria-label="Bot speed">
              {BOT_SPEEDS.map((s) => (
                <button
                  key={s.speed}
                  type="button"
                  className={`seg-option${s.speed === game.botSpeed ? ' active' : ''}`}
                  aria-pressed={s.speed === game.botSpeed}
                  onClick={() => game.setBotSpeed(s.speed)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          ) : (
            <span className="rs-value">{speedLabel}</span>
          )}
        </div>
      </div>
    </section>
  )
}

/**
 * The starting life, as presets and a box for any other total. The box keeps
 * its own draft while it's being typed in and sends on Enter or leaving it,
 * so "40" isn't sent as a "4" first; anything out of range or not a whole
 * number goes back to the room's value rather than to the server.
 */
function LifeControl({ life, onChange }: { readonly life: number; readonly onChange: (life: number) => void }) {
  const [draft, setDraft] = useState(String(life))
  // Follow the room's value when it changes from elsewhere (a preset, or a
  // stand-in host).
  useEffect(() => setDraft(String(life)), [life])

  const commit = () => {
    const value = Number(draft)
    if (Number.isInteger(value) && value >= LIFE_MIN && value <= LIFE_MAX) {
      if (value !== life) onChange(value)
    } else {
      setDraft(String(life))
    }
  }

  return (
    <div className="rs-options" role="group" aria-labelledby="rs-life">
      {LIFE_PRESETS.map((preset) => (
        <button
          key={preset}
          type="button"
          className={`seg-option${preset === life ? ' active' : ''}`}
          aria-pressed={preset === life}
          onClick={() => onChange(preset)}
        >
          {preset}
        </button>
      ))}
      <input
        type="number"
        className="rs-life-input mono"
        aria-label="Starting life"
        min={LIFE_MIN}
        max={LIFE_MAX}
        step={1}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setDraft(String(life))
        }}
      />
    </div>
  )
}
