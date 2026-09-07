import { defineCard } from "../define.js";

export default defineCard({
  name: "Foundry Inspector",
  manaCost: "{3}",
  types: ["artifact", "creature"],
  subtypes: ["Construct"],
  power: 3,
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
