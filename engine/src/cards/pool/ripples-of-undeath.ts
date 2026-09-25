import { defineCard } from "../define.js";

const TEXT =
  "At the beginning of your first main phase, mill three cards. Then you may pay {1} and 3 life. " +
  "If you do, put a card from among those cards into your hand.";

export default defineCard({
  name: "Ripples of Undeath",
  manaCost: "{1}{B}",
  colors: ["B"],
  types: ["enchantment"],
  text: TEXT,
  triggered: [
    {
      // The first main phase is the precombat one; an additional main phase
      // only ever follows a combat.
      trigger: { on: "step-begins", step: "precombat-main", who: "you" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "mill", target: "you", amount: 3 },
          {
            kind: "may",
            prompt: "Pay {1} and 3 life to put a card milled this way into your hand?",
            cost: "{1}",
            costLife: 3,
            effect: {
              kind: "look-and-choose",
              zone: "graveyard",
              min: 1,
              max: 1,
              destination: "hand",
              leftover: "stay",
              filter: { thisWay: "milled" },
            },
          },
        ],
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
