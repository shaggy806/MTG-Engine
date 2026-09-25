import { defineCard } from "../define.js";

export default defineCard({
  name: "Curiosity Crafter",
  manaCost: "{3}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird", "Wizard"],
  power: 3,
  toughness: 3,
  keywords: ["flying"],
  text: "Flying\nYou have no maximum hand size.\nWhenever a creature token you control deals combat damage to a player, draw a card.",
  triggered: [
    {
      trigger: {
        on: "deals-combat-damage-to-player",
        who: "you-control",
        filter: { token: true, type: "creature" },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: "Whenever a creature token you control deals combat damage to a player, draw a card.",
    },
  ],
  static: [{ affects: { scope: "self" }, noMaxHandSize: true, text: "You have no maximum hand size." }],
});
