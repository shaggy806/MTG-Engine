/**
 * A compacted token stack as the creatures it stands for, for the attack and
 * block bars.
 *
 * The engine keeps many identical tokens as one object (`stackCount`), and a
 * declaration says how many of it attack or block with a `count`
 * (`AttackerDeclaration.count`, `BlockerDeclaration.count`). The bars work in
 * creatures instead — a click takes one, a count row sets how many — so while
 * a declaration is being built a stack is expanded into one *member* id per
 * token (`<id>#<k>`), and collapsed back into counted entries on Confirm.
 * Every other id stands for itself. With members, the folded-tile logic the
 * board already has (`blockGroups.ts`, `attackGroups.ts`) covers the
 * engine's stacks without knowing about them, and the engine's own
 * set-level checks (menace, Lure, must-attack) run on the expanded offer
 * with every member counting as one creature, which is what it is.
 *
 * Members stop at {@link MEMBER_CAP} for a blocking stack, the most of one
 * the engine wakes up to block, and at {@link ATTACK_MEMBER_CAP} for an
 * attacking one: the engine attacks with every token declared, a stack past
 * its wake-up cap as one counted attacker. A stack bigger than that is
 * still declared whole when every member goes one way (`collapse` sends it
 * without a `count`); only a part of it can't be more than the cap.
 */

import type {
  AttackerDeclaration,
  BlockerDeclaration,
  LegalAction,
  ObjectId,
  PlayerId,
} from 'engine/client'

type AttackOffer = Extract<LegalAction, { kind: 'declare-attackers' }>
type BlockOffer = Extract<LegalAction, { kind: 'declare-blockers' }>

/** The engine's `MAX_MATERIALIZED`: past it a blocking stack's extra tokens
 * sit the combat out whatever is declared. */
export const MEMBER_CAP = 100

/** Members of one attacking stack: any number of its tokens attack, so this
 * only bounds the bar's own bookkeeping (a self-copier reaches millions). */
export const ATTACK_MEMBER_CAP = 2000

/** Real id → its member ids, for every stack that has them. */
export type Members = ReadonlyMap<ObjectId, readonly ObjectId[]>

/** The object a member id stands in for (itself, for a real id). */
export function realId(id: ObjectId): ObjectId {
  const at = id.indexOf('#')
  return (at === -1 ? id : id.slice(0, at)) as ObjectId
}

function membersOf(
  ids: readonly ObjectId[],
  tokensIn: (id: ObjectId) => number,
  cap: number = MEMBER_CAP,
): Map<ObjectId, ObjectId[]> {
  const out = new Map<ObjectId, ObjectId[]>()
  for (const id of ids) {
    const n = Math.min(tokensIn(id), cap)
    if (n > 1) out.set(id, Array.from({ length: n }, (_, k) => `${id}#${k}` as ObjectId))
  }
  return out
}

/** `ids` with every stack in `members` replaced by its member ids. */
export function expandIds(ids: readonly ObjectId[], members: Members): ObjectId[] {
  return ids.flatMap((id) => members.get(id) ?? [id])
}

/** The attack offer with each stack as its members, each able to attack
 * what the stack could and each as bound to attack as it was. */
export function expandAttackOffer(
  offer: AttackOffer,
  tokensIn: (id: ObjectId) => number,
): { readonly offer: AttackOffer; readonly members: Members } {
  const members = membersOf(offer.eligible, tokensIn, ATTACK_MEMBER_CAP)
  if (members.size === 0) return { offer, members }
  const defendersFor: Record<ObjectId, readonly (PlayerId | ObjectId)[]> = {}
  for (const [id, legal] of Object.entries(offer.defendersFor)) {
    for (const m of members.get(id as ObjectId) ?? [id as ObjectId]) defendersFor[m] = legal
  }
  return {
    members,
    offer: {
      ...offer,
      eligible: expandIds(offer.eligible, members),
      defendersFor,
      mustAttack: expandIds(offer.mustAttack, members),
    },
  }
}

/** The block offer with each stack (`copies`) as its members, one creature
 * each. */
export function expandBlockOffer(offer: BlockOffer): { readonly offer: BlockOffer; readonly members: Members } {
  const copies = new Map(offer.eligible.map((e) => [e.blocker, e.copies ?? 1]))
  const members = membersOf(
    offer.eligible.map((e) => e.blocker),
    (id) => copies.get(id) ?? 1,
  )
  if (members.size === 0) return { offer, members }
  return {
    members,
    offer: {
      ...offer,
      eligible: offer.eligible.flatMap((e) =>
        (members.get(e.blocker) ?? [e.blocker]).map((blocker) => ({ blocker, canBlock: e.canBlock })),
      ),
    },
  }
}

