import { defineCard } from "../define.js";

// #449 in top-commanders.txt.
//
// A completed Saga's sacrifice is a real sacrifice, so it draws a card too.
// "That Saga's mana value" reads it as it last existed once it's been
// sacrificed.
const SAC_TEXT = "Whenever you sacrifice an enchantment, draw a card.";
const SAGA_TEXT =
  "Whenever the final chapter ability of a Saga you control resolves, each opponent loses X life and " +
  "you gain X life, where X is that Saga's mana value.";
const X = { manaValueOf: "trigger-object" } as const;

export default defineCard({
  name: "Narci, Fable Singer",
  manaCost: "{1}{W}{B}{G}",
  colors: ["W", "B", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Bard"],
  power: 3,
  toughness: 3,
  keywords: ["lifelink"],
  text: `Lifelink\n${SAC_TEXT}\n${SAGA_TEXT}`,
  triggered: [
    {
      trigger: { on: "sacrifice", who: "you", filter: { type: "enchantment" } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: SAC_TEXT,
    },
    {
      trigger: { on: "chapter-resolves", who: "you-control", finalOnly: true },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: X, who: "each-opponent" },
          { kind: "gain-life", amount: X },
        ],
      },
      resolve: null,
      text: SAGA_TEXT,
    },
  ],
});
