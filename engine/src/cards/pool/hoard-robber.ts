import { defineCard } from "../define.js";

export default defineCard({
  name: "Hoard Robber",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Tiefling", "Rogue"],
  power: 1,
  toughness: 3,
  text: "Whenever this creature deals combat damage to a player, create a Treasure token. (It's an artifact with \"{T}, Sacrifice this token: Add one mana of any color.\")",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "create-token", token: "Treasure Token", count: 1 },
      resolve: null,
      text: "Whenever this creature deals combat damage to a player, create a Treasure token.",
    },
  ],
});
