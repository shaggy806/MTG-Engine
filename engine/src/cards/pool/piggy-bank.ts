import { defineCard } from "../define.js";

export default defineCard({
  name: "Piggy Bank",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["artifact", "creature"],
  subtypes: ["Boar", "Toy"],
  power: 3,
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
