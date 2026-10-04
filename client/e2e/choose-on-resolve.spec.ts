import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

// Permanents chosen on the board as an ability resolves (`choose-permanents`):
// Trostani, Selesnya's Voice's populate between two different creature
// tokens, and Abdel Adrian, Gorion's Ward's "exile any number of other
// nonland permanents you control", in the POPUL / POPU4 dev rooms. With
// E2E_SHOTS_DIR set, each prompt and its result are saved at 1366x768,
// 1920x1080 and 2560x1440.

const CONTROL = `http://127.0.0.1:${process.env.E2E_CONTROL_PORT ?? 4099}`
const SHOTS = process.env.E2E_SHOTS_DIR
const SIZES = [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
] as const

interface RoomState {
  readonly players: Record<string, { readonly hand: readonly string[]; readonly battlefield: readonly string[] }>
}

async function control<T>(request: APIRequestContext, body: object): Promise<T> {
  const response = await request.post(CONTROL, { data: body })
  expect(response.ok()).toBe(true)
  return (await response.json()) as T
}

function idsOf(state: RoomState, player: string, name: string): string[] {
  const { hand, battlefield } = state.players[player]
  // "obj-12 Hill Giant, tapped": the name may itself hold commas.
  return [...hand, ...battlefield]
    .filter((l) => {
      const rest = l.slice(l.indexOf(' ') + 1)
      return rest === name || rest.startsWith(`${name}, `)
    })
    .map((l) => l.split(' ')[0])
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

/** Confirms a choice on the board, where the banner asks for it (a single
 * pick may be taken as soon as it's made). */
async function confirm(page: Page): Promise<void> {
  const button = page.locator('.decision-banner').getByRole('button', { name: 'Confirm' })
  if (await button.isVisible()) await button.click()
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

for (const room of ['POPUL', 'POPU4'] as const) {
  test(`${room}: populate asks which token to copy, on the board`, async ({ page, request }) => {
    test.setTimeout(120_000)
    const state = await openRoom(page, request, room)
    const [trostani] = idsOf(state, 'alice', "Trostani, Selesnya's Voice")
    const [elephant] = idsOf(state, 'alice', 'Elephant Token')
    await ready(page)
    await page.locator(`.board [data-obj-id="${trostani}"]`).first().click()
    await page.getByRole('menuitem', { name: /Populate/ }).click()
    await untilChoice(page, /Populate: choose a creature token to copy/)
    await shots(page, `${room}-populate-prompt`)
    await page.locator(`.board [data-obj-id="${elephant}"]`).first().click()
    await confirm(page)
    await expect
      .poll(async () => {
        const now = await control<RoomState>(request, { op: 'state', room })
        return idsOf(now, 'alice', 'Elephant Token').length + idsOf(now, 'alice', 'Soldier Token').length
      }, paced)
      .toBe(3)
    await shots(page, `${room}-populate-done`)
  })

  test(`${room}: Abdel Adrian exiles any number of other nonland permanents`, async ({ page, request }) => {
    test.setTimeout(120_000)
    const state = await openRoom(page, request, room)
    const [abdel] = idsOf(state, 'alice', "Abdel Adrian, Gorion's Ward")
    const [ring] = idsOf(state, 'alice', 'Sol Ring')
    const [bears] = idsOf(state, 'alice', 'Grizzly Bears')
    await ready(page)
    await page.locator(`.hand-card[data-obj-id="${abdel}"] .card-tile`).dispatchEvent('click')
    await untilChoice(page, /Exile any number of other nonland permanents/)
    await shots(page, `${room}-abdel-prompt`)
    await page.locator(`.board [data-obj-id="${ring}"]`).first().click()
    await page.locator(`.board [data-obj-id="${bears}"]`).first().click()
    await confirm(page)
    await expect
      .poll(async () => {
        const now = await control<RoomState>(request, { op: 'state', room })
        return idsOf(now, 'alice', 'Sol Ring').length + idsOf(now, 'alice', 'Grizzly Bears').length
      }, paced)
      .toBe(0)
    await shots(page, `${room}-abdel-done`)
  })
}
