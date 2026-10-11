import type { ReactNode } from 'react'

/**
 * A label that is always as wide as the widest it can read, so the button it
 * names doesn't change size as it changes ("No attacks" → "Attack with 3",
 * "Auto-pass" → "Stop auto-pass") and push its neighbours about. The other
 * readings sit under the shown one, hidden, as generated content — kept out
 * of the page's text and its accessible name, which is the shown text alone.
 */
export function StableLabel({ children, widest }: { readonly children: ReactNode; readonly widest: readonly string[] }) {
  return (
    <span className="stable-label">
      <span>{children}</span>
      {/* Drawn from the attribute (CSS `content`), so the hidden readings
          are no text of the page's: not found by find-in-page or a test's
          getByText, and not read out. */}
      {widest.map((w) => (
        <span key={w} className="stable-label-room" data-text={w} aria-hidden="true" />
      ))}
    </span>
  )
}
