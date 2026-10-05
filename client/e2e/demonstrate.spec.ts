import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

// Demonstrate (DEMON): Transforming Flourish cast at bob's Grizzly Bears asks
// "copy this spell?" in the decision banner; yes puts alice's copy and bob's
// on the stack above it, bob's on top, and bob is the one who exiles and is
// offered a free cast. With E2E_SHOTS_DIR set, each step is saved.

const CONTROL = `http://127.0.0.1:${process.env.E2E_CONTROL_PORT ?? 4099}`
const SHOTS = process.env.E2E_SHOTS_DIR

interface RoomState {
  readonly stack: readonly string[]
  readonly players: Record<
    string,
    { readonly hand: readonly string[]; readonly battlefield: readonly string[] }
  >
}

async function control<T>(request: APIRequestContext, body: object): Promise<T> {
  const response = await request.post(CONTROL, { data: body })
  expect(response.ok()).toBe(true)
  return (await response.json()) as T
}

async function shot(page: Page, name: string): Promise<void> {
  if (SHOTS === undefined) return
  mkdirSync(SHOTS, { recursive: true })
  await page.screenshot({ path: join(SHOTS, `${name}.png`) })
}

const paced = { timeout: 30_000 }

test('DEMON: demonstrate copies for alice and then for bob, whose copy is on top', async ({ page, request }) => {
  test.setTimeout(120_000)
  await control(request, { op: 'reset', room: 'DEMON' })
  const state = await control<RoomState>(request, { op: 'state', room: 'DEMON' })
  const flourish = state.players.alice.hand.find((l) => l.endsWith('Transforming Flourish'))!.split(' ')[0]
  const bears = state.players.bob.battlefield.find((l) => l.includes('Grizzly Bears'))!.split(' ')[0]
  await page.goto('/?room=DEMON')
  await page.getByRole('button', { name: 'Ready', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pass (space)' })).toBeEnabled(paced)
  // One way to cast it: the card is the button. The fanned hand never holds
  // still for a click.
  await page.locator(`.hand-card[data-obj-id="${flourish}"] .card-tile`).dispatchEvent('click')
  await page.locator(`.board [data-obj-id="${bears}"]`).first().click()
  const banner = page.locator('.decision-banner', { hasText: /Demonstrate: copy this spell/ })
  await expect(banner).toBeVisible(paced)
  await shot(page, 'DEMON-ask')
  await banner.getByRole('button', { name: 'Yes', exact: true }).click()
  // Bottom first: the spell, alice's copy, bob's copy on top — read in one
  // go, since the stack moves on as soon as everyone passes.
  await expect
    .poll(
      async () =>
        control<string[]>(request, {
          op: 'eval',
          room: 'DEMON',
          js: 'return game.state.zones.shared.stack.map((id) => game.state.objects[id].controller)',
        }),
      paced,
    )
    .toEqual(['alice', 'alice', 'bob'])
  await shot(page, 'DEMON-stack')
})
