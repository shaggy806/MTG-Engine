/**
 * Telling when tokens split off a stack can be folded back together during a
 * turn — the pure half of `Game.refoldSplitTokens` (docs/plans/
 * token-stack-choices.md, "Folding back").
 *
 * A token stack (`GameObject.stackCount`) is a representation, not a rule:
 * every token in it is its own object (rule 111.1), so grouping them may never
 * change what happens. The end-of-turn fold (`Game.recompactTokens`) can
 * compare on `tokenFoldKey`, because what it leaves out — what happened to a
 * token this turn — stops mattering as the turn ends. Mid-turn it still
 * matters ("each creature that attacked this turn", "dealt damage by this
 * creature this turn"), so a fold then needs two tokens to be the same in
 * *everything*, and a token the rest of the game names by id to stay where
 * it is named.
 */

import type { ObjectId } from "./primitives.js";
import type { GameObject, GameState } from "./state.js";

/** JSON with every object's keys sorted, so two plain values that are equal
 * compare equal as strings however their fields were added (a token given a
 * +1/+1 counter and then a -1/-1 counter against one given them the other
 * way round). Fields holding `undefined` are left out, as in `JSON.stringify`. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v ?? null)).join(",")}]`;
  const record = value as Record<string, unknown>;
  const parts: string[] = [];
  for (const key of Object.keys(record).sort()) {
    const v = record[key];
    if (v === undefined) continue;
    parts.push(`${JSON.stringify(key)}:${stableStringify(v)}`);
  }
  return `{${parts.join(",")}}`;
}

/**
 * Everything about a token object, as one string, except what differs between
 * interchangeable members of one stack: its `id`, its `stackCount`, and the
 * `splitFromStack` mark. Two tokens with the same shape can't be told apart
 * by anything the game reads — their counters, damage, modifiers and
 * timestamps, and every per-turn record (attacked this turn, damage dealt to
 * it this turn, abilities used this turn).
 */
export function exactTokenShape(o: GameObject): string {
  const { id: _id, stackCount: _count, splitFromStack: _split, ...rest } = o;
  return stableStringify(rest);
}

/** Fields holding snapshots of things that have left a zone — a spell as it
 * last was on the stack, a permanent as it last existed, an ability kept to
 * be copied. Each is read only by something already waiting when it was
 * taken (a storm copy, a cast trigger, a leaves-the-battlefield trigger
 * reading "enchanted creature"), and `Game.refoldSplitTokens` runs only once
 * nothing is waiting, so the ids inside them name nothing anyone will look
 * up. Counting them kept apart every two tokens a spell had targeted. */
const SNAPSHOT_STATE_FIELDS: ReadonlySet<string> = new Set(["ceasedTokens", "departedAbilities"]);
const SNAPSHOT_OBJECT_FIELDS: ReadonlySet<string> = new Set(["lastOnStack", "lastKnown", "earlierLastKnown"]);

/** `TurnHistory` lists kept only to be counted, whose ids nothing looks up:
 * how many creatures attacked (`attackers`), how much damage sources dealt
 * (`damageDealt`, read by amount and colour). Every attacking token of a
 * stack is in `attackers`; naming them would keep them apart all turn. */
const COUNT_ONLY_HISTORY: ReadonlySet<string> = new Set(["attackers", "damageDealt"]);

/**
 * Every object id the rest of the game state names: other objects' fields
 * (an Aura's host, an exiled card's exiler, a modifier's source), delayed
 * triggers, prevention shields, anything waiting, and the turn's history of
 * what entered, died, was sacrificed or exiled (`PlayerState.turnHistory`,
 * read by matching each entry's object). Left out: the zone lists (where
 * things are, not what refers to them), the event log (what has already
 * happened), each object's own `id`, the snapshots of things that left a
 * zone, the history kept only to count (`COUNT_ONLY_HISTORY`), and cards in
 * a library, which name nothing (each is a new object, rule 400.7).
 *
 * A token named here may not be folded *into* another one, since the name
 * would then point at nothing: Thalisse, Reverent Medium counts the tokens
 * that entered this turn by the objects the history names. It may still
 * absorb others (`Game.refoldSplitTokens`), since the history keeps its own
 * count. Keys of id-keyed records (`publicStints`) aren't read: they're
 * bookkeeping about the object itself, not references to it.
 */
export function referencedObjectIds(state: GameState): Set<ObjectId> {
  const seen = new Set<ObjectId>();
  const walk = (value: unknown): void => {
    if (typeof value === "string") {
      if (value.startsWith("obj-")) seen.add(value as ObjectId);
      return;
    }
    if (value === null || typeof value !== "object") return;
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    for (const item of Object.values(value)) walk(item);
  };
  for (const [key, value] of Object.entries(state)) {
    if (key === "zones" || key === "eventLog" || key === "objects" || key === "players") continue;
    if (SNAPSHOT_STATE_FIELDS.has(key)) continue;
    walk(value);
  }
  for (const seat of Object.values(state.players)) {
    for (const [key, value] of Object.entries(seat)) {
      if (key !== "turnHistory") {
        walk(value);
        continue;
      }
      for (const [list, entries] of Object.entries(value ?? {})) {
        if (!COUNT_ONLY_HISTORY.has(list)) walk(entries);
      }
    }
  }
  for (const object of Object.values(state.objects)) {
    if (object.zone === "library") continue;
    for (const [key, value] of Object.entries(object)) {
      if (key !== "id" && !SNAPSHOT_OBJECT_FIELDS.has(key)) walk(value);
    }
  }
  return seen;
}
