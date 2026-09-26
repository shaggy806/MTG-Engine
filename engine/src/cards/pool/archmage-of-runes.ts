import { defineCard } from "../define.js";

const DRAW_TEXT = "Whenever you cast an instant or sorcery spell, draw a card.";

export default defineCard({
  name: "Archmage of Runes",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Giant", "Wizard"],
  power: 3,
  toughness: 6,
  text: `Instant and sorcery spells you cast cost {1} less to cast.\n${DRAW_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { typesAnyOf: ["instant", "sorcery"] }, caster: "you", reduceGeneric: 1 },
      text: "Instant and sorcery spells you cast cost {1} less to cast.",
    },
  ],
  triggered: [
    {
      trigger: { on: "cast-spell", who: "you", filter: { typesAnyOf: ["instant", "sorcery"] } },
      targets: [],
      effect: { kind: "draw", amount: 1 },
      resolve: null,
      text: DRAW_TEXT,
    },
  ],
});
