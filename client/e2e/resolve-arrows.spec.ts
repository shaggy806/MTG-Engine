import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

// A spell or ability points at its targets as it resolves (ArrowLayer's
// `resolve` arrows, played by usePlayback from the schedule's `aims`). The
// rooms are ARRWS and ARRW4 in server/scripts/dev-scenarios.mjs; each test
// resets the one it uses.
//
// Set RESOLVE_ARROW_SHOTS to a directory to also film each resolution there
// (a screenshot every ~100 ms through it), for a reviewer to look at.

const CONTROL = `http://127.0.0.1:${process.env.E2E_CONTROL_PORT ?? 4099}`
const SHOTS = process.env.RESOLVE_ARROW_SHOTS

// Waiting for a bot's turn to come round is paced like play.
test.describe.configure({ timeout: 90_000 })

type Ref = { readonly object: string } | { readonly player: string }

interface RoomState {
  readonly players: Record<
    string,
    { readonly hand: readonly string[]; readonly battlefield: readonly string[] }
  >
  readonly stack: readonly string[]
}

async function control<T>(request: APIRequestContext, body: object): Promise<T> {
  const response = await request.post(CONTROL, { data: body })
  expect(response.ok()).toBe(true)
  return (await response.json()) as T
}

/** The id of `player`'s first `name` in their hand or on the battlefield, from
 * the command port's "obj-12 Hill Giant, tapped" lines. */
function idOf(state: RoomState, player: string, name: string): string {
  const { hand, battlefield } = state.players[player]
  const line = [...hand, ...battlefield].find((l) => l.split(', ')[0].split(' ').slice(1).join(' ') === name)
  if (line === undefined) throw new Error(`${player} has no ${name}`)
  return line.split(' ')[0]
}

async function openRoom(page: Page, request: APIRequestContext, room: string): Promise<RoomState> {
  await control(request, { op: 'reset', room })
  const state = await control<RoomState>(request, { op: 'state', room })
  await page.goto(`/?room=${room}`)
  await page.getByRole('button', { name: 'Ready', exact: true }).click()
  await expect(page.getByText(`room ${room}`)).toBeVisible()
  return state
}

const paced = { timeout: 20_000 }

/** Waits until this seat may act: nothing is playing out and it has
 * priority. */
async function ready(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: 'Pass (space)' })).toBeEnabled(paced)
}

/** Casts `card` from hand at `targets`, picked on the board, and waits for it
 * to be shown on the stack. The card is clicked where it is in the hand's
 * fan, whether or not the tray happens to be raised: the tray isn't what's
 * under test. */
async function cast(page: Page, card: string, targets: readonly Ref[]): Promise<void> {
  // Again if an update lands just after the click: the board it was made on
  // is remounted, and a choice in progress with it.
  await expect(async () => {
    await ready(page)
    await page.locator(`.hand-card[data-obj-id="${card}"] .card-tile`).dispatchEvent('click')
    await expect(page.locator('.decision-banner')).toBeVisible({ timeout: 2000 })
  }).toPass(paced)
  for (const t of targets) await pick(page, t)
  await expect(page.locator(`.stack-entry[data-stack-id="${card}"]`)).toBeVisible(paced)
}

async function pick(page: Page, t: Ref): Promise<void> {
  if ('player' in t) await page.locator(`[data-player-id="${t.player}"]`).first().click()
  else await page.locator(`.board [data-obj-id="${t.object}"]`).first().click()
}

const keyOf = (t: Ref): string => ('player' in t ? `p:${t.player}` : `o:${t.object}`)

interface Seen {
  readonly key: string
  /** The line starts on the resolving entry's card and ends on the target. */
  readonly fromEntry: boolean
  readonly onTarget: boolean
  /** The same entry's waiting arrows are gone while it resolves. */
  readonly waitingGone: boolean
  readonly animation: string
  /** The board marks the target as targeted, and nothing else. */
  readonly marked: boolean
  readonly strayMarks: readonly string[]
}

/** What every resolving arrow should be. */
const POINTING = {
  fromEntry: true,
  onTarget: true,
  waitingGone: true,
  marked: true,
  strayMarks: [],
} as const

