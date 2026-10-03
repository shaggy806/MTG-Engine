/**
 * A rule over the chosen cards of a `choose-from-zone` decision *as a set* —
 * what a `CardFilter` can't say, since it checks each card on its own.
 *
 * - `"share"`: every chosen card has some tag in common with every other —
 *   Myriad Landscape's "up to two basic land cards **that share a land
 *   type**", where a card's tags are its land types (rule 205.3i). One card
 *   alone always passes (the card's ruling: "You can choose to find one basic
 *   land card").
 * - `"one-each"`: the chosen cards can be matched to different slots, one
 *   card per slot — Krosan Verge's "a Forest card and a Plains card", where a
 *   card's tags are the slots it could fill (a Forest Plains fills either, so
 *   two of them are both finds). Finding fewer than every slot is allowed —
 *   a search of a hidden zone may fail to find (rule 701.19b).
 *
 * The tags are worked out as the decision is raised, so checking a set is
 * pure and needs neither the registry nor the layer fold: the validator
 * (`decisions/choose-from-zone.ts`), the bots and the client all use these
 * same functions. The tags say what kind of card each library card is, so
 * `view.ts` hides them from every player but the chooser.
 */

import type { ObjectId } from "./primitives.js";

export interface ZoneChoiceTogether {
  readonly rule: "share" | "one-each";
  /** Each eligible card's tags: its land types (`share`), or the slots it
   * could fill (`one-each`). */
  readonly tags: Readonly<Record<string, readonly string[]>>;
  /** What a client tells the chooser — "that share a land type", "a Forest
   * card and a Plains card". */
  readonly text: string;
}

/** Why `chosen` breaks `together`, or `null` when it doesn't. Assumes each
 * card is already eligible and none is chosen twice (checked before this). */
export function togetherViolation(
  together: ZoneChoiceTogether,
  chosen: readonly ObjectId[],
): string | null {
  return fitsTogether(together, chosen)
    ? null
    : `the chosen cards must be ${together.rule === "share" ? "cards " : ""}${together.text}`;
}

/** Whether `chosen` obeys `together`. */
export function fitsTogether(together: ZoneChoiceTogether, chosen: readonly ObjectId[]): boolean {
  const tagsOf = (id: ObjectId): readonly string[] => together.tags[id] ?? [];
  if (together.rule === "share") {
    if (chosen.length < 2) return true;
    return tagsOf(chosen[0]).some((tag) => chosen.every((id) => tagsOf(id).includes(tag)));
  }
  // One card per slot: a matching that covers every chosen card. Two or
  // three slots at most on a real card, so plain backtracking is enough.
  const used = new Set<string>();
  const assign = (index: number): boolean => {
    if (index === chosen.length) return true;
    for (const tag of tagsOf(chosen[index])) {
      if (used.has(tag)) continue;
      used.add(tag);
      if (assign(index + 1)) return true;
      used.delete(tag);
    }
    return false;
  };
  return assign(0);
}

/**
 * A legal answer built from `preferred` — a chooser's pick that may not obey
 * `together` (a bot's ranking knows nothing of it). Keeps each preferred card
 * that still fits with the ones kept, in order, then tops up from `eligible`
 * (in order) to as many cards as were preferred, at least `min` and at most
 * `max`.
 */
export function completeTogether(
  together: ZoneChoiceTogether,
  preferred: readonly ObjectId[],
  eligible: readonly ObjectId[],
  min: number,
  max: number,
): ObjectId[] {
  const want = Math.min(max, Math.max(min, preferred.length));
  const kept: ObjectId[] = [];
  for (const id of [...preferred, ...eligible]) {
    if (kept.length >= want) break;
    if (kept.includes(id) || !eligible.includes(id)) continue;
    if (fitsTogether(together, [...kept, id])) kept.push(id);
  }
  return kept;
}
