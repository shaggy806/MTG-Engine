import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'

// Cards into and out of your own hand (the user, 2026-10-07), in the dev
// rooms CASTN (2 players) and CAST4 (4): Divination cast from alice's hand
// lifts out of its own place in the fan, and its two draws turn over off her
// library and settle into theirs. The animations are frozen at points along
// the way to check where the cards are and to screenshot them.

const CONTROL = `http://127.0.0.1:${process.env.E2E_CONTROL_PORT ?? 4099}`

test.describe.configure({ timeout: 120_000 })

interface RoomState {
  readonly players: Record<string, { readonly hand: readonly string[] }>
}

async function control<T>(request: APIRequestContext, body: object): Promise<T> {
  const response = await request.post(CONTROL, { data: body })
  expect(response.ok()).toBe(true)
  return (await response.json()) as T
}

function idOf(state: RoomState, player: string, name: string): string {
  const line = state.players[player].hand.find((l) => l.split(' ').slice(1).join(' ') === name)
  if (line === undefined) throw new Error(`${player} has no ${name} in hand`)
  return line.split(' ')[0]
}

interface Box {
  readonly x: number
  readonly y: number
  readonly w: number
}

/** The centre and width of `selector`'s first element as drawn, undoing its
 * rotation: a rotated box's bounding rect is wider than the card. */
async function drawnBox(page: Page, selector: string): Promise<Box | null> {
  return page.evaluate((sel) => {
    const el = document.querySelector<HTMLElement>(sel)
    if (el === null) return null
    const r = el.getBoundingClientRect()
    // The rotation the element itself and its ancestors draw it at.
    let angle = 0
    for (let n: HTMLElement | null = el; n; n = n.parentElement) {
      const t = new DOMMatrix(getComputedStyle(n).transform)
      angle += Math.atan2(t.b, t.a)
      const rot = getComputedStyle(n).rotate
      if (rot !== 'none') angle += (Number.parseFloat(rot) * Math.PI) / 180
    }
    const c = Math.abs(Math.cos(angle))
    const s = Math.abs(Math.sin(angle))
    // Bounding width = w·c + h·s with h = 1.4·w (a card's box).
    const w = r.width / (c + 1.4 * s)
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w }
  }, selector)
}

/** Every animation inside `filter`, frozen `fraction` of the way through it. */
async function freeze(page: Page, filter: string, fraction: number): Promise<void> {
  await page.evaluate(
    ([f, frac]) => {
      for (const a of document.getAnimations()) {
        const target = (a.effect as KeyframeEffect | null)?.target as Element | null
        if (!target?.closest(f as string)) continue
        const timing = a.effect?.getComputedTiming()
        const delay = Number(a.effect?.getTiming().delay ?? 0)
        const duration = Number(timing?.duration ?? 0)
        a.pause()
        a.currentTime = delay + duration * (frac as number)
      }
    },
    [filter, fraction] as const,
  )
}

async function resume(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const a of document.getAnimations()) if (a.playState === 'paused') a.play()
  })
}

const SIZES = [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
] as const

