import { defineCard } from "../define.js";

export default defineCard({
  name: "Nine-Tail White Fox",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Fox", "Spirit"],
  power: 2,
  toughness: 2,
  text: "Whenever this creature deals combat damage to a player, draw a card.",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "self" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever this creature deals combat damage to a player, draw a card.",
    },
  ],
});
