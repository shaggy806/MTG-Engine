import { defineCard } from "../define.js";

export default defineCard({
  name: "Vraska's Fall",
  manaCost: "{2}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Each opponent sacrifices a creature or planeswalker of their choice and gets a poison counter.",
  effect: {
    kind: "sequence",
    effects: [
      {
        kind: "sacrifice",
        who: "each-opponent",
        filter: { typesAnyOf: ["creature", "planeswalker"] },
        count: 1,
      },
      { kind: "add-player-counters", counter: "poison", amount: 1, who: "each-opponent" },
    ],
  },
});
