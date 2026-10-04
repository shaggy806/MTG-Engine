import { defineCard } from "../define.js";

// EDHREC rank 5573.
// The reflexive ability chooses its target as it's put on the stack, X read
// then (Spellstutter Sprite's dynamic target filter) and again as it
// resolves.
const SHRINES = { type: "enchantment", subtype: "Shrine", controlledBy: "you" } as const;
const TEXT =
  "At the beginning of your end step, you may pay {1}. When you do, destroy target creature with toughness X or less, where X is the number of Shrines you control.";

export default defineCard({
  name: "Go-Shintai of Hidden Cruelty",
  manaCost: "{3}{B}",
  colors: ["B"],
  supertypes: ["legendary"],
  types: ["enchantment", "creature"],
  subtypes: ["Shrine"],
  power: 2,
  toughness: 2,
  keywords: ["deathtouch"],
  text: `Deathtouch\n${TEXT}`,
  triggered: [
    {
      trigger: { on: "step-begins", step: "end", who: "you" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Pay {1} to destroy a creature with toughness X or less?",
        cost: "{1}",
        effect: {
          kind: "reflexive-trigger",
          targets: [
            {
              kind: "permanent",
              filter: {
                type: "creature",
                toughness: { op: "lte", n: { amount: { countOf: SHRINES } } },
              },
            },
          ],
          effect: { kind: "destroy", target: 0 },
          text: "When you do, destroy target creature with toughness X or less, where X is the number of Shrines you control.",
        },
      },
      resolve: null,
      text: TEXT,
    },
  ],
});
