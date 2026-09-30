import { defineCard } from "../define.js";

const TEXT = "Whenever an opponent draws a card, this creature deals 1 damage to that player.";

export default defineCard({
  name: "Fate Unraveler",
  manaCost: "{3}{B}",
  colors: ["B"],
  types: ["enchantment", "creature"],
  subtypes: ["Hag"],
  power: 3,
  toughness: 4,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "draws", who: "opponent" },
      targets: [],
      effect: { kind: "damage", amount: 1, who: "trigger-player" },
      resolve: null,
      text: TEXT,
    },
  ],
});
