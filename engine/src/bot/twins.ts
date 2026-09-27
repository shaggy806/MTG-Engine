/**
 * Twin targets: tokens nothing in the game tells apart, so that aiming at one
 * or another of them leads to the same position.
 *
 * Seven Scute Swarm copies are seven objects — a token with a trigger that
 * isn't count-scalable never folds into one stack — and each was a target
 * option of its own: seven candidates for one removal spell, seven identical
 * simulations, and the eight-combination cap filled with copies of one move
 * while the other permanents on the board went unconsidered. Collapsing twins
 * before the cap keeps the simulation of one and spends the rest of the cap on
 * real alternatives.
 *
 * Twins share everything the engine's own token fold compares
 * (`tokenFoldKey`), plus what separates two tokens only in the middle of a
 * turn — combat, marked damage, what's attached to them — and neither is
 * referred to by anything still due to happen (a spell or ability's target,
 * a delayed trigger, a prevention shield). Cards are never twins: two Forests
 * have different owners' histories, graveyards and zone-change stories.
 */

import type { ObjectId } from "../primitives.js";
import type { GameState } from "../state.js";
import { tokenFoldKey } from "../state.js";
import type { TargetRef } from "../target.js";

/** Object ids something pending refers to by id. */
function referencedIds(state: GameState): string {
  const parts: unknown[] = [state.delayedTriggers, state.preventionShields ?? []];
  for (const id of state.zones.shared.stack) parts.push(state.objects[id]?.targets ?? null);
  return JSON.stringify(parts);
}

/** `id`'s twin group, or `null` for something with no twins. */
function twinKey(state: GameState, id: ObjectId, referenced: string, hosts: ReadonlySet<ObjectId>): string | null {
  const o = state.objects[id];
  if (o === undefined || !o.isToken || o.zone !== "battlefield") return null;
  if (hosts.has(id) || referenced.includes(`"${id}"`)) return null;
  return JSON.stringify([
    tokenFoldKey(o),
    o.attachedTo,
    o.attacking,
    o.blocking,
    o.blockedBy,
    o.blocked,
    o.damageMarked,
    o.markedByDeathtouch,
    o.damageThisTurn ?? null,
  ]);
}

/**
 * `options` (already in the order worth trying) with each group of twins cut
 * down to its first `keep` members — as many as there are target slots, so a
 * "two target creatures" spell can still take two of them. Everything else
 * keeps its place.
 */
export function collapseTwins(
  state: GameState,
  options: readonly TargetRef[],
  keep: number,
): TargetRef[] {
  if (options.length < 2) return [...options];
  const referenced = referencedIds(state);
  const hosts = new Set<ObjectId>();
  for (const id of state.zones.shared.battlefield) {
    const host = state.objects[id]?.attachedTo;
    if (host !== null && host !== undefined) hosts.add(host as ObjectId);
  }
  const seen = new Map<string, number>();
  const out: TargetRef[] = [];
  for (const ref of options) {
    const key = ref.kind === "object" ? twinKey(state, ref.object, referenced, hosts) : null;
    if (key !== null) {
      const count = seen.get(key) ?? 0;
      if (count >= keep) continue;
      seen.set(key, count + 1);
    }
    out.push(ref);
  }
  return out;
}
