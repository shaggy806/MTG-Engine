import { expect, test } from '@playwright/test'

// A library's revealed top card (`LibraryTopCard`) shows the card full size
// on hover, as a battlefield tile does (the user, 2026-10-07). TOPLB and TOPL4
// (server/scripts/dev-scenarios.mjs) reveal a Forest on top of alice's
// library with Oracle of Mul Daya.

const CONTROL = `http://127.0.0.1:${process.env.E2E_CONTROL_PORT ?? 4099}`

const CASES = [
  { room: 'TOPLB', size: { width: 1366, height: 768 } },
  { room: 'TOPLB', size: { width: 2560, height: 1440 } },
  { room: 'TOPL4', size: { width: 1920, height: 1080 } },
] as const

for (const { room, size } of CASES) {
  test(`${room} ${size.width}x${size.height}: hovering a revealed top card shows it full size`, async ({
    page,
    request,
  }) => {
    expect((await request.post(CONTROL, { data: { op: 'reset', room } })).ok()).toBe(true)
    await page.setViewportSize(size)
    await page.goto(`/?room=${room}`)
    await page.getByRole('button', { name: 'Ready', exact: true }).click()
    await expect(page.getByText(`room ${room}`)).toBeVisible()

    const top = page.locator('.library-top')
    await expect(top).toBeVisible()
    // Off the board: Ready's click left the pointer where a tile now is.
    await page.mouse.move(5, 5)
    await expect(page.locator('.mini-tile-popover')).toHaveCount(0)
    await top.hover()
    const popover = page.locator('.mini-tile-popover.placed')
    await expect(popover).toBeVisible()
    await expect(popover).toContainText('Forest')
    // Bigger than the card in the rail, and wholly on screen.
    const small = await top.boundingBox()
    const big = await popover.locator('.card-tile').boundingBox()
    expect(big!.width).toBeGreaterThan(small!.width * 1.4)
    expect(big!.x).toBeGreaterThanOrEqual(0)
    expect(big!.y).toBeGreaterThanOrEqual(0)
    expect(big!.x + big!.width).toBeLessThanOrEqual(size.width)
    expect(big!.y + big!.height).toBeLessThanOrEqual(size.height)
    await page.waitForTimeout(300) // past the fade-in
    await page.screenshot({ path: test.info().outputPath(`${room}-${size.width}x${size.height}.png`) })

    await page.mouse.move(5, 5)
    await expect(page.locator('.mini-tile-popover')).toHaveCount(0)
  })
}
