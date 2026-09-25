import { defineCard } from "../define.js";

export default defineCard({
  name: "Broadside Barrage",
  manaCost: "{1}{U}{R}",
  colors: ["U", "R"],
  types: ["instant"],
  text: "Broadside Barrage deals 5 damage to target creature or planeswalker. Draw a card, then discard a card.",
  targets: [{ kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "damage", amount: 5, target: 0 },
      {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
    ],
  },
});
