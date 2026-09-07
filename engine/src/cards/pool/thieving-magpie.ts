import { defineCard } from "../define.js";

export default defineCard({
  name: "Thieving Magpie",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 1,
  keywords: ["flying"],
  text: "Flying. Whenever Thieving Magpie deals combat damage to a player, draw a card.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever Thieving Magpie deals combat damage to a player, draw a card.",
    },
  ],
});
