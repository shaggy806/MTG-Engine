/**
 * What a bot scries or surveils away — the card-quality call a scry is for.
 *
 * v1 used to keep everything on top (`AutomaticController`'s do-nothing
 * answer), and v2 almost always agreed, since its search can't tell: a scry
 * changes which card is drawn *next*, and a rollout to the end of the turn
 * rarely reaches that draw, so every answer scores the same and the tie goes
 * to v1's. So the call is made here, by rule, for v1 to answer with and v2 to
 * fall back on:
 *
 * - **A land** stays while the bot is short of lands — fewer than
 *   `LANDS_WANTED` among its battlefield, its hand and the lands already
 *   kept above it — or when it makes a colour the bot can't yet make
 *   (`land-colors.ts`), with the lands in hand counted as made. Past that it's a flood card, and goes.
 * - **A spell** stays unless it's far from castable: its mana value more
 *   than `TURNS_AWAY` lands beyond what the bot has (lands kept above it
 *   counted), two fewer if it needs a colour the bot can't make with no land
 *   coming for it — then it goes.
 * - **Surveil** also bins a card castable from the graveyard (flashback,
 *   escape, disturb, a graveyard ability): it's still in reach there.
 *
 * Cards are judged top first, each knowing what was kept above it, since the
 * draws come in that order. Kept cards stay in their order (the engine's
 * scry has no reordering). Pure over the state; no `bot/` import.
 */

import type { CardRegistry } from "./cards.js";
import { computeCharacteristics } from "./characteristics.js";
import { missingColors } from "./land-colors.js";
import { COLORS, manaValue, parseManaCost } from "./mana.js";
import type { Color } from "./mana.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameState } from "./state.js";
import { rulesTextName } from "./state.js";
import { isManaAbility } from "./abilities.js";

/** Lands a Commander deck wants before more of them are flood. */
const LANDS_WANTED = 7;
/** A spell more than this many mana beyond the bot's reach is a card it
 * won't cast for turns: scry it away. */
const TURNS_AWAY = 3;

/** The colours `name`'s printed mana abilities and basic land types make,
 * coarsely: enough to say whether a land fixes a missing colour. */
function landColors(registry: CardRegistry, name: string, identity: readonly Color[]): Set<Color> {
  const out = new Set<Color>();
  if (!registry.has(name)) return out;
  const def = registry.get(name);
  const basic: Record<string, Color> = { Plains: "W", Island: "U", Swamp: "B", Mountain: "R", Forest: "G" };
  for (const subtype of def.subtypes ?? []) if (basic[subtype] !== undefined) out.add(basic[subtype]);
  for (const ability of def.activated ?? []) {
    const effect = ability.effect;
    if (effect?.kind !== "add-mana") continue;
    const mana = effect.mana;
    if (mana === "any-color" || mana === "chosen") COLORS.forEach((c) => out.add(c));
    else if (mana === "commander-identity") identity.forEach((c) => out.add(c));
    else if (typeof mana === "string") {
      if ((COLORS as readonly string[]).includes(mana)) out.add(mana as Color);
    } else if ("oneOf" in mana) mana.oneOf.forEach((c) => (COLORS as readonly string[]).includes(c) && out.add(c as Color));
    else if ("all" in mana) mana.all.forEach((c) => (COLORS as readonly string[]).includes(c) && out.add(c as Color));
  }
  return out;
}

function castableFromGraveyard(registry: CardRegistry, name: string): boolean {
  if (!registry.has(name)) return false;
  const def = registry.get(name);
  return (
    def.flashback !== null ||
    def.escape !== null ||
    def.disturb !== null ||
    (def.activated ?? []).some((a) => a.zone === "graveyard")
  );
}

/** The cards of `cards` (the top of `me`'s library, top first) to move away:
 * to the bottom for a scry, to the graveyard for a surveil. */
export function scryAway(
  state: GameState,
  registry: CardRegistry,
  me: PlayerId,
  cards: readonly ObjectId[],
  mode: "scry" | "surveil",
): ObjectId[] {
  const isLand = (name: string): boolean => registry.has(name) && registry.get(name).types.includes("land");
  const identity = state.players[me]?.commanderIdentity ?? [];

  let lands = 0;
  let manaRocks = 0;
  for (const id of state.zones.shared.battlefield) {
    if (state.objects[id]?.controller !== me) continue;
    const c = computeCharacteristics(state, registry, id);
    if (c.types.includes("land")) {
      lands += state.objects[id].stackCount ?? 1;
      continue;
    }
    const name = rulesTextName(state.objects[id]);
    if (registry.has(name) && (registry.get(name).activated ?? []).some(isManaAbility)) manaRocks += 1;
  }
  // Lands in hand count as made: toward the lands wanted, and for the
  // colours they'll make once played.
  const missing = missingColors(state, registry, me);
  for (const id of state.zones.perPlayer[me]?.hand ?? []) {
    const name = state.objects[id]?.cardName;
    if (name === undefined || !isLand(name)) continue;
    lands += 1;
    for (const c of landColors(registry, name, identity)) missing.delete(c);
  }

  const away: ObjectId[] = [];
  for (const id of cards) {
    const name = state.objects[id]?.cardName;
    if (name === undefined || !registry.has(name)) continue;
    if (isLand(name)) {
      const fixes = [...landColors(registry, name, identity)].some((c) => missing.has(c));
      if (lands < LANDS_WANTED || fixes) {
        lands += 1;
        for (const c of landColors(registry, name, identity)) missing.delete(c);
      } else {
        away.push(id);
      }
      continue;
    }
    const cost = parseManaCost(registry.get(name).manaCost);
    const reach = lands + manaRocks;
    // A colour we can't make with no land for it coming is two more turns
    // away: it waits for a fetch or a land draw first.
    const offColour = COLORS.some((c) => cost.colored[c] > 0 && missing.has(c));
    const far = manaValue(cost) > reach + TURNS_AWAY - (offColour ? 2 : 0);
    if (far || (mode === "surveil" && castableFromGraveyard(registry, name))) {
      away.push(id);
    }
  }
  return away;
}
