import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'

// The decisions the TDC precons' last cards brought (2026-10-07), in the
// dev rooms SLAUG, SHDRX and LOAMS (server/scripts/dev-scenarios.mjs):
// - Slaughter the Strong: choosing creatures to keep under a total-power cap,
//   the banner counting it and Confirm greyed out past it;
// - Shadrix Silverquill: "you may choose two" — Confirm needs two, and
//   "Choose none" removes the trigger;
// - Life from the Loam: dredge offered before each draw, one at a time.
// Screenshots of each at the three desktop sizes go in the test's output.

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

const SIZES = [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
] as const

async function shots(page: Page, name: string): Promise<void> {
  for (const size of SIZES) {
    await page.setViewportSize(size)
    await page.waitForTimeout(250)
    await page.screenshot({ path: test.info().outputPath(`${name}-${size.width}x${size.height}.png`) })
  }
  await page.setViewportSize(SIZES[0])
}

const castFromHand = async (page: Page, card: string): Promise<void> => {
  await page.locator(`.hand-card[data-obj-id="${card}"] .card-tile`).dispatchEvent('click')
}

// Alice's own tiles: an opponent's board has a Grizzly Bears too.
const tile = (page: Page, name: string) =>
  page.locator('.quadrant-cell.self .mini-tile-wrap', { hasText: name }).first().locator('.mini-tile')
/** The decision's own buttons, not the card's rules text on the board. */
const decisionButton = (page: Page, name: string | RegExp) => page.locator('.controls').getByRole('button', { name })

test('Slaughter the Strong: the banner counts total power and Confirm stops past 4', async ({ page, request }) => {
  const state = await openRoom(page, request, 'SLAUG')
  await castFromHand(page, idOf(state, 'alice', 'Slaughter the Strong'))
  const banner = page.getByText(/total power \d+\/4/)
  await expect(banner).toBeVisible({ timeout: 20_000 })
  const confirm = decisionButton(page, 'Confirm')
  await tile(page, 'Hill Giant').click()
  await expect(page.getByText('total power 3/4')).toBeVisible()
  await tile(page, 'Grizzly Bears').click()
  await expect(page.getByText('total power 5/4')).toBeVisible()
  await expect(confirm).toBeDisabled()
  await shots(page, 'slaughter-over-cap')
  await tile(page, 'Grizzly Bears').click()
  await tile(page, 'Llanowar Elves').click()
  await expect(page.getByText('total power 4/4')).toBeVisible()
  await expect(confirm).toBeEnabled()
  await confirm.click()
  // The bots choose; then everything not kept goes at once.
  const mine = page.locator('.quadrant-cell.self .mini-tile-wrap')
  await expect(mine.filter({ hasText: 'Grizzly Bears' })).toHaveCount(0, { timeout: 20_000 })
  await expect(mine.filter({ hasText: 'Hill Giant' })).toHaveCount(1)
  await expect(mine.filter({ hasText: 'Llanowar Elves' })).toHaveCount(1)
})

test('Shadrix Silverquill: "you may choose 2", with Choose none', async ({ page, request }) => {
  await openRoom(page, request, 'SHDRX')
  await page.getByRole('button', { name: 'Pass (space)' }).click()
  await expect(page.getByText(/you may choose 2/)).toBeVisible({ timeout: 20_000 })
  const confirm = decisionButton(page, 'Confirm')
  await decisionButton(page, /Inkling creature token/).click()
  await expect(confirm).toBeDisabled()
  await decisionButton(page, /draws a card and loses 1 life/).click()
  await expect(confirm).toBeEnabled()
  await shots(page, 'shadrix-modes')
  await decisionButton(page, 'Choose none').click()
  await expect(page.getByText(/you may choose 2/)).toHaveCount(0)
})

test('Life from the Loam: dredge asked before each draw', async ({ page, request }) => {
  const state = await openRoom(page, request, 'LOAMS')
  await castFromHand(page, idOf(state, 'alice', 'Divination'))
  const dredge = decisionButton(page, /Dredge 3: mill 3, return Life from the Loam/)
  await expect(dredge).toBeVisible({ timeout: 20_000 })
  await expect(decisionButton(page, 'Draw a card')).toBeVisible()
  await shots(page, 'loam-dredge')
  await dredge.click()
  // The second draw is asked about too; the Loam is in hand now, so it's a
  // plain draw — no dredge on offer, and nothing asked.
  await expect(dredge).toHaveCount(0, { timeout: 10_000 })
  const after = await control<RoomState>(request, { op: 'state', room: 'LOAMS' })
  expect(after.players.alice.hand.some((l) => l.endsWith('Life from the Loam'))).toBe(true)
})
