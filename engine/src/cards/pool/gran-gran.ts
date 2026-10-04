import { defineCard } from "../define.js";

// EDHREC rank 6413.
//
// Rulings:
//   [2025-10-02] To determine the total cost of a spell, start with the mana cost or alternative
//     cost you're paying, add any cost increases, then apply any cost reductions. The mana value
//     of the spell remains unchanged, no matter what the total cost to cast it was.

const LOOT_TEXT = "Whenever Gran-Gran becomes tapped, draw a card, then discard a card.";
const COST_TEXT =
  "Noncreature spells you cast cost {1} less to cast as long as there are three or more Lesson cards in your graveyard.";

export default defineCard({
  name: "Gran-Gran",
  manaCost: "{U}",
  colors: ["U"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Peasant", "Ally"],
  power: 1,
  toughness: 2,
  text: `${LOOT_TEXT}\n${COST_TEXT}`,
  triggered: [
    {
      trigger: { on: "becomes-tapped", who: "self" },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [{ kind: "draw", amount: 1 }, { kind: "discard", target: "you", amount: 1 }],
      },
      resolve: null,
      text: LOOT_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      condition: { kind: "cards-in-graveyard", atLeast: 3, filter: { subtype: "Lesson" } },
      costModification: { applies: { notTypes: ["creature"] }, caster: "you", reduceGeneric: 1 },
      text: COST_TEXT,
    },
  ],
});