/**
 * Member → target choices, back as the engine's entries: a real id as
 * itself; a stack as one entry per target with how many go there — or as a
 * plain whole-stack entry when all of its members go one way, which is also
 * what a stack that must attack needs.
 */
function collapse<T extends string>(
  assign: Readonly<Record<string, T>>,
  members: Members,
): { readonly id: ObjectId; readonly target: T; readonly count?: number }[] {
  const out: { id: ObjectId; target: T; count?: number }[] = []
  const counted = new Map<ObjectId, Map<T, number>>()
  for (const [id, target] of Object.entries(assign) as [ObjectId, T][]) {
    const real = realId(id)
    if (real === id) {
      out.push({ id, target })
      continue
    }
    const byTarget = counted.get(real) ?? new Map<T, number>()
    byTarget.set(target, (byTarget.get(target) ?? 0) + 1)
    counted.set(real, byTarget)
  }
  for (const [id, byTarget] of counted) {
    const all = members.get(id)?.length ?? 0
    for (const [target, n] of byTarget) {
      out.push(byTarget.size === 1 && n === all ? { id, target } : { id, target, count: n })
    }
  }
  return out
}

export function collapseAttacks(
  assign: Readonly<Record<string, PlayerId | ObjectId>>,
  members: Members,
): AttackerDeclaration[] {
  return collapse(assign, members).map(({ id, target, count }) => ({
    attacker: id,
    defender: target,
    ...(count !== undefined ? { count } : {}),
  }))
}

/** How many blockers share each token of an attacking token stack (the
 * offer's `attackerTokens`), by attacker: 1, the default, is a token per
 * blocker; 2 pairs them up (menace); and so on. */
export type PerToken = Readonly<Record<string, number>>

/**
 * `assign` as block entries, one per blocker (member ids as they are), with
 * the token of an attacking stack each shares: the blockers on a stack with
 * a `perToken` of k, in the order they were assigned, go k to a token —
 * `attackerMember` 0 for the first k, 1 for the next, and so on (the last
 * token may have fewer). A stack left at 1 names no member: each blocker
 * blocks a token of its own.
 */
export function blockEntries(assign: Readonly<Record<string, ObjectId>>, perToken: PerToken = {}): BlockerDeclaration[] {
  const seen = new Map<ObjectId, number>()
  return (Object.entries(assign) as [ObjectId, ObjectId][]).map(([blocker, attacker]) => {
    const k = perToken[attacker] ?? 1
    if (k <= 1) return { blocker, attacker }
    const i = seen.get(attacker) ?? 0
    seen.set(attacker, i + 1)
    return { blocker, attacker, attackerMember: Math.floor(i / k) }
  })
}

export function collapseBlocks(
  assign: Readonly<Record<string, ObjectId>>,
  members: Members,
  perToken: PerToken = {},
): BlockerDeclaration[] {
  const entries = blockEntries(assign, perToken)
  const plain = Object.fromEntries(
    entries.filter((e) => e.attackerMember === undefined).map((e) => [e.blocker, e.attacker]),
  )
  const out: BlockerDeclaration[] = collapse(plain, members).map(({ id, target, count }) => ({
    blocker: id,
    attacker: target,
    ...(count !== undefined ? { count } : {}),
  }))
  // Shared tokens: one entry per (blocker, token), a stack's members counted.
  const shared = new Map<string, { blocker: ObjectId; attacker: ObjectId; attackerMember: number; count: number; member: boolean }>()
  for (const e of entries) {
    if (e.attackerMember === undefined) continue
    const real = realId(e.blocker)
    const key = `${real}>${e.attacker}#${e.attackerMember}`
    const at = shared.get(key)
    if (at !== undefined) at.count += 1
    else shared.set(key, { blocker: real, attacker: e.attacker, attackerMember: e.attackerMember, count: 1, member: real !== e.blocker })
  }
  for (const { blocker, attacker, attackerMember, count, member } of shared.values()) {
    // A stack's members always say how many: the rest of it blocks elsewhere.
    out.push({ blocker, attacker, attackerMember, ...(member ? { count } : {}) })
  }
  return out
}
