import { defineCard } from "../define.js";

const UNCOUNTERABLE_TEXT = "Creature spells you control can't be countered.";

export default defineCard({
  name: "Prowling Serpopard",
  manaCost: "{1}{G}{G}",
  colors: ["G"],
  types: ["creature"],
  subtypes: ["Cat", "Snake"],
  power: 4,
  toughness: 3,
  cantBeCountered: true,
  text: `This spell can't be countered.\n${UNCOUNTERABLE_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      grantsToSpells: { filter: { type: "creature" }, cantBeCountered: true },
      text: UNCOUNTERABLE_TEXT,
    },
  ],
});
