import { defineCard } from "../define.js";

export default defineCard({
  name: "Etherium Sculptor",
  manaCost: "{1}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Vedalken", "Artificer"],
  power: 1,
  toughness: 2,
  text: "Artifact spells you cast cost {1} less to cast.",
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { type: "artifact", controlledBy: "you" },
        reduceGeneric: 1,
      },
      text: "Artifact spells you cast cost {1} less to cast.",
    },
  ],
});
