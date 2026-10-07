import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'

// A rematch from the end-of-game panel: a game played to its end, then the
// host's button deals the next one into the same room, everyone at the table
// carried into it. Rooms are made the way a player makes them (a blitz, or a
// seat board), since only those can be rematched; dev-rooms' command port
// reaches them by code, to end a game without playing it out.

/** dev-rooms' loopback command port (`E2E_CONTROL_PORT` — see playwright.config.ts). */
const CONTROL = `http://127.0.0.1:${process.env.E2E_CONTROL_PORT ?? 4099}`

async function command(request: APIRequestContext, data: Record<string, unknown>): Promise<unknown> {
  const response = await request.post(CONTROL, { data })
  expect(response.ok()).toBe(true)
  return response.json()
}

const roomOf = (page: Page): Promise<string | null> =>
  page.evaluate(() => new URL(window.location.href).searchParams.get('room'))

function pageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

/** The page at both desktop sizes the user plays at, for looking at. */
async function screenshots(page: Page, name: string): Promise<void> {
  for (const [width, height] of [
    [1366, 768],
    [1920, 1080],
  ]) {
    await page.setViewportSize({ width, height })
    await page.screenshot({ path: test.info().outputPath(`${name}-${width}x${height}.png`) })
  }
  await page.setViewportSize({ width: 1366, height: 768 })
}

const LIST = ['Commander', '1 Ghalta, Primal Hunger', '', 'Deck', '1 Tooth and Nail', '1 Grizzly Bears', '30 Forest'].join(
  '\n',
)

/** The import endpoint's answer to LIST, Tooth and Nail stood in for — as
 * blitz.spec.ts stubs it (dev-rooms serves no `/import-deck`). */
async function stubImport(page: Page): Promise<void> {
  const card = (name: string, count = 1, extra: Record<string, unknown> = {}) => ({
    name,
    count,
    implemented: true,
    found: true,
    manaCost: null,
    typeLine: '',
    suggestedReplacement: null,
    replacements: [],
    printingId: null,
    ...extra,
  })
  const lines = [
    {
      type: 'result',
      cards: [
        card('Ghalta, Primal Hunger'),
        card('Tooth and Nail', 1, { implemented: false, suggestedReplacement: 'Natural Order' }),
        card('Grizzly Bears'),
        card('Forest', 30),
      ],
      format: { legal: false, violations: [], identity: 'G', commanders: ['Ghalta, Primal Hunger'] },
    },
  ]
  await page.route('**/import-deck', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/x-ndjson',
      body: lines.map((l) => JSON.stringify(l)).join('\n') + '\n',
      headers: { 'Access-Control-Allow-Origin': '*' },
    }),
  )
}

const keepPrompt = (page: Page) => page.getByText('Keep your opening hand?')
const resultPanel = (page: Page) => page.getByRole('dialog', { name: 'Game over' })
/** Bots and animations are paced, so a step of the game gets some room. */
const paced = { timeout: 30_000 }

test('blitz again: the same room, a fresh game, the import report not back', async ({ page, context, request }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await stubImport(page)
  const errors = pageErrors(page)

  await page.goto('/')
  await page.evaluate((text) => navigator.clipboard.writeText(text), LIST)
  await page.getByRole('button', { name: 'Have a deck copied? Click here to blitz!' }).click()
  await expect(page.getByRole('button', { name: 'History' })).toBeVisible(paced)
  const room = await roomOf(page)
  expect(room).toMatch(/^[A-Z0-9]{5}$/)
  // Left up, unlike blitz.spec.ts: it mustn't outlive the game it was about.
  await expect(page.locator('.blitz-report')).toBeVisible()

  // The bots are out the moment the opening hands are kept (rule 704.5a).
  await expect(keepPrompt(page)).toBeVisible(paced)
  for (const player of ['bob', 'carol', 'dave']) await command(request, { op: 'life', room, player, value: 0 })
  await page.getByRole('button', { name: 'Keep', exact: true }).click()

  await expect(resultPanel(page)).toBeVisible(paced)
  await expect(resultPanel(page).getByRole('heading', { name: 'You win!' })).toBeVisible()
  const again = resultPanel(page).getByRole('button', { name: 'Blitz again' })
  await expect(again).toBeVisible()
  await screenshots(page, 'blitz-result')

  await again.click()
  // A new game: its own opening hand, no result, no report, the same code.
  await expect(keepPrompt(page)).toBeVisible(paced)
  await expect(resultPanel(page)).toHaveCount(0)
  await expect(page.locator('.blitz-report')).toHaveCount(0)
  expect(await roomOf(page)).toBe(room)
  expect(await command(request, { op: 'eval', room, js: 'return room.gameNumber' })).toBe(2)
  // Every bot back at the table, alive.
  for (const seat of ['bob', 'carol', 'dave']) {
    const life = await command(request, { op: 'eval', room, js: `return game.state.players.${seat}.life` })
    expect(life).toBe(40)
  }
  await screenshots(page, 'blitz-again')
  expect(errors).toEqual([])
})

