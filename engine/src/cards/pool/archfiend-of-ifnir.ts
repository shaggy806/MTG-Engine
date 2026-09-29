import { defineCard } from "../define.js";

const TEXT = "Whenever you cycle or discard another card, put a -1/-1 counter on each creature your opponents control.";

// Cycling a card is discarding it, so one cycle triggers this once (the
// ruling). Once per card discarded.
export default defineCard({
  name: "Archfiend of Ifnir",
  manaCost: "{3}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Demon"],
  power: 5,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${TEXT}\nCycling {2} ({2}, Discard this card: Draw a card.)`,
  triggered: [
    {
      trigger: { on: "discards", who: "you", perCard: true },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { type: "creature", controlledBy: "opponent" },
        counter: "-1/-1",
        amount: 1,
      },
      resolve: null,
      text: TEXT,
    },
  ],
  cycling: { cost: "{2}" },
});
