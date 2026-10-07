import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

// Blitzing from the landing page: the list on the clipboard (or pasted, when
// the clipboard can't be read), through the import, into a started game
// against three bots, with no seat board in between.
//
// The import itself is stubbed: dev-rooms serves no `/import-deck`, and the
// real one asks Scryfall about every card the engine lacks. What this
// covers is everything after the import answers — the room, the seats, the
// start and the report — against the real room server.

const LIST = ['Commander', '1 Ghalta, Primal Hunger', '', 'Deck', '1 Tooth and Nail', '1 Grizzly Bears', '30 Forest'].join(
  '\n',
)

/** The import endpoint's answer to LIST: Tooth and Nail stood in for. */
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
    { type: 'progress', done: 4, total: 4, name: 'Forest' },
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

async function expectBlitzStarted(page: Page): Promise<void> {
  // Straight into the game, with no seat board on the way: four players at
  // the table (the bots are named for their decks' commanders).
  await expect(page.getByRole('button', { name: 'History' })).toBeVisible({ timeout: 20_000 })
  await expect(page.locator('.seat-board')).toHaveCount(0)
  expect(await page.evaluate(() => new URL(window.location.href).searchParams.get('room'))).toMatch(/^[A-Z0-9]{5}$/)
  // What the import changed, over the board until clicked.
  const report = page.locator('.blitz-report')
  await expect(report).toContainText('Imported: Ghalta, Primal Hunger: 1 stand-in')
  await expect(report).toContainText('Tooth and Nail → Natural Order')
  await report.click()
  await expect(report).toHaveCount(0)
}

test('blitzing the clipboard starts a game against three bots', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await stubImport(page)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto('/')
  await page.evaluate((text) => navigator.clipboard.writeText(text), LIST)
  await page.getByRole('button', { name: 'Have a deck copied? Click here to blitz!' }).click()

  await expectBlitzStarted(page)
  // The deck was saved, and is now the active one.
  const saved = await page.evaluate(() => window.localStorage.getItem('mtg-engine:decks'))
  expect(saved).toContain('Imported: Ghalta, Primal Hunger')
  expect(errors).toEqual([])
})

test('with no list on the clipboard, a box to paste it into', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await stubImport(page)

  await page.goto('/')
  await page.evaluate(() => navigator.clipboard.writeText('not a decklist'))
  await page.getByRole('button', { name: 'Have a deck copied? Click here to blitz!' }).click()

  await expect(page.getByText("Your clipboard doesn't hold a decklist")).toBeVisible()
  await page.locator('#landing-blitz-list').fill(LIST)
  await page.getByRole('button', { name: 'Blitz', exact: true }).click()

  await expectBlitzStarted(page)
})
