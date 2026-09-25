import { defineCard } from "../define.js";

export default defineCard({
  name: "Undercity Dire Rat",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Rat"],
  power: 2,
  toughness: 2,
  text: "Rat Tail — When this creature dies, create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  triggered: [
    {
      trigger: { on: "dies", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "Rat Tail — When this creature dies, create a Treasure token.",
    },
  ],
});
