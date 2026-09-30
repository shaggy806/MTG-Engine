import { defineCard } from "../define.js";

const CAST_TEXT =
  "When you cast this spell, you may search your library for a colorless creature card with mana value 7 or greater, reveal it, then shuffle and put that card on top.";
const COST_TEXT = "The first creature spell you cast each turn costs {2} less to cast.";

// The cast trigger resolves first, even if the spell is then countered.
// A creature spell cast earlier in the turn, before this arrived, was the
// first.
export default defineCard({
  name: "Conduit of Ruin",
  manaCost: "{6}",
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 5,
  toughness: 5,
  text: `${CAST_TEXT}\n${COST_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { type: "creature" }, caster: "you", reduceGeneric: 2, firstEachTurn: true },
      text: COST_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Search for a colorless creature card with mana value 7 or greater?",
        effect: {
          kind: "search-library",
          filter: { type: "creature", colorless: true, manaValue: { op: "gte", n: 7 } },
          destination: "library-top",
          reveal: true,
          min: 0,
          max: 1,
        },
      },
      resolve: null,
      text: CAST_TEXT,
    },
  ],
});
