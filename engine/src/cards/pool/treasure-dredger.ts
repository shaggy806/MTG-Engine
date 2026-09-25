import { defineCard } from "../define.js";

export default defineCard({
  name: "Treasure Dredger",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Rogue"],
  power: 2,
  toughness: 2,
  text: "{1}, {T}, Pay 1 life: Create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  activated: [
    {
      cost: { mana: "{1}", tap: true, payLife: 1 },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "{1}, {T}, Pay 1 life: Create a Treasure token.",
    },
  ],
});
