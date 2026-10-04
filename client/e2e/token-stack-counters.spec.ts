import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'

// Counters on each token of a stack keep it one stack (engine
// `Game.refoldSplitTokens`): Tribute to the World Tree triggers once per
// Warrior entering and puts two +1/+1 counters on one at a time, splitting
// each off the stack, and once the last trigger has resolved they fold back
// into one object — one board tile, ×N, with its counters. Before, they
// stayed one object (and one tile) per token.
//
// Rooms TREES and TREE4 are in server/scripts/dev-scenarios.mjs. Set
// E2E_SHOTS_DIR to also save screenshots at three screen sizes and, for the
// four-player room, a frame every ~100 ms while the triggers resolve.

const CONTROL = `http://127.0.0.1:${process.env.E2E_CONTROL_PORT ?? 4099}`
const SHOTS = process.env.E2E_SHOTS_DIR
const SIZES = [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
] as const

/** A Warrior token object as the engine holds it. */
interface Warrior {
  readonly id: string
  readonly count: number
  readonly plusOnes: number
}

async function resetRoom(request: APIRequestContext, room: string): Promise<void> {
  const response = await request.post(CONTROL, { data: { op: 'reset', room } })
  expect(response.ok()).toBe(true)
}

async function control<T>(request: APIRequestContext, data: Record<string, unknown>): Promise<T> {
  const response = await request.post(CONTROL, { data })
  expect(response.ok()).toBe(true)
  return (await response.json()) as T
}

/** The room's Warrior tokens, and whether anything is still on the stack —
 * both read without pushing a frame (the `state` and `objects` ops). */
async function warriors(
  request: APIRequestContext,
  room: string,
): Promise<{ readonly settled: boolean; readonly warriors: readonly Warrior[] }> {
  const state = await control<{ readonly stack: readonly string[]; readonly awaiting: string | null }>(request, {
    op: 'state',
    room,
  })
  const objects = await control<
    readonly {
      readonly id: string
      readonly zone: string
      readonly stackCount: number
      readonly counters: Readonly<Record<string, number>>
    }[]
  >(request, { op: 'objects', room, names: ['Warrior Token'] })
  return {
    settled: state.stack.length === 0 && state.awaiting === null,
    warriors: objects
      .filter((o) => o.zone === 'battlefield')
      .map((o) => ({ id: o.id, count: o.stackCount, plusOnes: o.counters['+1/+1'] ?? 0 })),
  }
}

function pageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

async function takeSeat(page: Page, room: string): Promise<void> {
  await page.goto(`/?room=${room}`)
  await page.getByRole('button', { name: 'Ready', exact: true }).click()
  await expect(page.getByText(`room ${room}`)).toBeVisible()
}

/** Cast Secure the Wastes from the hand for `x`. */
async function secureTheWastes(page: Page, x: number): Promise<void> {
  // The hand rests mostly below the screen's edge and rises when the pointer
  // comes near it.
  const card = page.locator('.hand-card', { hasText: 'Secure the Wastes' }).first()
  // Straight after taking a seat the opening frames are still playing and the
  // hand isn't drawn yet; hovering then fails as "not visible".
  await expect(page.locator('.hand-strip-inner')).toBeVisible()
  await page.locator('.hand-strip-inner').hover({ force: true })
  await expect(page.locator('.hand-strip.raised')).toBeVisible()
  await card.click()
  const input = page.locator('.controls input[type="number"]')
  await expect(input).toBeVisible()
  await input.fill(String(x))
  await page.getByRole('button', { name: 'Confirm', exact: true }).click()
}

/** Wait until every trigger has resolved; returns the Warriors then. */
async function settle(request: APIRequestContext, room: string, total: number): Promise<readonly Warrior[]> {
  let last: readonly Warrior[] = []
  await expect
    .poll(
      async () => {
        const now = await warriors(request, room)
        last = now.warriors
        return now.settled && now.warriors.reduce((n, w) => n + w.count, 0) === total
      },
      { timeout: 60_000, intervals: [250] },
    )
    .toBe(true)
  return last
}

/** The board tile holding the object `id` (a tile lists every id it stands for). */
const tileOf = (page: Page, id: string) => page.locator(`[data-obj-ids~="${id}"]`)

