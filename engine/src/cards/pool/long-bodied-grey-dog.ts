import { defineCard } from "../define.js";

export default defineCard({
  name: "Long-Bodied Grey Dog",
  manaCost: "{3}",
  colors: [],
  types: ["creature"],
  subtypes: ["Dog"],
  power: 2,
  toughness: 2,
  keywords: ["flash", "reach"],
  text: "Flash\nReach\nWhen this creature enters, create a tapped Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1, tapped: true },
      resolve: null,
      text: "When this creature enters, create a tapped Treasure token.",
    },
  ],
});
