import { defineCard } from "../define.js";

export default defineCard({
  name: "Thalia, Guardian of Thraben",
  manaCost: "{1}{W}",
  colors: ["W"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Human", "Soldier"],
  power: 2,
  toughness: 1,
  keywords: ["first-strike"],
  text: "First strike\nNoncreature spells cost {1} more to cast.",
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { notTypes: ["creature"] },
        increaseGeneric: 1,
      },
      text: "Noncreature spells cost {1} more to cast.",
    },
  ],
});
