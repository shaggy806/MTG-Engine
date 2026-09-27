import { useEffect, useState } from 'react'
import type { NetworkGame } from '../net/useNetworkGame.ts'
import { playerLabel } from '../format.ts'
import './capture-panel.css'

/**
 * Saving a bot's blunder as a training scenario — a developer's tool, shown
 * only when the server captures (`--capture`, never the public site): pick one
 * of the bots' recent decisions, then what it should have done there, or
 * "anything but what it did". The server writes the position and the answer
 * to the git-ignored `captures/` folder, where `bot:scenarios` and
 * `bot:fit-scenarios` pick it up (see `engine/src/bot/capture.ts`).
 */
export function CapturePanel({
  game,
  onClose,
}: {
  readonly game: NetworkGame
  readonly onClose: () => void
}) {
  const { capture, captureList, captureOptions, captureSave, clearCapture } = game
  const [picked, setPicked] = useState<number | null>(null)
  const [expect, setExpect] = useState<number | 'not-this'>('not-this')
  const [note, setNote] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    captureList()
  }, [captureList])

  const close = () => {
    clearCapture()
    onClose()
  }
  const pick = (id: number) => {
    setPicked(id)
    setExpect('not-this')
    captureOptions(id)
  }
  const options = capture.options !== null && capture.options.id === picked ? capture.options : null

  return (
    <div className="zone-viewer-overlay" onClick={close}>
      <div
        className="zone-viewer-box capture-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Capture a position"
      >
        <div className="zone-viewer-head">
          <h2>Capture a bot decision</h2>
          <button type="button" onClick={close}>
            Close
          </button>
        </div>
        <p className="capture-hint">
          Pick a decision a bot got wrong, then what it should have done. It's saved as a training
          scenario in <code>captures/</code> (local only, never committed).
        </p>
        <div className="capture-body">
          <ol className="capture-entries" aria-label="Recent bot decisions">
            {capture.entries === null ? (
              <li className="capture-empty">Loading…</li>
            ) : capture.entries.length === 0 ? (
              <li className="capture-empty">No bot decisions yet.</li>
            ) : (
              capture.entries.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    className={picked === entry.id ? 'selected' : undefined}
                    onClick={() => pick(entry.id)}
                  >
                    <span className="capture-when">
                      Turn {entry.turn} · {entry.step}
                      {entry.decision !== 'priority' ? ` · ${entry.decision}` : ''} ·{' '}
                      {playerLabel(entry.player, game.seats)}
                    </span>
                    <span className="capture-did">{entry.did}</span>
                  </button>
                </li>
              ))
            )}
          </ol>
          {picked === null ? null : options === null ? (
            <div className="capture-answer">Loading its options…</div>
          ) : (
            <div className="capture-answer">
              <div className="capture-did-line">
                It did: <strong>{options.did}</strong>
              </div>
              <div className="capture-options" role="radiogroup" aria-label="What it should have done">
                <label>
                  <input
                    type="radio"
                    name="capture-expect"
                    checked={expect === 'not-this'}
                    onChange={() => setExpect('not-this')}
                  />
                  Anything but that
                </label>
                {options.options.map((option) => (
                  <label key={option.index}>
                    <input
                      type="radio"
                      name="capture-expect"
                      checked={expect === option.index}
                      onChange={() => setExpect(option.index)}
                    />
                    {option.text}
                  </label>
                ))}
              </div>
              <input
                className="capture-name"
                type="text"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <textarea
                className="capture-note"
                placeholder="Why was it wrong?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="capture-save">
                <button type="button" onClick={() => captureSave(picked, expect, note, name)}>
                  Save scenario
                </button>
                {capture.saved !== null ? (
                  <span className="capture-saved">Saved {capture.saved}</span>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
