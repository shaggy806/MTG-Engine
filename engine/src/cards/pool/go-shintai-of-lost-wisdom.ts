import { defineCard } from "../define.js";

// EDHREC rank 6107.

const END_TEXT =
  "At the beginning of your end step, you may pay {1}. When you do, target player mills X cards, where X is the number of Shrines you control.";

export default defineCard({
  name: "Go-Shintai of Lost Wisdom",
  manaCost: "{1}{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["enchantment", "creature"],
  subtypes: ["Shrine"],
  power: 0,
  toughness: 4,
  keywords: ["flying"],
  text: `Flying\n${END_TEXT} (To mill a card, a player puts the top card of their library into their graveyard.)`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      // Go-Shintai of Ancient Wars' shape: a reflexive trigger (rule 603.12),
      // its target chosen once {1} is paid, X counted as it resolves.
      effect: {
        kind: "may",
        prompt: "Pay {1} to have target player mill cards?",
        cost: "{1}",
        effect: {
          kind: "reflexive-trigger",
          targets: ["player"],
          effect: { kind: "mill", target: 0, amount: { countOf: { subtype: "Shrine", controlledBy: "you" } } },
          text: "When you do, target player mills X cards, where X is the number of Shrines you control.",
        },
      },
      resolve: null,
      text: END_TEXT,
    },
  ],
});
