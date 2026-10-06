import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

// A resolving permanent spell is put down on its tile: the card lifted off
// the stack flies onto the permanent's tile, shrinking from the full card into
// the mini tile, with the real tile held hidden until it lands
// (AnimationLayer's `liftOffStack` / `putDownOnTile`). The rooms are PUTDN and
// PUTD4 in server/scripts/dev-scenarios.mjs; each test resets the one it uses.
//
// Set PUT_DOWN_SHOTS to a directory to also film each landing there (a
// screenshot every ~100 ms through it), for a reviewer to look at.

const CONTROL = `http://127.0.0.1:${process.env.E2E_CONTROL_PORT ?? 4099}`
const SHOTS = process.env.PUT_DOWN_SHOTS

// Waiting for a bot's turn to come round is paced like play.
test.describe.configure({ timeout: 90_000 })

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

/** Casts `card` (no targets) from hand. Nothing in these rooms' hands can
 * answer it, so "skip mana stops" (on by default) passes on alice's behalf and
 * it resolves by itself. */
async function cast(page: Page, card: string): Promise<void> {
  await expect(page.getByRole('button', { name: 'Pass (space)' })).toBeEnabled(paced)
  await page.locator(`.hand-card[data-obj-id="${card}"] .card-tile`).dispatchEvent('click')
}

/** One animation frame, as the page drew it. */
interface Sample {
  readonly t: number
  /** The card or tile in flight, if any: its on-screen box, and how opaque
   * the card's copy and the tile's copy are. */
  readonly ghost: {
    readonly face: number
    readonly landing: number | null
    readonly box: { x: number; y: number; w: number; h: number } | null
  } | null
  /** The real tile on the board, once it's there. */
  readonly tile: { readonly opacity: number; readonly x: number; readonly y: number; readonly w: number; readonly h: number } | null
  readonly entryShown: boolean
}

