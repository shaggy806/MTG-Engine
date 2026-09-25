import { defineCard } from "../define.js";

export default defineCard({
  name: "Glittermonger",
  manaCost: "{3}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Elf", "Rogue"],
  power: 1,
  toughness: 4,
  text: "{T}: Create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "{T}: Create a Treasure token.",
    },
  ],
});
