import { defineCard } from "../define.js";

const COST_TEXT = "Red creature spells you cast cost {1} less to cast.";
const LOOT_TEXT = "Whenever you cast a creature spell, you may discard a card. If you do, draw a card.";

// "If you do" is the discard actually happening: saying yes with an empty
// hand draws nothing.
export default defineCard({
  name: "Hazoret's Monument",
  manaCost: "{3}",
  supertypes: ["legendary"],
  types: ["artifact"],
  text: `${COST_TEXT}\n${LOOT_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { type: "creature", colors: ["R"] }, caster: "you", reduceGeneric: 1 },
      text: COST_TEXT,
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "may",
        prompt: "Discard a card to draw a card?",
        effect: {
          kind: "sequence",
          effects: [
            { kind: "discard", target: "you", amount: 1 },
            {
              kind: "conditional",
              condition: { kind: "this-way", what: "discarded" },
              then: { kind: "draw", amount: 1 },
            },
          ],
        },
      },
      resolve: null,
      text: LOOT_TEXT,
    },
  ],
});
