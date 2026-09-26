import { defineCard } from "../define.js";

// Any damage to an opponent, not only combat damage.
const TRIGGER_TEXT = "Whenever Thieving Magpie deals damage to an opponent, draw a card.";

export default defineCard({
  name: "Thieving Magpie",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird"],
  power: 1,
  toughness: 3,
  keywords: ["flying"],
  text: `Flying\n${TRIGGER_TEXT}`,
  triggered: [
    {
      trigger: { on: "deals-damage", who: "self", to: "opponent" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: TRIGGER_TEXT,
    },
  ],
});
