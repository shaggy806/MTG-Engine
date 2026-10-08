import { expect, test } from '@playwright/test'
import type { Browser, Page } from '@playwright/test'

// The waiting room (2026-10-07): four places on the seat board whatever the
// seat count, so adding or removing a player moves nothing; the host's
// "Decks" setting (Commander-legal only); and a full table watched instead of
// joined — the seat board, then the game with every hand hidden.

const roomOf = (page: Page): Promise<string | null> =>
  page.evaluate(() => new URL(window.location.href).searchParams.get('room'))

function pageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
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

const paced = { timeout: 30_000 }

async function newPage(browser: Browser): Promise<Page> {
  return (await browser.newContext()).newPage()
}

/** A host's new room with a second player seated. */
async function twoPlayerRoom(browser: Browser): Promise<{ host: Page; guest: Page; room: string }> {
  const host = await newPage(browser)
  await host.goto('/')
  await host.getByRole('button', { name: 'Create a game' }).click()
  await expect(host.getByRole('button', { name: 'Ready', exact: true })).toBeVisible()
  const room = await roomOf(host)
  if (room === null) throw new Error('no room code')
  const guest = await newPage(browser)
  await guest.goto(`/?room=${room}`)
  await expect(guest.getByRole('button', { name: 'Ready', exact: true })).toBeVisible()
  return { host, guest, room }
}

test('the seat board keeps four places: adding a player moves no one', async ({ browser }) => {
  const host = await newPage(browser)
  const errors = pageErrors(host)
  await host.goto('/')
  await host.getByRole('button', { name: 'Create a game' }).click()
  const grid = host.locator('.seat-board-grid')
  await expect(grid.locator('.seat-panel')).toHaveCount(2)
  await expect(grid.locator('> *')).toHaveCount(4)
  await expect(grid.getByRole('button', { name: /Add player/ })).toHaveCount(2)
  const before = await grid.locator('.seat-panel').first().boundingBox()
  const gridBefore = await grid.boundingBox()
  await shots(host, 'lobby-two-seats')

  await grid.getByRole('button', { name: /Add player/ }).first().click()
  await expect(grid.locator('.seat-panel')).toHaveCount(3)
  await expect(grid.locator('> *')).toHaveCount(4)
  await grid.getByRole('button', { name: /Add player/ }).first().click()
  await expect(grid.locator('.seat-panel')).toHaveCount(4)
  await expect(grid.getByRole('button', { name: /Add player/ })).toHaveCount(0)
  expect(await grid.locator('.seat-panel').first().boundingBox()).toEqual(before)
  expect(await grid.boundingBox()).toEqual(gridBefore)
  await shots(host, 'lobby-four-seats')
  expect(errors).toEqual([])
  await host.context().close()
})

test('the host can allow only Commander-legal decks, and everyone sees it', async ({ browser }) => {
  const { host, guest } = await twoPlayerRoom(browser)
  const decks = (page: Page) => page.locator('.rs-options[aria-label="Decks"]')
  await expect(decks(host).getByRole('button', { name: 'Any deck' })).toHaveClass(/active/)
  await decks(host).getByRole('button', { name: 'Commander-legal' }).click()
  await expect(decks(host).getByRole('button', { name: 'Commander-legal' })).toHaveClass(/active/)
  // Not the host's to change: the guest reads it.
  await expect(guest.getByRole('button', { name: 'Commander-legal' })).toHaveCount(0)
  await expect(guest.getByText('Commander-legal', { exact: false }).first()).toBeVisible()
  // The default decks are real precons: legal, so nothing is refused.
  await expect(host.locator('.seat-deck-refused')).toHaveCount(0)
  await shots(host, 'lobby-commander-legal')
  await host.context().close()
  await guest.context().close()
})

