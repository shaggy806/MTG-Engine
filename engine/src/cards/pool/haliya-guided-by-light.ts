import { defineCard } from "../define.js";
import { thisOrAnother } from "../helpers.js";

//
// Rulings:
//   [2025-07-25] Haliya, Guided by Light’s second ability checks how much life you’ve gained
//     during the turn at the time it resolves, not what your life total is compared to what it was
//     when the turn began. For example, if you start the turn at 10 life, gain 6 life during the
//     turn, then lose 6 life later that turn, Haliya’s second ability will cause you to draw a
//     card as it resolves.

export default defineCard({
  name: "Haliya, Guided by Light",
  manaCost: "{2}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 3,
  toughness: 3,
  text: "Whenever Haliya or another creature or artifact you control enters, you gain 1 life.\nAt the beginning of your end step, draw a card if you've gained 3 or more life this turn.\nWarp {W} (You may cast this card from your hand for its warp cost. Exile this creature at the beginning of the next end step, then you may cast it from exile on a later turn.)",
  triggered: [
    ...thisOrAnother({
      trigger: {
        on: "enters-battlefield",
        who: "you-control",
        filter: { typesAnyOf: ["creature", "artifact"] },
      },
      targets: [],
      effect: { kind: "gain-life", amount: 1 },
      resolve: null,
      text: "Whenever Haliya or another creature or artifact you control enters, you gain 1 life.",
    }),
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      // Asked as it resolves (the ruling): life gained this turn, not the
      // life total's change.
      effect: {
        kind: "conditional",
        condition: { kind: "turn-stat", stat: "life-gained", who: "you", atLeast: 3 },
        then: { kind: "draw", amount: 1 },
      },
      resolve: null,
      text: "At the beginning of your end step, draw a card if you've gained 3 or more life this turn.",
    },
  ],
  warp: { cost: "{W}" },
});
