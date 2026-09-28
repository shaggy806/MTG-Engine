/**
 * Blocking with, and blocking, a folded tile: the block bar's model where
 * one board tile stands for several creatures.
 *
 * The board folds identical tokens into one tile (`board.ts`), and a token
 * stack that attacks is woken into one attacker per token, which fold right
 * back into one tile. Picking from the board by tile then went wrong on both
 * sides: a click on a tile always meant its first member, so six attacking
 * Goblins could only ever be blocked one at a time — every blocker went onto
 * the same Goblin — and a stack of your own Soldiers could only ever send one
 * of them to block.
 *
 * So a click picks a *fitting* member instead — a blocker not yet blocking,
 * or the attacker with the fewest blockers so far — and the bar grows a row
 * per (your folded tile → the attackers it's blocking) with a − / + count, so
 * "four of the Soldiers block the Goblins" is a number to set rather than
 * four rounds of clicks. Which member does what can't matter: nothing tells
 * them apart, which is what folding them already asserts.
 *
 * The answer keeps the engine's own shape, one attacker per blocker id, and
 * the legality check stays the engine's `blockingViolations`.
 */

import type { LegalAction, ObjectId } from 'engine/client'

export type BlockOffer = Extract<LegalAction, { kind: 'declare-blockers' }>
/** Blocker id → the attacker it blocks. */
export type BlockAssign = Readonly<Record<string, ObjectId>>

/** How many blockers each attacker has in `assign`. */
function loads(assign: BlockAssign): Map<ObjectId, number> {
  const out = new Map<ObjectId, number>()
  for (const attacker of Object.values(assign)) out.set(attacker, (out.get(attacker) ?? 0) + 1)
  return out
}

/** Of a tile's members, the one blocker a click should take: eligible, not
 * blocking yet and not already the one waiting for an attacker. `null` once
 * every member is spoken for. */
export function freeBlocker(
  ids: readonly ObjectId[],
  offer: BlockOffer,
  assign: BlockAssign,
  focus: ObjectId | null,
): ObjectId | null {
  return (
    ids.find(
      (i) => i !== focus && assign[i] === undefined && offer.eligible.some((e) => e.blocker === i),
    ) ?? null
  )
}

/** Of a tile's members, the attacker `blocker` should block: one it can
 * block, with the fewest blockers so far — so repeated clicks spread blockers
 * across a folded stack of attackers rather than piling onto one. */
export function leastBlocked(
  ids: readonly ObjectId[],
  blocker: ObjectId,
  offer: BlockOffer,
  assign: BlockAssign,
): ObjectId | null {
  const canBlock = offer.eligible.find((e) => e.blocker === blocker)?.canBlock ?? []
  const load = loads(assign)
  let best: ObjectId | null = null
  for (const i of ids) {
    if (!canBlock.includes(i)) continue
    if (best === null || (load.get(i) ?? 0) < (load.get(best) ?? 0)) best = i
  }
  return best
}

/** One row of the bar's counts: some of a folded tile of yours blocking
 * the attackers of one tile. */
export interface BlockPair {
  /** Every member of your tile (the blocker side). */
  readonly blockers: readonly ObjectId[]
  /** Every member of the attackers' tile. */
  readonly attackers: readonly ObjectId[]
  /** How many of `blockers` block one of `attackers` now. */
  readonly count: number
  /** The most that could: the ones doing so, plus the free ones able to. */
  readonly max: number
}

const pairKey = (b: readonly ObjectId[], a: readonly ObjectId[]) => `${b[0]}>${a[0]}`

/**
 * The bar's count rows: for each of your tiles with more than one member,
 * one row per attacker tile its members are blocking. `tileOf` maps an id to
 * every member of the tile it's drawn in (itself alone when unfolded).
 */
export function blockPairs(
  offer: BlockOffer,
  assign: BlockAssign,
  tileOf: (id: ObjectId) => readonly ObjectId[],
): BlockPair[] {
  const rows = new Map<string, { blockers: readonly ObjectId[]; attackers: readonly ObjectId[] }>()
  for (const [blocker, attacker] of Object.entries(assign)) {
    const blockers = tileOf(blocker as ObjectId)
    if (blockers.length < 2) continue
    const attackers = tileOf(attacker)
    rows.set(pairKey(blockers, attackers), { blockers, attackers })
  }
  return [...rows.values()].map(({ blockers, attackers }) => {
    const count = blockers.filter((b) => {
      const at = assign[b]
      return at !== undefined && attackers.includes(at)
    }).length
    const free = blockers.filter(
      (b) => assign[b] === undefined && leastBlocked(attackers, b, offer, assign) !== null,
    ).length
    return { blockers, attackers, count, max: count + free }
  })
}

/**
 * `assign` with `pair` set to `n` blockers: freed from the end (the most
 * recently added, off the attackers with the most blockers), or added from
 * the tile's free members, each onto the attacker with the fewest.
 */
export function setPairCount(
  pair: BlockPair,
  n: number,
  offer: BlockOffer,
  assign: BlockAssign,
): Record<string, ObjectId> {
  const next: Record<string, ObjectId> = { ...assign }
  const target = Math.max(0, Math.min(pair.max, Math.floor(n)))
  const inPair = () =>
    pair.blockers.filter((b) => {
      const at = next[b]
      return at !== undefined && pair.attackers.includes(at)
    })
  let current = inPair()
  while (current.length > target) {
    const load = loads(next)
    // Off the attacker with the most blockers, so what's left stays spread.
    let drop = current[current.length - 1]
    for (const b of current) if ((load.get(next[b]) ?? 0) > (load.get(next[drop]) ?? 0)) drop = b
    delete next[drop]
    current = inPair()
  }
  while (current.length < target) {
    let placed = false
    for (const b of pair.blockers) {
      if (next[b] !== undefined) continue
      const at = leastBlocked(pair.attackers, b, offer, next)
      if (at === null) continue
      next[b] = at
      placed = true
      break
    }
    if (!placed) break
    current = inPair()
  }
  return next
}
