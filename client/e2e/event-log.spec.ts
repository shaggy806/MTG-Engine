import { expect, test, type APIRequestContext } from '@playwright/test'

// The History popup's log scrolls under a sticky "Log" header. A bug report
// (2026-10-09): once the log filled up, a strip near its top showed the lines
// scrolled past — the header pinned inside the scroll box's padding, 8px
// below its top edge. Lines are cloned in to make it overflow without playing
// a long game; only the layout is under test.

const CONTROL = `http://127.0.0.1:${process.env.E2E_CONTROL_PORT ?? 4099}`

async function control(request: APIRequestContext, body: object): Promise<void> {
  const response = await request.post(CONTROL, { data: body })
  expect(response.ok()).toBe(true)
}

test('a scrolled log shows nothing above its sticky header', async ({ page, request }) => {
  await control(request, { op: 'reset', room: 'TWOAA' })
  await page.goto('/?room=TWOAA')
  await page.getByRole('button', { name: 'Ready', exact: true }).click()
  await page.getByRole('button', { name: 'History', exact: true }).click()
  const box = page.locator('.event-log')
  await expect(box.locator('li').first()).toBeVisible()

  const measured = await box.evaluate((el) => {
    const ul = el.querySelector('ul')
    if (ul === null) return null
    const lines = [...ul.children]
    while (el.scrollHeight <= el.clientHeight * 2) for (const li of lines) ul.appendChild(li.cloneNode(true))
    el.scrollTop = el.scrollHeight / 2
    const inner = el.getBoundingClientRect().top + el.clientTop
    const head = el.querySelector('.event-log-head')?.getBoundingClientRect().top ?? NaN
    // What is drawn just inside the box's top edge.
    const at = document.elementFromPoint(el.getBoundingClientRect().left + 60, inner + 3)
    return { gap: Math.round(head - inner), drawn: at?.closest('.event-log-head') ? 'header' : at?.closest('li') ? 'line' : 'other' }
  })
  expect(measured).toEqual({ gap: 0, drawn: 'header' })
})