// The 4-player room at half speed (Settings' animation speed 2x), which
// also gives the screenshots time to catch the draws mid-flight.
for (const { room, size, animScale } of [
  { room: 'CASTN', size: SIZES[0], animScale: 1 },
  { room: 'CASTN', size: SIZES[1], animScale: 1 },
  { room: 'CASTN', size: SIZES[2], animScale: 1 },
  { room: 'CAST4', size: SIZES[1], animScale: 2 },
]) {
  test(`${room} ${size.width}x${size.height}: a card lifts out of the hand, and draws settle into it`, async ({
    page,
    request,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await control(request, { op: 'reset', room })
    const state = await control<RoomState>(request, { op: 'state', room })
    await page.setViewportSize(size)
    await page.addInitScript((scale) => {
      window.localStorage.setItem('mtg.motion', JSON.stringify({ animScale: scale }))
    }, animScale)
    await page.goto(`/?room=${room}`)
    await page.getByRole('button', { name: 'Ready', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Pass (space)' })).toBeEnabled({ timeout: 20_000 })
    const shot = (name: string) =>
      page.screenshot({ path: test.info().outputPath(`${room}-${size.width}x${size.height}-${name}.png`) })

    // Clicked with the pointer elsewhere, so the card stands in its fan pose
    // from the click to the cast (a hovered card is lifted from its grown
    // pose, which a remount under a resting pointer can be easing out of).
    const divination = idOf(state, 'alice', 'Divination')
    const handTile = `.hand-cards .hand-card[data-obj-id="${divination}"] .card-tile`
    await page.mouse.move(size.width / 2, 10)
    await page.waitForTimeout(400)
    const inHand = await drawnBox(page, handTile)
    expect(inHand).not.toBeNull()
    const handBefore = await page.locator('.hand-cards .hand-card').count()
    await page.locator(handTile).dispatchEvent('click')

    // The spotlight starts exactly where the hand card was drawn.
    const spotlight = page.locator('.played-card-fly.from-hand')
    await expect(spotlight).toHaveCount(1, { timeout: 10_000 })
    await freeze(page, '.played-card-fly', 0)
    const start = await drawnBox(page, '.played-card-fly.from-hand .card-tile')
    expect(start).not.toBeNull()
    expect(Math.abs(start!.x - inHand!.x)).toBeLessThan(4)
    expect(Math.abs(start!.y - inHand!.y)).toBeLessThan(4)
    expect(Math.abs(start!.w - inHand!.w)).toBeLessThan(4)
    // …and the hand card has gone from the fan, its copy flying.
    await expect(page.locator(`.hand-cards .hand-card[data-obj-id="${divination}"]`)).toBeHidden()
    await shot('lift-0')
    await freeze(page, '.played-card-fly', 0.09)
    await shot('lift-mid')
    await freeze(page, '.played-card-fly', 0.25)
    await shot('lift-held')
    await resume(page)

    // Bob passes, Divination resolves: two cards fly into the hand. Each
    // copy is steered frame by frame, so its path is recorded the same way.
    await page.evaluate(() => {
      // Each copy's centre, and its card's in the fan, frame by frame.
      const trail: Record<string, { x: number; y: number; cx: number; cy: number }[]> = {}
      ;(window as unknown as { __trail: typeof trail }).__trail = trail
      const record = () => {
        // The fan opening round the cards coming in: its cards glide.
        for (const el of document.querySelectorAll<HTMLElement>('.hand-cards .hand-card:not([data-arriving])')) {
          if (el.getAnimations().length > 0) (window as unknown as { __glided: boolean }).__glided = true
        }
        for (const ghost of document.querySelectorAll<HTMLElement>('.hand-draw-ghost')) {
          const face = ghost.querySelector<HTMLElement>('.hand-draw-face')
          if (face === null) continue
          const id = ghost.dataset.for ?? ''
          const r = face.getBoundingClientRect()
          const card = document
            .querySelector(`.hand-cards .hand-card[data-obj-id="${CSS.escape(id)}"] .card-tile`)
            ?.getBoundingClientRect()
          if (card === undefined) continue
          ;(trail[id] ??= []).push({
            x: r.left + r.width / 2,
            y: r.top + r.height / 2,
            cx: card.left + card.width / 2,
            cy: card.top + card.height / 2,
          })
        }
        requestAnimationFrame(record)
      }
      requestAnimationFrame(record)
    })
    await page.getByRole('button', { name: 'Pass (space)' }).click({ timeout: 20_000 })
    const ghost = page.locator('.hand-draw-ghost')
    await expect(ghost.first()).toBeAttached({ timeout: 20_000 })
    expect(await page.locator('.hand-card[data-arriving]').count()).toBeGreaterThan(0)
    await page.waitForTimeout(60 * animScale)
    await shot('draw-turning')
    await page.waitForTimeout(200 * animScale)
    await shot('draw-landing')
    await expect(ghost).toHaveCount(0, { timeout: 10_000 })
    await expect(page.locator('.hand-card[data-arriving]')).toHaveCount(0)
    expect(await page.evaluate(() => (window as unknown as { __glided?: boolean }).__glided)).toBe(true)
    // Each copy's last place is its card's place in the fan, wherever the
    // hand had moved to by then.
    const trail = await page.evaluate(
      () =>
        (window as unknown as { __trail: Record<string, { x: number; y: number; cx: number; cy: number }[]> })
          .__trail,
    )
    const ids = Object.keys(trail)
    expect(ids.length).toBe(2)
    for (const id of ids) {
      const path = trail[id]
      expect(path.length).toBeGreaterThan(5)
      const end = path[path.length - 1]
      expect(Math.abs(end.x - end.cx)).toBeLessThan(4)
      expect(Math.abs(end.y - end.cy)).toBeLessThan(4)
      // …and it set off from the library, a long way from there.
      expect(Math.hypot(path[0].x - path[0].cx, path[0].y - path[0].cy)).toBeGreaterThan(100)
    }
    // One played, two drawn.
    await expect(page.locator('.hand-cards .hand-card')).toHaveCount(handBefore + 1)
    await shot('after')
    expect(errors).toEqual([])
  })
}
