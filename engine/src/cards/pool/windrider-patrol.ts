import { defineCard } from "../define.js";

export default defineCard({
  name: "Windrider Patrol",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Wizard"],
  power: 4,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nWhenever this creature deals combat damage to a player, scry 2. (Look at the top two cards of your library, then put any number of them on the bottom and the rest on top in any order.)",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "scry", amount: 2 },
      resolve: null,
      text: "Whenever this creature deals combat damage to a player, scry 2.",
    },
  ],
});
