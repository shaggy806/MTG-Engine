/**
 * The Ring tempts you (rule 701.54): the Ring-bearer designation and the
 * Ring emblem a tempted player gets. Pure — `Game` applies the temptation
 * (`the-ring-tempts-you` effect), this says who the Ring-bearer is and what
 * the emblem does.
 *
 * The emblem (701.54c) is one per player, made the first time the Ring
 * tempts them. Its first ability — "your Ring-bearer is legendary and can't
 * be blocked by creatures with greater power" — is read where those
 * questions are asked (`supertypesOf`, the block check in
 * `combat/eligibility.ts`) off the designation itself; its three later ones
 * are triggered abilities of the emblem's object, each there only once the
 * Ring has tempted that player enough times (a `ring-tempted` trigger
 * condition: the count only ever grows, so asking it as the event happens
 * is the same as the ability having arrived).
 */
import type { TriggeredAbility } from "./abilities.js";
import type { ObjectId, PlayerId } from "./primitives.js";
import type { GameObject, GameState } from "./state.js";

/** Whether `object` is a Ring-bearer now — its controller's (rule 701.54e:
 * on the battlefield under that player's control, with the designation). */
export function hasRingBearerDesignation(object: GameObject | undefined): boolean {
  return (
    object !== undefined &&
    object.zone === "battlefield" &&
    object.ringBearer !== undefined &&
    object.ringBearer === object.controller
  );
}

/** Whether `id` is `player`'s Ring-bearer (rule 701.54e). */
export function isRingBearer(state: GameState, player: PlayerId, id: ObjectId): boolean {
  const object = state.objects[id];
  return hasRingBearerDesignation(object) && object!.ringBearer === player;
}

/** `player`'s Ring-bearer, if they have one. */
export function ringBearerOf(state: GameState, player: PlayerId): ObjectId | undefined {
  return state.zones.shared.battlefield.find((id) => isRingBearer(state, player, id));
}

const LEVEL_TEXT = [
  "Your Ring-bearer is legendary and can't be blocked by creatures with greater power.",
  "Whenever your Ring-bearer attacks, draw a card, then discard a card.",
  "Whenever your Ring-bearer becomes blocked by a creature, that creature's controller sacrifices it at end of combat.",
  "Whenever your Ring-bearer deals combat damage to a player, each opponent loses 3 life.",
] as const;

/** The emblem's text at `count` temptations: the abilities it has by then
 * (its name, The Ring, is the emblem's `sourceName`). */
export function ringEmblemText(count: number): string {
  return LEVEL_TEXT.slice(0, Math.max(1, Math.min(4, count))).join(" ");
}

/** The Ring emblem's triggered abilities (rule 701.54c), each gated on how
 * many times the Ring has tempted its owner. */
export const RING_EMBLEM_TRIGGERS: readonly TriggeredAbility[] = [
  {
    trigger: { on: "attacks", who: "ring-bearer" },
    whileCondition: { kind: "ring-tempted", atLeast: 2 },
    targets: [],
    effect: {
      kind: "sequence",
      effects: [
        { kind: "draw", amount: 1 },
        { kind: "discard", target: "you", amount: 1 },
      ],
    },
    resolve: null,
    text: LEVEL_TEXT[1],
  },
  {
    trigger: { on: "blocked-by", who: "ring-bearer" },
    whileCondition: { kind: "ring-tempted", atLeast: 3 },
    targets: [],
    effect: {
      kind: "delayed-trigger",
      at: "end-of-combat",
      effect: { kind: "sacrifice-target", target: "trigger-object", byItsController: true },
      text: "The creature that blocked your Ring-bearer is sacrificed.",
    },
    resolve: null,
    text: LEVEL_TEXT[2],
  },
  {
    trigger: { on: "deals-combat-damage-to-player", who: "ring-bearer" },
    whileCondition: { kind: "ring-tempted", atLeast: 4 },
    targets: [],
    effect: { kind: "lose-life", amount: 3, who: "each-opponent" },
    resolve: null,
    text: LEVEL_TEXT[3],
  },
];