/** The client plays the server's frames back one at a time, each with its
 * animations, so it shows the end of a long chain of triggers well after the
 * engine got there. */
const caughtUp = { timeout: 60_000 }

async function expectStackTile(page: Page, warrior: Warrior): Promise<void> {
  const tile = tileOf(page, warrior.id)
  await expect(tile.locator('.card-stack')).toHaveText(`×${warrior.count}`, caughtUp)
  if (warrior.plusOnes > 0) {
    await expect(tile.locator(`.mt-counter[title="${warrior.plusOnes} +1/+1 counters"]`)).toBeVisible(caughtUp)
  } else {
    await expect(tile.locator('.mt-counter')).toHaveCount(0, caughtUp)
  }
  await expect(tile).toHaveCount(1)
}

/** How many board tiles stand for any of `ids`. */
async function tilesFor(page: Page, ids: readonly string[]): Promise<number> {
  return page.evaluate((wanted) => {
    const tiles = [...document.querySelectorAll<HTMLElement>('[data-obj-ids]')]
    return tiles.filter((t) => (t.dataset.objIds ?? '').split(' ').some((id) => wanted.includes(id))).length
  }, ids)
}

async function screenshots(page: Page, name: string): Promise<void> {
  if (SHOTS === undefined) return
  mkdirSync(SHOTS, { recursive: true })
  for (const size of SIZES) {
    await page.setViewportSize(size)
    // Let the layout settle at the new size (card widths are viewport-derived).
    await page.waitForTimeout(400)
    await page.screenshot({ path: join(SHOTS, `${name}-${size.width}x${size.height}.png`) })
  }
  await page.setViewportSize(SIZES[0])
}

test('three Warriors joining a stack, each given counters by its own trigger, are one tile', async ({
  page,
  request,
}) => {
  await resetRoom(request, 'TREES')
  const errors = pageErrors(page)
  await takeSeat(page, 'TREES')

  const before = await warriors(request, 'TREES')
  expect(before.warriors).toEqual([expect.objectContaining({ count: 10, plusOnes: 0 })])
  await expectStackTile(page, before.warriors[0])
  await screenshots(page, '2p-before')

  await secureTheWastes(page, 3)
  const after = await settle(request, 'TREES', 13)

  // The ten untouched, and the three that got Tribute's counters: two
  // objects, two tiles.
  expect(after).toHaveLength(2)
  const plain = after.find((w) => w.plusOnes === 0)
  const grown = after.find((w) => w.plusOnes === 2)
  expect(plain?.count).toBe(10)
  expect(grown?.count).toBe(3)
  if (plain === undefined || grown === undefined) throw new Error('unreachable')
  await expectStackTile(page, plain)
  await expectStackTile(page, grown)
  expect(await tilesFor(page, [plain.id, grown.id])).toBe(2)
  await screenshots(page, '2p-after')
  expect(errors).toEqual([])
})

test('ten Warriors each given counters by Tribute to the World Tree are one tile in a 4-player room', async ({
  page,
  request,
}) => {
  test.setTimeout(120_000)
  await resetRoom(request, 'TREE4')
  const errors = pageErrors(page)
  await takeSeat(page, 'TREE4')
  await screenshots(page, '4p-before')

  await secureTheWastes(page, 10)
  const after = await settle(request, 'TREE4', 10)
  expect(after).toEqual([expect.objectContaining({ count: 10, plusOnes: 2 })])

  // A frame sequence through the ten triggers resolving as the client plays
  // them: the stack splits one Warrior at a time, then folds back together.
  if (SHOTS !== undefined) {
    const frames = join(SHOTS, '4p-frames')
    mkdirSync(frames, { recursive: true })
    const done = tileOf(page, after[0].id).locator('.mt-counter[title="2 +1/+1 counters"]')
    for (let i = 0; i < 600; i += 1) {
      await page.screenshot({ path: join(frames, `frame-${String(i).padStart(3, '0')}.png`) })
      if ((await done.count()) > 0 && (await page.locator('.stack-entry').count()) === 0) break
      await page.waitForTimeout(100)
    }
  }

  await expectStackTile(page, after[0])
  expect(await tilesFor(page, [after[0].id])).toBe(1)
  await screenshots(page, '4p-after')
  expect(errors).toEqual([])
})
