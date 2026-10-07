import { useLayoutEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import type { NetworkGame } from '../net/useNetworkGame.ts'
import { PINNED_ART } from 'engine/client'
import { cssUrl, resolveArtUrl } from '../ui/art.ts'
import { BlitzPanel } from './BlitzPanel.tsx'
import './landing.css'

/** Room codes are five characters from a deliberately unambiguous alphabet —
 * no O/0 or I/1, so nothing is lost reading one out loud. Mirrors
 * `server/src/room-manager.ts`; a mistyped `O` simply isn't a code character
 * and gets dropped rather than quietly making a wrong code. */
const ROOM_CODE_LENGTH = 5
const ROOM_CODE_CHARS = /[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g

/**
 * One card's art, blurred and dimmed behind the title. Purely decorative —
 * `.landing-hero` paints its own gradient underneath, so a failed load costs
 * nothing.
 *
 * Deliberately *not* required to be in the pool: `resolveArtUrl` falls back
 * to Scryfall's by-name lookup when the pool pins no art for it
 * (`PINNED_ART`), which is why this can name any real card rather than only
 * an implemented one.
 */
const HERO_CARD = 'The Ur-Dragon'

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

/** The window the page is laid out for at its natural size; a bigger one
 * scales it up, by {@link ZOOM_GAIN} of the extra, up to {@link MAX_ZOOM}. */
const BASE_WIDTH = 1440
const BASE_HEIGHT = 860
/** A fifth of the window's growth past the base: in full step a 1440p
 * monitor scaled the page 1.67x, and at half 1.34x, both too large (the
 * user, 2026-10-07: "closer to what it was"); a fifth is ~1.13x there and
 * ~1.05x at 1080p. */
const ZOOM_GAIN = 0.2
const MAX_ZOOM = 1.15

/**
 * How much to scale the page for this window: 1 up to {@link BASE_WIDTH} x
 * {@link BASE_HEIGHT}, then growing with whichever of the two runs out
 * first, so the page grows on a big monitor without outgrowing a short one.
 * Every size on the page is in px, sized for a laptop, so on a 1440p screen
 * it was a small island of small text. A number, not CSS: no CSS length
 * divides into the unitless factor `zoom` takes.
 */
function landingZoom(width: number, height: number): number {
  const growth = Math.max(0, Math.min(width / BASE_WIDTH, height / BASE_HEIGHT) - 1)
  return Math.min(MAX_ZOOM, 1 + growth * ZOOM_GAIN)
}

function useLandingZoom(): number {
  const [zoom, setZoom] = useState(() => landingZoom(window.innerWidth, window.innerHeight))
  // A layout effect, so a resize never paints a frame at the old size.
  useLayoutEffect(() => {
    const update = () => setZoom(landingZoom(window.innerWidth, window.innerHeight))
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return zoom
}

/**
 * The app's front door: the screen anyone who isn't already in a room lands
 * on. Two jobs, deliberately given two separate panels with an "or" between
 * them — start a game, or join one someone else started — plus a footer row
 * for the two pages that need no room at all, and at the very bottom the
 * blitz button (`BlitzPanel`).
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
  const zoom = useLandingZoom()

  const join = (code: string) => {
    if (code.length === ROOM_CODE_LENGTH) game.joinRoom(code)
  }

  // Not gated on the card being in the pool — see HERO_CARD.
  const heroArt = resolveArtUrl(PINNED_ART[HERO_CARD], HERO_CARD, 'art_crop')

  return (
    <div className="landing" style={{ '--landing-zoom': zoom } as CSSProperties}>
      {/* A zoomed-in crop of the top-100-commanders tile, drifting diagonally
          behind everything. Two elements, not one: the outer holds the angle
          and clips, the inner does the moving — see landing.css for why the
          loop can't just translate the outer. */}
      <div className="landing-backdrop" aria-hidden="true">
        <div className="landing-backdrop-layer" />
      </div>

      <header className="landing-hero">
        <div className="landing-hero-art" style={{ backgroundImage: cssUrl(heroArt) }} aria-hidden="true" />
        <div className="landing-hero-text">
          <h1 className="landing-title">MTG Deck Blitz</h1>
          <p className="landing-tagline">
            Goldfishing tests a deck against nobody. Blitzing tests it against
            three bots: copy a Commander decklist, hit Blitz, and you're playing.
            Or start a table with friends.
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
          <button type="button" className="landing-cta" onClick={() => game.createRoom()}>
            Create a game
          </button>
        </section>

        <div className="landing-or" aria-hidden="true">
          <span>or</span>
        </div>

        <section className="landing-card">
          <h2>Join a game</h2>
          <form
            className="landing-join-form"
            onSubmit={(e) => {
              e.preventDefault()
              join(joinCode)
            }}
          >
            <label className="landing-field-label" htmlFor="landing-room-code">
              Room code
            </label>
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
        </a>
        <a className="landing-nav-card" href="/library">
          <span className="landing-nav-name">Card library</span>
        </a>
        {/* A dev build only (and a server started with --builder): it puts
            any card anywhere, which the public site mustn't offer. */}
        {import.meta.env.DEV ? (
          <button type="button" className="landing-nav-card landing-nav-dev" onClick={() => game.createBuilder()}>
            <span className="landing-nav-name">Scenario builder</span>
          </button>
        ) : null}
      </nav>

      <BlitzPanel game={game} />
    </div>
  )
}
