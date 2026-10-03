import { defineCard } from "../define.js";

const PT_TEXT = "This creature gets +1/+1 for each color among permanents you control.";
const MANA_TEXT = "{T}: For each color among permanents you control, add one mana of that color.";

// Both read the colours among your permanents, itself included — at most
// five of either (the rulings).
export default defineCard({
  name: "Faeburrow Elder",
  manaCost: "{1}{G}{W}",
  colors: ["W", "G"],
  types: ["creature"],
  subtypes: ["Treefolk", "Druid"],
  power: 0,
  toughness: 0,
  keywords: ["vigilance"],
  text: `Vigilance\n${PT_TEXT}\n${MANA_TEXT}`,
  activated: [
    {
      cost: { mana: null, tap: true },
      targets: [],
      effect: { kind: "add-mana", mana: { eachColorAmong: { controlledBy: "you" } }, amount: 1 },
      resolve: null,
      text: MANA_TEXT,
    },
  ],
  static: [
    {
      affects: { scope: "self" },
      grantPtPerCount: { colorsAmong: { controlledBy: "you" }, pt: [1, 1] },
      text: PT_TEXT,
    },
  ],
});
