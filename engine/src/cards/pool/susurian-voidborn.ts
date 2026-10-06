import { defineCard } from "../define.js";

// Rulings:
//   [2025-07-25] If the target opponent is an illegal target as Susurian Voidborn's first ability
//     tries to resolve, it won't resolve and none of its effects will happen. You won't gain life.
//   [2025-07-25] If Susurian Voidborn dies at the same time as one or more creatures or artifacts
//     you control, its first ability will still trigger for itself and each of those creatures
//     and artifacts.

const TEXT =
  "Whenever this creature or another creature or artifact you control dies, target opponent loses 1 life and you gain 1 life.";
const WARP_TEXT =
  "Warp {B} (You may cast this card from your hand for its warp cost. Exile this creature at the beginning of the next end step, then you may cast it from exile on a later turn.)";

const DRAIN = {
  kind: "sequence",
  effects: [
    { kind: "lose-life", amount: 1, target: 0 },
    { kind: "gain-life", amount: 1 },
  ],
} as const;

// Al Bhed Salvagers' two halves (an artifact "dies" too).
export default defineCard({
  name: "Susurian Voidborn",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Vampire", "Soldier"],
  power: 2,
  toughness: 2,
  text: `${TEXT}\n${WARP_TEXT}`,
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: ["opponent"],
      effect: DRAIN,
      resolve: null,
      text: TEXT,
    },
    {
      trigger: {
        on: "dies",
        who: "you-control",
        filter: { typesAnyOf: ["creature", "artifact"] },
        otherOnly: true,
      },
      targets: ["opponent"],
      effect: DRAIN,
      resolve: null,
      text: TEXT,
    },
  ],
  warp: { cost: "{B}" },
});
