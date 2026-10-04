import { defineCard } from "../define.js";

// EDHREC rank 2906.
const COST_TEXT = "Zombie spells you cast cost {1} less to cast.";
const PUMP_TEXT = "Zombie creatures you control get +2/+1.";

export default defineCard({
  name: "Undead Warchief",
  manaCost: "{2}{B}{B}",
  colors: ["B"],
  types: ["creature"],
  subtypes: ["Zombie"],
  power: 1,
  toughness: 1,
  text: `${COST_TEXT}\n${PUMP_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      costModification: { applies: { subtype: "Zombie" }, caster: "you", reduceGeneric: 1 },
      text: COST_TEXT,
    },
    {
      affects: { scope: "creatures-you-control", subtype: "Zombie" },
      grantPt: [2, 1],
      text: PUMP_TEXT,
    },
  ],
});
