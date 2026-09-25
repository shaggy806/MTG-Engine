import { defineCard } from "../define.js";

export default defineCard({
  name: "Etherium Astrolabe",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["artifact"],
  keywords: ["flash"],
  text: "Flash\n{B}, {T}, Sacrifice an artifact: Draw a card.",
  activated: [
    {
      cost: { mana: "{B}", tap: true, sacrifice: { filter: { type: "artifact" } } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "{B}, {T}, Sacrifice an artifact: Draw a card.",
    },
  ],
});
