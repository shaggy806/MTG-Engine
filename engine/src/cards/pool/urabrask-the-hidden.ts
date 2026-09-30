import { defineCard } from "../define.js";

const HASTE_TEXT = "Creatures you control have haste.";
const TAPPED_TEXT = "Creatures your opponents control enter tapped.";

export default defineCard({
  name: "Urabrask the Hidden",
  manaCost: "{3}{R}{R}",
  colors: ["R"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Phyrexian", "Praetor"],
  power: 4,
  toughness: 4,
  text: `${HASTE_TEXT}\n${TAPPED_TEXT}`,
  static: [
    {
      affects: { scope: "creatures-you-control" },
      grantKeywords: ["haste"],
      text: HASTE_TEXT,
    },
    {
      affects: { scope: "self" },
      replacement: {
        event: "others-enter-battlefield",
        filter: { type: "creature", controlledBy: "opponent" },
        tapped: true,
      },
      text: TAPPED_TEXT,
    },
  ],
});