test("the host picks the bots' decks: upgraded precons for every bot added", async ({ browser }) => {
  const { host, guest } = await twoPlayerRoom(browser)
  const pool = (page: Page) => page.locator('.rs-options[aria-label="Bot decks"]')
  await expect(pool(host).getByRole('button', { name: 'Precons' })).toHaveClass(/active/)
  await pool(host).getByRole('button', { name: 'Upgraded' }).click()
  await expect(pool(host).getByRole('button', { name: 'Upgraded' })).toHaveClass(/active/)
  await expect(guest.getByText('Upgraded precons')).toBeVisible()
  const grid = host.locator('.seat-board-grid')
  await grid.getByRole('button', { name: /Add player/ }).first().click()
  await host.getByRole('button', { name: 'Add bot (random deck)' }).first().click()
  await expect(host.locator('.seat-deck-name', { hasText: '(Upgraded)' })).toHaveCount(1)
  await shots(host, 'lobby-upgraded-bots')
  await host.context().close()
  await guest.context().close()
})

test('a full room can be watched: the seat board, then the game with no hand', async ({ browser }) => {
  // A waiting room grows a seat for each newcomer up to four, so it's full
  // at four: the host and three bots.
  const host = await newPage(browser)
  await host.goto('/')
  await host.getByRole('button', { name: 'Create a game' }).click()
  await expect(host.getByRole('button', { name: 'Ready', exact: true })).toBeVisible()
  const room = await roomOf(host)
  if (room === null) throw new Error('no room code')
  const addPlayer = host.locator('.seat-board-grid').getByRole('button', { name: /Add player/ })
  await addPlayer.first().click()
  await expect(host.locator('.seat-panel')).toHaveCount(3)
  await addPlayer.first().click()
  await expect(host.locator('.seat-panel')).toHaveCount(4)
  for (let i = 0; i < 3; i += 1) {
    await host.getByRole('button', { name: 'Add bot (random deck)' }).first().click()
    await expect(host.getByRole('button', { name: 'Add bot (random deck)' })).toHaveCount(2 - i)
  }

  const watcher = await newPage(browser)
  const errors = pageErrors(watcher)
  await watcher.goto(`/?room=${room}`)
  await expect(watcher.getByText('Room is full.')).toBeVisible()
  await watcher.getByRole('button', { name: 'Spectate' }).click()
  await expect(watcher.getByText(/You're spectating/)).toBeVisible()
  // No seat taken: still two players, and no Ready button for the watcher.
  await expect(watcher.locator('.seat-panel')).toHaveCount(4)
  await expect(watcher.getByRole('button', { name: 'Ready', exact: true })).toHaveCount(0)
  await shots(watcher, 'spectate-lobby')

  await host.getByRole('button', { name: 'Ready', exact: true }).click()
  await host.getByRole('button', { name: 'Start Game' }).click()

  // The watcher follows into the game: the board, tagged, nothing to decide.
  await expect(watcher.locator('.ts-spectating')).toBeVisible(paced)
  await expect(watcher.getByText(`room ${room}`)).toBeVisible()
  await expect(host.getByText('Keep your opening hand?')).toBeVisible(paced)
  await expect(watcher.getByText('Keep your opening hand?')).toHaveCount(0)
  await expect(watcher.locator('.hand-card')).toHaveCount(0)
  // Nothing to pass, and nothing sent that only a seat may send.
  await expect(watcher.getByRole('button', { name: 'Pass (space)' })).toHaveCount(0)
  await expect(watcher.getByRole('button', { name: 'Auto-pass' })).toHaveCount(0)
  await expect(watcher.getByText(/claim a seat/)).toHaveCount(0)
  await watcher.getByRole('button', { name: 'Game', exact: true }).click()
  await expect(watcher.getByRole('button', { name: /Concede/ })).toHaveCount(0)
  await expect(watcher.getByRole('button', { name: /Let a bot play/ })).toHaveCount(0)
  await watcher.keyboard.press('Escape')
  await shots(watcher, 'spectate-game')

  // Someone arriving once the game is under way can watch it too.
  const late = await newPage(browser)
  await late.goto(`/?room=${room}`)
  await late.getByRole('button', { name: 'Spectate' }).click(paced)
  await expect(late.locator('.ts-spectating')).toBeVisible(paced)
  await expect(late.getByText('Keep your opening hand?')).toHaveCount(0)
  expect(errors).toEqual([])
  for (const page of [host, watcher, late]) await page.context().close()
})
