import { defineCard } from "../define.js";
import { ward } from "../helpers.js";

const UNCOUNTERABLE_TEXT = "Spells you control can't be countered.";
const GRANT_TEXT = "Other creatures you control have \"Ward—Pay 2 life.\"";

export default defineCard({
  name: "Hexing Squelcher",
  manaCost: "{1}{R}",
  colors: ["R"],
  types: ["creature"],
  subtypes: ["Goblin", "Sorcerer"],
  power: 2,
  toughness: 2,
  cantBeCountered: true,
  text: `This spell can't be countered.\nWard—Pay 2 life.\n${UNCOUNTERABLE_TEXT}\n${GRANT_TEXT}`,
  triggered: [ward({ payLife: 2 })],
  static: [
    {
      affects: { scope: "self" },
      grantsToSpells: { cantBeCountered: true },
      text: UNCOUNTERABLE_TEXT,
    },
    {
      affects: { scope: "creatures-you-control", excludeSelf: true },
      grantsTriggered: [ward({ payLife: 2 })],
      text: GRANT_TEXT,
    },
  ],
});
