import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'

// A hover outlasting the board's per-frame remount (`hoverCarry.ts`): `Table`
// remounts on every frame shown, so the card under a resting pointer is a new
// element each time another player plays a card. Without the carry, the hand
// card under the pointer shrank and grew again, and a tile's popover vanished
// and faded back in (a bug report, 2026-10-07). Each test parks the pointer,
// lets an opponent cast Colossal Dreadmaw (bob in PUTDN, carol in PUTD4 —
// server/scripts/dev-scenarios.mjs), and samples every animation frame.

const CONTROL = `http://127.0.0.1:${process.env.E2E_CONTROL_PORT ?? 4099}`

test.describe.configure({ timeout: 120_000 })

interface RoomState {
  readonly players: Record<string, { readonly hand: readonly string[] }>
}

async function control<T>(request: APIRequestContext, body: object): Promise<T> {
  const response = await request.post(CONTROL, { data: body })
  expect(response.ok()).toBe(true)
  return (await response.json()) as T
}

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
  await expect(page.getByRole('button', { name: 'Pass (space)' })).toBeEnabled({ timeout: 20_000 })
  return state
}

/** Samples `probe` (a function body run in the page) every animation frame
 * until `stop`, also counting how often the element `probe` measured was a
 * new one — the remounts the samples span. */
async function record(page: Page, probe: string): Promise<() => Promise<{ samples: string[]; remounts: number }>> {
  await page.evaluate((body) => {
    const read = new Function(body) as () => [Element | null, string]
    const w = window as unknown as { __hover: { samples: string[]; remounts: number; stop: boolean } }
    w.__hover = { samples: [], remounts: 0, stop: false }
    let last: Element | null = null
    const loop = () => {
      const [el, sample] = read()
      if (el !== null && last !== null && el !== last) w.__hover.remounts += 1
      if (el !== null) last = el
      w.__hover.samples.push(sample)
      if (!w.__hover.stop) requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }, probe)
  return async () =>
    page.evaluate(() => {
      const w = window as unknown as { __hover: { samples: string[]; remounts: number; stop: boolean } }
      w.__hover.stop = true
      return { samples: w.__hover.samples, remounts: w.__hover.remounts }
    })
}

/** Passes until the opponent's Dreadmaw is on his board, and a little after, without
 * moving the mouse. */
async function letBobCast(page: Page, dreadmaw: string): Promise<void> {
  await page.getByRole('button', { name: 'Auto-pass' }).dispatchEvent('click')
  await expect(page.locator(`.mini-tile-wrap[data-obj-id="${dreadmaw}"]`)).toBeVisible({ timeout: 60_000 })
  await page.waitForTimeout(1500)
}

const CASES = [
  { room: 'PUTDN', caster: 'bob', size: { width: 1366, height: 768 } },
  { room: 'PUTDN', caster: 'bob', size: { width: 2560, height: 1440 } },
  { room: 'PUTD4', caster: 'carol', size: { width: 1920, height: 1080 } },
] as const

for (const { room, caster, size } of CASES) {
  const name = `${room} ${size.width}x${size.height}`
  test(`${name}: a hand card under the pointer stays grown while another player casts`, async ({ page, request }) => {
    await page.setViewportSize(size)
    const state = await openRoom(page, request, room)
    const angel = idOf(state, 'alice', 'Serra Angel')
    const dreadmaw = idOf(state, caster, 'Colossal Dreadmaw')
    // Twice: the first raises the hand's tray, which moves the card.
    const card = page.locator(`.hand-card[data-obj-id="${angel}"] .card-tile`)
    await card.hover()
    await page.waitForTimeout(600)
    await card.hover()
    await page.waitForTimeout(600)
    const scale = (): Promise<string> =>
      page.evaluate((id) => {
        const tile = document.querySelector(`.hand-card[data-obj-id="${id}"] .card-tile`)
        return tile ? getComputedStyle(tile).scale : 'gone'
      }, angel)
    expect(await scale()).toBe('1.65')

    const stop = await record(
      page,
      `const tile = document.querySelector('.hand-card[data-obj-id="${angel}"] .card-tile')
       return [tile, tile ? getComputedStyle(tile).scale : 'gone']`,
    )
    await letBobCast(page, dreadmaw)
    const { samples, remounts } = await stop()
    // The cast reached this board as frames: the tile was replaced at least once.
    expect(remounts).toBeGreaterThan(0)
    const shrunk = samples.filter((s) => s !== '1.65')
    expect(shrunk, `${shrunk.length} of ${samples.length} frames not grown`).toEqual([])

    // The carry lets go when the pointer leaves: the card shrinks back.
    await page.mouse.move(5, 5)
    await expect.poll(scale).toBe('1')
    expect(await page.locator('.hover-carry').count()).toBe(0)
  })

  test(`${name}: a tile's popover stays open while another player casts`, async ({ page, request }) => {
    await page.setViewportSize(size)
    const state = await openRoom(page, request, room)
    const dreadmaw = idOf(state, caster, 'Colossal Dreadmaw')
    const giant = await page
      .locator('.mini-tile-wrap', { hasText: 'Hill Giant' })
      .first()
      .getAttribute('data-obj-id')
    expect(giant).toBeTruthy()
    await page.locator(`.mini-tile-wrap[data-obj-id="${giant}"]`).hover()
    await expect(page.locator('.mini-tile-popover.placed')).toBeVisible()
    await page.waitForTimeout(500)

    const stop = await record(
      page,
      `const wrap = document.querySelector('.mini-tile-wrap[data-obj-id="${giant}"]')
       const pop = document.querySelector('.mini-tile-popover')
       return [wrap, pop ? getComputedStyle(pop).opacity : 'closed']`,
    )
    await letBobCast(page, dreadmaw)
    const { samples, remounts } = await stop()
    expect(remounts).toBeGreaterThan(0)
    const faded = samples.filter((s) => s !== '1')
    expect(faded, `${faded.length} of ${samples.length} frames without the popover`).toEqual([])

    await page.mouse.move(5, 5)
    await expect(page.locator('.mini-tile-popover')).toHaveCount(0)
    expect(await page.locator('.hover-carry').count()).toBe(0)
  })
}
