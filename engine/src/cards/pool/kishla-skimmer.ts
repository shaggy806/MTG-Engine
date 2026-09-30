import { defineCard } from "../define.js";

const TEXT = "Whenever a card leaves your graveyard during your turn, draw a card. This ability triggers only once each turn.";

export default defineCard({
  name: "Kishla Skimmer",
  manaCost: "{G}{U}",
  colors: ["G", "U"],
  types: ["creature"],
  subtypes: ["Bird", "Scout"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: `Flying\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "leaves-graveyard", who: "you" },
      condition: { kind: "your-turn" },
      oncePerTurn: true,
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: TEXT,
    },
  ],
});
