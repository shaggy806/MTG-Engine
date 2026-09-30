import { defineCard } from "../define.js";

const TEXT = "Whenever a creature you control deals combat damage to an opponent, you may draw a card.";

// One card per creature, not per point of damage (its ruling). Combat damage
// to a player is only ever dealt to the player it attacked, an opponent.
export default defineCard({
  name: "Coastal Piracy",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: TEXT,
    },
  ],
});
