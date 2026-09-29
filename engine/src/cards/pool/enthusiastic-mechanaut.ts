import { defineCard } from "../define.js";

export default defineCard({
  name: "Enthusiastic Mechanaut",
  manaCost: "{U}{R}",
  colors: ["U", "R"],
  types: ["artifact", "creature"],
  subtypes: ["Goblin", "Artificer"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nArtifact spells you cast cost {1} less to cast.",
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
