import { useState } from 'react'
import type { NetworkGame } from '../net/useNetworkGame.ts'
import { findCardDef } from '../ui/defToVisible.ts'
import { cssUrl, resolveArtUrl } from '../ui/art.ts'
import './landing.css'

/** Room codes are five characters from a deliberately unambiguous alphabet —
 * no O/0 or I/1, so nothing is lost reading one out loud. Mirrors
 * `server/src/room-manager.ts`; a mistyped `O` simply isn't a code character
 * and gets dropped rather than quietly making a wrong code. */
const ROOM_CODE_LENGTH = 5
const ROOM_CODE_CHARS = /[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g

/** One card's art, blurred and dimmed behind the title — this is the only
 * place a first-time visitor learns the app is about Magic before they've
 * clicked anything. Purely decorative: `.landing-hero` paints a gradient
 * underneath, so a failed image load costs nothing. */
const HERO_CARD = "Atraxa, Praetors' Voice"

/**
 * What a friend actually pastes: a bare code, or the whole room URL out of
 * their address bar. Anything that parses as a URL contributes its `room`
 * parameter; everything else is treated as the code itself. Either way the
 * result is upper-cased and stripped to real code characters, so stray
 * spaces, a trailing full stop, or a lower-case retyping all still work.
 */
function parseRoomCode(raw: string): string {
  const text = raw.trim()
  try {
    const fromUrl = new URL(text).searchParams.get('room')
    if (fromUrl !== null) return normalizeCode(fromUrl)
  } catch {
    // Not a URL — fall through and read it as a bare code.
  }
  return normalizeCode(text)
}

function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(ROOM_CODE_CHARS, '').slice(0, ROOM_CODE_LENGTH)
}

/**
 * The app's front door: the screen anyone who isn't already in a room lands
 * on. Two jobs, deliberately given two separate panels with an "or" between
 * them — start a game, or join one someone else started — plus a footer row
 * for the two pages that need no room at all.
 *
 * It does *not* ask how many players. That question used to sit above the
 * "Create a game" button as three count buttons, where (a) nothing said the
 * counts belonged to the button under them, so all four read as one menu of
 * options, and (b) the selected count was the only accent-coloured thing on
 * the page, making a setting look like the primary action. The table is
 * sized on the seat board instead (`SeatBoard`'s add/remove seat controls),
 * where seats are visible and changing your mind costs one click.
 */
export function LandingScreen({
  game,
  notFound = false,
}: {
  readonly game: NetworkGame
  readonly notFound?: boolean
}) {
  const [joinCode, setJoinCode] = useState('')

  const join = (code: string) => {
    if (code.length === ROOM_CODE_LENGTH) game.joinRoom(code)
  }

  const heroDef = findCardDef(HERO_CARD)
  const heroArt = heroDef ? resolveArtUrl(heroDef.art, heroDef.name, 'art_crop') : null

  return (
    <div className="landing">
      <header className="landing-hero">
        {heroArt ? (
          <div className="landing-hero-art" style={{ backgroundImage: cssUrl(heroArt) }} aria-hidden="true" />
        ) : null}
        <div className="landing-hero-text">
          <h1 className="landing-title">MTG Engine</h1>
          <p className="landing-tagline">
            A Magic: The Gathering rules engine that runs in your browser. Play
            Commander against friends — or fill the empty seats with bots and
            play right now.
          </p>
        </div>
      </header>

      {notFound ? (
        <p className="landing-notice" role="status">
          That room wasn't found — it may have closed. Start a new one, or check
          the code and try again.
        </p>
      ) : null}
      {game.error ? (
        <p className="landing-notice bad" role="alert" onClick={game.clearError}>
          ⚠ {game.error}
        </p>
      ) : null}

      <div className="landing-actions">
        <section className="landing-card">
          <h2>Start a game</h2>
          <p className="landing-card-body">
            You'll get a five-letter room code to share. Pick decks and choose
            how many are playing on the next screen.
          </p>
          <button type="button" className="landing-cta" onClick={() => game.createRoom()}>
            Create a game
          </button>
        </section>

        <div className="landing-or" aria-hidden="true">
          <span>or</span>
        </div>

        <section className="landing-card">
          <h2>Join a game</h2>
          <p className="landing-card-body">
            Enter the code a friend gave you. Pasting the whole link works too.
          </p>
          <form
            className="landing-join-form"
            onSubmit={(e) => {
              e.preventDefault()
              join(joinCode)
            }}
          >
            {/* Label and hint share a line so the input stays the last thing
                in this panel, level with the other panel's button. */}
            <div className="landing-field-head">
              <label className="landing-field-label" htmlFor="landing-room-code">
                Room code
              </label>
              <span className="landing-field-hint" id="landing-code-hint">
                Five letters and numbers
              </span>
            </div>
            <div className="landing-join-row">
              <input
                id="landing-room-code"
                className="landing-code-input"
                value={joinCode}
                // A full code is unambiguous — there is nothing else to type
                // and no second field to tab to — so the fifth character
                // joins rather than waiting for a button nobody needs to
                // press. Pasting a link fills all five at once and joins the
                // same way.
                onChange={(e) => {
                  const code = parseRoomCode(e.target.value)
                  setJoinCode(code)
                  join(code)
                }}
                placeholder="ABC23"
                aria-describedby="landing-code-hint"
                // Deliberately no `maxLength`: the browser applies it to
                // pasted text too, so a pasted room *link* would arrive here
                // already chopped to its first five characters ("HTTP") and
                // `parseRoomCode` would never see the URL it needs to read
                // the code out of. The length cap lives in `normalizeCode`,
                // which runs after the paste is whole.
                autoComplete="off"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                inputMode="text"
              />
              <button type="submit" className="landing-join-btn" disabled={joinCode.length < ROOM_CODE_LENGTH}>
                Join
              </button>
            </div>
          </form>
        </section>
      </div>

      <nav className="landing-nav" aria-label="Other pages">
        <a className="landing-nav-card" href="/deck-builder">
          <span className="landing-nav-name">Deck builder</span>
          <span className="landing-nav-desc">
            Build a Commander deck with live format checking, or import a
            decklist you already have.
          </span>
        </a>
        <a className="landing-nav-card" href="/library">
          <span className="landing-nav-name">Card library</span>
          <span className="landing-nav-desc">
            Browse every card the engine implements, with its real rules text.
          </span>
        </a>
      </nav>
    </div>
  )
}
