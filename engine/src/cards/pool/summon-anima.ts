import { defineCard } from "../define.js";

// EDHREC rank 6639.
// Summon: Ixion's Saga-creature shape: chapters I–III draw and lose life,
// chapter IV makes each opponent sacrifice a creature of their choice, then
// lose 3 life; it's sacrificed after IV.

const PAIN_TEXT = "I, II, III — Pain — You draw a card and you lose 1 life.";
const OBLIVION_TEXT = "IV — Oblivion — Each opponent sacrifices a creature of their choice and loses 3 life.";

export default defineCard({
  name: "Summon: Anima",
  manaCost: "{4}{B}{B}",
  colors: ["B"],
  types: ["enchantment", "creature"],
  subtypes: ["Saga", "Horror"],
  power: 4,
  toughness: 4,
  keywords: ["menace"],
  text: `(As this Saga enters and after your draw step, add a lore counter. Sacrifice after IV.)\n${PAIN_TEXT}\n${OBLIVION_TEXT}\nMenace`,
  chapters: [
    {
      at: [1, 2, 3],
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "draw", amount: 1 },
          { kind: "lose-life", amount: 1, who: "you" },
        ],
      },
      resolve: null,
      text: PAIN_TEXT,
    },
    {
      at: [4],
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "sacrifice", who: "each-opponent", filter: { type: "creature" }, count: 1 },
          { kind: "lose-life", amount: 3, who: "each-opponent" },
        ],
      },
      resolve: null,
      text: OBLIVION_TEXT,
    },
  ],
});
