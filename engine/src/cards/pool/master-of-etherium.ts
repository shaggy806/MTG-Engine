import { defineCard } from "../define.js";

const CDA_TEXT = "Master of Etherium's power and toughness are each equal to the number of artifacts you control.";
const LORD_TEXT = "Other artifact creatures you control get +1/+1.";

export default defineCard({
  name: "Master of Etherium",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["artifact", "creature"],
  subtypes: ["Vedalken", "Wizard"],
  power: 0,
  toughness: 0,
  text: `${CDA_TEXT}\n${LORD_TEXT}`,
  static: [
    {
      affects: { scope: "self" },
      setBasePtFromCount: { countOf: { countOf: { type: "artifact", controlledBy: "you" } }, plusPower: 0, plusToughness: 0 },
      text: CDA_TEXT,
    },
    {
      affects: { scope: "filter", filter: { types: ["artifact", "creature"], controlledBy: "you" }, excludeSelf: true },
      grantPt: [1, 1],
      text: LORD_TEXT,
    },
  ],
});
