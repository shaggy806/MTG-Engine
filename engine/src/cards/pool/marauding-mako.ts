import { defineCard } from "../define.js";

// EDHREC rank 5180.

export default defineCard({
  name: "Marauding Mako",
  manaCost: "{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Shark", "Pirate"],
  power: 1,
  toughness: 1,
  cycling: { cost: "{2}" },
  text: "Whenever you discard one or more cards, put that many +1/+1 counters on this creature.\nCycling {2} ({2}, Discard this card: Draw a card.)",
  triggered: [
    {
      trigger: { on: "discards", who: "you" },
      // One trigger per discard event; its trigger value is how many cards
      // (Magmakin Artillerist's shape).
      targets: [],
      effect: { kind: "add-counter", target: "source", counter: "+1/+1", amount: { triggerValue: true } },
      resolve: null,
      text: "Whenever you discard one or more cards, put that many +1/+1 counters on this creature.",
    },
  ],
});
