/**
 * The reticle marking something a spell or ability on the stack targets — a
 * permanent's tile, a spell's card on the stack, or (`inline`) beside a
 * player's name. Only a marker: it takes no clicks, so a tile under it keeps
 * whatever the current decision makes clickable. See `Table`'s `aim`.
 */
export function TargetedMark({ by, inline = false }: { readonly by: string; readonly inline?: boolean }) {
  return (
    <span className={`aimed-mark${inline ? ' inline' : ''}`} role="img" aria-label={`Targeted by ${by}`}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path
          d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </span>
  )
}