/**
 * Waits for `spell`'s resolving arrow to each of `targets` to be up all at
 * once, and reports where each one runs — measured in the one evaluation that
 * finds them, since they're only up for the length of the resolution.
 */
async function resolving(page: Page, spell: string, targets: readonly Ref[]): Promise<Seen[]> {
  const handle = await page.waitForFunction(
    ({ spell, targets }) => {
      const inside = (x: number, y: number, r: DOMRect): boolean =>
        x >= r.left - 2 && x <= r.right + 2 && y >= r.top - 2 && y <= r.bottom + 2
      const entry = document.querySelector(`.stack-entry[data-stack-id="${CSS.escape(spell)}"] .card-tile`)
      // The board's targeted marks (a permanent's reticle, a player's
      // "Targeted" chip), as ids: on this spell's targets, and nowhere else.
      const marked = new Set([
        ...[...document.querySelectorAll('.board .aimed-mark')].map(
          (m) => `o:${m.closest('[data-obj-id]')?.getAttribute('data-obj-id')}`,
        ),
        ...[...document.querySelectorAll('.pp-aimed')].map(
          (m) => `p:${m.closest('[data-player-id]')?.getAttribute('data-player-id')}`,
        ),
      ])
      const out = []
      for (const t of targets) {
        const key = `r:${spell}->${t.key}`
        const path = document.querySelector<SVGPathElement>(`path.arrow.resolve[data-arrow="${CSS.escape(key)}"]`)
        if (!path || !entry) return null
        const target =
          t.kind === 'p'
            ? document.querySelector(`[data-player-id="${CSS.escape(t.id)}"] .pp-life`)
            : (document.querySelector(`.board [data-obj-id="${CSS.escape(t.id)}"]`) ??
              document.querySelector(`.stack-entry[data-stack-id="${CSS.escape(t.id)}"] .card-tile`))
        if (!target) return null
        const n = (path.getAttribute('d') ?? '').match(/-?\d+(\.\d+)?/g)?.map(Number) ?? []
        out.push({
          key,
          fromEntry: inside(n[0], n[1], entry.getBoundingClientRect()),
          onTarget: inside(n[n.length - 2], n[n.length - 1], target.getBoundingClientRect()),
          waitingGone: document.querySelector(`path.arrow.target[data-arrow^="t:${CSS.escape(spell)}->"]`) === null,
          animation: getComputedStyle(path).animationName,
          marked: marked.has(t.key),
          strayMarks: [...marked].filter((m) => !targets.some((x) => x.key === m)),
        })
      }
      return out
    },
    {
      spell,
      targets: targets.map((t) =>
        'player' in t ? { kind: 'p', id: t.player, key: keyOf(t) } : { kind: 'o', id: t.object, key: keyOf(t) },
      ),
    },
    { polling: 'raf', timeout: 20_000 },
  )
  return (await handle.jsonValue()) as Seen[]
}

/** With RESOLVE_ARROW_SHOTS set: screenshots every ~100 ms for `ms`. */
async function film(page: Page, name: string, ms: number): Promise<void> {
  if (!SHOTS) return
  const start = Date.now()
  for (let i = 1; Date.now() - start < ms; i += 1) {
    const at = Date.now()
    // JPEG: a big screen's PNG takes longer to encode than a frame lasts.
    await page.screenshot({
      path: join(SHOTS, `${name}-${String(i).padStart(2, '0')}.jpg`),
      type: 'jpeg',
      quality: 85,
    })
    const left = 100 - (Date.now() - at)
    if (left > 0) await page.waitForTimeout(left)
  }
}

/** With RESOLVE_ARROW_SHOTS set: the board before anything resolves. */
async function still(page: Page, name: string): Promise<void> {
  if (!SHOTS) return
  mkdirSync(SHOTS, { recursive: true })
  await page.screenshot({ path: join(SHOTS, `${name}-00.png`) })
}

/** Passes priority (or does whatever else `trigger` does to let the stack
 * resolve) and checks `spell` points at each of `targets` as it resolves,
 * filming it as `name`. */
