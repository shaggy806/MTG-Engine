import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'

// Exiling from the top of a library plays the way a mill does: the cards peel
// off the pile one after another, its count ticks down card by card, and one
// "−N exiled" floats off it. Played for real in the EXILE / EXIL4 dev rooms
// (server/scripts/dev-scenarios.mjs), where alice holds an impulse draw, a
// cascade spell, Ulamog and Pako.

// Bots and animations are paced, so each resolution gets some room.
const paced = { timeout: 20_000 }

const CONTROL = `http://127.0.0.1:${process.env.E2E_CONTROL_PORT ?? 4099}`

async function resetRoom(request: APIRequestContext, room: string): Promise<void> {
  const response = await request.post(CONTROL, { data: { op: 'reset', room } })
  expect(response.ok()).toBe(true)
}

function pageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

/** What the peels put on screen, sampled every animation frame: each
 * floating word, the most cards peeling at once, and every value each
 * player's "library N" count showed, in order. */
interface PeelRecord {
  floats: string[]
  maxPeeling: number
  libraryCounts: Record<string, string[]>
}

async function recordPeels(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const record: PeelRecord = { floats: [], maxPeeling: 0, libraryCounts: {} }
    ;(window as unknown as { peels: PeelRecord }).peels = record
    // Watching the document itself: an init script runs before it has any
    // element, `documentElement` included.
    new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node instanceof HTMLElement && node.classList.contains('float-text')) {
            record.floats.push(node.textContent ?? '')
          }
        }
      }
    }).observe(document, { childList: true, subtree: true })
    const sample = (): void => {
      record.maxPeeling = Math.max(record.maxPeeling, document.querySelectorAll('.peel-card').length)
      for (const el of document.querySelectorAll('[data-library-count-of]')) {
        const who = el.getAttribute('data-library-count-of') ?? ''
        const seen = (record.libraryCounts[who] ??= [])
        const text = el.textContent ?? ''
        if (seen.at(-1) !== text) seen.push(text)
      }
      requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  })
}

const peels = (page: Page): Promise<PeelRecord> =>
  page.evaluate(() => (window as unknown as { peels: PeelRecord }).peels)

const clearPeels = (page: Page): Promise<void> =>
  page.evaluate(() => {
    const record = (window as unknown as { peels: PeelRecord }).peels
    record.floats = []
    record.maxPeeling = 0
    record.libraryCounts = {}
  })

const exiledFloats = (record: PeelRecord): string[] =>
  record.floats.filter((f) => f.includes('exiled')).sort()

/** Whether `seen` shows "library <from>", "library <from − 1>", … down to
 * "library <to>", in that order (with anything else in between). */
function countsDown(seen: readonly string[] | undefined, from: number, to: number): boolean {
  let next = from
  for (const text of seen ?? []) if (next >= to && text === `library ${next}`) next -= 1
  return next < to
}

