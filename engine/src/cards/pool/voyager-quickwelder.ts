import { defineCard } from "../define.js";

// EDHREC rank 2647.
export default defineCard({
  name: "Voyager Quickwelder",
  manaCost: "{2}{W}",
  colors: ["W"],
  types: ["artifact", "creature"],
  subtypes: ["Robot", "Artificer"],
  power: 2,
  toughness: 4,
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