async function passAndSee(
  page: Page,
  spell: string,
  targets: readonly Ref[],
  name: string,
  trigger: () => Promise<unknown> = () => page.getByRole('button', { name: 'Pass (space)' }).click(),
): Promise<Seen[]> {
  await still(page, name)
  const seen = resolving(page, spell, targets)
  await trigger()
  const [arrows] = await Promise.all([seen, film(page, name, 1600)])
  expect(arrows.map((a) => a.key)).toEqual(targets.map((t) => `r:${spell}->${keyOf(t)}`))
  for (const a of arrows) expect(a, a.key).toMatchObject(POINTING)
  // Gone again once it has left the stack.
  await expect(page.locator(`path.arrow[data-arrow^="r:${spell}->"]`)).toHaveCount(0, paced)
  return arrows
}

const SIZES = [
  { width: 1366, height: 768 },
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
] as const

for (const size of SIZES) {
  test.describe(`at ${size.width}x${size.height}`, () => {
    test.use({ viewport: size })

    test('2p: a spell at a creature points at it as it resolves', async ({ page, request }) => {
      const state = await openRoom(page, request, 'ARRWS')
      const bolt = idOf(state, 'alice', 'Lightning Bolt')
      const giant = { object: idOf(state, 'bob', 'Hill Giant') }
      await cast(page, bolt, [giant])
      // Waiting on the stack, it points the dashed way; the stack card sits
      // over the arrows, and the arrows over the tiles they cross.
      await expect(page.locator(`path.arrow.target[data-arrow="t:${bolt}->${keyOf(giant)}"]`)).toHaveCount(1)
      const z = await page.evaluate(() => ({
        stack: Number(getComputedStyle(document.querySelector('.stack-overlay')!).zIndex),
        arrows: Number(getComputedStyle(document.querySelector('.arrow-layer')!).zIndex),
        tile: Number(getComputedStyle(document.querySelector('.board-entry > .mini-tile-wrap')!).zIndex),
      }))
      expect(z.stack).toBeGreaterThan(z.arrows)
      expect(z.arrows).toBeGreaterThan(z.tile)
      const [arrow] = await passAndSee(page, bolt, [giant], `2p-${size.width}-bolt-creature`)
      // It shoots out along its length.
      expect(arrow.animation).toBe('arrow-draw')
    })

    test("4p: an opponent's spells point at another opponent's creature and at you", async ({
      page,
      request,
    }) => {
      const state = await openRoom(page, request, 'ARRW4')
      const murder = idOf(state, 'bob', 'Murder')
      const bolt = idOf(state, 'bob', 'Lightning Bolt')
      const angel = { object: idOf(state, 'carol', 'Serra Angel') }
      // Pass through until bob casts into it.
      await page.getByRole('button', { name: 'Auto-pass' }).click()
      await expect(page.locator(`.stack-entry[data-stack-id="${murder}"]`)).toBeVisible({ timeout: 40_000 })
      await passAndSee(page, murder, [angel], `4p-${size.width}-bot-murder`)
      await expect(page.locator(`.stack-entry[data-stack-id="${bolt}"]`)).toBeVisible({ timeout: 40_000 })
      await passAndSee(page, bolt, [{ player: 'alice' }], `4p-${size.width}-bot-bolt-you`)
    })
  })
}

test('2p: a spell at a player points at their life total', async ({ page, request }) => {
  const state = await openRoom(page, request, 'ARRWS')
  const bolt = idOf(state, 'alice', 'Lightning Bolt')
  await cast(page, bolt, [{ player: 'bob' }])
  await passAndSee(page, bolt, [{ player: 'bob' }], '2p-bolt-player')
})

test('2p: an activated ability points at its target', async ({ page, request }) => {
  const state = await openRoom(page, request, 'ARRWS')
  const pyromancer = idOf(state, 'alice', 'Prodigal Pyromancer')
  const bears = { object: idOf(state, 'bob', 'Grizzly Bears') }
  await ready(page)
  await page.locator(`.board [data-obj-id="${pyromancer}"]`).first().click()
  await page.getByRole('menuitem', { name: /deals 1 damage to any target/ }).click()
  await pick(page, bears)
  const entry = page.locator('.stack-entry[data-stack-id]').first()
  await expect(entry).toBeVisible(paced)
  const ability = (await entry.getAttribute('data-stack-id'))!
  await passAndSee(page, ability, [bears], '2p-ability')
})

