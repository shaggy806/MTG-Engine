import { defineCard } from "../define.js";

export default defineCard({
  name: "Plundering Pirate",
  manaCost: "{2}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Orc", "Pirate"],
  power: 3,
  toughness: 2,
  text: "When this creature enters, create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "When this creature enters, create a Treasure token.",
    },
  ],
});