test("the host's rematch carries the other player into the new game", async ({ browser }) => {
  const hostContext = await browser.newContext()
  const guestContext = await browser.newContext()
  const host = await hostContext.newPage()
  const guest = await guestContext.newPage()
  const hostErrors = pageErrors(host)
  const guestErrors = pageErrors(guest)

  await host.goto('/')
  await host.getByRole('button', { name: 'Create a game' }).click()
  await host.getByRole('button', { name: 'Ready', exact: true }).click()
  const room = await roomOf(host)
  expect(room).toMatch(/^[A-Z0-9]{5}$/)
  await guest.goto(`/?room=${room}`)
  await guest.getByRole('button', { name: 'Ready', exact: true }).click()
  await host.getByRole('button', { name: 'Start Game' }).click()

  for (const page of [host, guest]) {
    await expect(keepPrompt(page)).toBeVisible(paced)
    await page.getByRole('button', { name: 'Keep', exact: true }).click()
  }
  await host.getByRole('button', { name: 'Game', exact: true }).click()
  await host.getByRole('button', { name: 'Concede…' }).click(paced)
  await host.getByRole('button', { name: 'Concede', exact: true }).click()

  // The guest won, and waits on the host; only the host has the button.
  await expect(resultPanel(guest)).toBeVisible(paced)
  await expect(resultPanel(guest).getByRole('heading', { name: 'You win!' })).toBeVisible()
  await expect(resultPanel(guest).getByText(/^Waiting for .+ to rematch…$/)).toBeVisible()
  await expect(resultPanel(guest).getByRole('button', { name: 'Rematch' })).toHaveCount(0)
  await screenshots(guest, 'guest-result')
  await expect(resultPanel(host)).toBeVisible(paced)
  await screenshots(host, 'host-result')

  // Put aside, the panel comes back from the Game menu.
  await resultPanel(host).getByRole('button', { name: 'View the board' }).click()
  await expect(resultPanel(host)).toHaveCount(0)
  await host.getByRole('button', { name: 'Game', exact: true }).click()
  await host.getByRole('button', { name: 'Game result' }).click()
  await resultPanel(host).getByRole('button', { name: 'Rematch' }).click()

  // Both at the new game's opening hands, the guest without lifting a finger.
  for (const page of [host, guest]) {
    await expect(keepPrompt(page)).toBeVisible(paced)
    await expect(resultPanel(page)).toHaveCount(0)
    expect(await roomOf(page)).toBe(room)
  }
  await screenshots(guest, 'guest-rematch')
  expect(hostErrors).toEqual([])
  expect(guestErrors).toEqual([])
  await hostContext.close()
  await guestContext.close()
})

test('the host restarts a game mid-way, and the other player is told', async ({ browser, request }) => {
  const hostContext = await browser.newContext()
  const guestContext = await browser.newContext()
  const host = await hostContext.newPage()
  const guest = await guestContext.newPage()
  const hostErrors = pageErrors(host)
  const guestErrors = pageErrors(guest)

  await host.goto('/')
  await host.getByRole('button', { name: 'Create a game' }).click()
  await host.getByRole('button', { name: 'Ready', exact: true }).click()
  const room = await roomOf(host)
  await guest.goto(`/?room=${room}`)
  await guest.getByRole('button', { name: 'Ready', exact: true }).click()
  await host.getByRole('button', { name: 'Start Game' }).click()
  for (const page of [host, guest]) {
    await expect(keepPrompt(page)).toBeVisible(paced)
    await page.getByRole('button', { name: 'Keep', exact: true }).click()
  }
  await expect(keepPrompt(host)).toHaveCount(0, paced)

  // Only the host is offered it, and only mid-game.
  await guest.getByRole('button', { name: 'Game', exact: true }).click()
  await expect(guest.getByRole('button', { name: 'Restart game…' })).toHaveCount(0)
  await guest.keyboard.press('Escape')

  // Asked once more, then dealt.
  await host.getByRole('button', { name: 'Game', exact: true }).click()
  await host.getByRole('button', { name: 'Restart game…' }).click()
  await expect(host.getByText('Restart for everyone?')).toBeVisible()
  await screenshots(host, 'host-restart-confirm')
  await host.getByRole('button', { name: 'Restart', exact: true }).click()

  // Both at a new game's opening hands in the same room, the guest told why.
  for (const page of [host, guest]) {
    await expect(keepPrompt(page)).toBeVisible(paced)
    expect(await roomOf(page)).toBe(room)
  }
  await expect(guest.getByText(/restarted the game$/)).toBeVisible()
  await expect(host.getByText(/restarted the game$/)).toHaveCount(0)
  expect(await command(request, { op: 'eval', room, js: 'return room.gameNumber' })).toBe(2)
  await screenshots(guest, 'guest-restarted')
  expect(hostErrors).toEqual([])
  expect(guestErrors).toEqual([])
  await hostContext.close()
  await guestContext.close()
})
