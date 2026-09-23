import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'

// Each test resets the dev room it uses, so none depends on what an earlier
// one did there. The rooms are defined in server/scripts/dev-scenarios.mjs;
// in each, the first seat is the human one and the rest are scripted bots.

/** dev-rooms' loopback command port. */
const CONTROL = 'http://127.0.0.1:4099'

async function resetRoom(request: APIRequestContext, room: string): Promise<void> {
  const response = await request.post(CONTROL, { data: { op: 'reset', room } })
  expect(response.ok()).toBe(true)
}

/** Uncaught exceptions in the page. Failed requests don't count: card art and
 * fonts come from the network, which a sandboxed run may not reach. */
function pageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

/** Open a room and claim its first (human) seat. */
async function takeSeat(page: Page, room: string): Promise<void> {
  await page.goto(`/?room=${room}`)
  await page.getByRole('button', { name: 'Ready', exact: true }).click()
  await expect(page.getByText(`room ${room}`)).toBeVisible()
}

async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

test('the landing page offers starting and joining a game', async ({ page }) => {
  const errors = pageErrors(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Start a game' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Join a game' })).toBeVisible()
  await expectNoHorizontalScroll(page)
  expect(errors).toEqual([])
})

test('a 2-player table', async ({ page, request }) => {
  await resetRoom(request, 'TWOAA')
  const errors = pageErrors(page)
  await takeSeat(page, 'TWOAA')

  await expect(page.getByText("Player 1's Turn")).toBeVisible()
  for (const card of ['Colossal Dreadmaw', 'Serra Angel', 'Hill Giant']) {
    await expect(page.getByText(card, { exact: true }).first()).toBeVisible()
  }
  await expect(page.getByRole('button', { name: 'Pass (space)' })).toBeVisible()
  await expectNoHorizontalScroll(page)
  expect(errors).toEqual([])
})

test('a 4-player table fits a short screen', async ({ page, request }) => {
  await resetRoom(request, 'FOURP')
  const errors = pageErrors(page)
  await takeSeat(page, 'FOURP')

  for (const seat of ['Bob', 'Carol', 'Dave', 'Player 1']) {
    await expect(page.getByText(seat, { exact: true }).first()).toBeVisible()
  }
  await expectNoHorizontalScroll(page)
  expect(errors).toEqual([])
})

test('passing priority walks into combat and the attack declaration', async ({
  page,
  request,
}) => {
  await resetRoom(request, 'TWOAA')
  const errors = pageErrors(page)
  await takeSeat(page, 'TWOAA')
  const pass = page.getByRole('button', { name: 'Pass (space)' })
  // Bots and animations are paced, so each step change gets some room.
  const paced = { timeout: 15_000 }

  await expect(page.getByText('Precombat Main Phase')).toBeVisible()
  await pass.click()
  // The active player gets priority at the beginning of combat (rule 507.2).
  await expect(page.getByText('Beginning of Combat')).toBeVisible(paced)
  await pass.click()
  await expect(page.getByRole('button', { name: /^(No attacks|Attack with \d+)$/ })).toBeVisible(
    paced,
  )
  expect(errors).toEqual([])
})
