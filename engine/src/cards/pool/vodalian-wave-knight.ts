import { defineCard } from "../define.js";

// EDHREC rank 6217.
//
// Bellowing Aegisaur's "each other … you control" counters; `subtypes` is
// an OR ("Merfolk and/or Knight").
const TEXT = "Whenever you draw a card, put a +1/+1 counter on each other Merfolk and/or Knight you control.";

export default defineCard({
  name: "Vodalian Wave-Knight",
  manaCost: "{2}{W}{U}",
  colors: ["W", "U"],
  types: ["creature"],
  subtypes: ["Merfolk", "Knight"],
  power: 3,
  toughness: 3,
  text: TEXT,
  triggered: [
    {
      trigger: { on: "draws", who: "you" },
      targets: [],
      effect: {
        kind: "add-counter-all",
        filter: { subtypes: ["Merfolk", "Knight"], controlledBy: "you" },
        counter: "+1/+1",
        amount: 1,
        exceptSource: true,
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
