import { createPortal } from 'react-dom'
import type { VisibleObject } from 'engine/client'
import { CardTile } from './CardTile.tsx'
import { KeywordTips } from './KeywordTips.tsx'
import { useHoverPopover } from './useHoverPopover.ts'

export interface LibraryTopCardProps {
  readonly obj: VisibleObject
  /** Playable right now (the engine offers a play or a cast naming it). */
  readonly highlight: boolean
  readonly onClick: () => void
}

/**
 * A library's revealed top card (Oracle of Mul Daya's "play with the top
 * card of your library revealed"), drawn as it would be in the hand but
 * scaled down to the face-down pile's box (`.library-top`) — too small to
 * read, so hovering it shows the card full size beside it, as hovering a
 * battlefield tile or a commander does (the user, 2026-10-07). The popover
 * is portalled and JS-placed by `useHoverPopover`, for the same reasons.
 */
export function LibraryTopCard({ obj, highlight, onClick }: LibraryTopCardProps) {
  const { wrapRef, popoverRef, open, handlers } = useHoverPopover(obj)
  return (
    <div className="library-top" ref={wrapRef} {...handlers}>
      <CardTile obj={obj} layout="art-first" highlight={highlight} onClick={onClick} />
      {open
        ? createPortal(
            <div className="mini-tile-popover" ref={popoverRef}>
              <CardTile obj={obj} />
              <KeywordTips obj={obj} />
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
