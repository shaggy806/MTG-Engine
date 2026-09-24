import { defineCard } from "../define.js";

export default defineCard({
  name: "Altar of Dementia",
  manaCost: "{2}",
  colors: [],
  types: ["artifact"],
  text: "Sacrifice a creature: Target player mills cards equal to the sacrificed creature's power.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: "creature-you-control" },
      targets: ["player"],
      effect: { kind: "mill", target: 0, amount: { powerOf: "sacrificed" } },
      resolve: null,
      text: "Sacrifice a creature: Target player mills cards equal to the sacrificed creature's power.",
    },
  ],
});
