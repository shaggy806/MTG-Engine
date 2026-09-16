import { defineCard } from "../define.js";

export default defineCard({
  name: "Dragonlord's Servant",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Shaman"],
  power: 1,
  toughness: 3,
  text: "Dragon spells you cast cost {1} less to cast.",
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { subtype: "Dragon", controlledBy: "you" },
        reduceGeneric: 1,
      },
      text: "Dragon spells you cast cost {1} less to cast.",
    },
  ],
});
