import { defineCard } from "../define.js";

export default defineCard({
  name: "Bontu's Monument",
  manaCost: "{3}",
  colors: [],
  supertypes: ["legendary"],
  types: ["artifact"],
  text:
    "Black creature spells you cast cost {1} less to cast.\n" +
    "Whenever you cast a creature spell, each opponent loses 1 life and you gain 1 life.",
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { type: "creature", colors: ["B"] },
        caster: "you",
        reduceGeneric: 1,
      },
      text: "Black creature spells you cast cost {1} less to cast.",
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { type: "creature" } },
      targets: [],
      effect: {
        kind: "sequence",
        effects: [
          { kind: "lose-life", amount: 1, who: "each-opponent" },
          { kind: "gain-life", amount: 1 },
        ],
      },
      resolve: null,
      text: "Whenever you cast a creature spell, each opponent loses 1 life and you gain 1 life.",
    },
  ],
});
