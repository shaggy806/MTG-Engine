import { defineCard } from "../define.js";

export default defineCard({
  name: "Reconnaissance Mission",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["enchantment"],
  cycling: { cost: "{2}" },
  text: "Whenever a creature you control deals combat damage to a player, you may draw a card.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "may", prompt: "Draw a card?", effect: { kind: "draw", amount: 1 } },
      resolve: null,
      text: "Whenever a creature you control deals combat damage to a player, you may draw a card.",
    },
  ],
});
