/**
 * Declaring part of a compacted token stack in combat: the `count` on an
 * `AttackerDeclaration` / `BlockerDeclaration`.
 *
 * A stack (`GameObject.stackCount`) is one object standing for many
 * identical tokens, an engine resource-safety measure rather than a rule. The
 * rules see only the tokens, and attacking and blocking are choices made per
 * creature (rules 508.1a, 509.1a), so a player may send some of a stack and
 * hold the rest back, or send its tokens at different defenders (or to block
 * different attackers). An entry without a `count` is the whole stack, which
 * is what a declaration meant before counts existed; several entries may
 * name one stack only when each says how many.
 *
 * Shared by the attack and block validators so the two can't drift.
 */

import type { ObjectId } from "../primitives.js";

/** One declaration entry, as far as counting goes. */
export interface CountedEntry {
  readonly id: ObjectId;
  readonly count?: number;
}

/**
 * Why the entries' counts don't add up, or `null`. `tokensIn` is how many
 * tokens an object stands for (1 for an ordinary permanent); `twice` is the
 * message for an object named more than once without counts, which each
 * validator words its own way.
 */
export function whyCountsInvalid(
  entries: readonly CountedEntry[],
  tokensIn: (id: ObjectId) => number,
  name: (id: ObjectId) => string,
  twice: (id: ObjectId) => string,
): string | null {
  const byId = new Map<ObjectId, CountedEntry[]>();
  for (const entry of entries) {
    const list = byId.get(entry.id) ?? [];
    list.push(entry);
    byId.set(entry.id, list);
  }
  for (const [id, list] of byId) {
    const tokens = tokensIn(id);
    for (const { count } of list) {
      if (count !== undefined && (!Number.isInteger(count) || count < 1 || count > tokens)) {
        return `${name(id)}: ${count} is not a number of its ${tokens} to declare`;
      }
    }
    if (list.length > 1) {
      if (list.some((e) => e.count === undefined)) return twice(id);
      const total = list.reduce((sum, e) => sum + (e.count ?? 0), 0);
      if (total > tokens) return `${name(id)}: ${total} declared, but it is only ${tokens}`;
    }
  }
  return null;
}

/** How many creatures each object's entries declare in all: an entry
 * without a count is every token the object stands for. */
export function declaredTokens(
  entries: readonly CountedEntry[],
  tokensIn: (id: ObjectId) => number,
): Map<ObjectId, number> {
  const out = new Map<ObjectId, number>();
  for (const { id, count } of entries) out.set(id, (out.get(id) ?? 0) + (count ?? tokensIn(id)));
  return out;
}
