import { defineCard } from "../define.js";

// EDHREC rank 3480.

const PT_TEXT = "Other Faerie creatures you control get +1/+1.";
const SHROUD_TEXT = "Other Faeries you control have shroud. (They can't be the targets of spells or abilities.)";

export default defineCard({
  name: "Scion of Oona",
  manaCost: "{2}{U}",
  colors: ["U"],
  types: ["creature"],
  subtypes: ["Faerie", "Soldier"],
  power: 1,
  toughness: 1,
  keywords: ["flash", "flying"],
  text: `Flash\nFlying\n${PT_TEXT}\n${SHROUD_TEXT}`,
  static: [
    {
      affects: { scope: "filter", filter: { type: "creature", subtype: "Faerie", controlledBy: "you" }, excludeSelf: true },
      grantPt: [1, 1],
      text: PT_TEXT,
    },
    {
      // Every Faerie permanent, not only creatures.
      affects: { scope: "filter", filter: { subtype: "Faerie", controlledBy: "you" }, excludeSelf: true },
      grantKeywords: ["shroud"],
      text: SHROUD_TEXT,
    },
  ],
});
