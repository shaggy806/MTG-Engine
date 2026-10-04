import { defineCard } from "../define.js";

// EDHREC rank 5462.

const ENTER_TEXT = "When this enchantment enters, draw two cards, then discard a card.";
const BOUNCE_TEXT = "When a Dragon you control enters, return this enchantment to its owner's hand.";

export default defineCard({
  name: "Roiling Dragonstorm",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["enchantment"],
  text: `${ENTER_TEXT}\n${BOUNCE_TEXT}`,
  triggered: [
    {
      trigger: { on: "enters-battlefield", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 2 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: ENTER_TEXT,
    },
    {
      trigger: { on: "enters-battlefield", who: "you-control", filter: { subtype: "Dragon" } },
      targets: [],
      effect: { kind: "return-to-hand", target: "source" },
      resolve: null,
      text: BOUNCE_TEXT,
    },
  ],
});
