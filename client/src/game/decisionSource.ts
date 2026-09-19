/**
 * What the stack overlay draws for the decision you're being asked.
 *
 * A sacrifice or discard effect raises its prompt *after* the spell that
 * ordered it has finished resolving and gone to a graveyard, so a forced
 * choice used to arrive with nothing on screen explaining it. The engine
 * names the cause on `PlayerView.decisionSource`; this decides whether
 * there's a card face to show for it, and `Stack` renders it at depth 0
 * alongside the real stack.
 *
 * Lives here rather than in `Stack.tsx` so that file exports only components
 * (React Fast Refresh).
 */
import type { ObjectId, PlayerView } from 'engine'

/** The object to draw as the decision's cause, or `null` if there's nothing
 * extra to draw — nothing pending, the cause is already on the stack, or the
 * card isn't in a zone this viewer can see (the decision strip still names it
 * in words either way). */
export function decisionGhostOf(view: PlayerView): ObjectId | null {
  const source = view.decisionSource
  if (!source) return null
  if (view.zones.stack.includes(source.object)) return null
  if (!view.objects[source.object]) return null
  return source.object
}

/** Whether the stack overlay has anything at all to draw. */
export function stackShowsSomething(view: PlayerView): boolean {
  return view.zones.stack.length > 0 || decisionGhostOf(view) !== null
}
