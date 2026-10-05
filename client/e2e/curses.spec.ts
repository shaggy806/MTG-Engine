import { expect, test, type APIRequestContext, type Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

// Curses, Auras that enchant a player: Curse of Opulence cast at carol in a
// three-player room (CURSE) — flagged on alice's board, chipped on carol's
// panel, and paying out once when bob's bot attacks carol — and a Curse
// returned from the graveyard asking which player it enchants (CRSRT). With
// E2E_SHOTS_DIR set, each step is saved at 1366x768 and 1920x1080.

const CONTROL = `http://127.0.0.1:${process.env.E2E_CONTROL_PORT ?? 4099}`
const SHOTS = process.env.E2E_SHOTS_DIR
const SIZES = [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
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

const named = (lines: readonly string[], name: string): string[] =>
  lines.filter((l) => {
    const rest = l.slice(l.indexOf(' ') + 1)
    return rest === name || rest.startsWith(`${name}, `)
  })

async function openRoom(page: Page, request: APIRequestContext, room: string): Promise<RoomState> {
  await control(request, { op: 'reset', room })
  const state = await control<RoomState>(request, { op: 'state', room })
  await page.goto(`/?room=${room}`)
  await page.getByRole('button', { name: 'Ready', exact: true }).click()
  await expect(page.getByText(`room ${room}`)).toBeVisible()
  return state
}

const paced = { timeout: 30_000 }

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

test('CURSE: a Curse cast at a player is shown on them, and pays out once per attack on them', async ({
  page,
  request,
}) => {
  test.setTimeout(180_000)
  const state = await openRoom(page, request, 'CURSE')
  const [curse] = named(state.players.alice.hand, 'Curse of Opulence').map((l) => l.split(' ')[0])
  await expect(page.getByRole('button', { name: 'Pass (space)' })).toBeEnabled(paced)
  // One way to cast it, so the card itself is the button. The fanned hand
  // never holds still for a click.
  await page.locator(`.hand-card[data-obj-id="${curse}"] .card-tile`).dispatchEvent('click')
  // Players are its targets: carol's panel lights up and takes the click.
  const carol = page.locator('.player-panel[data-player-id="carol"]')
  await expect(carol).toHaveClass(/targetable/)
  await carol.click()
  await expect
    .poll(async () => {
      const now = await control<RoomState>(request, { op: 'state', room: 'CURSE' })
      return named(now.players.alice.battlefield, 'Curse of Opulence').length
    }, paced)
    .toBe(1)
  await expect(carol.locator('.pp-curse')).toHaveCount(1, paced)
  await expect(page.locator(`.board [data-obj-id="${curse}"] .card-flag.enchanting`)).toBeVisible(paced)
  await shots(page, 'CURSE-cast')
  // On to bob's turn, where his bot attacks carol with both Bears.
  await expect(async () => {
    const now = await control<RoomState>(request, { op: 'state', room: 'CURSE' })
    if (named(now.players.alice.battlefield, 'Gold Token').length > 0) return
    const pass = page.getByRole('button', { name: 'Pass (space)' })
    if (await pass.isEnabled()) await pass.click()
    throw new Error('no Gold yet')
  }).toPass({ timeout: 90_000 })
  const after = await control<RoomState>(request, { op: 'state', room: 'CURSE' })
  // One trigger for two attackers: one Gold each for alice and bob.
  expect(named(after.players.alice.battlefield, 'Gold Token')).toHaveLength(1)
  expect(named(after.players.bob.battlefield, 'Gold Token')).toHaveLength(1)
  expect(named(after.players.carol.battlefield, 'Gold Token')).toHaveLength(0)
  await shots(page, 'CURSE-attacked')
})

test('CRSRT: a Curse entering without being cast asks which player it enchants', async ({ page, request }) => {
  test.setTimeout(120_000)
  await openRoom(page, request, 'CRSRT')
  await expect(page.getByRole('button', { name: 'Pass (space)' })).toBeEnabled(paced)
  // Return it the way the Archon's trigger would, straight from the room.
  await control(request, {
    op: 'eval',
    room: 'CRSRT',
    js: `const s = game.state;
      const curse = s.zones.perPlayer.alice.graveyard.find((id) => s.objects[id].cardName === "Curse of Verbosity");
      const source = s.zones.shared.battlefield.find((id) => s.objects[id].cardName === "Archon of Falling Stars");
      game.debugApplyEffect("alice", { kind: "put-onto-battlefield", target: 0, underYourControl: true },
        [{ kind: "object", object: curse }], { source });`,
  })
  const banner = page.locator('.decision-banner', { hasText: /click the player it enchants/ })
  await expect(banner).toBeVisible(paced)
  const bob = page.locator('.player-panel[data-player-id="bob"]')
  await expect(bob).toHaveClass(/targetable/)
  await shots(page, 'CRSRT-choose')
  await bob.click()
  await expect(bob.locator('.pp-curse')).toHaveCount(1, paced)
  await shots(page, 'CRSRT-done')
})
