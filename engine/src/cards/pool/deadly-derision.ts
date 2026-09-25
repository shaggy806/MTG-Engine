import { defineCard } from "../define.js";

export default defineCard({
  name: "Deadly Derision",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["instant"],
  text: "Destroy target creature or planeswalker. Create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  targets: [{ kind: "permanent", whose: "any", filter: { typesAnyOf: ["creature", "planeswalker"] } }],
  effect: {
    kind: "sequence",
    effects: [
      { kind: "destroy", target: 0 },
      { kind: "create-token", token: "Treasure Token", count: 1 },
    ],
  },
});
