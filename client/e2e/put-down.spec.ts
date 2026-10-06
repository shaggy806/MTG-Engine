import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

// Cards flying to where they went (AnimationLayer):
// - a cast spell's spotlight holds, then flies into the place its entry takes
//   on the stack (`liftSpotlight` / `slotIntoStack`), the entry hidden until
//   it lands;
// - a resolving permanent spell is lifted off the stack and put down on its
//   tile (`liftOffStack` / `putDownOnTile`), the tile hidden until it lands;
// - a played land's spotlight flies onto its tile the same way;
// - each flight's time grows with how far it goes (`flightMs`), at a steady
//   speed measured in viewport diagonals.
// The rooms are PUTDN and PUTD4 in server/scripts/dev-scenarios.mjs; each test
// resets the one it uses.
//
// Set PUT_DOWN_SHOTS to a directory to also film each flight there (a
// screenshot every ~100 ms through it), for a reviewer to look at.

const CONTROL = `http://127.0.0.1:${process.env.E2E_CONTROL_PORT ?? 4099}`
const SHOTS = process.env.PUT_DOWN_SHOTS

// animationSchedule.ts's flight timing, at normal speed.
const FLIGHT_MIN_MS = 420
const FLIGHT_MAX_MS = 1100
const expectedFlightMs = (distance: number, diagonal: number): number =>
  Math.min(FLIGHT_MAX_MS, Math.max(FLIGHT_MIN_MS, 220 + (distance / diagonal) * 1100))

// Waiting for a bot's turn to come round is paced like play.
test.describe.configure({ timeout: 120_000 })

interface RoomState {
  readonly players: Record<string, { readonly hand: readonly string[] }>
}

async function control<T>(request: APIRequestContext, body: object): Promise<T> {
  const response = await request.post(CONTROL, { data: body })
  expect(response.ok()).toBe(true)
  return (await response.json()) as T
}

/** The id of `player`'s first `name` in hand, from the command port's
 * "obj-12 Hill Giant" lines. */
function idOf(state: RoomState, player: string, name: string): string {
  const line = state.players[player].hand.find((l) => l.split(' ').slice(1).join(' ') === name)
  if (line === undefined) throw new Error(`${player} has no ${name} in hand`)
  return line.split(' ')[0]
}

async function openRoom(page: Page, request: APIRequestContext, room: string): Promise<RoomState> {
  await control(request, { op: 'reset', room })
  const state = await control<RoomState>(request, { op: 'state', room })
  await page.goto(`/?room=${room}`)
  await page.getByRole('button', { name: 'Ready', exact: true }).click()
  await expect(page.getByText(`room ${room}`)).toBeVisible()
  return state
}

const paced = { timeout: 20_000 }

/** Casts or plays `card` (no targets) from hand. Nothing in these rooms'
 * hands can answer it, so "skip mana stops" (on by default) passes on
 * alice's behalf and a spell resolves by itself. */
async function play(page: Page, card: string): Promise<void> {
  await expect(page.getByRole('button', { name: 'Pass (space)' })).toBeEnabled(paced)
  await page.locator(`.hand-card[data-obj-id="${card}"] .card-tile`).dispatchEvent('click')
}

interface Box {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
}

/** A card in flight (a `.ghost-flight` box): which object, where to, for how
 * long, and how opaque and where the card's copy (`face`) and the copy of
 * what it lands as (`landing`) are. */
interface Ghost {
  readonly object: string | null
  readonly to: string | null
  readonly flightMs: number | null
  /** How far along its flight it is, eased (0 to 1), once it's flying. */
  readonly progress: number | null
  readonly face: number | null
  readonly faceBox: Box | null
  /** Where the card inside the face is actually drawn — off the face's
   * centre only if a style the copy kept moves it (the spotlight's
   * `--spot-x` translate did, a bug report). */
  readonly faceCard: Box | null
  readonly landing: number | null
  readonly landingBox: Box | null
}

/** One stack entry as drawn: shown counts its opacity and visibility. */
interface Entry {
  readonly id: string
  readonly shown: number
  readonly box: Box
}

