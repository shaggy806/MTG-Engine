import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

// EDHREC rank 6028.
// A discarded card with {X} in its cost has mana value with X = 0 (the
// ruling; `sumOf: "mana-value"` reads it so, in the graveyard it went to).

const CHAPTER_I = "I — Lightning — This creature deals 3 damage to each of up to two target creatures.";
const CHAPTER_II = "II — Ice — Up to three target creatures can't block this turn.";
const CHAPTER_III =
  "III — Fire — Discard a card, then draw two cards. When you discard a card this way, this creature deals damage equal to that card's mana value to each opponent.";

export default defineCard({
  name: "Summon: Kujata",
  manaCost: "{5}{R}",
  colors: ["R"],
  types: ["enchantment", "creature"],
  subtypes: ["Saga", "Ox"],
  power: 7,
  toughness: 5,
  keywords: ["trample", "haste"],
  text: `(As this Saga enters and after your draw step, add a lore counter. Sacrifice after III.)\n${CHAPTER_I}\n${CHAPTER_II}\n${CHAPTER_III}\nTrample, haste`,
  chapters: [
    {
      at: [1],
      targets: distinctTargets(2, "creature", { optional: true }),
      effect: {
        kind: "sequence",
        effects: [
          { kind: "damage", amount: 3, target: 0 },
          { kind: "damage", amount: 3, target: 1 },
        ],
      },
      resolve: null,
      text: CHAPTER_I,
    },
    {
      at: [2],
      targets: distinctTargets(3, "creature", { optional: true }),
      effect: {
        kind: "sequence",
        effects: [
          { kind: "restrict", target: 0, restrictions: ["cant-block"] },
          { kind: "restrict", target: 1, restrictions: ["cant-block"] },
          { kind: "restrict", target: 2, restrictions: ["cant-block"] },
        ],
      },
      resolve: null,
      text: CHAPTER_II,
    },
    {
      at: [3],
      targets: [],
      // Tip the Scales' shape: the reflexive trigger is made only once a card
      // was discarded, its X fixed then; it goes on the stack once the
      // chapter ability has finished resolving (after the draw).
      effect: {
        kind: "sequence",
        effects: [
          { kind: "discard", target: "you", amount: 1 },
          {
            kind: "conditional",
            condition: { kind: "this-way", what: "discarded" },
            then: {
              kind: "reflexive-trigger",
              targets: [],
              value: { thisWay: "discarded", sumOf: "mana-value" },
              effect: { kind: "damage", amount: { triggerValue: true }, who: "each-opponent" },
              text: "When you discard a card this way, this creature deals damage equal to that card's mana value to each opponent.",
            },
          },
          { kind: "draw", amount: 2 },
        ],
      },
      resolve: null,
      text: CHAPTER_III,
    },
  ],
});
