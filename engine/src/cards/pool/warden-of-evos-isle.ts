import { defineCard } from "../define.js";

export default defineCard({
  name: "Warden of Evos Isle",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Bird", "Wizard"],
  power: 2,
  toughness: 2,
  keywords: ["flying"],
  text: "Flying\nCreature spells with flying you cast cost {1} less to cast.",
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { type: "creature", keyword: "flying", controlledBy: "you" },
        reduceGeneric: 1,
      },
      text: "Creature spells with flying you cast cost {1} less to cast.",
    },
  ],
});
