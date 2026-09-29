import { defineCard } from "../define.js";
import { enduringReturn } from "../helpers.js";

const DRAW_TEXT = "Whenever a creature you control deals combat damage to a player, draw a card.";

export default defineCard({
  name: "Enduring Curiosity",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["enchantment", "creature"],
  subtypes: ["Cat", "Glimmer"],
  power: 4,
  toughness: 3,
  keywords: ["flash"],
  text: `Flash\n${DRAW_TEXT}\n${enduringReturn("Enduring Curiosity").text}`,
  triggered: [
    {
      trigger: { on: "deals-combat-damage-to-player", who: "you-control", filter: { type: "creature" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
    enduringReturn("Enduring Curiosity"),
  ],
});
