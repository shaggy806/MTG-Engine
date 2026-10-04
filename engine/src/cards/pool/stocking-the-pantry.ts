import { defineCard } from "../define.js";

// EDHREC rank 3647.
//
// "Whenever you put one or more +1/+1 counters on a creature you control" is
// Terrasymbiosis's trigger (`counters-put`, `byYou`).
const COUNTER_TEXT =
  "Whenever you put one or more +1/+1 counters on a creature you control, put a supply counter on this enchantment.";
const DRAW_TEXT = "{2}, Remove a supply counter from this enchantment: Draw a card.";

export default defineCard({
  name: "Stocking the Pantry",
  manaCost: "{G}",
  colors: ["G"],
  types: ["enchantment"],
  text: `${COUNTER_TEXT}\n${DRAW_TEXT}`,
  triggered: [
    {
      trigger: {
        on: "counters-put",
        who: "you-control",
        counter: "+1/+1",
        filter: { type: "creature" },
        byYou: true,
      },
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "supply", amount: 1 },
      resolve: null,
      text: COUNTER_TEXT,
    },
  ],
  activated: [
    {
      cost: { mana: "{2}", tap: false, removeCounter: { kind: "supply", count: 1 } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