/** Records every frame the page draws, from now until `stop()`. */
async function record(page: Page, object: string): Promise<{ stop: () => Promise<Sample[]> }> {
  await page.evaluate((object) => {
    const w = window as unknown as { __samples: unknown[]; __recording: boolean }
    w.__samples = []
    w.__recording = true
    const rect = (el: Element) => {
      const r = el.getBoundingClientRect()
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }
    }
    const tick = () => {
      if (!w.__recording) return
      const box = document.querySelector('.ghost-flight')
      const layers = box ? [...box.children] as HTMLElement[] : []
      const [face, landing] = layers
      const tile = document.querySelector<HTMLElement>(`.board [data-obj-id="${object}"]`)
      const entry = document.querySelector<HTMLElement>(`.stack-entry[data-stack-id="${object}"]`)
      w.__samples.push({
        t: performance.now(),
        ghost: box
          ? {
              face: face ? Number(getComputedStyle(face).opacity) : 0,
              landing: landing ? Number(getComputedStyle(landing).opacity) : null,
              box: landing ? rect(landing) : face ? rect(face) : null,
            }
          : null,
        tile: tile ? { opacity: Number(getComputedStyle(tile).opacity), ...rect(tile) } : null,
        entryShown: entry !== null && getComputedStyle(entry).visibility !== 'hidden',
      })
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, object)
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

const near = (a: number, b: number) => Math.abs(a - b) <= 3

/**
 * What a landing has to look like, frame by frame: the card is lifted off the
 * stack (the entry hidden under it), then a copy of the tile takes over and
 * flies onto the real tile — which isn't seen until that copy is on it — and
 * the copy is gone straight after.
 */
function checkLanding(samples: readonly Sample[]): void {
  const flying = samples.filter((s) => s.ghost?.landing !== null && s.ghost !== null)
  expect(flying.length, 'frames with the card flying to its tile').toBeGreaterThan(5)
  // It starts at the stack, well away from the tile.
  const first = flying[0]
  const tile = samples.findLast((s) => s.tile !== null)?.tile
  expect(tile).toBeTruthy()
  expect(Math.hypot(first.ghost!.box!.x - tile!.x, first.ghost!.box!.y - tile!.y)).toBeGreaterThan(100)
  // The card shows at first, the tile at the end.
  expect(first.ghost!.face).toBeGreaterThan(0.9)
  const last = flying.at(-1)!
  expect(last.ghost!.landing).toBeGreaterThan(0.9)
  expect(last.ghost!.face).toBeLessThan(0.1)
  // It ends exactly on the tile.
  expect(near(last.ghost!.box!.x, tile!.x) && near(last.ghost!.box!.y, tile!.y), JSON.stringify([last, tile])).toBe(true)
  expect(near(last.ghost!.box!.w, tile!.w) && near(last.ghost!.box!.h, tile!.h), JSON.stringify([last, tile])).toBe(true)
  for (const s of samples) {
    // The stack entry and its lifted card are never both up.
    if (s.ghost !== null) expect(s.entryShown).toBe(false)
    // The real tile is never seen while the copy is anywhere but on it.
    if (s.tile !== null && s.tile.opacity > 0 && s.ghost?.box) {
      expect(near(s.ghost.box.x, s.tile.x) && near(s.ghost.box.y, s.tile.y), JSON.stringify(s)).toBe(true)
    }
  }
  // Once the copy's gone the tile is there, and the copy doesn't come back.
  const gone = samples.findIndex((s, i) => i > samples.indexOf(last) && s.ghost === null)
  expect(gone).toBeGreaterThan(0)
  expect(samples[gone].t - last.t).toBeLessThan(80)
  for (const s of samples.slice(gone)) {
    expect(s.ghost).toBeNull()
    expect(s.tile?.opacity).toBe(1)
  }
}

/** Does `act` (a cast, a pass) and checks `object`'s landing as it
 * resolves, filming it as `name`. */
async function castAndLand(
  page: Page,
  object: string,
  name: string,
  act: () => Promise<unknown>,
  wait = paced,
): Promise<void> {
  const recording = await record(page, object)
  await act()
  // From the moment it's lifted off the stack.
  await expect(page.locator('.ghost-flight')).not.toHaveCount(0, wait)
  await film(page, name, 1400)
  await expect(page.locator(`.board [data-obj-id="${object}"]`)).toBeVisible(paced)
  await expect(page.locator('.ghost-flight')).toHaveCount(0, paced)
  await page.waitForTimeout(300)
  checkLanding(await recording.stop())
}

const SIZES = [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
] as const

for (const size of SIZES) {
  test.describe(`at ${size.width}x${size.height}`, () => {
    test.use({ viewport: size })

    test('2p: an artifact and a creature entering tapped are put down on their tiles', async ({
      page,
      request,
    }) => {
      const state = await openRoom(page, request, 'PUTDN')
      const ring = idOf(state, 'alice', 'Sol Ring')
      const bears = idOf(state, 'alice', 'Grizzly Bears')
      await castAndLand(page, ring, `2p-${size.width}-sol-ring`, () => cast(page, ring))
      await castAndLand(page, bears, `2p-${size.width}-bears-tapped`, () => cast(page, bears))
      // Thalia's: it entered tapped, and the copy landed on its layout box.
      await expect(page.locator(`.board [data-obj-id="${bears}"] .mini-tile.tapped`)).toHaveCount(1)
    })

    test("4p: an opponent's creature is put down on their board", async ({ page, request }) => {
      const state = await openRoom(page, request, 'PUTD4')
      const dreadmaw = idOf(state, 'carol', 'Colossal Dreadmaw')
      // Pass through until carol casts it, and let it resolve.
      await castAndLand(
        page,
        dreadmaw,
        `4p-${size.width}-dreadmaw`,
        () => page.getByRole('button', { name: 'Auto-pass' }).click(),
        { timeout: 60_000 },
      )
    })
  })
}
