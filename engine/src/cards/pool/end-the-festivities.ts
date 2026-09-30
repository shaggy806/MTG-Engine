import { defineCard } from "../define.js";

export default defineCard({
  name: "End the Festivities",
  manaCost: "{R}",
  colors: ["R"],
  types: ["sorcery"],
  text: "End the Festivities deals 1 damage to each opponent and each creature and planeswalker they control.",
  effect: {
    kind: "sequence",
    effects: [
      { kind: "damage", amount: 1, who: "each-opponent" },
      {
        kind: "damage-all",
        filter: { typesAnyOf: ["creature", "planeswalker"], controlledBy: "opponent" },
        amount: 1,
      },
    ],
  },
});