async function takeSeat(page: Page, room: string): Promise<void> {
  await page.goto(`/?room=${room}`)
  await page.getByRole('button', { name: 'Ready', exact: true }).click()
  await expect(page.getByText(`room ${room}`)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pass (space)' })).toBeEnabled()
}

async function cast(page: Page, card: string): Promise<void> {
  await page.locator('.hand-cards [data-obj-id]').filter({ hasText: card }).first().click()
  // Off the hand, so the raised fan doesn't cover the board.
  await page.mouse.move(400, 40)
}

const passButton = (page: Page) => page.getByRole('button', { name: 'Pass (space)' })

/** Wait for the peels a pass set off to start, then to finish. */
async function peelsPlayed(page: Page, count: number): Promise<void> {
  await expect.poll(async () => exiledFloats(await peels(page)).length, paced).toBeGreaterThanOrEqual(count)
  await expect(page.locator('.peel-card')).toHaveCount(0, paced)
}

test('an impulse draw peels its two cards off one after another', async ({ page, request }) => {
  await resetRoom(request, 'EXILE')
  const errors = pageErrors(page)
  await recordPeels(page)
  await takeSeat(page, 'EXILE')
  await clearPeels(page)

  await cast(page, 'Reckless Impulse')
  await passButton(page).click()
  await peelsPlayed(page, 1)
  await expect(page.locator('[data-exile-count-of="alice"]')).toHaveText('exile 2', paced)

  const seen = await peels(page)
  expect(exiledFloats(seen)).toEqual(['−2 exiled'])
  expect(seen.maxPeeling).toBe(2)
  // The count ran down a card at a time on the old board, not in one jump.
  expect(countsDown(seen.libraryCounts.alice, 61, 59), String(seen.libraryCounts.alice)).toBe(true)
  expect(errors).toEqual([])
})

test("a cascade's cards, exiled one move at a time, peel as one run", async ({
  page,
  request,
}) => {
  await resetRoom(request, 'EXILE')
  const errors = pageErrors(page)
  await recordPeels(page)
  await takeSeat(page, 'EXILE')
  await clearPeels(page)

  // Forest, Island, Mountain, Plains, then Divination: five one-card moves.
  await cast(page, 'Bloodbraid Elf')
  await passButton(page).click()
  await expect(page.getByText('Cast Divination without paying its mana cost')).toBeVisible(paced)

  const seen = await peels(page)
  // One run of five, not five cards peeling at once under five "−1"s.
  expect(exiledFloats(seen)).toEqual(['−5 exiled'])
  expect(seen.maxPeeling).toBe(5)
  expect(countsDown(seen.libraryCounts.alice, 61, 56), String(seen.libraryCounts.alice)).toBe(true)
  expect(errors).toEqual([])
})

test("exiling the top twenty, and each player's top card, at four players", async ({
  page,
  request,
}) => {
  await resetRoom(request, 'EXIL4')
  const errors = pageErrors(page)
  await recordPeels(page)
  await takeSeat(page, 'EXIL4')

  // On to the attack: Mystic Forge's ability stops the beginning of combat.
  const declare = page.getByRole('button', { name: /^(No attacks|Attack with \d+)$/ })
  await expect(async () => {
    if (!(await declare.isVisible())) {
      const pass = passButton(page)
      if ((await pass.isVisible()) && (await pass.isEnabled())) await pass.click()
    }
    await expect(declare).toBeVisible({ timeout: 3_000 })
  }).toPass(paced)
  for (const name of ['Ulamog, the Ceaseless Hunger', 'Pako, Arcane Retriever']) {
    await page.locator('.board [data-obj-id]').filter({ hasText: name }).first().click()
  }
  // Several opponents: the selected attackers wait to be told whom.
  await page.locator('[data-player-id="bob"]').first().click()
  await page.getByRole('button', { name: 'Attack with 2' }).click()
  await page.mouse.move(400, 40)
  await clearPeels(page)

  // Both attack triggers, each resolving on a pass: Pako takes every
  // library's top card in one move, Ulamog the top twenty of bob's.
  await passButton(page).click()
  await peelsPlayed(page, 1)
  await passButton(page).click()
  await peelsPlayed(page, 5)
  await expect(page.locator('[data-library-count-of="bob"]')).toHaveText('library 32', paced)

  const seen = await peels(page)
  expect(exiledFloats(seen)).toEqual(['−1 exiled', '−1 exiled', '−1 exiled', '−1 exiled', '−20 exiled'])
  // Twenty cards, at most eight of them shown peeling.
  expect(seen.maxPeeling).toBe(8)
  for (const player of ['alice', 'carol', 'dave']) {
    expect(seen.libraryCounts[player]?.length, player).toBeGreaterThanOrEqual(2)
  }
  // Bob's ran down in steps (52, 49, 47, … 32) rather than in one jump.
  const steps = seen.libraryCounts.bob.filter((c) => /^library (3[3-9]|4\d|5[01])$/.test(c))
  expect(steps.length, String(seen.libraryCounts.bob)).toBeGreaterThanOrEqual(5)
  expect(errors).toEqual([])
})
