import { defineCard } from "../define.js";

export default defineCard({
  name: "Common Crook",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Human", "Rogue", "Villain"],
  power: 2,
  toughness: 2,
  text: "When this creature dies, create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "When this creature dies, create a Treasure token.",
    },
  ],
});
