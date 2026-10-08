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
