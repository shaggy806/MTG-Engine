import { defineCard } from "../define.js";

export default defineCard({
  name: "Jewel Thief",
  manaCost: "{2}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Cat", "Rogue"],
  power: 3,
  toughness: 3,
  keywords: ["vigilance", "trample"],
  text: "Vigilance, trample\nWhen this creature enters, create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
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
