import { defineCard } from "../define.js";

// EDHREC rank 2737.

const DRAW_TEXT =
  "Whenever one or more +1/+1 counters are put on this creature, draw a card. This ability triggers only once each turn.";

export default defineCard({
  name: "Dusk Legion Duelist",
  manaCost: "{1}{W}",
  colors: ["W"],
  types: ["creature"],
  subtypes: ["Vampire", "Soldier"],
  power: 2,
  toughness: 2,
  keywords: ["vigilance"],
  text: `Vigilance\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: { on: "counters-put", who: "self", counter: "+1/+1" },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      oncePerTurn: true,
      text: DRAW_TEXT,
    },
  ],
});
