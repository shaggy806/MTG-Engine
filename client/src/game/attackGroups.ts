/**
 * Attacking with a folded tile: the attack bar's model where one board tile
 * is several creatures — identical tokens the board folds together, or the
 * members of one of the engine's compacted stacks (`stackMembers.ts`).
 *
 * The same shape as `blockGroups.ts`: a click takes a member that isn't in
 * the attack yet rather than always the first (which made a folded tile
 * attack one creature at a time, and a second click take it back out), and
 * the bar grows a row per (your tile → a defender) with a − / + count, so
 * "five of the Goblins attack Bob, the rest stay home" is a number to set.
 * Attacking is a choice per creature (rule 508.1a), so any split is legal;
 * the engine's `attackingViolations` still decides the must-attacks.
 */

import type { ObjectId, PlayerId } from 'engine/client'

export type Defender = PlayerId | ObjectId
/** Attacker id → the defender it attacks. */
export type AttackAssign = Readonly<Record<string, Defender>>

/** Of a tile's members, the one a click should take: eligible, not
 * attacking yet and not already waiting in the group. `null` once every
 * member is spoken for. */
export function freeAttacker(
  ids: readonly ObjectId[],
  eligible: readonly ObjectId[],
  assign: AttackAssign,
  picks: readonly ObjectId[],
): ObjectId | null {
  return ids.find((i) => eligible.includes(i) && assign[i] === undefined && !picks.includes(i)) ?? null
}

/** One row of the bar's counts: some of a folded tile of yours attacking
 * one defender. */
export interface AttackPair {
  readonly attackers: readonly ObjectId[]
  readonly defender: Defender
  readonly count: number
  /** The ones attacking it, plus the free ones that may. */
  readonly max: number
}

/** The bar's count rows: one per (tile with more than one member, defender
 * some of them attack). `tileOf` maps an id to every member of its tile. */
export function attackPairs(
  assign: AttackAssign,
  picks: readonly ObjectId[],
  defendersFor: (id: ObjectId) => readonly Defender[],
  tileOf: (id: ObjectId) => readonly ObjectId[],
): AttackPair[] {
  const rows = new Map<string, { attackers: readonly ObjectId[]; defender: Defender }>()
  for (const [attacker, defender] of Object.entries(assign)) {
    const attackers = tileOf(attacker as ObjectId)
    if (attackers.length < 2) continue
    rows.set(`${attackers[0]}>${defender}`, { attackers, defender })
  }
  return [...rows.values()].map(({ attackers, defender }) => {
    const count = attackers.filter((a) => assign[a] === defender).length
    const free = attackers.filter(
      (a) => assign[a] === undefined && !picks.includes(a) && defendersFor(a).includes(defender),
    ).length
    return { attackers, defender, count, max: count + free }
  })
}

/** `assign` with `pair` set to `n` attackers: freed from the end, or added
 * from the tile's free members. */
export function setAttackPairCount(
  pair: AttackPair,
  n: number,
  picks: readonly ObjectId[],
  defendersFor: (id: ObjectId) => readonly Defender[],
  assign: AttackAssign,
): Record<string, Defender> {
  const next: Record<string, Defender> = { ...assign }
  const target = Math.max(0, Math.min(pair.max, Math.floor(n)))
  const inPair = pair.attackers.filter((a) => next[a] === pair.defender)
  for (let i = inPair.length - 1; i >= target; i -= 1) delete next[inPair[i]]
  let have = Math.min(inPair.length, target)
  for (const a of pair.attackers) {
    if (have >= target) break
    if (next[a] !== undefined || picks.includes(a) || !defendersFor(a).includes(pair.defender)) continue
    next[a] = pair.defender
    have += 1
  }
  return next
}
