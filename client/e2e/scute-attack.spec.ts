import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'

// A bug report (2026-10-07): 336 Scute Swarm tokens, and the attack bar
// offered only 103 — the engine woke at most 100 tokens of a stack for
// combat. Now a stack past that attacks as one counted attacker, every token
// of it. Dev rooms SCUTE (2 players) and SCUT4 (4): one stack of 336 tokens
// and the card itself; bob has two Grizzly Bears to block with.

const CONTROL = `http://127.0.0.1:${process.env.E2E_CONTROL_PORT ?? 4099}`

test.describe.configure({ timeout: 120_000 })

async function control<T>(request: APIRequestContext, body: object): Promise<T> {
  const response = await request.post(CONTROL, { data: body })
  expect(response.ok()).toBe(true)
  return (await response.json()) as T
}

for (const { room, size } of [
  { room: 'SCUTE', size: { width: 1366, height: 768 } },
  { room: 'SCUT4', size: { width: 1920, height: 1080 } },
]) {
  test(`${room} ${size.width}x${size.height}: every Scute Swarm attacks`, async ({ page, request }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await control(request, { op: 'reset', room })
    // Enough life to take the swing and still be there to look at.
    await control(request, { op: 'life', room, player: 'bob', value: 10_000 })
    await page.setViewportSize(size)
    await page.goto(`/?room=${room}`)
    await page.getByRole('button', { name: 'Ready', exact: true }).click()
    const pass = page.getByRole('button', { name: 'Pass (space)' })
    await expect(pass).toBeEnabled({ timeout: 20_000 })
    await pass.click()

    // Declare attackers: the bar offers the stack's every token, and the card.
    await expect(page.getByText(/Declare attackers/)).toBeVisible({ timeout: 20_000 })
    await page.locator('.controls').getByRole('button', { name: /All attack|Select all/ }).click()
    if (room === 'SCUT4') {
      // Four players: the tokens wait for a defender — send them all at bob.
      await page.locator('[data-player-id="bob"]').first().click()
    }
    await expect(page.getByText('Declare attackers — 337 attacking')).toBeVisible()
    await page.screenshot({ path: test.info().outputPath(`${room}-declared.png`) })
    await page.locator('.controls').getByRole('button', { name: 'Attack with 337' }).click()

    // Bob's two Bears block a token each at most; every other token connects.
    await expect
      .poll(async () => (await control<{ players: Record<string, { life: number }> }>(request, { op: 'state', room })).players.bob.life, {
        timeout: 30_000,
      })
      .toBeLessThanOrEqual(10_000 - 335)
    await page.screenshot({ path: test.info().outputPath(`${room}-after.png`) })
    expect(errors).toEqual([])
  })
}

test('SCUT4: a stack asks how many attack each opponent', async ({ page, request }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await control(request, { op: 'reset', room: 'SCUT4' })
  for (const player of ['bob', 'carol']) await control(request, { op: 'life', room: 'SCUT4', player, value: 10_000 })
  await page.setViewportSize({ width: 1366, height: 768 })
  await page.goto('/?room=SCUT4')
  await page.getByRole('button', { name: 'Ready', exact: true }).click()
  const pass = page.getByRole('button', { name: 'Pass (space)' })
  await expect(pass).toBeEnabled({ timeout: 20_000 })
  await pass.click()
  await expect(page.getByText(/Declare attackers/)).toBeVisible({ timeout: 20_000 })

  // The stack's tile, by its count badge: a popup, a row per opponent.
  await page.locator('.quadrant-cell.self .mini-tile-wrap', { hasText: '336' }).first().click()
  const menu = page.getByRole('menu', { name: 'How many attack each defender' })
  await expect(menu).toBeVisible()
  for (const name of ['Bob', 'Carol', 'Dave']) await expect(menu.getByText(`→ ${name}`)).toBeVisible()
  await menu.getByRole('spinbutton', { name: '→ Bob: how many' }).fill('200')
  await expect(menu.getByText('— 200 attacking')).toBeVisible()
  // "All" sends the rest: 136 at Carol, none left for Dave.
  const carolRow = menu.locator('.attack-split-row', { hasText: '→ Carol' })
  await carolRow.getByRole('button', { name: 'All' }).click()
  await expect(menu.getByText('— 336 attacking')).toBeVisible()
  await expect(menu.locator('.attack-split-row', { hasText: '→ Dave' }).getByRole('spinbutton')).toHaveValue('0')
  await page.screenshot({ path: test.info().outputPath('SCUT4-split.png') })
  await menu.getByRole('button', { name: 'Done' }).click()
  await expect(menu).toHaveCount(0)
  await expect(page.getByText('Declare attackers — 336 attacking')).toBeVisible()
  await page.locator('.controls').getByRole('button', { name: 'Attack with 336' }).click()

  // Bob's Bears block a token each at most; Carol takes all 136.
  const life = async () =>
    (await control<{ players: Record<string, { life: number }> }>(request, { op: 'state', room: 'SCUT4' })).players
  await expect.poll(async () => (await life()).carol.life, { timeout: 30_000 }).toBe(10_000 - 136)
  await expect.poll(async () => (await life()).bob.life, { timeout: 30_000 }).toBeLessThanOrEqual(10_000 - 198)
  expect(errors).toEqual([])
})

for (const size of [
  { width: 1366, height: 768 },
  { width: 2560, height: 1440 },
]) {
  test(`SCUTB ${size.width}x${size.height}: blockers share a token of a menace stack`, async ({ page, request }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await control(request, { op: 'reset', room: 'SCUTB' })
    await page.setViewportSize(size)
    await page.goto('/?room=SCUTB')
    await page.getByRole('button', { name: 'Ready', exact: true }).click()

    // It's bob's turn: he attacks with his stack of 150; alice declares blockers.
    await expect(page.getByText(/Declare blockers/)).toBeVisible({ timeout: 90_000 })
    const bears = page.locator('.quadrant-cell.self .mini-tile-wrap', { hasText: 'Grizzly Bears' })
    const count = await bears.count()
    for (let i = 0; i < count; i += 1) await bears.nth(i).click()
    await expect(page.getByText('Declare blockers — 4 assigned')).toBeVisible()
    // A token each, and every token has menace: not a legal block yet.
    await expect(page.getByText(/has menace/)).toBeVisible()
    const block = page.locator('.controls').getByRole('button', { name: 'Block (4)' })
    await expect(block).toBeDisabled()

    // The stack's popup: two blockers to a token.
    await page.locator('.mini-tile-wrap', { hasText: '150' }).first().click()
    const menu = page.getByRole('menu', { name: 'How many blockers share each token' })
    await expect(menu).toBeVisible()
    await expect(menu.getByText('4 blocking 4 tokens, 1 on each.')).toBeVisible()
    await menu.getByRole('spinbutton', { name: 'Blockers per token: how many' }).fill('2')
    await expect(menu.getByText('4 blocking 2 tokens, 2 on each.')).toBeVisible()
    await page.screenshot({ path: test.info().outputPath(`SCUTB-${size.width}x${size.height}-split.png`) })
    await menu.getByRole('button', { name: 'Done' }).click()
    await expect(page.getByText(/has menace/)).toHaveCount(0)
    await expect(block).toBeEnabled()
    await block.click()

    // Two tokens blocked, two Bears on each: the other 148 connect.
    await expect
      .poll(async () => (await control<{ players: Record<string, { life: number }> }>(request, { op: 'state', room: 'SCUTB' })).players.alice.life, {
        timeout: 30_000,
      })
      .toBe(10_000 - 148)
    expect(errors).toEqual([])
  })
}
