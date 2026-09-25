import { defineCard } from "../define.js";

export default defineCard({
  name: "Army Ants",
  manaCost: "{1}{B}{R}",
  colors: ["B", "R"],
  types: ["creature"],
  subtypes: ["Insect"],
  power: 1,
  toughness: 1,
  text: "{T}, Sacrifice a land: Destroy target land.",
  activated: [
    {
      cost: { mana: null, tap: true, sacrifice: { filter: { type: "land" } } },
      targets: ["land"],
      effect: { kind: "destroy", target: 0 },
      resolve: null,
      text: "{T}, Sacrifice a land: Destroy target land.",
    },
  ],
});