/** One animation frame, as the page drew it. */
interface Sample {
  readonly t: number
  readonly ghosts: readonly Ghost[]
  /** The stack pile, top first. */
  readonly entries: readonly Entry[]
  /** The board tile of each object seen in flight, once it's there. */
  readonly tiles: Record<string, { readonly opacity: number; readonly box: Box }>
  /** Spotlights (`.played-card-fly`) showing, by object. */
  readonly spotlights: readonly string[]
}

/** Records every frame the page draws, from now until `stop()`. */
async function record(page: Page): Promise<{ stop: () => Promise<Sample[]> }> {
  await page.evaluate(() => {
    const w = window as unknown as { __samples: unknown[]; __recording: boolean }
    w.__samples = []
    w.__recording = true
    const seen = new Set<string>()
    const box = (el: Element) => {
      const r = el.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }
    }
    const shown = (el: HTMLElement) => {
      const cs = getComputedStyle(el)
      return cs.visibility === 'hidden' ? 0 : Number(cs.opacity)
    }
    const tick = () => {
      if (!w.__recording) return
      const ghosts = [...document.querySelectorAll<HTMLElement>('.ghost-flight')].map((g) => {
        const face = g.querySelector<HTMLElement>('[data-part="face"]')
        const landing = g.querySelector<HTMLElement>('[data-part="landing"]')
        if (g.dataset.object) seen.add(g.dataset.object)
        return {
          object: g.dataset.object ?? null,
          to: g.dataset.to ?? null,
          flightMs: g.dataset.flightMs ? Number(g.dataset.flightMs) : null,
          // The box's own flight: the animation of its that moves it.
          progress:
            g
              .getAnimations()
              .find((a) =>
                (a.effect as KeyframeEffect | null)?.getKeyframes().some((k) => String(k.transform).includes('translate(')),
              )
              ?.effect?.getComputedTiming().progress ?? null,
          face: face ? Number(getComputedStyle(face).opacity) : null,
          faceBox: face ? box(face) : null,
          faceCard: face?.querySelector('.card-tile') ? box(face.querySelector('.card-tile')!) : null,
          landing: landing ? Number(getComputedStyle(landing).opacity) : null,
          landingBox: landing ? box(landing) : null,
        }
      })
      const tiles: Record<string, unknown> = {}
      for (const id of seen) {
        const tile = document.querySelector<HTMLElement>(`.board [data-obj-id="${id}"]`)
        if (tile) tiles[id] = { opacity: Number(getComputedStyle(tile).opacity), box: box(tile) }
      }
      w.__samples.push({
        t: performance.now(),
        ghosts,
        entries: [...document.querySelectorAll<HTMLElement>('.stack-entry[data-stack-id]')].map((e) => ({
          id: e.dataset.stackId,
          shown: shown(e),
          box: box(e),
        })),
        tiles,
        spotlights: [...document.querySelectorAll<HTMLElement>('.played-card-fly[data-played-obj]')]
          .filter((s) => shown(s) > 0)
          .map((s) => s.dataset.playedObj),
      })
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  return {
    stop: async () =>
      page.evaluate(() => {
        const w = window as unknown as { __samples: Sample[]; __recording: boolean }
        w.__recording = false
        return w.__samples
      }),
  }
}

/** With PUT_DOWN_SHOTS set: screenshots every ~100 ms for `ms`. */
async function film(page: Page, name: string, ms: number): Promise<void> {
  if (!SHOTS) return
  mkdirSync(SHOTS, { recursive: true })
  const start = Date.now()
  for (let i = 1; Date.now() - start < ms; i += 1) {
    const at = Date.now()
    await page.screenshot({
      path: join(SHOTS, `${name}-${String(i).padStart(2, '0')}.jpg`),
      type: 'jpeg',
      quality: 85,
    })
    const left = 100 - (Date.now() - at)
    if (left > 0) await page.waitForTimeout(left)
  }
}

const near = (a: number, b: number, by = 3) => Math.abs(a - b) <= by
const sameBox = (a: Box, b: Box) => near(a.x, b.x) && near(a.y, b.y) && near(a.w, b.w) && near(a.h, b.h)

/**
 * Whether a flight ends exactly on `end`. The last frame drawn in flight can
 * be a frame or two short of its end (the page drops frames as it lands), so
 * the box it's in there is projected on to where it stops: whatever is left of
 * the flight (its eased `progress`) is the share of the way from where it set
 * off still to go. That's `end` to within 3 px, or it doesn't end there.
 */
function endsOn(first: Ghost, last: Ghost, end: Box): boolean {
  const p = last.progress ?? 1
  const p0 = first.progress ?? 0
  if (p < 0.85) return false
  const at = last.landingBox!
  const from = first.landingBox!
  const ahead = (now: number, start: number) => (p >= 1 ? now : now + ((now - start) * (1 - p)) / (p - p0))
  return sameBox(
    { x: ahead(at.x, from.x), y: ahead(at.y, from.y), w: ahead(at.w, from.w), h: ahead(at.h, from.h) },
    end,
  )
}
const ghostOf = (s: Sample, object: string, to: string) => s.ghosts.find((g) => g.object === object && g.to === to)

/** What a flight measured, for comparing flights' times. */
interface Flight {
  readonly object: string
  readonly to: string
  readonly distance: number
  readonly flightMs: number
  /** From the first frame drawn in flight to the last. */
  readonly seenMs: number
}

/** `object`'s flight to `to`, as the samples show it: the frames it was in
 * flight, and how long it was meant to take for how far it went. */
function flightOf(samples: readonly Sample[], object: string, to: string, end: Box): Flight {
  const flying = samples.filter((s) => ghostOf(s, object, to)?.faceBox)
  expect(flying.length, `frames with ${object} flying to its ${to}`).toBeGreaterThan(5)
  // The card is drawn where its flight is, every frame: centred on its face.
  for (const s of flying) {
    const g = ghostOf(s, object, to)!
    if (g.faceCard === null || g.faceBox === null) continue
    const off = Math.hypot(g.faceCard.x - g.faceBox.x, g.faceCard.y - g.faceBox.y)
    expect(off, `${object}'s card drawn off its flight (${JSON.stringify(g)})`).toBeLessThan(3)
  }
  const first = ghostOf(flying[0], object, to)!
  return {
    object,
    to,
    distance: Math.hypot(first.faceBox!.x - end.x, first.faceBox!.y - end.y),
    flightMs: first.flightMs!,
    seenMs: flying.at(-1)!.t - flying[0].t,
  }
}

/** A flight's time is what its distance calls for, and it really takes it. */
function checkPace(flight: Flight, diagonal: number): void {
  // Measured from the first frame drawn in flight, a frame or so after it set
  // off: a little nearer than it started.
  const expected = expectedFlightMs(flight.distance, diagonal)
  expect(flight.flightMs, JSON.stringify(flight)).toBeGreaterThanOrEqual(expected - 5)
  expect(flight.flightMs, JSON.stringify(flight)).toBeLessThanOrEqual(expected + 50)
  expect(Math.abs(flight.seenMs - flight.flightMs), JSON.stringify(flight)).toBeLessThan(120)
}

/**
 * A spell slotting into its place on the stack, frame by frame: its spotlight
 * card flies from the middle of the screen, a copy of its entry takes over and
 * lands exactly on the real entry — which isn't seen until that copy is on it
 * — and the copy is gone straight after. Entries put on the stack above it in
 * the same frame (a cast trigger) wait for it to land. Returns the flight.
 */
function checkStackLanding(samples: readonly Sample[], object: string, diagonal: number): Flight {
  const flying = samples.filter((s) => ghostOf(s, object, 'stack'))
  expect(flying.length, 'frames with the card flying into the stack').toBeGreaterThan(5)
  const firstAt = samples.indexOf(flying[0])
  const lastAt = samples.indexOf(flying.at(-1)!)
  const entryIn = (s: Sample) => s.entries.find((e) => e.id === object)
  const last = ghostOf(samples[lastAt], object, 'stack')!
  const entry = entryIn(samples[lastAt])!
  expect(entry, 'its entry on the stack as it lands').toBeTruthy()
  // It sets off from the spotlight, well away from the pile, as the card.
  const first = ghostOf(flying[0], object, 'stack')!
  expect(first.face).toBeGreaterThan(0.9)
  expect(Math.hypot(first.faceBox!.x - entry.box.x, first.faceBox!.y - entry.box.y)).toBeGreaterThan(100)
  // It ends exactly on the entry, depth styling and all, as the entry.
  // The copy has taken over by the last frame drawn in flight (the cross-fade
  // ends at 80% of it; a busy page can drop the frame or two after that).
  expect(last.landing, object).toBeGreaterThan(0.75)
  expect(last.face, object).toBeLessThan(0.25)
  expect(endsOn(first, last, entry.box), JSON.stringify([first, last, entry])).toBe(true)
  for (const s of samples.slice(0, lastAt + 1)) {
    const e = entryIn(s)
    const g = ghostOf(s, object, 'stack')
    // The spotlight and its flight are never both up.
    if (g) expect(s.spotlights).not.toContain(object)
    // The real entry isn't seen until the copy is on it.
    if (e && e.shown > 0) {
      expect(g?.landingBox && sameBox(g.landingBox, e.box), JSON.stringify([s.t, e, g])).toBe(true)
    }
    // Anything put on the stack above it waits for it to land.
    if (s.t < samples[lastAt].t && e) {
      const above = s.entries.slice(0, s.entries.indexOf(e))
      for (const a of above) expect(a.shown, `${a.id} above ${object} before it lands`).toBe(0)
    }
  }
  // Once the copy's gone the entry is there, the copy doesn't come back, and
  // what was above it shows.
  const after = samples.slice(lastAt + 1)
  const gone = after.findIndex((s) => !ghostOf(s, object, 'stack'))
  expect(gone).toBe(0)
  expect(after[0].t - samples[lastAt].t).toBeLessThan(80)
  const until = after.findIndex((s) => s.ghosts.some((g) => g.object === object && g.to !== 'stack'))
  for (const s of until === -1 ? after : after.slice(0, until)) {
    expect(ghostOf(s, object, 'stack')).toBeUndefined()
    const e = entryIn(s)
    if (e) expect(e.shown).toBeGreaterThan(0.5)
  }
  const settled = after.at(until === -1 ? -1 : Math.max(0, until - 1))!
  for (const e of settled.entries) expect(e.shown, `${e.id} once ${object} has landed`).toBeGreaterThan(0.5)
  expect(firstAt).toBeLessThan(lastAt)
  const flight = flightOf(samples, object, 'stack', entry.box)
  checkPace(flight, diagonal)
  return flight
}

/**
 * What a landing on a tile has to look like, frame by frame: the card (lifted
 * off the stack, or a land's spotlight) flies off, then a copy of the tile
 * takes over and lands on the real tile — which isn't seen until that copy is
 * on it — and the copy is gone straight after. Returns the flight.
 */
function checkTileLanding(samples: readonly Sample[], object: string, diagonal: number): Flight {
  const flying = samples.filter((s) => ghostOf(s, object, 'tile')?.landing != null)
  expect(flying.length, 'frames with the card flying to its tile').toBeGreaterThan(5)
  const lastAt = samples.indexOf(flying.at(-1)!)
  const tile = samples.slice(lastAt).find((s) => s.tiles[object])?.tiles[object]
  expect(tile, 'its tile').toBeTruthy()
  // It starts well away from the tile, as the card.
  const first = ghostOf(flying[0], object, 'tile')!
  expect(Math.hypot(first.landingBox!.x - tile!.box.x, first.landingBox!.y - tile!.box.y)).toBeGreaterThan(100)
  expect(first.face).toBeGreaterThan(0.9)
  // It ends exactly on the tile, as the tile.
  const last = ghostOf(samples[lastAt], object, 'tile')!
  // (As for the stack: the cross-fade is done by 80% of the flight.)
  expect(last.landing, object).toBeGreaterThan(0.75)
  expect(last.face, object).toBeLessThan(0.25)
  expect(endsOn(first, last, tile!.box), JSON.stringify([first, last, tile])).toBe(true)
  for (const s of samples) {
    // (Its flight into the stack, if any, is `checkStackLanding`'s.)
    const g = s.ghosts.find((x) => x.object === object && x.to !== 'stack')
    // The stack entry and its lifted card, or the spotlight and its flight,
    // are never both up.
    if (g) expect(s.entries.find((e) => e.id === object)?.shown ?? 0).toBe(0)
    if (g?.to === 'tile') expect(s.spotlights).not.toContain(object)
    // The real tile is never seen while the copy is anywhere but on it.
    const t = s.tiles[object]
    if (t && t.opacity > 0 && g?.to === 'tile') {
      expect(near(g.landingBox!.x, t.box.x) && near(g.landingBox!.y, t.box.y), JSON.stringify(s)).toBe(true)
    }
  }
  // Once the copy's gone the tile is there, and the copy doesn't come back.
  const after = samples.slice(lastAt + 1)
  expect(after.length).toBeGreaterThan(0)
  expect(after[0].ghosts.some((g) => g.object === object)).toBe(false)
  expect(after[0].t - samples[lastAt].t).toBeLessThan(80)
  for (const s of after) {
    expect(s.ghosts.some((g) => g.object === object)).toBe(false)
    expect(s.tiles[object]?.opacity).toBe(1)
  }
  const flight = flightOf(samples, object, 'tile', tile!.box)
  checkPace(flight, diagonal)
  return flight
}

/** Waits for `object`'s flights to be done (`tile`: it's down on the board
 * too) and nothing is in the air. */
async function settle(page: Page, name: string, object: string, onto: 'stack' | 'tile', wait = paced): Promise<void> {
  // Every frame: a short flight is over before `expect`'s backing-off polls
  // come round again.
  await page.waitForFunction(
    (object) => document.querySelector(`.ghost-flight[data-object="${object}"]`) !== null,
    object,
    { polling: 'raf', ...wait },
  )
  await film(page, name, 1600)
  // A spell's landing on its tile comes after its stack beat: film that too.
  if (SHOTS && onto === 'tile') {
    const landing = await page
      .waitForFunction(
        (object) => document.querySelector(`.ghost-flight[data-object="${object}"][data-to="tile"]`) !== null,
        object,
        { polling: 'raf', ...wait },
      )
      .then(() => true)
      .catch(() => false)
    if (landing) await film(page, `${name}-tile`, 1000)
  }
  if (onto === 'tile') await expect(page.locator(`.board [data-obj-id="${object}"]`)).toBeVisible(wait)
  else await expect(page.locator(`.stack-entry[data-stack-id="${object}"]`)).toBeVisible(wait)
  await expect(page.locator('.ghost-flight')).toHaveCount(0, wait)
  await page.waitForTimeout(400)
}

const SIZES = [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
] as const

for (const size of SIZES) {
  const diagonal = Math.hypot(size.width, size.height)
  test.describe(`at ${size.width}x${size.height}`, () => {
    test.use({ viewport: size })

    test('2p: a land onto its tile; spells into the stack, then onto their tiles', async ({
      page,
      request,
    }) => {
      const state = await openRoom(page, request, 'PUTDN')
      const tower = idOf(state, 'alice', 'Reliquary Tower')
      const ring = idOf(state, 'alice', 'Sol Ring')
      const bears = idOf(state, 'alice', 'Grizzly Bears')
      const elf = idOf(state, 'alice', 'Bloodbraid Elf')

      // A land: its spotlight flies onto its tile (tapped: Thalia).
      let recording = await record(page)
      await play(page, tower)
      await settle(page, `2p-${size.width}-land`, tower, 'tile')
      checkTileLanding(await recording.stop(), tower, diagonal)

      // Sol Ring into the stack, then put down on its tile.
      recording = await record(page)
      await play(page, ring)
      await settle(page, `2p-${size.width}-sol-ring`, ring, 'tile')
      let samples = await recording.stop()
      checkStackLanding(samples, ring, diagonal)
      checkTileLanding(samples, ring, diagonal)

      // A creature entering tapped: the copy lands on its layout box.
      recording = await record(page)
      await play(page, bears)
      await settle(page, `2p-${size.width}-bears-tapped`, bears, 'tile')
      samples = await recording.stop()
      checkStackLanding(samples, bears, diagonal)
      checkTileLanding(samples, bears, diagonal)
      await expect(page.locator(`.board [data-obj-id="${bears}"] .mini-tile.tapped`)).toHaveCount(1)

      // Bloodbraid Elf: its cascade trigger goes on the stack above it, and
      // waits for the Elf to land under it.
      recording = await record(page)
      await play(page, elf)
      await settle(page, `2p-${size.width}-bloodbraid`, elf, 'stack')
      samples = await recording.stop()
      checkStackLanding(samples, elf, diagonal)
      const landed = samples.findLast((s) => ghostOf(s, elf, 'stack'))!
      expect(landed.entries.length, 'the cascade trigger above the Elf').toBeGreaterThanOrEqual(2)
      expect(landed.entries.at(-1)!.id).toBe(elf)
    })

    test("4p: an opponent's spell into the stack and onto a far board, slower the further it goes", async ({
      page,
      request,
    }) => {
      const state = await openRoom(page, request, 'PUTD4')
      const tower = idOf(state, 'alice', 'Reliquary Tower')
      const ring = idOf(state, 'alice', 'Sol Ring')
      const dreadmaw = idOf(state, 'carol', 'Colossal Dreadmaw')
      const flights: Flight[] = []

      let recording = await record(page)
      await play(page, tower)
      await settle(page, `4p-${size.width}-land`, tower, 'tile')
      flights.push(checkTileLanding(await recording.stop(), tower, diagonal))

      recording = await record(page)
      await play(page, ring)
      await settle(page, `4p-${size.width}-sol-ring`, ring, 'tile')
      let samples = await recording.stop()
      flights.push(checkStackLanding(samples, ring, diagonal))
      flights.push(checkTileLanding(samples, ring, diagonal))

      // A commander, cast from the command zone.
      recording = await record(page)
      await expect(page.getByRole('button', { name: 'Pass (space)' })).toBeEnabled(paced)
      await page.locator('.commander-tile.clickable').first().click()
      // Its id, off its spotlight.
      const krenko = await (
        await page.waitForFunction(
          () => document.querySelector<HTMLElement>('.played-card-fly[data-played-obj]')?.dataset.playedObj,
          undefined,
          { polling: 'raf', ...paced },
        )
      ).jsonValue()
      expect(krenko).toBeTruthy()
      await settle(page, `4p-${size.width}-krenko`, krenko!, 'tile')
      samples = await recording.stop()
      flights.push(checkStackLanding(samples, krenko!, diagonal))
      flights.push(checkTileLanding(samples, krenko!, diagonal))

      // Pass through until carol casts it, and let it resolve.
      recording = await record(page)
      await page.getByRole('button', { name: 'Auto-pass' }).click()
      await settle(page, `4p-${size.width}-dreadmaw`, dreadmaw, 'tile', { timeout: 60_000 })
      samples = await recording.stop()
      flights.push(checkStackLanding(samples, dreadmaw, diagonal))
      flights.push(checkTileLanding(samples, dreadmaw, diagonal))

      // The further a card goes, the longer it takes: every two flights whose
      // distances differ by a tenth of the screen's diagonal or more.
      let compared = 0
      for (const a of flights) {
        for (const b of flights) {
          if (b.distance - a.distance < diagonal * 0.1) continue
          if (a.flightMs === FLIGHT_MAX_MS) continue
          compared += 1
          expect(b.flightMs, JSON.stringify([a, b])).toBeGreaterThan(a.flightMs)
        }
      }
      expect(compared, JSON.stringify(flights)).toBeGreaterThan(0)
      console.log(
        `${size.width}x${size.height}`,
        flights.map((f) => `${f.object}->${f.to} ${Math.round(f.distance)}px ${f.flightMs}ms (seen ${Math.round(f.seenMs)})`).join('; '),
      )
    })
  })
}
