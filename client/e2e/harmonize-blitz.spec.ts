import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

// Harmonize and blitz, each a cast variant of its own: Zenith Festival cast
// from the graveyard tapping a creature (HARMN), and Star Athlete cast for its
// blitz cost from the hand (BLITZ). With E2E_SHOTS_DIR set, each menu and its
// result are saved at 1366x768, 1920x1080 and 2560x1440.

const CONTROL = `http://127.0.0.1:${process.env.E2E_CONTROL_PORT ?? 4099}`
const SHOTS = process.env.E2E_SHOTS_DIR
const SIZES = [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
] as const

interface RoomState {
  readonly players: Record<
    string,
    { readonly life: number; readonly hand: readonly string[]; readonly battlefield: readonly string[] }
  >
}

async function control<T>(request: APIRequestContext, body: object): Promise<T> {
  const response = await request.post(CONTROL, { data: body })
  expect(response.ok()).toBe(true)
  return (await response.json()) as T
}

/** "obj-12 Hill Giant, tapped" lines for `name` (which may hold commas). */
function linesOf(state: RoomState, player: string, name: string): string[] {
  const { hand, battlefield } = state.players[player]
  return [...hand, ...battlefield].filter((l) => {
    const rest = l.slice(l.indexOf(' ') + 1)
    return rest === name || rest.startsWith(`${name}, `)
  })
}

const idsOf = (state: RoomState, player: string, name: string): string[] =>
  linesOf(state, player, name).map((l) => l.split(' ')[0])

async function openRoom(page: Page, request: APIRequestContext, room: string): Promise<RoomState> {
  await control(request, { op: 'reset', room })
  const state = await control<RoomState>(request, { op: 'state', room })
  await page.goto(`/?room=${room}`)
  await page.getByRole('button', { name: 'Ready', exact: true }).click()
  await expect(page.getByText(`room ${room}`)).toBeVisible()
  return state
}

const paced = { timeout: 20_000 }

async function ready(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: 'Pass (space)' })).toBeEnabled(paced)
}

async function shots(page: Page, name: string): Promise<void> {
  if (SHOTS === undefined) return
  mkdirSync(SHOTS, { recursive: true })
  const size = page.viewportSize()
  for (const s of SIZES) {
    await page.setViewportSize(s)
    await page.waitForTimeout(250)
    await page.screenshot({ path: join(SHOTS, `${name}-${s.width}x${s.height}.png`) })
  }
  if (size !== null) await page.setViewportSize(size)
}

/** Passes priority until the choice comes up in this seat's banner. */
async function untilChoice(page: Page, prompt: RegExp): Promise<void> {
  await expect(async () => {
    const banner = page.locator('.decision-banner', { hasText: prompt })
    if (await banner.isVisible()) return
    const pass = page.getByRole('button', { name: 'Pass (space)' })
    if (await pass.isEnabled()) await pass.click()
    await expect(banner).toBeVisible({ timeout: 1500 })
  }).toPass(paced)
}

test('HARMN: harmonize offers a cast per untapped creature, and taps the one chosen', async ({ page, request }) => {
  test.setTimeout(120_000)
  await openRoom(page, request, 'HARMN')
  await ready(page)
  await page.locator('[data-graveyard-count-of="alice"]').click()
  const viewer = page.locator('.zone-viewer-box')
  await expect(viewer.getByRole('button', { name: /harmonize, tapping Hill Giant \(−3\)/ })).toBeVisible()
  // The tapped Craw Wurm isn't offered.
  await expect(viewer.getByRole('button', { name: /Craw Wurm/ })).toHaveCount(0)
  await shots(page, 'HARMN-menu')
  await viewer.getByRole('button', { name: /harmonize, tapping Hill Giant/ }).click()
  // X=4 is the most three Mountains pay with the Giant's 3 off.
  await expect(page.locator('.controls input[type="number"]')).toHaveValue('4')
  await page.locator('.controls').getByRole('button', { name: 'Confirm' }).click()
  await expect
    .poll(async () => {
      const now = await control<RoomState>(request, { op: 'state', room: 'HARMN' })
      return linesOf(now, 'alice', 'Hill Giant')[0] ?? ''
    }, paced)
    .toMatch(/tapped/)
  // Resolved, it's exiled rather than back in the graveyard.
  await ready(page)
  await expect(page.locator('[data-graveyard-count-of="alice"]')).toHaveText('graveyard 0', paced)
  await shots(page, 'HARMN-done')
})

test('BLITZ: Star Athlete is offered for its blitz cost, then attacks at once', async ({ page, request }) => {
  test.setTimeout(120_000)
  const state = await openRoom(page, request, 'BLITZ')
  const [athlete] = idsOf(state, 'alice', 'Star Athlete')
  const [giant] = idsOf(state, 'bob', 'Hill Giant')
  await ready(page)
  const card = page.locator(`.hand-card[data-obj-id="${athlete}"]`)
  await expect(card.getByRole('button', { name: /Cast Star Athlete \(blitz\)/ })).toBeVisible()
  await card.locator('.card-tile').hover({ force: true })
  await shots(page, 'BLITZ-menu')
  // The fanned hand never holds still for a click.
  await card.getByRole('button', { name: /Cast Star Athlete \(blitz\)/ }).dispatchEvent('click')
  await untilChoice(page, /No attacks|Attack with/)
  await page.locator(`.board [data-obj-id="${athlete}"]`).first().click()
  await page.locator('.decision-banner').getByRole('button', { name: /^Attack with 1/ }).click()
  // Its attack trigger aims at bob's Giant; bob (a bot) sacrifices it or
  // takes 5.
  await untilChoice(page, /Choose targets for Star Athlete/)
  await shots(page, 'BLITZ-target')
  await page.locator(`.board [data-obj-id="${giant}"]`).first().click()
  await expect
    .poll(async () => {
      const now = await control<RoomState>(request, { op: 'state', room: 'BLITZ' })
      const kept = idsOf(now, 'bob', 'Hill Giant').length === 1
      const lost = state.players.bob.life - now.players.bob.life
      // 5 from the trigger and 3 in combat, or only the combat damage.
      return kept ? lost === 8 : lost === 3
    }, paced)
    .toBe(true)
  await shots(page, 'BLITZ-done')
})
