import { Fragment, useEffect, useState } from 'react'
import type { ClipboardEvent } from 'react'
import type { PlayerId } from 'engine/client'
import type { NetworkGame } from '../net/useNetworkGame.ts'
import { playerLabel } from '../format.ts'
import { useEscape } from './useEscape.ts'
import './capture-panel.css'

/**
 * Saving a bot's blunder as a training scenario — a developer's tool, shown
 * only when the server captures (`--capture`, never the public site): pick one
 * of the bots' recent decisions, then what it should have done there, or
 * "anything but what it did". The server writes the position and the answer
 * to the git-ignored `captures/` folder, where `bot:scenarios` and
 * `bot:fit-scenarios` pick it up (see `engine/src/bot/capture.ts`).
 *
 * Its other tab files a bug report instead: the game as it stands now, its
 * recent events and what went wrong, written to `captures/bugs/`
 * (`server/src/capture.ts`) — for a rules or UI bug rather than a bot's choice.
 * A photo can go with it, picked from a file or pasted into the description.
 */

/** The image types the server takes for a bug report's photo, and the most
 * it takes (`BUG_REPORT_IMAGE_MAX` in `server/src/capture.ts`). */
const PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
const PHOTO_MAX = 10 * 1024 * 1024

/** A photo attached to a bug report: its name, to show, and its data URL. */
interface Photo {
  readonly name: string
  readonly dataUrl: string
}
export function CapturePanel({
  game,
  onClose,
}: {
  readonly game: NetworkGame
  readonly onClose: () => void
}) {
  const { capture, captureList, captureOptions, captureSave, captureReport, clearCapture } = game
  const [mode, setMode] = useState<'decision' | 'bug'>('decision')
  // Whose decisions to list: a room keeps a couple of hundred, every bot's.
  const [seat, setSeat] = useState<PlayerId | null>(null)
  // Most kept decisions are a pass where something else was possible; the
  // plays are easier to find without them.
  const [hidePasses, setHidePasses] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const [expect, setExpect] = useState<number | 'not-this'>('not-this')
  const [note, setNote] = useState('')
  const [name, setName] = useState('')
  const [bugTitle, setBugTitle] = useState('')
  const [bugText, setBugText] = useState('')
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const attach = (file: File | null | undefined) => {
    if (file === null || file === undefined) return
    if (!PHOTO_TYPES.includes(file.type)) {
      setPhotoError('A photo must be a PNG, JPEG, GIF or WebP image.')
      return
    }
    if (file.size > PHOTO_MAX) {
      setPhotoError('That photo is over 10 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      setPhoto({ name: file.name || 'pasted image', dataUrl: reader.result })
      setPhotoError(null)
    }
    reader.readAsDataURL(file)
  }
  // A screenshot pasted into the description attaches as the photo; pasted
  // text is left to the textarea.
  const pastePhoto = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const item = [...e.clipboardData.items].find((i) => i.kind === 'file' && i.type.startsWith('image/'))
    if (item === undefined) return
    e.preventDefault()
    attach(item.getAsFile())
  }

  useEffect(() => {
    captureList()
  }, [captureList])

  const close = () => {
    clearCapture()
    onClose()
  }
  useEscape(close)
  const entries = capture.entries ?? []
  // The bots that have decisions kept, in seating order.
  const seating = game.view?.turnOrder ?? []
  const bots = [...new Set(entries.map((e) => e.player))].sort(
    (a, b) => seating.indexOf(a) - seating.indexOf(b),
  )
  const shown = entries.filter(
    (e) => (seat === null || e.player === seat) && !(hidePasses && e.did === 'Pass'),
  )

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
          <h2>{mode === 'decision' ? 'Capture a bot decision' : 'Report a bug'}</h2>
          <div className="capture-modes" role="tablist" aria-label="What to capture">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'decision'}
              className={mode === 'decision' ? 'selected' : undefined}
              onClick={() => setMode('decision')}
            >
              Bot decision
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'bug'}
              className={mode === 'bug' ? 'selected' : undefined}
              onClick={() => setMode('bug')}
            >
              Bug report
            </button>
          </div>
          <button type="button" onClick={close}>
            Close
          </button>
        </div>
        {mode === 'bug' ? (
          <>
            <p className="capture-hint">
              Describe what went wrong. The whole game as it stands now and its recent events are
              saved with it to <code>captures/bugs/</code> (local only, never committed).
            </p>
            <div className="capture-answer">
              <input
                className="capture-name"
                type="text"
                placeholder="Title (optional)"
                value={bugTitle}
                onChange={(e) => setBugTitle(e.target.value)}
              />
              <textarea
                className="capture-note capture-bug-text"
                placeholder="What happened, and what should have happened? (A screenshot pasted here attaches as the photo.)"
                value={bugText}
                onChange={(e) => setBugText(e.target.value)}
                onPaste={pastePhoto}
              />
              <div className="capture-photo">
                <label className="capture-photo-pick">
                  {photo === null ? 'Attach a photo' : 'Replace photo'}
                  <input
                    type="file"
                    accept={PHOTO_TYPES.join(',')}
                    onChange={(e) => {
                      attach(e.target.files?.[0])
                      e.target.value = ''
                    }}
                  />
                </label>
                {photo !== null ? (
                  <>
                    <img className="capture-photo-thumb" src={photo.dataUrl} alt={photo.name} />
                    <span className="capture-photo-name">{photo.name}</span>
                    <button type="button" onClick={() => setPhoto(null)}>
                      Remove
                    </button>
                  </>
                ) : null}
                {photoError !== null ? <span className="capture-photo-error">{photoError}</span> : null}
              </div>
              <div className="capture-save">
                <button
                  type="button"
                  disabled={bugText.trim() === ''}
                  onClick={() => captureReport(bugTitle, bugText, photo?.dataUrl)}
                >
                  Save bug report
                </button>
                {capture.saved !== null ? (
                  <span className="capture-saved">Saved {capture.saved}</span>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="capture-hint">
              Pick a decision a bot got wrong, then what it should have done. It's saved as a training
              scenario in <code>captures/</code> (local only, never committed).
            </p>
            <div className="capture-body">
              <div className="capture-list">
                <div className="capture-seats">
                  {bots.length > 1 ? (
                    <div role="group" aria-label="Whose decisions">
                      <button
                        type="button"
                        className={seat === null ? 'selected' : undefined}
                        onClick={() => setSeat(null)}
                      >
                        All
                      </button>
                      {bots.map((p) => (
                        <button
                          key={p}
                          type="button"
                          className={seat === p ? 'selected' : undefined}
                          onClick={() => setSeat(p)}
                        >
                          {playerLabel(p, game.seats)}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <label className="capture-hide-passes">
                    <input
                      type="checkbox"
                      checked={hidePasses}
                      onChange={(e) => setHidePasses(e.target.checked)}
                    />
                    Hide passes
                  </label>
                </div>
                <ol className="capture-entries" aria-label="Recent bot decisions">
                  {capture.entries === null ? (
                    <li className="capture-empty">Loading…</li>
                  ) : entries.length === 0 ? (
                    <li className="capture-empty">No bot decisions yet.</li>
                  ) : shown.length === 0 ? (
                    <li className="capture-empty">None of these.</li>
                  ) : (
                    shown.map((entry, i) => (
                      <Fragment key={entry.id}>
                        {/* Newest first, under a heading for each turn. */}
                        {i === 0 || shown[i - 1].turn !== entry.turn ? (
                          <li className="capture-turn">
                            {entry.turn === 0 ? 'Opening hands' : `Turn ${entry.turn}`}
                          </li>
                        ) : null}
                        <li>
                          <button
                            type="button"
                            className={picked === entry.id ? 'selected' : undefined}
                            onClick={() => pick(entry.id)}
                          >
                            <span className="capture-when">
                              {entry.step}
                              {entry.decision !== 'priority' ? ` · ${entry.decision}` : ''} ·{' '}
                              {playerLabel(entry.player, game.seats)}
                            </span>
                            <span className="capture-did">{entry.did}</span>
                          </button>
                        </li>
                      </Fragment>
                    ))
                  )}
                </ol>
              </div>
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
          </>
        )}
      </div>
    </div>
  )
}
