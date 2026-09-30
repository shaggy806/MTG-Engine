import { defineCard } from "../define.js";

const COST_TEXT = "Colorless spells you cast with mana value 7 or greater cost {1} less to cast.";
const ANTHEM_TEXT = "Other colorless creatures you control get +1/+1.";

export default defineCard({
  name: "It That Heralds the End",
  manaCost: "{1}{C}",
  types: ["creature"],
  subtypes: ["Eldrazi", "Drone"],
  power: 2,
  toughness: 2,
  text: `${COST_TEXT}\n${ANTHEM_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: {
        applies: { colorless: true, manaValue: { op: "gte", n: 7 } },
        caster: "you",
        reduceGeneric: 1,
      },
      text: COST_TEXT,
    },
    {
      affects: { scope: "filter", filter: { type: "creature", colorless: true, controlledBy: "you" }, excludeSelf: true },
      grantPt: [1, 1],
      text: ANTHEM_TEXT,
    },
  ],
});
