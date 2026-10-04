import { defineCard } from "../define.js";

// EDHREC rank 4725.

const DRAW_TEXT = "Whenever an artifact creature you control deals combat damage to a player, draw a card.";

export default defineCard({
  name: "Research Thief",
  manaCost: "{4}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Moonfolk", "Wizard"],
  power: 3,
  toughness: 3,
  keywords: ["flash", "flying"],
  text: `Flash\nFlying\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "deals-combat-damage-to-player",
        who: "you-control",
        filter: { type: "artifact" },
      },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
