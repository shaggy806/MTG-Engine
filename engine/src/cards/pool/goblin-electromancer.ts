import { defineCard } from "../define.js";

export default defineCard({
  name: "Goblin Electromancer",
  manaCost: "{U}{R}",
  colors: ["U", "R"],
  types: ["creature"],
  subtypes: ["Goblin", "Wizard"],
  power: 2,
  toughness: 2,
  text: "Instant and sorcery spells you cast cost {1} less to cast.",
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { typesAnyOf: ["instant", "sorcery"] },
        caster: "you",
        reduceGeneric: 1,
      },
      text: "Instant and sorcery spells you cast cost {1} less to cast.",
    },
  ],
});
