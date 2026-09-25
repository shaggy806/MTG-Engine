import { defineCard } from "../define.js";

export default defineCard({
  name: "Horizon Canopy",
  colors: [],
  types: ["land"],
  text: "{T}, Pay 1 life: Add {G} or {W}.\n{1}, {T}, Sacrifice this land: Draw a card.",
  activated: [
    {
      cost: { mana: null, tap: true, payLife: 1 },
      targets: [],
      effect: { kind: "add-mana", mana: { oneOf: ["G", "W"] }, amount: 1 },
      resolve: null,
      text: "{T}, Pay 1 life: Add {G} or {W}.",
    },
    {
      cost: { mana: "{1}", tap: true, sacrifice: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{1}, {T}, Sacrifice this land: Draw a card.",
    },
  ],
});
