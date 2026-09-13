import { defineCard } from "../define.js";

export default defineCard({
  name: "Dragonspeaker Shaman",
  manaCost: "{1}{R}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Human", "Barbarian", "Shaman"],
  power: 2,
  toughness: 2,
  text: "Dragon spells you cast cost {2} less to cast.",
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { subtype: "Dragon", controlledBy: "you" },
        reduceGeneric: 2,
      },
      text: "Dragon spells you cast cost {2} less to cast.",
    },
  ],
});
