import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'
import type { Page, Route } from '@playwright/test'

// The library and the deck builder wait on all 32 card shards before they
// render (main.tsx), drawing a progress bar meanwhile (cards/PoolLoading.tsx).
// Each test here holds the shards' responses and lets them through by hand,
// so the bar can be read part-way.
//
// With E2E_SHOTS_DIR set, the tests also save screenshots there: the bar
// part-way and the loaded page at three screen sizes, and the bar filling a
// shard at a time as a numbered frame sequence.

/** A shard's file, in the dev server (`…/cards/shards/shard-07.js`) or a
 * build (`assets/shard-07-<hash>.js`). */
const SHARD = /\/shard-\d+(?:-[\w-]+)?\.js(?:\?.*)?$/

const SIZES = [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
] as const

const shotsDir = process.env.E2E_SHOTS_DIR

async function shot(page: Page, name: string): Promise<void> {
  if (shotsDir === undefined) return
  mkdirSync(shotsDir, { recursive: true })
  await page.screenshot({ path: join(shotsDir, `${name}.png`) })
}

async function shotAtEverySize(page: Page, name: string): Promise<void> {
  if (shotsDir === undefined) return
  for (const size of SIZES) {
    await page.setViewportSize(size)
    await shot(page, `${name}-${size.width}x${size.height}`)
  }
  await page.setViewportSize(SIZES[0])
}

/** Holds every shard request until the test lets it through. */
async function holdShards(page: Page) {
  const held: Route[] = []
  await page.route(SHARD, (route) => {
    held.push(route)
  })
  return {
    /** Waits until all `count` shards have been asked for. */
    async requested(count = 32) {
      await expect.poll(() => held.length, { timeout: 30_000 }).toBe(count)
    },
    /** Lets the next `count` held shards through. */
    async release(count: number) {
      for (const route of held.splice(0, count)) await route.continue()
    },
    async fail(count: number) {
      for (const route of held.splice(0, count)) await route.abort()
    },
  }
}

const progressBar = (page: Page) => page.getByRole('progressbar', { name: 'Loading cards…' })

/** Uncaught exceptions in the page. Failed requests don't count. */
function pageErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  return errors
}

for (const { path, name, ready } of [
  { path: '/library', name: 'library', ready: 'Card Library' },
  { path: '/deck-builder', name: 'deck-builder', ready: 'Deck Builder' },
]) {
  test(`${path} shows the card shards coming in, then the page`, async ({ page }) => {
    const errors = pageErrors(page)
    const shards = await holdShards(page)
    await page.goto(path)
    await shards.requested()

    const bar = progressBar(page)
    await expect(bar).toBeVisible()
    await expect(bar).toHaveAttribute('aria-valuemin', '0')
    await expect(bar).toHaveAttribute('aria-valuemax', '32')
    await expect(bar).toHaveAttribute('aria-valuenow', '0')

    await shards.release(12)
    await expect(bar).toHaveAttribute('aria-valuenow', '12', { timeout: 30_000 })
    await expect(bar).toHaveAttribute('aria-valuetext', '38% (12 of 32 card files)')
    await expect(page.getByText('38%')).toBeVisible()
    await shotAtEverySize(page, `${name}-midload`)
    if (shotsDir !== undefined && name === 'library') {
      await page.emulateMedia({ colorScheme: 'light' })
      await shot(page, `${name}-midload-light-1366x768`)
      await page.emulateMedia({ colorScheme: 'dark' })
    }

    // The rest one at a time, a frame a step, for the frame sequence.
    for (let i = 0; i < 20; i++) {
      await shards.release(1)
      if (shotsDir !== undefined) {
        await page.waitForTimeout(100)
        await shot(page, `${name}-fill-${String(i + 1).padStart(2, '0')}`)
      }
    }

    await expect(page.getByRole('heading', { name: ready })).toBeVisible({ timeout: 30_000 })
    await expect(bar).toHaveCount(0)
    await shotAtEverySize(page, `${name}-loaded`)
    expect(errors).toEqual([])
  })
}

test('a shard that fails to load says so, rather than leaving the bar where it was', async ({
  page,
}) => {
  const shards = await holdShards(page)
  await page.goto('/library')
  await shards.requested()
  await shards.release(20)
  await expect(progressBar(page)).toHaveAttribute('aria-valuenow', '20', { timeout: 30_000 })

  await shards.fail(1)
  const alert = page.getByRole('alert')
  await expect(alert).toContainText("The card data couldn't be loaded.")
  await expect(alert.getByRole('button', { name: 'Reload' })).toBeVisible()
  await expect(progressBar(page)).toHaveCount(0)
  await shotAtEverySize(page, 'library-failed')
  await shards.release(11)
})

test('a shard that never answers brings up a reload offer after a while', async ({ page }) => {
  await page.clock.install()
  const shards = await holdShards(page)
  await page.goto('/deck-builder')
  await shards.requested()
  await shards.release(31)
  const bar = progressBar(page)
  await expect(bar).toHaveAttribute('aria-valuenow', '31', { timeout: 30_000 })
  const hint = page.getByText('This is taking longer than usual.')
  await expect(hint).toHaveCount(0)
  // The hint's live region is already there, empty, so a screen reader
  // announces the hint when it's filled in.
  const region = page.getByRole('status')
  await expect(region).toHaveCount(1)
  await expect(region).toBeEmpty()
  const before = await bar.boundingBox()

  await page.clock.fastForward(16_000)
  await expect(hint).toBeVisible()
  await expect(region).toContainText('This is taking longer than usual.')
  await expect(region.getByRole('button', { name: 'Reload' })).toBeVisible()
  // The hint appears under the bar without moving it.
  expect(await bar.boundingBox()).toEqual(before)
  await shotAtEverySize(page, 'deck-builder-stalled')

  // The last shard turning up after all still opens the page.
  await shards.release(1)
  await expect(page.getByRole('heading', { name: 'Deck Builder' })).toBeVisible({
    timeout: 30_000,
  })
})

test("the bar's movement follows the viewer's motion settings", async ({ page }) => {
  // The fill's step and the whole screen's fade-in.
  const motion = () =>
    page.evaluate(() => ({
      fill: getComputedStyle(document.querySelector('.pool-progress-fill')!).transitionDuration,
      fade: (() => {
        const style = getComputedStyle(document.querySelector('.pool-status-loading')!)
        return style.animationName === 'none' ? 'none' : style.animationDuration
      })(),
    }))
  const loadWith = async (settings: object) => {
    await page.unrouteAll({ behavior: 'ignoreErrors' })
    // Init scripts run in the order they were added, so the latest wins.
    await page.addInitScript(
      (s) => window.localStorage.setItem('mtg.motion', s),
      JSON.stringify(settings),
    )
    const shards = await holdShards(page)
    await page.goto('/library')
    await shards.requested()
    const seen = await motion()
    await shards.release(32)
    await expect(page.getByRole('heading', { name: 'Card Library' })).toBeVisible({
      timeout: 30_000,
    })
    return seen
  }

  // Animation speed: twice as slow, twice as long.
  expect(await loadWith({ animScale: 2 })).toEqual({ fill: '0.32s', fade: '0.6s' })

  // Reduced motion, from the browser: no movement at all.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  expect(await loadWith({ animScale: 2 })).toEqual({ fill: '0s', fade: 'none' })

  // Reduced motion, from the viewer's own setting with the browser saying
  // nothing: the same.
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  expect(await loadWith({ reduceMotion: true })).toEqual({ fill: '0s', fade: 'none' })
})
