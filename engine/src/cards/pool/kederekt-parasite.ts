import { defineCard } from "../define.js";

const TEXT =
  "Whenever an opponent draws a card, if you control a red permanent, you may have this creature deal 1 damage to that player.";

export default defineCard({
  name: "Kederekt Parasite",
  manaCost: "{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Horror"],
  power: 1,
  toughness: 1,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "draws", who: "opponent" },
      condition: { kind: "controls", filter: { colors: ["R"] }, atLeast: 1 },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Deal 1 damage to that player?",
        effect: { kind: "damage", amount: 1, who: "trigger-player" },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