test('2p: a spell with two targets points at both', async ({ page, request }) => {
  const state = await openRoom(page, request, 'ARRWS')
  const prey = idOf(state, 'alice', 'Prey Upon')
  const dreadmaw = { object: idOf(state, 'alice', 'Colossal Dreadmaw') }
  const angel = { object: idOf(state, 'bob', 'Serra Angel') }
  await cast(page, prey, [dreadmaw, angel])
  await passAndSee(page, prey, [dreadmaw, angel], '2p-two-targets')
})

test('2p: two resolving in one update point in turn, though only the top one was aimed', async ({
  page,
  request,
}) => {
  const state = await openRoom(page, request, 'ARRWS')
  const murder = idOf(state, 'alice', 'Murder')
  const bolt = idOf(state, 'alice', 'Lightning Bolt')
  const angel = { object: idOf(state, 'bob', 'Serra Angel') }
  await cast(page, murder, [angel])
  // Down to one Mountain: once Lightning Bolt is cast with it, alice has
  // nothing left to do but pass, and the room passes for her.
  await control(request, {
    op: 'eval',
    room: 'ARRWS',
    js: `let kept = false
      for (const id of game.state.zones.shared.battlefield) {
        const o = game.state.objects[id]
        if (o.controller !== 'alice') continue
        o.tapped = kept || o.cardName !== 'Mountain'
        if (o.cardName === 'Mountain') kept = true
      }`,
  })
  await ready(page)
  // Alone on the stack, Murder points the waiting way. Once Lightning Bolt
  // is on top of it, nothing points from Murder until it resolves — and as
  // both resolve in one update, no board with Murder back on top comes
  // between them to point from it again.
  await expect(page.locator(`path.arrow.target[data-arrow^="t:${murder}->"]`)).toHaveCount(1)
  await page.evaluate(
    ({ murder, bolt }) => {
      const w = window as unknown as { murderWaited: boolean }
      w.murderWaited = false
      let boltShown = false
      new MutationObserver(() => {
        if (document.querySelector(`.stack-entry[data-stack-id="${bolt}"]`)) boltShown = true
        else if (boltShown && document.querySelector(`path.arrow.target[data-arrow^="t:${murder}->"]`)) {
          w.murderWaited = true
        }
      }).observe(document.body, { childList: true, subtree: true })
    },
    { murder, bolt },
  )
  const murderSeen = resolving(page, murder, [angel])
  await passAndSee(page, bolt, [{ player: 'bob' }], '2p-two-in-one-update', () =>
    cast(page, bolt, [{ player: 'bob' }]),
  )
  const [arrow] = await murderSeen
  // Its target marked, and bob — the Bolt's, gone — no longer.
  expect(arrow).toMatchObject(POINTING)
  expect(await page.evaluate(() => (window as unknown as { murderWaited: boolean }).murderWaited)).toBe(false)
})

test("2p: the bot's spell points at your creature", async ({ page, request }) => {
  const state = await openRoom(page, request, 'ARRWS')
  const bolt = idOf(state, 'bob', 'Lightning Bolt')
  const pyromancer = { object: idOf(state, 'alice', 'Prodigal Pyromancer') }
  await page.getByRole('button', { name: 'Auto-pass' }).click()
  await expect(page.locator(`.stack-entry[data-stack-id="${bolt}"]`)).toBeVisible({ timeout: 40_000 })
  await passAndSee(page, bolt, [pyromancer], '2p-bot-bolt')
})

test('4p: your own spell at an opponent across the table', async ({ page, request }) => {
  const state = await openRoom(page, request, 'ARRW4')
  const bolt = idOf(state, 'alice', 'Lightning Bolt')
  const wurm = { object: idOf(state, 'dave', 'Craw Wurm') }
  await cast(page, bolt, [wurm])
  await passAndSee(page, bolt, [wurm], '4p-bolt-across')
})

test('under reduced motion the arrow is simply there, without shooting out', async ({
  page,
  request,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const state = await openRoom(page, request, 'ARRWS')
  const bolt = idOf(state, 'alice', 'Lightning Bolt')
  const giant = { object: idOf(state, 'bob', 'Hill Giant') }
  await cast(page, bolt, [giant])
  const [arrow] = await passAndSee(page, bolt, [giant], '2p-reduced-motion')
  expect(arrow.animation).toBe('arrow-fade')
})
