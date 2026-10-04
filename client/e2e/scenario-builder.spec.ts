import { expect, test, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

// The scenario builder (a dev build, against dev-rooms, which has it on):
// build a board from the landing page's dev entry, edit a card picked on the
// board, play from it, and come back to building from where play stands.
// With E2E_SHOTS_DIR set, the drawer is saved at 1366x768, 1920x1080 and
// 2560x1440.

const SHOTS = process.env.E2E_SHOTS_DIR
const SIZES = [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
] as const

const paced = { timeout: 20_000 }

async function shots(page: Page, name: string): Promise<void> {
  if (SHOTS === undefined) return
  mkdirSync(SHOTS, { recursive: true })
  const size = page.viewportSize()
  for (const s of SIZES) {
    await page.setViewportSize(s)
    await page.waitForTimeout(300)
    await page.screenshot({ path: join(SHOTS, `${name}-${s.width}x${s.height}.png`) })
  }
  if (size !== null) await page.setViewportSize(size)
}

/** Searches the pool and adds the first card of that name. */
async function addCard(page: Page, name: string): Promise<void> {
  const panel = page.locator('.builder-panel')
  await panel.getByLabel('Search cards').fill(name)
  await panel.locator('.bp-results button', { hasText: name }).first().click()
}

test('builds a board, edits a card picked on it, plays it, and builds on from there', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/')
  await page.getByRole('button', { name: /Scenario builder/ }).click()
  const panel = page.locator('.builder-panel')
  await expect(panel).toBeVisible(paced)
  await expect(panel.locator('.bp-mode')).toHaveText('Building')
  await expect(panel.getByLabel('Search cards')).toBeEnabled(paced)

  // Bob is a bot once play starts; alice gets a Bear and a Mountain, and a
  // Lightning Bolt in hand.
  // Each edit is the server's to make: a box shows checked once the rebuilt
  // board comes back.
  await panel.getByLabel('Bob is a bot').click()
  await expect(panel.getByLabel('Bob is a bot')).toBeChecked(paced)
  await addCard(page, 'Grizzly Bears')
  await addCard(page, 'Mountain')
  await panel.locator('.bp-section', { hasText: 'Add cards' }).getByLabel('Zone').selectOption('hand')
  await addCard(page, 'Lightning Bolt')
  await expect(page.locator('.board [data-obj-id]', { hasText: 'Grizzly Bears' }).first()).toBeVisible(paced)
  await expect(panel.locator('.bp-zone', { hasText: 'Hand' })).toContainText('Lightning Bolt')

  // A click on the board picks the card for editing, and nothing else.
  await page.locator('.board [data-obj-id]', { hasText: 'Grizzly Bears' }).first().click()
  const selected = panel.locator('.bp-section', { hasText: 'Selected' })
  await expect(selected.locator('.bp-selected-name')).toContainText('Grizzly Bears')
  await selected.getByLabel('Counter kind').fill('+1/+1')
  await selected.getByRole('button', { name: 'Add counter' }).click()
  await selected.getByRole('checkbox', { name: 'Tapped' }).click()
  await expect(panel.locator('.bp-card', { hasText: 'Grizzly Bears' })).toContainText('tapped', paced)
  await expect(panel.locator('.bp-card', { hasText: 'Grizzly Bears' })).toContainText('1 +1/+1')
  await shots(page, 'builder-building')

  // Play: alice can act, and bob's seat is a bot's.
  await panel.getByRole('button', { name: /Start play/ }).click()
  await expect(panel.locator('.bp-mode')).toHaveText('Playing', paced)
  await expect(page.getByRole('button', { name: 'Pass (space)' })).toBeEnabled(paced)
  await shots(page, 'builder-playing')

  // Back to building, from the game as it stands.
  await panel.getByRole('button', { name: 'Edit from here' }).click()
  await expect(panel.locator('.bp-mode')).toHaveText('Building', paced)
  await expect(panel.locator('.bp-card', { hasText: 'Grizzly Bears' })).toContainText('1 +1/+1')
  await expect(panel.locator('.bp-zone', { hasText: 'Hand' })).toContainText('Lightning Bolt')
})

test('grows the table to four and sits at another seat, the board redrawn for it', async ({ page }) => {
  test.setTimeout(120_000)
  await page.goto('/')
  await page.getByRole('button', { name: /Scenario builder/ }).click()
  const panel = page.locator('.builder-panel')
  await expect(panel.getByLabel('Search cards')).toBeEnabled(paced)
  // A table that changes size between frames: the board must follow it.
  await panel.getByRole('button', { name: '4p' }).click()
  await expect(panel.locator('.bp-seats tbody tr')).toHaveCount(4, paced)
  await expect(page.locator('.quadrant-grid')).toBeVisible(paced)
  await panel.locator('.bp-section', { hasText: 'Add cards' }).getByLabel('Owner').selectOption('carol')
  await addCard(page, 'Serra Angel')
  await expect(page.locator('.board [data-obj-id]', { hasText: 'Serra Angel' }).first()).toBeVisible(paced)
  await panel.locator('tr', { hasText: 'Carol' }).getByRole('button', { name: 'Sit' }).click()
  await expect(panel.locator('tr', { hasText: 'Carol' })).toContainText('you', paced)
  await expect(page.locator('.board [data-obj-id]', { hasText: 'Serra Angel' }).first()).toBeVisible(paced)
  await shots(page, 'builder-4p')
  await panel.getByRole('button', { name: '2p' }).click()
  await expect(panel.locator('.bp-seats tbody tr')).toHaveCount(2, paced)
  // Carol's seat went with the table: the developer is moved to alice's.
  await expect(panel.locator('tr', { hasText: 'Alice' })).toContainText('you', paced)
  await expect(page.locator('.board')).toHaveCount(2, paced)
})
