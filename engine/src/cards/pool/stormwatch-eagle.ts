import { defineCard } from "../define.js";

export default defineCard({
  name: "Stormwatch Eagle",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 2,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying\nSacrifice a land: Return this creature to its owner's hand.",
  activated: [
    {
      cost: { mana: null, tap: false, sacrifice: { filter: { type: "land" } } },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: "Sacrifice a land: Return this creature to its owner's hand.",
    },
  ],
});
